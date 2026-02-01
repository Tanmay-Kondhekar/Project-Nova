# Quick Start Guide - Joern Static Analysis

## 5-Minute Setup

### 1. Prerequisites Check

```bash
# Verify Python
python3 --version  # Should be 3.8+

# Verify Docker
docker --version
docker info

# Optional: Verify Graphviz (for visualizations)
dot -V
```

### 2. Get Started

```bash
# Create a test file
cat > HelloWorld.java << 'EOF'
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
EOF

# Run analysis
python3 joern_analyzer.py HelloWorld.java

# Output will show:
# - CPG generation progress
# - Graph extraction status
# - Output file locations
```

### 3. Check Results

After running the analysis, you'll have:

```
/tmp/joern_analysis_*/
├── output/
│   ├── cpg.bin         # Full Code Property Graph
│   ├── ast.dot         # Abstract Syntax Tree (GraphViz)
│   ├── cfg.dot         # Control Flow Graph (GraphViz)
│   ├── nodes.json      # All nodes with properties
│   └── methods.json    # Method metadata
```

### 4. View Visualizations

```bash
# If Graphviz is installed, SVG files are generated
# Find your workspace path from the output, then:
cd /tmp/joern_analysis_XXXXX/output/

# Open in browser (Linux)
xdg-open ast.svg

# Or generate from DOT manually
dot -Tsvg ast.dot -o ast.svg
dot -Tpdf cfg.dot -o cfg.pdf
```

---

## Common Use Cases

### Use Case 1: Analyze a Single File

```python
from joern_analyzer import analyze_code_with_joern

result = analyze_code_with_joern("MyClass.java")
print(f"CPG saved at: {result.cpg_bin_path}")
```

### Use Case 2: Analyze a Project

```python
result = analyze_code_with_joern(
    "/path/to/my-project",
    output_dir="analysis-results"
)
print(f"Results in: {result.workspace_path}")
```

### Use Case 3: Keep Workspace for Debugging

```python
result = analyze_code_with_joern(
    "code.cpp",
    keep_workspace=True
)
# Workspace preserved for inspection
print(f"Inspect: {result.workspace_path}")
```

### Use Case 4: Extract and Process Graphs

```python
result = analyze_code_with_joern("app.py")

# Get AST DOT graph
ast = result.graphs['ast_dot']

# Save for custom processing
with open("my_ast.dot", "w") as f:
    f.write(ast)

# Process with your own tools
import networkx as nx
# ... custom graph processing
```

---

## What You Get

### Output Files

| File | Format | Purpose |
|------|--------|---------|
| `cpg.bin` | Binary | Complete CPG for Joern queries |
| `ast.dot` | GraphViz | Abstract Syntax Tree |
| `cfg.dot` | GraphViz | Control Flow Graph |
| `nodes.json` | JSON | All graph nodes |
| `methods.json` | JSON | Method information |
| `ast.svg` | SVG | AST visualization |
| `cfg.svg` | SVG | CFG visualization |

### Return Object

```python
result = analyze_code_with_joern("code.java")

# Access components
result.cpg_bin_path      # Path to CPG binary
result.graphs            # Dict of graph data
result.workspace_path    # Workspace directory
result.source_info       # Source metadata
```

---

## Troubleshooting

### "Docker is not running"

```bash
# Linux
sudo systemctl start docker

# macOS/Windows
# Start Docker Desktop
```

### "Permission denied"

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Log out and back in
```

### "Graphviz not found"

```bash
# Ubuntu/Debian
sudo apt-get install graphviz

# macOS
brew install graphviz
```

---

## Next Steps

1. **Read full documentation**: See `DOCUMENTATION.md`
2. **Explore examples**: Run `python3 examples.py`
3. **Check architecture**: See `ARCHITECTURE.md`
4. **Build custom analysis**: Use generated CPG/graphs

---

## File Overview

- **joern_analyzer.py** - Main implementation
- **examples.py** - 6 usage examples
- **DOCUMENTATION.md** - Complete technical docs
- **ARCHITECTURE.md** - System design details
- **README.md** - Setup and installation guide
- **QUICKSTART.md** - This file

---

## Key Points

✅ **Single Function**: Just `analyze_code_with_joern()`  
✅ **Automatic**: Handles Docker, Joern, everything  
✅ **Multiple Formats**: DOT, JSON, SVG, Binary  
✅ **No Extra Dependencies**: Pure Python stdlib  
✅ **Clean Interface**: Simple in, structured out  

❌ **Not Included**: Vulnerability detection, scoring, CI/CD  
❌ **Scope**: Only graph generation, not analysis  

---

## Example Session

```python
>>> from joern_analyzer import analyze_code_with_joern
>>> 
>>> # Analyze code
>>> result = analyze_code_with_joern("Example.java")
2026-02-01 11:20:15 - INFO - Docker verification successful
2026-02-01 11:20:15 - INFO - Joern image already available locally
2026-02-01 11:20:16 - INFO - Copied file: Example.java
2026-02-01 11:20:16 - INFO - Starting Joern container for CPG generation...
2026-02-01 11:20:23 - INFO - CPG generated successfully
2026-02-01 11:20:23 - INFO - Extracting graph representations...
2026-02-01 11:20:28 - INFO - AST DOT graph extracted
2026-02-01 11:20:28 - INFO - CFG DOT graph extracted
2026-02-01 11:20:28 - INFO - Analysis complete!
>>> 
>>> # Access results
>>> result.cpg_bin_path
PosixPath('/tmp/joern_analysis_abc123/output/cpg.bin')
>>> 
>>> list(result.graphs.keys())
['ast_dot', 'cfg_dot', 'nodes_json_path', 'methods_json_path', 'ast_svg_path', 'cfg_svg_path']
>>> 
>>> # Use the data
>>> ast = result.graphs['ast_dot']
>>> print(ast[:200])
digraph AST {
  node [shape=box];
  1 [label="METHOD\nmain"];
  2 [label="PARAMETER\nargs"];
  ...
```

---

**Ready to start? Run:** `python3 examples.py`
