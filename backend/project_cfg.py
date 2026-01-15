import ast
from pathlib import Path
from typing import Dict, Set, List, Tuple
import logging

logger = logging.getLogger(__name__)

class RobustProjectCFGGenerator:
    """
    Enhanced project-wide Control Flow Graph generator with:
    - Better error handling
    - Cross-file function tracking
    - Module import awareness
    - Improved visualization data
    """
    
    def __init__(self):
        self.all_functions = {}  # func_name -> file_path
        self.all_calls = {}  # func_name -> set of called functions
        self.file_modules = {}  # file_path -> module_name
        self.errors = []
    
    def extract_functions_from_file(self, file_path: Path) -> Tuple[Set[str], Dict[str, Set[str]]]:
        """
        Extract functions and their calls from a single file.
        Returns: (set of function names, dict of calls)
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
            
            tree = ast.parse(code)
        except SyntaxError as e:
            logger.warning(f"Syntax error in {file_path}: {e}")
            self.errors.append(f"Syntax error in {file_path.name}: {str(e)}")
            return set(), {}
        except Exception as e:
            logger.warning(f"Failed to parse {file_path}: {e}")
            self.errors.append(f"Parse error in {file_path.name}: {str(e)}")
            return set(), {}
        
        functions = set()
        calls = {}
        
        # Collect all user-defined functions (skip private ones)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Skip private functions and dunder methods
                if not node.name.startswith('_'):
                    functions.add(node.name)
        
        # Extract function calls
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_name = node.name
                if func_name.startswith('_'):
                    continue
                
                calls[func_name] = set()
                
                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        called = self._extract_called_functions(child)
                        calls[func_name].update(called)
        
        return functions, calls
    
    def _extract_called_functions(self, call_node: ast.Call) -> Set[str]:
        """
        Extract function names from a Call node.
        Handles: func(), self.method(), obj.method()
        """
        called = set()
        
        try:
            # Direct function call
            if isinstance(call_node.func, ast.Name):
                called.add(call_node.func.id)
            
            # Attribute call (method or module function)
            elif isinstance(call_node.func, ast.Attribute):
                method_name = call_node.func.attr
                
                # Check if it's a self.method() call
                if isinstance(call_node.func.value, ast.Name):
                    if call_node.func.value.id == 'self':
                        called.add(method_name)
                    else:
                        # Could be module.function() or obj.method()
                        # Add method name for potential matching
                        called.add(method_name)
                else:
                    called.add(method_name)
        
        except Exception as e:
            logger.debug(f"Could not extract function from call: {e}")
        
        return called
    
    def build_project_cfg_json(self, project_path: Path) -> Dict:
        """
        Build control flow graph for entire project.
        Returns JSON-serializable dict with nodes and edges.
        """
        self.all_functions = {}
        self.all_calls = {}
        self.errors = []
        
        # Collect all Python files
        python_files = []
        try:
            python_files = list(project_path.rglob('*.py'))
        except Exception as e:
            logger.error(f"Failed to list Python files: {e}")
            self.errors.append(f"Failed to scan project: {str(e)}")
            return self._empty_result()
        
        # Skip common directories
        skip_dirs = {'__pycache__', 'venv', 'env', '.git', 'node_modules', 'build', 'dist'}
        python_files = [
            f for f in python_files 
            if not any(skip_dir in f.parts for skip_dir in skip_dirs)
            and not f.name.startswith('test_')
            and not f.name.endswith('_test.py')
        ]
        
        if not python_files:
            self.errors.append("No Python files found in project")
            return self._empty_result()
        
        # Process each file
        file_count = 0
        for py_file in python_files:
            try:
                functions, calls = self.extract_functions_from_file(py_file)
                
                if functions:
                    file_count += 1
                    rel_path = str(py_file.relative_to(project_path))
                    
                    # Store functions with their file locations
                    for func in functions:
                        if func not in self.all_functions:
                            self.all_functions[func] = []
                        self.all_functions[func].append(rel_path)
                    
                    # Store calls
                    for func, targets in calls.items():
                        if func not in self.all_calls:
                            self.all_calls[func] = set()
                        self.all_calls[func].update(targets)
            
            except Exception as e:
                logger.warning(f"Error processing {py_file}: {e}")
                continue
        
        if file_count == 0:
            self.errors.append("No valid Python files with functions found")
            return self._empty_result()
        
        # Build graph
        return self._build_graph()
    
    def _build_graph(self) -> Dict:
        """
        Build the final graph structure from collected data.
        """
        # Find connected functions
        connected_functions = set()
        
        for src, targets in self.all_calls.items():
            # Filter targets to only include functions we know about
            valid_targets = {t for t in targets if t in self.all_functions}
            
            if valid_targets:
                connected_functions.add(src)
                connected_functions.update(valid_targets)
        
        # If no connections, include top N most common functions
        if not connected_functions:
            # Sort by number of occurrences across files
            func_counts = [(f, len(files)) for f, files in self.all_functions.items()]
            func_counts.sort(key=lambda x: x[1], reverse=True)
            connected_functions = {f for f, _ in func_counts[:50]}  # Top 50
        
        # Limit to reasonable size for visualization
        if len(connected_functions) > 100:
            # Prioritize functions with most connections
            func_conn_counts = []
            for func in connected_functions:
                in_degree = sum(1 for calls in self.all_calls.values() if func in calls)
                out_degree = len(self.all_calls.get(func, set()))
                func_conn_counts.append((func, in_degree + out_degree))
            
            func_conn_counts.sort(key=lambda x: x[1], reverse=True)
            connected_functions = {f for f, _ in func_conn_counts[:100]}
        
        # Build nodes
        nodes = []
        for func in sorted(connected_functions):
            file_info = self.all_functions.get(func, ['unknown'])[0]
            nodes.append({
                "id": func,
                "label": func,
                "file": file_info,
                "title": f"{func} ({file_info})"  # Tooltip
            })
        
        # Build edges (deduplicate)
        edges = []
        edge_set = set()
        
        for src, targets in self.all_calls.items():
            if src in connected_functions:
                for tgt in targets:
                    if tgt in connected_functions:
                        edge_key = (src, tgt)
                        if edge_key not in edge_set:
                            edges.append({
                                "from": src,
                                "to": tgt
                            })
                            edge_set.add(edge_key)
        
        # Calculate statistics
        stats = {
            "total_functions": len(self.all_functions),
            "displayed_functions": len(connected_functions),
            "total_calls": len(edges),
            "files_processed": len(set(f for files in self.all_functions.values() for f in files))
        }
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": stats,
            "errors": self.errors if self.errors else None,
            "warning": "Large graphs limited to 100 most connected functions" if stats["total_functions"] > 100 else None
        }
    
    def _empty_result(self) -> Dict:
        """Return empty result structure with errors."""
        return {
            "nodes": [],
            "edges": [],
            "stats": {
                "total_functions": 0,
                "displayed_functions": 0,
                "total_calls": 0,
                "files_processed": 0
            },
            "errors": self.errors
        }


def build_project_cfg_json(project_path: Path) -> Dict:
    """
    Main entry point for project CFG generation.
    Wrapper function for backward compatibility.
    """
    generator = RobustProjectCFGGenerator()
    return generator.build_project_cfg_json(project_path)


# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        project_path = Path(sys.argv[1])
        generator = RobustProjectCFGGenerator()
        cfg = generator.build_project_cfg_json(project_path)
        
        print("Project CFG Result:")
        print(f"Stats: {cfg['stats']}")
        print(f"Nodes: {len(cfg['nodes'])}")
        print(f"Edges: {len(cfg['edges'])}")
        if cfg.get('errors'):
            print(f"Errors: {cfg['errors']}")
        if cfg.get('warning'):
            print(f"Warning: {cfg['warning']}")
    else:
        print("Usage: python project_cfg.py <project_path>")