# 🔬 Code Analysis Features - Technical Guide

## Overview

The platform now includes advanced code analysis capabilities:

- **Tokenization**: Breaks down source code into tokens (keywords, operators, identifiers, etc.)
- **AST Generation**: Creates Abstract Syntax Trees for Python files
- **Semantic Analysis**: Extracts functions, classes, imports, and their relationships
- **Semantic Graph**: Visualizes the structure and relationships in your codebase

---

## 🎯 What Gets Analyzed

### Supported Languages

| Language | Tokenization | AST | Semantic Analysis |
|----------|--------------|-----|-------------------|
| Python | ✅ Full | ✅ Full | ✅ Full |
| JavaScript | ✅ Basic | ❌ | ✅ Regex-based |
| TypeScript | ✅ Basic | ❌ | ✅ Regex-based |
| JSX/TSX | ✅ Basic | ❌ | ✅ Regex-based |

### What's Extracted

#### For Python Files:
1. **Tokens**
   - Keywords (def, class, if, for, etc.)
   - Identifiers (variable names, function names)
   - Operators (+, -, ==, etc.)
   - Literals (strings, numbers)
   - Comments are removed

2. **AST Structure**
   - Full Abstract Syntax Tree up to 3 levels deep
   - Node types (FunctionDef, ClassDef, If, For, etc.)
   - Line numbers for each node

3. **Functions**
   - Name
   - Line number
   - Arguments
   - Decorators
   - Cyclomatic complexity

4. **Classes**
   - Name
   - Line number
   - Methods
   - Base classes

5. **Imports**
   - Module names
   - Import type (import vs from-import)

#### For JavaScript/TypeScript Files:
1. **Tokens**
   - Keywords, operators, identifiers
   - Strings and numbers
   - Comments removed

2. **Functions** (regex-based detection)
   - Function declarations
   - Arrow functions
   - Named function expressions

3. **Classes**
   - ES6 class declarations

4. **Imports**
   - ES6 import statements

---

## 📊 Understanding the Metrics

### Token Count
- Total number of meaningful code tokens (excluding comments)
- Higher count = more code complexity
- Useful for estimating code size

### Line Count
- Total lines of code (including blank lines)
- Standard metric for code volume

### Cyclomatic Complexity
- Measures the number of independent paths through code
- **1-10**: Simple, low risk
- **11-20**: Moderate complexity
- **21-50**: High complexity, needs refactoring
- **50+**: Very high complexity, testing difficult

Formula: `Complexity = 1 + number of decision points (if, for, while, etc.)`

### Aggregate Statistics
- **Total Tokens**: Sum of all tokens across analyzed files
- **Total Functions**: Count of all functions/methods
- **Total Classes**: Count of all class definitions

---

## 🎨 UI Tabs Explained

### 1. Overview Tab
Traditional project metadata:
- Languages and frameworks
- Dependencies
- Test files
- Security warnings
- Project structure tree

### 2. Code Analysis Tab
Detailed per-file analysis:
- **Left Panel**: List of analyzed files with quick stats
- **Right Panel**: Selected file details
  - Token count and line count
  - Complexity score
  - Imports used
  - Classes with methods
  - Functions with arguments
  - Token preview (first 50 tokens)

**How to use:**
1. Click on any file in the left panel
2. View detailed analysis in the right panel
3. Scroll through imports, classes, and functions
4. Review token stream to understand code structure

### 3. Semantic Graph Tab
Visual representation of code structure:
- **Hierarchical View**: Files → Classes → Functions
- **Color Coding**:
  - 🔵 Blue: Files
  - 🟣 Purple: Classes
  - 🟢 Green: Functions
- **Graph Statistics**: Node and edge counts

**Understanding the Graph:**
- Each file is a root node
- Classes are indented under their file
- Functions are further indented
- Shows "contains" relationships

---

## 🔍 Example Outputs

### Python Function Analysis
```json
{
  "name": "calculate_total",
  "line": 15,
  "args": ["items", "tax_rate"],
  "decorators": ["@staticmethod"]
}
```

### Python Class Analysis
```json
{
  "name": "ShoppingCart",
  "line": 10,
  "methods": ["add_item", "remove_item", "get_total"],
  "bases": ["BaseCart"]
}
```

### Token Example
```
KEYWORD        def
IDENTIFIER     calculate_total
DELIMITER      (
IDENTIFIER     items
PUNCTUATION    ,
IDENTIFIER     tax_rate
DELIMITER      )
PUNCTUATION    :
```

### AST Example (Simplified)
```json
{
  "type": "FunctionDef",
  "name": "calculate_total",
  "line": 15,
  "children": [
    {
      "type": "Return",
      "line": 16,
      "children": [...]
    }
  ]
}
```

---

## 🚀 Use Cases

### 1. Code Review Preparation
- Review complexity metrics before PR review
- Identify overly complex functions that need refactoring
- Check import dependencies

### 2. Onboarding New Developers
- Visualize project structure with semantic graph
- Understand class hierarchies
- See function relationships

### 3. Refactoring Planning
- Find high-complexity functions
- Identify deeply nested code
- Locate duplicate patterns (manual review of tokens)

### 4. Documentation Generation
- Extract all public APIs (classes and functions)
- Generate function signatures
- List module dependencies

### 5. Test Planning
- Count total functions to estimate test coverage needs
- Identify complex functions that need more tests
- See which files lack tests

---

## ⚙️ Technical Implementation

### Python Analysis
Uses Python's built-in `ast` and `tokenize` modules:

```python
import ast
import tokenize

# Parse into AST
tree = ast.parse(source_code)

# Walk the tree
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        # Extract function info
        ...
```

### JavaScript Analysis
Uses regex patterns for basic extraction:

```python
# Find function declarations
pattern = r'function\s+(\w+)'
functions = re.findall(pattern, source_code)
```

**Note**: For production, consider using proper JS parsers like:
- Esprima
- Babel parser
- Acorn

---

## 📈 Performance Considerations

### File Limits
- Maximum **50 files** analyzed per upload
- Prevents UI slowdown and timeout issues
- Focus on most important source files

### Token Limits
- First **1000 tokens** per file displayed
- Full analysis still performed
- Reduces memory usage

### AST Depth
- Maximum **3 levels** deep
- Prevents exponential growth
- Captures essential structure

### Why These Limits?
- Browser memory constraints
- API response time
- UI rendering performance
- User experience (too much data is overwhelming)

---

## 🐛 Limitations & Known Issues

### Python
✅ Full AST support  
✅ Accurate complexity calculation  
✅ Complete token stream  
❌ No type hint extraction (yet)  
❌ No docstring parsing (yet)  

### JavaScript/TypeScript
✅ Basic function/class detection  
✅ Import extraction  
❌ No proper AST (uses regex)  
❌ May miss complex patterns  
❌ No complexity calculation  

### General
- Binary files are skipped
- Files with syntax errors are skipped
- Very large files (>10MB) may timeout
- Minified code produces unhelpful tokens

---

## 🔮 Future Enhancements

### Planned Features
1. **Control Flow Graphs**: Visual diagrams of code execution paths
2. **Call Graph Analysis**: Which functions call which
3. **Dependency Graph**: Module-level import relationships
4. **Dead Code Detection**: Unused functions and variables
5. **Code Duplication**: Find similar code blocks
6. **Security Pattern Matching**: Detect common vulnerabilities
7. **Type Inference**: Extract and validate type hints
8. **Documentation Coverage**: Check for missing docstrings

### Parser Improvements
- Add proper JavaScript AST parser (Esprima/Babel)
- Support Java (Eclipse JDT)
- Support Go (go/parser)
- Support C++ (Clang)

---

## 💡 Tips for Best Results

### 1. Clean Code First
- Remove commented-out code
- Fix syntax errors
- Use consistent formatting

### 2. Small Batches
- Analyze specific modules, not entire monorepos
- Focus on changed files in PRs
- Break large projects into subsections

### 3. Interpret Metrics
- Complexity >20 doesn't mean "bad code"
- Consider domain complexity
- Some algorithms are inherently complex

### 4. Use Filters
- Skip generated code (migrations, compiled files)
- Exclude vendor/node_modules
- Focus on your source code

---

## 📚 Resources

### Learn More About:
- **AST**: [Python AST Documentation](https://docs.python.org/3/library/ast.html)
- **Tokenization**: [Python tokenize module](https://docs.python.org/3/library/tokenize.html)
- **Cyclomatic Complexity**: [Wikipedia](https://en.wikipedia.org/wiki/Cyclomatic_complexity)
- **Code Metrics**: [SonarQube Documentation](https://docs.sonarqube.org/)

### Tools for Deeper Analysis:
- **Python**: pylint, radon, mccabe
- **JavaScript**: ESLint, complexity-report
- **Multi-language**: SonarQube, CodeClimate

---

## ❓ FAQ

**Q: Why are some files not analyzed?**  
A: Files with syntax errors, binary files, or unsupported languages are skipped.

**Q: Can I analyze private repositories?**  
A: Yes, but you'll need to clone locally and upload as .zip.

**Q: How accurate is JavaScript analysis?**  
A: Basic patterns work well, but complex code may be missed. Use ESLint for production.

**Q: Can I export the analysis results?**  
A: Currently view-only. Export feature coming in Stage 2.

**Q: Does this work with Python 2?**  
A: Best results with Python 3.6+. Python 2 may have parsing issues.

---

**Built with ❤️ for better code understanding**