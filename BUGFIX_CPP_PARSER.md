# C/C++ Parser Fix - Tree-sitter API Compatibility

## Problem

The error occurred because the code was using the `query.captures()` method from tree-sitter, which doesn't exist in certain versions of the tree-sitter Python bindings:

```
ERROR: 'tree_sitter.Query' object has no attribute 'captures'
```

This caused:
- ❌ C/C++ files to fail parsing
- ❌ No functions/classes detected in the website tabs
- ❌ Empty CFG visualizations for C/C++ code

## Root Cause

The tree-sitter Python API has changed between versions. The `Query.captures()` method used in the original implementation is not available in all versions of the library.

## Solution

**Replaced query-based extraction with manual tree traversal**, which is:
- ✅ Compatible with all tree-sitter versions
- ✅ More reliable and predictable
- ✅ Easier to debug and maintain

### Files Modified

#### 1. `/backend/cpp_parser.py`
Replaced all query-based methods:

**Before (❌ Broken):**
```python
query = language.query(query_string)
captures = query.captures(tree.root_node)  # THIS FAILS
for node, name in captures:
    process_node(node)
```

**After (✅ Fixed):**
```python
def find_nodes(node):
    if node.type == 'function_definition':
        process_node(node)
    for child in node.children:
        find_nodes(child)

find_nodes(tree.root_node)
```

**Methods Updated:**
- `extract_functions()` - Now uses recursive tree traversal
- `extract_function_calls()` - Now uses recursive traversal  
- `extract_includes()` - Now uses recursive traversal
- `extract_classes()` - Now uses recursive traversal
- `extract_namespaces()` - Now uses recursive traversal

#### 2. `/requirements.txt`
Changed version constraints to allow newer compatible versions:

**Before:**
```
tree-sitter==0.21.3
tree-sitter-c==0.21.4
tree-sitter-cpp==0.22.3
```

**After:**
```
tree-sitter>=0.20.0
tree-sitter-c>=0.21.0
tree-sitter-cpp>=0.22.0
```

#### 3. New Test Files

**`/backend/verify_fix.py`** - Quick verification script:
```bash
cd /home/tammy/Documents/Project-Nova/backend
python verify_fix.py
```

This will verify:
- Parser initialization works
- Code parsing succeeds
- Function extraction works
- Class extraction works
- Namespace extraction works
- Include extraction works
- Call graph generation works

## How to Apply the Fix

### Option 1: Already Applied ✅
If you're reading this, the fix has already been applied to your codebase!

### Option 2: Verify the Fix
Run the verification script:
```bash
cd backend
python verify_fix.py
```

Expected output:
```
============================================================
Testing C/C++ Parser Fix
============================================================
✓ CppParser imported successfully
✓ Parser initialized
✓ Code parsed successfully
✓ Found 2 functions: ['add', 'main']
✓ Found 1 classes: ['Calculator']
✓ Found 1 namespaces: ['Test']
✓ Found 1 includes: ['iostream']
✓ Built call graph with 2 entries

============================================================
✅ ALL TESTS PASSED - Parser is working correctly!
============================================================
```

### Option 3: Restart the Backend
```bash
cd backend
# Kill existing process if running
pkill -f "uvicorn main:app"

# Start fresh
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## What Now Works

After this fix, your website should now correctly:

✅ **Parse C/C++ files** without errors
✅ **Extract functions** from C/C++ code
✅ **Extract classes & methods** from C++ code
✅ **Extract namespaces** from C++ code
✅ **Build call graphs** showing function relationships
✅ **Display CFG visualizations** in the frontend tabs
✅ **Show code structure** in the analysis reports

## Testing the Fix

### 1. Upload a C++ Test File

Create a test file `test.cpp`:
```cpp
#include <iostream>

namespace Math {
    class Calculator {
    public:
        int add(int a, int b) {
            return a + b;
        }
        
        int multiply(int a, int b) {
            return add(a, 0) + a * b;
        }
    };
}

int main() {
    Math::Calculator calc;
    int result = calc.multiply(5, 3);
    std::cout << result << std::endl;
    return 0;
}
```

### 2. Zip and Upload
```bash
zip test.zip test.cpp
# Upload via the website frontend
```

### 3. Verify Results
You should now see:
- **Functions tab**: Shows `add`, `multiply`, `main`
- **Classes tab**: Shows `Calculator` with methods
- **CFG tab**: Shows call graph with arrows between functions
- **Namespaces**: Shows `Math` namespace

## Technical Details

### Manual Tree Traversal Approach

The new implementation walks the abstract syntax tree recursively:

```python
def find_functions(node, parent=None):
    # Check if current node matches what we're looking for
    if node.type == 'function_definition':
        extract_and_store(node)
    
    # Handle special cases (templates, etc.)
    elif node.type == 'template_declaration':
        for child in node.children:
            if child.type == 'function_definition':
                extract_and_store(child)
    
    # Recurse through all children
    for child in node.children:
        find_functions(child, node)
```

### Why This Works Better

1. **No API Dependencies**: Doesn't rely on specific tree-sitter API methods
2. **Version Agnostic**: Works with any tree-sitter version that supports basic parsing
3. **More Control**: We can handle special cases (templates, nested structures) explicitly
4. **Better Debugging**: Easier to add logging and understand what's happening
5. **No Query Syntax**: Don't need to learn or maintain tree-sitter query language

## Troubleshooting

### Still seeing errors?

1. **Clear Python cache:**
   ```bash
   cd backend
   rm -rf __pycache__
   find . -name "*.pyc" -delete
   ```

2. **Reinstall dependencies:**
   ```bash
   pip uninstall tree-sitter tree-sitter-c tree-sitter-cpp
   pip install tree-sitter>=0.20.0 tree-sitter-c>=0.21.0 tree-sitter-cpp>=0.22.0
   ```

3. **Check backend logs:**
   ```bash
   # Look for any remaining errors
   tail -f backend_output.log
   ```

4. **Verify parser initialization:**
   ```bash
   python -c "from cpp_parser import CppParser; p = CppParser(); print('✓ OK')"
   ```

### If the website still shows no functions:

1. Check the browser console for frontend errors
2. Verify the backend is running: `curl http://localhost:8000/`
3. Try uploading a simple Python file first to verify basic functionality
4. Check that auto-detection is working by looking at the response JSON

## Summary

- **Issue**: Tree-sitter query API incompatibility
- **Impact**: C/C++ analysis completely broken
- **Fix**: Replaced queries with manual tree traversal
- **Status**: ✅ FIXED
- **Version**: All changes applied to codebase
- **Next Steps**: Restart backend and test with C/C++ upload

---

**Date**: February 21, 2026  
**Status**: RESOLVED ✅
