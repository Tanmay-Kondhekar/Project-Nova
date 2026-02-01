"""
Joern Static Analysis Module

This module provides a single-purpose function for generating Code Property Graphs (CPG)
using Joern in a containerized environment. The function handles:
- Input validation (single file or repository)
- Joern container lifecycle management
- CPG generation (AST, CFG, data/control flow)
- Graph extraction and persistence
- Visualization support

No vulnerability detection, scoring, or higher-level analysis is performed.
"""

import os
import json
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import Union, Dict, List, Optional
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class JoernAnalysisResult:
    """
    Container for Joern analysis results.
    
    Attributes:
        cpg_bin_path: Path to the serialized CPG binary file
        graphs: Dictionary containing extracted graph representations
        workspace_path: Path to the workspace directory containing all artifacts
        source_info: Metadata about the analyzed source code
    """
    cpg_bin_path: Path
    graphs: Dict[str, any]
    workspace_path: Path
    source_info: Dict[str, str]


class JoernAnalyzer:
    """
    Orchestrates Joern-based static analysis in a containerized environment.
    
    This class manages the complete lifecycle of:
    1. Container setup and Joern invocation
    2. CPG generation from source code
    3. Graph extraction in multiple formats
    4. Cleanup and resource management
    """
    
    # Joern Docker image - using official ShiftLeft image
    JOERN_IMAGE = "ghcr.io/joernio/joern:nightly"
    
    # Container workspace paths
    CONTAINER_WORKSPACE = "/workspace"
    CONTAINER_INPUT = f"{CONTAINER_WORKSPACE}/input"
    CONTAINER_OUTPUT = f"{CONTAINER_WORKSPACE}/output"
    
    def __init__(self, docker_image: str = None):
        """
        Initialize the analyzer.
        
        Args:
            docker_image: Optional custom Joern Docker image
        """
        self.docker_image = docker_image or self.JOERN_IMAGE
        self._verify_docker()
        self._pull_joern_image()
    
    def _verify_docker(self):
        """Verify Docker is available and running."""
        try:
            result = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                raise RuntimeError("Docker is not running or not accessible")
            logger.info("Docker verification successful")
        except FileNotFoundError:
            raise RuntimeError("Docker is not installed")
        except subprocess.TimeoutExpired:
            raise RuntimeError("Docker command timed out")
    
    def _pull_joern_image(self):
        """Pull the Joern Docker image if not present."""
        try:
            # Check if image exists locally
            result = subprocess.run(
                ["docker", "images", "-q", self.docker_image],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if not result.stdout.strip():
                logger.info(f"Pulling Joern image: {self.docker_image}")
                subprocess.run(
                    ["docker", "pull", self.docker_image],
                    check=True,
                    timeout=300
                )
                logger.info("Joern image pulled successfully")
            else:
                logger.info("Joern image already available locally")
        except subprocess.TimeoutExpired:
            raise RuntimeError("Docker pull operation timed out")
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to pull Joern image: {e}")
    
    def _prepare_workspace(self, source_path: Path) -> tuple[Path, Path, Path]:
        """
        Create a temporary workspace and copy source files.
        
        Args:
            source_path: Path to source file or directory
            
        Returns:
            Tuple of (workspace_dir, input_dir, output_dir)
        """
        workspace = Path(tempfile.mkdtemp(prefix="joern_analysis_"))
        input_dir = workspace / "input"
        output_dir = workspace / "output"
        
        input_dir.mkdir(parents=True)
        output_dir.mkdir(parents=True)
        
        # Copy source to input directory
        if source_path.is_file():
            shutil.copy2(source_path, input_dir / source_path.name)
            logger.info(f"Copied file: {source_path.name}")
        elif source_path.is_dir():
            shutil.copytree(source_path, input_dir / source_path.name)
            logger.info(f"Copied directory: {source_path.name}")
        else:
            raise ValueError(f"Invalid source path: {source_path}")
        
        return workspace, input_dir, output_dir
    
    def _generate_cpg(self, workspace: Path, input_dir: Path, output_dir: Path) -> Path:
        """
        Run Joern to generate the Code Property Graph.
        """
        cpg_bin = output_dir / "cpg.bin"
        
        # Use joern-parse to generate CPG
        docker_cmd = [
            "docker", "run", "--rm",
            "-v", f"{workspace}:{self.CONTAINER_WORKSPACE}:z",  # Added :z for SELinux
            self.docker_image,
            "joern-parse",
            self.CONTAINER_INPUT,
            "--output", f"{self.CONTAINER_OUTPUT}/cpg.bin"
        ]

        
        logger.info("Starting Joern container for CPG generation...")
        try:
            result = subprocess.run(
                docker_cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            logger.info(f"Joern stdout: {result.stdout}")
            if result.stderr:
                logger.info(f"Joern stderr: {result.stderr}")
            
            if result.returncode != 0:
                logger.error(f"Joern failed with return code: {result.returncode}")
                raise RuntimeError(f"Joern CPG generation failed: {result.stderr}")
            
            # Check what was created
            created_files = list(output_dir.iterdir()) if output_dir.exists() else []
            logger.info(f"Files in output directory: {created_files}")
            
            if not cpg_bin.exists():
                raise RuntimeError(f"CPG binary file was not created. Output dir contains: {created_files}")
            
            logger.info("CPG generated successfully")
            return cpg_bin
            
        except subprocess.TimeoutExpired:
            raise RuntimeError("Joern analysis timed out")


    def _extract_graphs(self, workspace: Path, cpg_bin: Path, output_dir: Path) -> Dict[str, any]:
        """
        Extract various graph representations from the CPG.
        """
        graphs = {}
        
        # Create temporary directory for exports
        export_temp = workspace / "exports"
        export_temp.mkdir(exist_ok=True)
        
        # Export AST
        logger.info("Extracting AST...")
        docker_cmd_ast = [
            "docker", "run", "--rm",
            "-v", f"{workspace}:{self.CONTAINER_WORKSPACE}:z",  # Added :z for SELinux
            self.docker_image,
            "joern-export",
            f"{self.CONTAINER_OUTPUT}/cpg.bin",
            "--out", f"{self.CONTAINER_WORKSPACE}/exports/ast",
            "--repr", "ast",
            "--format", "dot"
        ]

        
        result = subprocess.run(docker_cmd_ast, capture_output=True, text=True, timeout=300)
        logger.info(f"AST export: {result.stdout}")
        
        # Export CFG
        logger.info("Extracting CFG...")
        docker_cmd_cfg = [
            "docker", "run", "--rm",
            "-v", f"{workspace}:{self.CONTAINER_WORKSPACE}:z",  # Added :z for SELinux
            self.docker_image,
            "joern-export",
            f"{self.CONTAINER_OUTPUT}/cpg.bin",
            "--out", f"{self.CONTAINER_WORKSPACE}/exports/cfg",
            "--repr", "cfg",
            "--format", "dot"
        ]
        
        result = subprocess.run(docker_cmd_cfg, capture_output=True, text=True, timeout=300)
        logger.info(f"CFG export: {result.stdout}")
        
        # Find and copy exported files to output directory
        if export_temp.exists():
            for subdir in export_temp.iterdir():
                if subdir.is_dir():
                    for dotfile in subdir.glob("*.dot"):
                        target_name = f"{subdir.name}.dot"
                        target_path = output_dir / target_name
                        shutil.copy2(dotfile, target_path)
                        graphs[f'{subdir.name}_dot'] = target_path.read_text()
                        logger.info(f"{subdir.name.upper()} DOT graph extracted")
        
        if not graphs:
            logger.warning("No graphs were extracted, but continuing anyway")
        
        return graphs
    
    def _generate_visualizations(self, graphs: Dict, output_dir: Path):
        """
        Generate visualization files from DOT graphs.
        
        Args:
            graphs: Dictionary containing graph data
            output_dir: Output directory for visualization files
        """
        try:
            # Check if Graphviz is available
            subprocess.run(
                ["dot", "-V"],
                capture_output=True,
                timeout=5
            )
            graphviz_available = True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            graphviz_available = False
            logger.warning("Graphviz not available - skipping visualization generation")
        
        if not graphviz_available:
            return
        
        # Generate SVG from AST DOT
        if 'ast_dot' in graphs:
            ast_svg = output_dir / "ast.svg"
            ast_dot_file = output_dir / "ast.dot"
            
            try:
                subprocess.run(
                    ["dot", "-Tsvg", str(ast_dot_file), "-o", str(ast_svg)],
                    check=True,
                    timeout=60
                )
                graphs['ast_svg_path'] = str(ast_svg)
                logger.info("AST SVG visualization generated")
            except Exception as e:
                logger.warning(f"Failed to generate AST SVG: {e}")
        
        # Generate SVG from CFG DOT
        if 'cfg_dot' in graphs:
            cfg_svg = output_dir / "cfg.svg"
            cfg_dot_file = output_dir / "cfg.dot"
            
            try:
                subprocess.run(
                    ["dot", "-Tsvg", str(cfg_dot_file), "-o", str(cfg_svg)],
                    check=True,
                    timeout=60
                )
                graphs['cfg_svg_path'] = str(cfg_svg)
                logger.info("CFG SVG visualization generated")
            except Exception as e:
                logger.warning(f"Failed to generate CFG SVG: {e}")


def analyze_code_with_joern(
    source_path: Union[str, Path],
    output_dir: Optional[Union[str, Path]] = None,
    keep_workspace: bool = False
) -> JoernAnalysisResult:
    """
    Analyze source code using Joern to generate Code Property Graphs.
    
    This function performs purely static analysis by:
    1. Spinning up a Joern container instance
    2. Generating CPG (including AST, CFG, data/control flow)
    3. Extracting graphs in multiple formats (DOT, JSON)
    4. Optionally generating visualizations (SVG)
    5. Persisting all artifacts for programmatic access
    
    No code execution, vulnerability detection, or higher-level analysis is performed.
    
    Args:
        source_path: Path to a single source file or repository directory
        output_dir: Optional directory to copy final outputs (if None, uses temp workspace)
        keep_workspace: If True, preserves the temporary workspace for inspection
    
    Returns:
        JoernAnalysisResult containing:
            - cpg_bin_path: Path to serialized CPG binary
            - graphs: Dictionary with graph representations (DOT, JSON)
            - workspace_path: Path to workspace with all artifacts
            - source_info: Metadata about analyzed source
    
    Raises:
        ValueError: If source_path is invalid
        RuntimeError: If Docker is unavailable or Joern analysis fails
    
    Examples:
        >>> # Analyze a single file
        >>> result = analyze_code_with_joern("example.java")
        >>> print(result.graphs.keys())
        
        >>> # Analyze a repository
        >>> result = analyze_code_with_joern("/path/to/repo", keep_workspace=True)
        >>> print(f"CPG saved at: {result.cpg_bin_path}")
        
        >>> # Access extracted graphs
        >>> ast_dot = result.graphs['ast_dot']
        >>> print(ast_dot)
    """
    source_path = Path(source_path).resolve()
    
    if not source_path.exists():
        raise ValueError(f"Source path does not exist: {source_path}")
    
    logger.info(f"Starting Joern analysis for: {source_path}")
    
    # Initialize analyzer
    analyzer = JoernAnalyzer()
    
    # Prepare workspace
    workspace, input_dir, temp_output_dir = analyzer._prepare_workspace(source_path)
    
    try:
        # Generate CPG
        cpg_bin = analyzer._generate_cpg(workspace, input_dir, temp_output_dir)
        
        # Extract graphs
        graphs = analyzer._extract_graphs(workspace, cpg_bin, temp_output_dir)
        
        # Generate visualizations
        analyzer._generate_visualizations(graphs, temp_output_dir)
        
        # Prepare final output location
        if output_dir:
            final_output = Path(output_dir).resolve()
            final_output.mkdir(parents=True, exist_ok=True)
            
            # Copy all outputs
            for item in temp_output_dir.iterdir():
                shutil.copy2(item, final_output / item.name)
            
            cpg_final = final_output / "cpg.bin"
        else:
            final_output = temp_output_dir
            cpg_final = cpg_bin
        
        # Gather source metadata
        source_info = {
            "path": str(source_path),
            "type": "file" if source_path.is_file() else "directory",
            "name": source_path.name
        }
        
        result = JoernAnalysisResult(
            cpg_bin_path=cpg_final,
            graphs=graphs,
            workspace_path=workspace if keep_workspace else final_output,
            source_info=source_info
        )
        
        logger.info("Analysis complete!")
        logger.info(f"CPG binary: {result.cpg_bin_path}")
        logger.info(f"Workspace: {result.workspace_path}")
        logger.info(f"Available graphs: {list(result.graphs.keys())}")
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise
    
    finally:
        # Cleanup workspace if not keeping it
        if not keep_workspace and not output_dir:
            try:
                shutil.rmtree(workspace)
                logger.info("Cleaned up temporary workspace")
            except Exception as e:
                logger.warning(f"Failed to clean up workspace: {e}")


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python joern_analyzer.py <source_path> [output_dir]")
        sys.exit(1)
    
    source = sys.argv[1]
    output = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = analyze_code_with_joern(source, output_dir=output, keep_workspace=True)
    
    print("\n" + "="*60)
    print("JOERN ANALYSIS RESULTS")
    print("="*60)
    print(f"\nSource: {result.source_info['path']}")
    print(f"Type: {result.source_info['type']}")
    print(f"\nCPG Binary: {result.cpg_bin_path}")
    print(f"Workspace: {result.workspace_path}")
    print(f"\nGenerated Graphs:")
    for graph_type in result.graphs.keys():
        print(f"  - {graph_type}")
