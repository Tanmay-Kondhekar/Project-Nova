# Joern Static Analysis Setup Guide

## Prerequisites

### Required Software

1. **Python 3.8 or higher**
   ```bash
   python3 --version
   # Should show: Python 3.8.x or higher
   ```

2. **Docker**
   ```bash
   # Install Docker (Ubuntu/Debian)
   sudo apt-get update
   sudo apt-get install docker.io
   
   # Install Docker (macOS)
   # Download from: https://docs.docker.com/desktop/mac/install/
   
   # Install Docker (Windows)
   # Download from: https://docs.docker.com/desktop/windows/install/
   
   # Verify installation
   docker --version
   docker info
   ```

3. **Docker Permissions** (Linux only)
   ```bash
   # Add your user to docker group
   sudo usermod -aG docker $USER
   
   # Log out and back in, then verify
   docker run hello-world
   ```

### Optional Software

4. **Graphviz** (for SVG visualization)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install graphviz
   
   # macOS
   brew install graphviz
   
   # Windows
   # Download from: https://graphviz.org/download/
   
   # Verify installation
   dot -V
   ```

---

## Installation

### Step 1: Clone or Download Files

```bash
# Create project directory
mkdir joern-analysis
cd joern-analysis

# Copy the following files:
# - joern_analyzer.py
# - examples.py
# - DOCUMENTATION.md
# - README.md (this file)
```

### Step 2: Verify Python Dependencies

The implementation uses only Python standard library, so no additional packages needed!

```bash
python3 -c "import subprocess, tempfile, pathlib, dataclasses, logging; print('✓ All dependencies available')"
```

### Step 3: Pull Joern Docker Image

```bash
# This will be done automatically on first run, but you can pre-pull:
docker pull ghcr.io/joernio/joern:nightly

# Verify image is available
docker images | grep joern
```

---

## Quick Start

### Test Installation

```bash
# Create a simple test file
cat > Test.java << 'EOF'
public class Test {
    public static void main(String[] args) {
        System.out.println("Hello, Joern!");
    }
}
EOF

# Run analysis
python3 joern_analyzer.py Test.java

# You should see:
# - CPG generation messages
# - Graph extraction confirmation
# - Output paths
```

### Run Example Scripts

```bash
# Run all examples
python3 examples.py

# This will create:
# - Multiple sample source files
# - Analysis results in various directories
# - DOT and SVG visualizations
```

---

## Usage Patterns

### Pattern 1: Quick Analysis

```python
from joern_analyzer import analyze_code_with_joern

# Analyze and get results
result = analyze_code_with_joern("mycode.java")

# Access CPG
print(result.cpg_bin_path)

# Access graphs
print(result.graphs.keys())
```

### Pattern 2: Persistent Storage

```python
# Save results to specific location
result = analyze_code_with_joern(
    "mycode.java",
    output_dir="/path/to/storage"
)

# All artifacts saved to /path/to/storage/
```

### Pattern 3: Development/Debugging

```python
# Keep workspace for inspection
result = analyze_code_with_joern(
    "mycode.java",
    keep_workspace=True
)

# Inspect workspace
print(f"Workspace: {result.workspace_path}")
# Contains: input/, output/, scripts/
```

---

## Directory Structure

After running examples, you'll have:

```
joern-analysis/
├── joern_analyzer.py          # Main implementation
├── examples.py                 # Usage examples
├── DOCUMENTATION.md            # Technical documentation
├── README.md                   # This file
│
├── analysis_results/           # Example 2 output
│   ├── cpg.bin
│   ├── ast.dot
│   ├── cfg.dot
│   └── ...
│
├── visualization_output/       # Example 4 output
│   ├── cpg.bin
│   ├── ast.svg
│   ├── cfg.svg
│   └── ...
│
└── /tmp/joern_analysis_*/      # Temporary workspaces
    ├── input/
    ├── output/
    ├── analyze.sc
    └── export.sc
```

---

## Troubleshooting

### Issue: "Docker is not running"

**Solution:**
```bash
# Linux
sudo systemctl start docker
sudo systemctl enable docker

# macOS
# Start Docker Desktop application

# Windows
# Start Docker Desktop application
```

### Issue: "Permission denied" when running Docker

**Solution (Linux):**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
# Or use newgrp
newgrp docker

# Test
docker run hello-world
```

### Issue: "Joern image pull failed"

**Solution:**
```bash
# Check internet connection
ping -c 3 google.com

# Try manual pull
docker pull ghcr.io/joernio/joern:nightly

# Check Docker Hub status
# https://status.docker.com/
```

### Issue: "CPG generation failed"

**Possible causes:**
1. Source code has syntax errors
2. Unsupported language
3. Out of memory

**Solution:**
```python
# Use keep_workspace=True to debug
result = analyze_code_with_joern(
    "code.java",
    keep_workspace=True
)

# Check workspace logs
# Examine: result.workspace_path/analyze.sc
```

### Issue: "Graph extraction incomplete"

**Solution:**
```python
# Check which graphs were successfully extracted
result = analyze_code_with_joern("code.java")
print(f"Available: {list(result.graphs.keys())}")

# Not all exports may succeed due to Scala/Java quirks
# Use available graphs and report issues
```

### Issue: "Graphviz not found"

**Solution:**
```bash
# Install Graphviz
# Ubuntu/Debian
sudo apt-get install graphviz

# macOS
brew install graphviz

# Verify
dot -V

# Re-run analysis
python3 examples.py
```

---

## Performance Tuning

### For Large Codebases

```python
# Joern may require more memory
# Increase Docker memory limit in Docker Desktop settings
# Recommended: 4GB+ for large projects
```

### For Multiple Analyses

```python
# Generate CPG once, reuse multiple times
result = analyze_code_with_joern(
    "project/",
    output_dir="persistent_cpg",
    keep_workspace=True
)

cpg_path = result.cpg_bin_path

# Now you can load this CPG in custom Joern queries
# without regenerating it
```

---

## Testing

### Unit Test Example

```python
import unittest
from pathlib import Path
from joern_analyzer import analyze_code_with_joern

class TestJoernAnalyzer(unittest.TestCase):
    
    def setUp(self):
        # Create test file
        self.test_file = Path("test.java")
        self.test_file.write_text("""
public class Test {
    public static void main(String[] args) {
        System.out.println("Test");
    }
}
""")
    
    def tearDown(self):
        # Cleanup
        if self.test_file.exists():
            self.test_file.unlink()
    
    def test_basic_analysis(self):
        result = analyze_code_with_joern(self.test_file)
        
        # Verify CPG was generated
        self.assertTrue(result.cpg_bin_path.exists())
        
        # Verify graphs were extracted
        self.assertIn('ast_dot', result.graphs)
        self.assertIn('cfg_dot', result.graphs)
        
        # Verify source info
        self.assertEqual(result.source_info['type'], 'file')

if __name__ == '__main__':
    unittest.main()
```

---

## Advanced Usage

### Custom Joern Queries

After generating CPG, you can run custom Joern queries:

```bash
# Start interactive Joern shell with CPG loaded
docker run -it --rm \
  -v $(pwd)/analysis_results:/workspace \
  ghcr.io/joernio/joern:nightly \
  joern

# In Joern shell:
joern> loadCpg("/workspace/cpg.bin")
joern> cpg.method.name.l
joern> cpg.call.code.l
```

### Integration with CI/CD

```python
# In CI pipeline (e.g., GitHub Actions)
import os
from joern_analyzer import analyze_code_with_joern

def ci_analysis():
    # Get source from CI environment
    source_dir = os.getenv("GITHUB_WORKSPACE", ".")
    
    # Run analysis
    result = analyze_code_with_joern(
        source_dir,
        output_dir="ci_artifacts"
    )
    
    # Save artifacts
    # (Will be uploaded by CI)
    print(f"::set-output name=cpg_path::{result.cpg_bin_path}")

if __name__ == "__main__":
    ci_analysis()
```

---

## Support and Resources

### Documentation
- **This implementation**: See DOCUMENTATION.md
- **Joern official docs**: https://docs.joern.io/
- **CPG specification**: https://cpg.joern.io/

### Community
- **Joern Gitter**: https://gitter.im/joern-code-analyzer/community
- **GitHub Issues**: https://github.com/joernio/joern/issues

### Example Projects
- **Joern examples**: https://github.com/joernio/joern/tree/master/querydb
- **CPG tutorials**: https://docs.joern.io/cpgql/

---

## What's Next?

After setting up and running basic analyses, you can:

1. **Explore the CPG**
   - Load CPG in interactive Joern shell
   - Run custom queries
   - Export specific subgraphs

2. **Build Custom Analyses**
   - Use generated graphs as input
   - Implement vulnerability detection
   - Calculate code metrics
   - Identify patterns

3. **Integrate with Tools**
   - Export to graph databases (Neo4j)
   - Visualize in graph tools (Gephi)
   - Process with NetworkX
   - Analyze with custom scripts

4. **Extend Functionality**
   - Add support for more languages
   - Implement custom graph exports
   - Create domain-specific analyses
   - Build CI/CD integrations

---

## License and Attribution

This implementation uses:
- **Joern**: Apache 2.0 License
- **Python**: PSF License
- **Docker**: Apache 2.0 License

Please refer to respective projects for full license terms.

---

## Version History

- **v1.0** (2026-02-01)
  - Initial implementation
  - Core CPG generation
  - Multi-format graph export
  - Visualization support
  - Comprehensive documentation
