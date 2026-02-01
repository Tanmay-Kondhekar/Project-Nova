# Joern Static Analysis Function - Technical Documentation

## Overview

This implementation provides a **single-purpose Python function** (`analyze_code_with_joern`) that orchestrates Joern-based static code analysis in a containerized environment. The function is strictly scoped to graph generation and visualization, with no vulnerability detection, scoring, or higher-level analysis.

---

## Architecture

### High-Level Flow

```
┌─────────────────┐
│  Input Source   │ (file or repository)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  analyze_code_with_joern()                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 1. Validate input & prepare workspace            │  │
│  │ 2. Verify Docker & pull Joern image              │  │
│  │ 3. Copy source to workspace/input                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Joern Container Lifecycle                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Container Start                                   │  │
│  │   docker run -v workspace:/workspace joern        │  │
│  │                                                   │  │
│  │ CPG Generation                                    │  │
│  │   joern --script analyze.sc                       │  │
│  │   ├─ importCode("/workspace/input")              │  │
│  │   └─ save("/workspace/output/cpg.bin")           │  │
│  │                                                   │  │
│  │ Graph Extraction                                  │  │
│  │   joern --script export.sc                        │  │
│  │   ├─ loadCpg("/workspace/output/cpg.bin")        │  │
│  │   ├─ Export AST as DOT                           │  │
│  │   ├─ Export CFG as DOT                           │  │
│  │   ├─ Export nodes as JSON                        │  │
│  │   └─ Export methods metadata                     │  │
│  │                                                   │  │
│  │ Container Stop (automatic with --rm)             │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Post-Processing (Local)                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Optional: Generate SVG visualizations            │  │
│  │   - Uses Graphviz (if available)                 │  │
│  │   - Converts DOT → SVG for viewing               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Output: JoernAnalysisResult                            │
│  ├─ cpg_bin_path: Path to CPG binary                    │
│  ├─ graphs: Dict with AST/CFG DOT, JSON                 │
│  ├─ workspace_path: All artifacts location              │
│  └─ source_info: Metadata about analyzed code           │
└─────────────────────────────────────────────────────────┘
```

---

## Container Lifecycle Management

### 1. Image Preparation

```python
# On first run or if image is missing
docker pull joernio/joern:latest
```

The `_pull_joern_image()` method checks if the Joern image exists locally and pulls it if needed.

### 2. Container Invocation (CPG Generation)

```bash
docker run --rm \
  -v /host/workspace:/workspace \
  joernio/joern:latest \
  joern --script /workspace/analyze.sc
```

**Lifecycle:**
- `docker run`: Creates and starts container
- `--rm`: Automatically removes container when it exits
- `-v`: Mounts host workspace into container
- Container executes Joern script
- Container exits and is automatically cleaned up

**Joern Script (analyze.sc):**
```scala
importCode("/workspace/input")       // Parse source code
save("/workspace/output/cpg.bin")    // Serialize CPG
:exit                                // Terminate Joern
```

### 3. Container Invocation (Graph Extraction)

```bash
docker run --rm \
  -v /host/workspace:/workspace \
  joernio/joern:latest \
  joern --script /workspace/export.sc
```

**Joern Script (export.sc):**
```scala
loadCpg("/workspace/output/cpg.bin")

// Export AST as GraphViz DOT format
cpg.method.ast.dotGraph.l.foreach { graph =>
  writeToFile("/workspace/output/ast.dot", graph.toDotGraph)
}

// Export CFG as GraphViz DOT format
cpg.method.dotCfg.l.foreach { cfgDot =>
  writeToFile("/workspace/output/cfg.dot", cfgDot)
}

// Export nodes for programmatic access
cpg.all.map { node =>
  Map(
    "id" -> node.id,
    "label" -> node.label,
    "properties" -> node.propertiesMap
  )
} |> writeJSON("/workspace/output/nodes.json")

:exit
```

---

## Graph Generation Process

### Code Property Graph (CPG) Components

The CPG is a unified graph representation combining multiple program analysis graphs:

1. **Abstract Syntax Tree (AST)**
   - Hierarchical representation of source code structure
   - Nodes: declarations, statements, expressions
   - Edges: parent-child relationships

2. **Control Flow Graph (CFG)**
   - Program execution flow
   - Nodes: basic blocks, statements
   - Edges: control flow transitions (sequential, conditional, loops)

3. **Data Flow Graph (DFG)**
   - Variable definitions and uses
   - Nodes: variables, operations
   - Edges: def-use chains

4. **Program Dependence Graph (PDG)**
   - Control and data dependencies
   - Combines CFG + DFG relationships

### CPG Serialization

```python
# Generated file: cpg.bin
# Format: Joern's binary OverflowDB format
# Size: Varies (typically 10-100x source code size)
# Persistence: Can be reloaded without re-parsing source
```

### Graph Export Formats

| Format | File | Purpose | Tooling |
|--------|------|---------|---------|
| Binary CPG | cpg.bin | Full graph persistence | Joern, OverflowDB |
| DOT (AST) | ast.dot | AST visualization | Graphviz |
| DOT (CFG) | cfg.dot | CFG visualization | Graphviz |
| JSON (nodes) | nodes.json | Programmatic access | Python, jq |
| JSON (methods) | methods.json | Method metadata | Python, jq |
| SVG (AST) | ast.svg | Browser-viewable AST | Any browser |
| SVG (CFG) | cfg.svg | Browser-viewable CFG | Any browser |

---

## Function Interface

### Primary Function

```python
def analyze_code_with_joern(
    source_path: Union[str, Path],
    output_dir: Optional[Union[str, Path]] = None,
    keep_workspace: bool = False
) -> JoernAnalysisResult
```

### Parameters

- **source_path**: Path to source file or repository
  - Single file: `"example.java"`, `"/path/to/file.cpp"`
  - Repository: `"/path/to/repo"`, `"./my-project"`
  
- **output_dir**: Optional permanent output location
  - `None` (default): Uses temporary workspace
  - `"/path/to/outputs"`: Copies results here
  
- **keep_workspace**: Preserve temporary workspace
  - `False` (default): Cleanup after completion
  - `True`: Keep workspace for inspection

### Return Value

```python
@dataclass
class JoernAnalysisResult:
    cpg_bin_path: Path              # Path to cpg.bin
    graphs: Dict[str, any]          # Graph data/paths
    workspace_path: Path            # Workspace directory
    source_info: Dict[str, str]     # Source metadata
```

**graphs dictionary keys:**
- `'ast_dot'`: AST in DOT format (string)
- `'cfg_dot'`: CFG in DOT format (string)
- `'nodes_json_path'`: Path to nodes JSON file
- `'methods_json_path'`: Path to methods JSON file
- `'ast_svg_path'`: Path to AST SVG (if Graphviz available)
- `'cfg_svg_path'`: Path to CFG SVG (if Graphviz available)

---

## Usage Examples

### Example 1: Analyze a Single File

```python
from joern_analyzer import analyze_code_with_joern

# Analyze a Java file
result = analyze_code_with_joern("Example.java")

# Access CPG binary
print(f"CPG saved at: {result.cpg_bin_path}")

# Access AST DOT graph
ast_dot = result.graphs['ast_dot']
print(ast_dot)

# Access CFG
cfg_dot = result.graphs['cfg_dot']
with open("my_cfg.dot", "w") as f:
    f.write(cfg_dot)
```

### Example 2: Analyze a Repository

```python
from joern_analyzer import analyze_code_with_joern
from pathlib import Path

# Analyze entire repository
repo_path = Path("/path/to/my-project")
result = analyze_code_with_joern(
    repo_path,
    output_dir="/path/to/analysis-results",
    keep_workspace=True
)

# Results are saved to /path/to/analysis-results/
print(f"Analysis complete. Results in: {result.workspace_path}")
print(f"Available graphs: {list(result.graphs.keys())}")
```

### Example 3: Programmatic Graph Access

```python
import json
from joern_analyzer import analyze_code_with_joern

result = analyze_code_with_joern("app.cpp", keep_workspace=True)

# Load and process nodes JSON
nodes_path = result.graphs['nodes_json_path']
with open(nodes_path, 'r') as f:
    # Note: Joern exports Scala collections, may need parsing
    nodes_data = f.read()
    # Process nodes...

# Load method metadata
methods_path = result.graphs['methods_json_path']
with open(methods_path, 'r') as f:
    methods_data = f.read()
    # Process methods...
```

### Example 4: Visualization Workflow

```python
from joern_analyzer import analyze_code_with_joern
import subprocess

result = analyze_code_with_joern(
    "source.java",
    output_dir="./analysis",
    keep_workspace=True
)

# If SVG was generated
if 'ast_svg_path' in result.graphs:
    svg_path = result.graphs['ast_svg_path']
    # Open in browser
    subprocess.run(["xdg-open", svg_path])  # Linux
    # subprocess.run(["open", svg_path])    # macOS
    # subprocess.run(["start", svg_path])   # Windows

# Or generate custom visualization from DOT
ast_dot = result.graphs['ast_dot']
with open("custom.dot", "w") as f:
    f.write(ast_dot)

# Convert to PDF
subprocess.run(["dot", "-Tpdf", "custom.dot", "-o", "ast_graph.pdf"])
```

---

## Workspace Structure

```
/tmp/joern_analysis_XXXXXX/
├── analyze.sc              # Joern script for CPG generation
├── export.sc               # Joern script for graph extraction
├── input/                  # Source code (copied here)
│   ├── Example.java
│   └── ...
└── output/                 # Generated artifacts
    ├── cpg.bin            # Serialized CPG (binary)
    ├── ast.dot            # AST in GraphViz format
    ├── cfg.dot            # CFG in GraphViz format
    ├── nodes.json         # All nodes with properties
    ├── methods.json       # Method metadata
    ├── ast.svg            # AST visualization (if Graphviz available)
    └── cfg.svg            # CFG visualization (if Graphviz available)
```

---

## Technical Details

### Dependencies

**Required:**
- Python 3.8+
- Docker (running daemon)

**Optional:**
- Graphviz (for SVG generation)

**Python Packages:**
- Built-in only (subprocess, tempfile, pathlib, dataclasses, logging)

### Supported Languages

Joern supports multiple languages. The function works with any language Joern can parse:

- **Java** (full support)
- **C/C++** (full support)
- **JavaScript** (full support)
- **Python** (full support)
- **Go** (experimental)
- **Others** (check Joern documentation)

### Performance Characteristics

| Aspect | Details |
|--------|---------|
| Startup | 2-5 seconds (container initialization) |
| CPG Generation | O(n) where n = lines of code |
| Typical Speed | ~1000-5000 LOC/second |
| Memory | ~500MB-2GB (depends on code size) |
| Storage | CPG ~10-100x source size |

### Error Handling

The function raises exceptions for:
- **ValueError**: Invalid source path
- **RuntimeError**: Docker unavailable, Joern failures
- All exceptions include descriptive messages

---

## Limitations and Scope

### What This Function DOES:

✅ Spin up Joern container  
✅ Generate CPG (AST, CFG, DFG, PDG)  
✅ Extract graphs as DOT, JSON  
✅ Generate SVG visualizations  
✅ Persist all artifacts  
✅ Provide programmatic access  

### What This Function DOES NOT:

❌ Vulnerability detection  
❌ Security scoring  
❌ Pattern matching  
❌ Code quality analysis  
❌ CI/CD integration  
❌ Performance profiling  
❌ Higher-level semantic analysis  

---

## Extending the Function

While the function is purposely limited in scope, you can build on top of it:

```python
from joern_analyzer import analyze_code_with_joern

# Step 1: Generate graphs (this function)
result = analyze_code_with_joern("app.java")

# Step 2: Your custom analysis
def analyze_security(cpg_path):
    # Load CPG and run custom queries
    # (outside scope of this function)
    pass

def calculate_metrics(graphs):
    # Process extracted graphs
    # (outside scope of this function)
    pass

# Use the generated CPG for your purposes
analyze_security(result.cpg_bin_path)
calculate_metrics(result.graphs)
```

---

## Troubleshooting

### Docker Issues

```python
# Error: Docker is not running
# Solution: Start Docker daemon

# Error: Permission denied
# Solution (Linux): Add user to docker group
sudo usermod -aG docker $USER
```

### Joern Issues

```python
# Error: Joern CPG generation failed
# Check: Joern logs in result.workspace_path
# Common causes:
#   - Unsupported language
#   - Syntax errors in source
#   - Out of memory

# Solution: Check workspace for error logs
result = analyze_code_with_joern("code.java", keep_workspace=True)
# Inspect: result.workspace_path/analyze.sc and container output
```

### Graph Extraction Issues

```python
# Warning: Some graph exports might fail
# Reason: Scala/Java serialization quirks
# Solution: Function continues, returns available graphs
# Always check: result.graphs.keys()
```

---

## Best Practices

1. **Use keep_workspace=True during development**
   ```python
   result = analyze_code_with_joern(source, keep_workspace=True)
   # Inspect workspace to debug issues
   ```

2. **Specify output_dir for production use**
   ```python
   result = analyze_code_with_joern(
       source,
       output_dir="/persistent/storage"
   )
   ```

3. **Check available graphs**
   ```python
   result = analyze_code_with_joern(source)
   if 'ast_svg_path' in result.graphs:
       # Graphviz was available
       display_svg(result.graphs['ast_svg_path'])
   else:
       # Fall back to DOT
       process_dot(result.graphs['ast_dot'])
   ```

4. **Reuse CPG for multiple analyses**
   ```python
   result = analyze_code_with_joern(source, keep_workspace=True)
   cpg_path = result.cpg_bin_path
   
   # Can load this CPG multiple times without re-parsing
   run_analysis_1(cpg_path)
   run_analysis_2(cpg_path)
   ```

---

## References

- **Joern Documentation**: https://docs.joern.io/
- **OverflowDB (CPG storage)**: https://github.com/ShiftLeftSecurity/overflowdb
- **GraphViz (DOT format)**: https://graphviz.org/
- **Code Property Graphs**: https://github.com/ShiftLeftSecurity/codepropertygraph

---

## Summary

This implementation provides a **clean, single-purpose interface** to Joern's static analysis capabilities. It handles all container lifecycle management, graph generation, and artifact persistence, allowing you to focus on **using** the graphs rather than **generating** them.

The function is intentionally minimal and focused, making it easy to integrate into larger systems while maintaining clear separation of concerns.
