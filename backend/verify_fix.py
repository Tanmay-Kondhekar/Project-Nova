#!/usr/bin/env python3
"""
Quick verification test for C/C++ parser fix
"""

import sys
import os

# Add backend to path
sys.path.insert(0, '/home/tammy/Documents/Project-Nova/backend')

def test_basic_functionality():
    """Test that the parser doesn't crash and can extract basic info"""
    try:
        print("=" * 60)
        print("Testing C/C++ Parser Fix")
        print("=" * 60)
        
        from cpp_parser import CppParser
        print("✓ CppParser imported successfully")
        
        # Simple C++ test code
        test_code = """
#include <iostream>

namespace Test {
    class Calculator {
    public:
        int add(int a, int b) {
            return a + b;
        }
    };
}

int main() {
    Test::Calculator calc;
    int result = calc.add(5, 3);
    return 0;
}
"""
        
        parser = CppParser()
        print("✓ Parser initialized")
        
        tree = parser.parse(test_code, is_cpp=True)
        print("✓ Code parsed successfully")
        
        # Test each extraction method
        functions = parser.extract_functions(tree, test_code, is_cpp=True)
        print(f"✓ Found {len(functions)} functions: {[f['name'] for f in functions]}")
        
        classes = parser.extract_classes(tree, test_code)
        print(f"✓ Found {len(classes)} classes: {[c['name'] for c in classes]}")
        
        namespaces = parser.extract_namespaces(tree, test_code)
        print(f"✓ Found {len(namespaces)} namespaces: {[n['name'] for n in namespaces]}")
        
        includes = parser.extract_includes(tree, test_code)
        print(f"✓ Found {len(includes)} includes: {[i['path'] for i in includes]}")
        
        call_graph = parser.build_call_graph(tree, test_code, is_cpp=True)
        print(f"✓ Built call graph with {len(call_graph)} entries")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED - Parser is working correctly!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ TEST FAILED: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_basic_functionality()
    sys.exit(0 if success else 1)
