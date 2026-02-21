# C/C++ Analysis Implementation Guide

## 🎯 Overview

This document describes the implementation of C/C++ graphical analysis for the Project-Nova testing platform. The implementation adds comprehensive support for analyzing C and C++ codebases, including:

- **AST (Abstract Syntax Tree) Analysis**: Parse and analyze C/C++ code structure
- **Control Flow Graph (CFG)**: Generate function call graphs for single files
- **Project-wide CFG**: Analyze function relationships across entire C/C++ projects
- **Include Dependency Analysis**: Track #include directives

## 🏗️ Architecture

### New Components

#### 1. **cpp_parser.py** (New File)
Core C/C++ parsing module using tree-sitter.

**Key Features:**
- Separate parsing for C and C++ (with advanced C++ features)
- Function extraction (including templates, namespaces, class methods)
- Class/struct extraction (with inheritance)
- Namespace extraction
- Include directive analysis
- Function call graph generation

**Main Classes:**
- `CppParser`: Main parser class with methods for extracting various code elements

**Usage Example:**
```python
from cpp_parser import CppParser, analyze_cpp_file

parser = CppParser()
tree = parser.parse(code, is_cpp=True)
functions = parser.extract_functions(tree, code, is_cpp=True)
classes = parser.extract_classes(tree, code)
call_graph = parser.build_call_graph(tree, code, is_cpp=True)
```

#### 2. **Extended ast_analyzer.py**
Added C/C++ analysis capabilities to existing AST analyzer.

**New Features:**
- Support for `.c`, `.cpp`, `.cc`, `.cxx`, `.h`, `.hpp` files
- `_analyze_c()` method for C code analysis
- `_analyze_cpp()` method for C++ code analysis (with classes, namespaces, templates)

**Key Additions:**
```python
# Now supports these extensions
self.supported_extensions = {'.py', '.js', '.jsx', '.ts', '.tsx', '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'}
```

#### 3. **Extended cfg_generator.py**
Added C/C++ CFG generation for single files.

**New Classes:**
- `CppCFGGenerator`: Generates control flow graphs for C/C++ code
  - Supports both C and C++ syntax
  - Handles class methods with `ClassName::methodName` notation
  - Filters standard library functions

**Updated Functions:**
- `build_cfg_json()`: Now accepts `language` parameter ('python', 'c', 'cpp')

**Usage Example:**
```python
from cfg_generator import build_cfg_json

# For C++ code
cfg = build_cfg_json(source_code, language='cpp')

# For C code
cfg = build_cfg_json(source_code, language='c')
```

#### 4. **Extended project_cfg.py**
Added project-wide CFG for C/C++ projects.

**New Classes:**
- `CppProjectCFGGenerator`: Generates project-wide CFG for C/C++ projects
  - Scans entire project for C/C++ files
  - Builds comprehensive call graph across files
  - Handles include dependencies
  - Supports both C and C++ projects

**Updated Functions:**
- `build_project_cfg_json()`: Now accepts `language` parameter with auto-detection

**Usage Example:**
```python
from pathlib import Path
from project_cfg import build_project_cfg_json

# Auto-detect language
cfg = build_project_cfg_json(Path('/path/to/project'))

# Explicit C++ project
cfg = build_project_cfg_json(Path('/path/to/project'), language='cpp')

# Explicit C project
cfg = build_project_cfg_json(Path('/path/to/project'), language='c')
```

#### 5. **Updated main.py**
Modified API endpoints to support C/C++.

**Changes:**
- `/cfg` endpoint now accepts `language` parameter
- `/preprocess` endpoint auto-detects primary language and uses appropriate analyzer
- Added language detection logic (C++ > C > Python priority)

## 📦 Dependencies

### New Requirements
Added to `requirements.txt`:
```
tree-sitter==0.21.3
tree-sitter-c==0.21.4
tree-sitter-cpp==0.22.3
boto3==1.34.0
requests==2.31.0
```

### Installation
```bash
cd /path/to/Project-Nova
pip install -r requirements.txt
```

Or install with virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 🚀 Usage

### Frontend Integration

The frontend doesn't need changes because the backend now automatically:
1. Detects the project language
2. Uses the appropriate parser/analyzer
3. Returns results in the same format

### API Endpoints

#### 1. Single File CFG
```http
POST /cfg
Content-Type: application/json

{
  "code": "int add(int a, int b) { return a + b; }",
  "language": "c"
}
```

Response includes nodes, edges, and statistics about the code.

#### 2. Project Analysis
```http
POST /preprocess
Content-Type: multipart/form-data

file: project.zip
```

Response includes:
- `detected_language`: Auto-detected language ('python', 'c', 'cpp')
- `control_flow_graph`: Project-wide CFG
- `ast_analysis`: Code structure analysis

### Direct Python Usage

#### Example 1: Analyze a C++ File
```python
from pathlib import Path
from cpp_parser import analyze_cpp_file

result = analyze_cpp_file(Path('calculator.cpp'))
print(f"Functions: {result['functions']}")
print(f"Classes: {result['classes']}")
print(f"Namespaces: {result['namespaces']}")
print(f"Call Graph: {result['call_graph']}")
```

#### Example 2: Generate CFG for C Code
```python
from cfg_generator import build_cfg_json

c_code = """
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int result = factorial(5);
    return 0;
}
"""

cfg = build_cfg_json(c_code, language='c')
print(f"Total functions: {cfg['stats']['total_functions']}")
print(f"Nodes: {len(cfg['nodes'])}")
print(f"Edges: {len(cfg['edges'])}")
```

#### Example 3: Analyze Entire C++ Project
```python
from pathlib import Path
from project_cfg import build_project_cfg_json

project_path = Path('/path/to/cpp/project')
cfg = build_project_cfg_json(project_path, language='cpp')

print(f"Total functions: {cfg['stats']['total_functions']}")
print(f"Files processed: {cfg['stats']['files_processed']}")
print(f"Class methods: {cfg['stats']['class_methods']}")
print(f"Template functions: {cfg['stats']['template_functions']}")
```

## 🎨 Supported C++ Features

### Functions
- ✅ Regular functions
- ✅ Template functions
- ✅ Static functions
- ✅ Function overloading
- ✅ Return types and parameters

### Classes
- ✅ Class definitions
- ✅ Struct definitions
- ✅ Member functions (methods)
- ✅ Inheritance (base classes)
- ✅ Template classes
- ✅ Access modifiers (public, private, protected)

### Namespaces
- ✅ Namespace definitions
- ✅ Nested namespaces
- ✅ Namespace-qualified names (e.g., `std::vector`)

### Other Features
- ✅ Include directives (`#include`)
- ✅ System vs local includes
- ✅ Function calls (including method calls)
- ✅ Qualified names (e.g., `ClassName::methodName`)

## 📊 Output Format

### CFG Node Structure
```json
{
  "id": "Calculator::add",
  "label": "add",
  "file": "src/calculator.cpp",
  "line": 15,
  "return_type": "int",
  "connected": true,
  "is_method": true,
  "class_name": "Calculator",
  "namespace": "Math",
  "is_static": false,
  "is_template": false
}
```

### CFG Edge Structure
```json
{
  "from": "Calculator::multiply",
  "to": "Calculator::add",
  "file": "src/calculator.cpp"
}
```

### Statistics
```json
{
  "total_functions": 25,
  "displayed_functions": 25,
  "total_calls": 18,
  "connected_functions": 20,
  "isolated_functions": 5,
  "external_references": 3,
  "files_processed": 8,
  "static_functions": 4,
  "template_functions": 2,
  "class_methods": 12
}
```

## 🔍 Language Detection

The system uses the following priority for auto-detection:
1. **C++** - If `.cpp`, `.cc`, `.cxx`, or `.hpp` files are found
2. **C** - If `.c` files are found (but no C++ files)
3. **Python** - Default fallback

This can be overridden by explicitly passing the `language` parameter.

## 🧪 Testing

### Test Files Included
- `test_cpp_parser.py`: Unit tests for C/C++ parser

### Running Tests
```bash
cd backend
python test_cpp_parser.py
```

Expected output:
```
🧪 C/C++ Parser Test Suite

============================================================
Testing C Parser
============================================================
✓ Found 3 functions:
  - add (line 4) -> int
  - multiply (line 8) -> int
  - main (line 13) -> int
...
✅ C parser test PASSED!

============================================================
Testing C++ Parser
============================================================
✓ Found 3 functions:
...
✅ C++ parser test PASSED!

🎉 All tests passed!
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Import Errors
**Problem:** `ImportError: No module named 'tree_sitter'`

**Solution:**
```bash
pip install tree-sitter tree-sitter-c tree-sitter-cpp
```

#### 2. Parser Not Available
**Problem:** "C/C++ parser not available" in results

**Solution:** Ensure tree-sitter dependencies are installed correctly.

#### 3. No Functions Found
**Problem:** Empty CFG results for C/C++ code

**Solution:** 
- Check file extensions are `.c`, `.cpp`, `.cc`, `.cxx`, `.h`, or `.hpp`
- Verify code has proper function definitions
- Check for syntax errors in the source code

## 📝 Implementation Notes

### Design Decisions

1. **Separate Analyzers**: C and C++ have separate parsing paths due to significant language differences
2. **Method Naming**: C++ methods use `ClassName::methodName` format in the graph for clarity
3. **External Filtering**: Standard library functions (printf, cout, etc.) are filtered from external references
4. **Auto-detection**: Projects with mixed languages prioritize C++ > C > Python

### Performance Considerations

- Large projects (>200 functions) are automatically trimmed to show most connected functions
- Tree-sitter parsing is fast but may be slower than AST for Python
- Files in common build directories (build/, dist/, etc.) are automatically skipped

## 🔮 Future Enhancements

Potential improvements:
- [ ] C++ template specialization analysis
- [ ] Virtual function resolution
- [ ] Constructor/destructor tracking
- [ ] Operator overloading visualization
- [ ] Macro expansion handling
- [ ] Header-implementation file linking
- [ ] Cross-language call analysis (C++ calling C functions)

## 📄 License

This implementation follows the same license as the Project-Nova platform.

## 👥 Contributing

When adding new features:
1. Update the appropriate parser in `cpp_parser.py`
2. Extend the CFG generators as needed
3. Add tests to `test_cpp_parser.py`
4. Update this documentation

---

**Last Updated:** February 21, 2026
**Version:** 1.0.0
**Author:** Project-Nova Team
