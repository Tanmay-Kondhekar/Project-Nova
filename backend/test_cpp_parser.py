#!/usr/bin/env python3
"""
Test script for C/C++ parser functionality
"""

import sys
sys.path.insert(0, '/home/tammy/Documents/Project-Nova/backend')

from cpp_parser import CppParser

# Test C code
test_c_code = """
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int multiply(int x, int y) {
    int result = add(x, 0);
    return x * y;
}

int main() {
    int sum = add(5, 3);
    int product = multiply(sum, 2);
    printf("Result: %d\\n", product);
    return 0;
}
"""

# Test C++ code
test_cpp_code = """
#include <iostream>
#include <string>

namespace Math {
    class Calculator {
    public:
        int add(int a, int b) {
            return a + b;
        }
        
        int multiply(int a, int b) {
            int sum = add(a, 0);
            return a * b;
        }
    };
}

void printResult(int value) {
    std::cout << "Result: " << value << std::endl;
}

int main() {
    Math::Calculator calc;
    int result = calc.multiply(5, 3);
    printResult(result);
    return 0;
}
"""

def test_c_parser():
    print("=" * 60)
    print("Testing C Parser")
    print("=" * 60)
    
    try:
        parser = CppParser()
        tree = parser.parse(test_c_code, is_cpp=False)
        
        functions = parser.extract_functions(tree, test_c_code, is_cpp=False)
        print(f"\n✓ Found {len(functions)} functions:")
        for func in functions:
            print(f"  - {func['name']} (line {func['line']}) -> {func['return_type']}")
        
        includes = parser.extract_includes(tree, test_c_code)
        print(f"\n✓ Found {len(includes)} includes:")
        for inc in includes:
            print(f"  - {inc['path']} ({'system' if inc['is_system'] else 'local'})")
        
        call_graph = parser.build_call_graph(tree, test_c_code, is_cpp=False)
        print(f"\n✓ Call graph:")
        for func, calls in call_graph.items():
            if calls:
                print(f"  - {func} calls: {', '.join(calls)}")
        
        print("\n✅ C parser test PASSED!\n")
        return True
    except Exception as e:
        print(f"\n❌ C parser test FAILED: {e}\n")
        import traceback
        traceback.print_exc()
        return False

def test_cpp_parser():
    print("=" * 60)
    print("Testing C++ Parser")
    print("=" * 60)
    
    try:
        parser = CppParser()
        tree = parser.parse(test_cpp_code, is_cpp=True)
        
        functions = parser.extract_functions(tree, test_cpp_code, is_cpp=True)
        print(f"\n✓ Found {len(functions)} functions:")
        for func in functions:
            method_info = f" (method of {func['class_name']})" if func.get('is_method') else ""
            ns_info = f" in namespace {func['namespace']}" if func.get('namespace') else ""
            print(f"  - {func['name']} (line {func['line']}) -> {func['return_type']}{method_info}{ns_info}")
        
        classes = parser.extract_classes(tree, test_cpp_code)
        print(f"\n✓ Found {len(classes)} classes:")
        for cls in classes:
            ns_info = f" in namespace {cls['namespace']}" if cls.get('namespace') else ""
            print(f"  - {cls['name']}{ns_info}")
            if cls['methods']:
                print(f"    Methods: {', '.join(cls['methods'])}")
        
        namespaces = parser.extract_namespaces(tree, test_cpp_code)
        print(f"\n✓ Found {len(namespaces)} namespaces:")
        for ns in namespaces:
            print(f"  - {ns['name']} (line {ns['line']})")
        
        includes = parser.extract_includes(tree, test_cpp_code)
        print(f"\n✓ Found {len(includes)} includes:")
        for inc in includes:
            print(f"  - {inc['path']} ({'system' if inc['is_system'] else 'local'})")
        
        call_graph = parser.build_call_graph(tree, test_cpp_code, is_cpp=True)
        print(f"\n✓ Call graph:")
        for func, calls in call_graph.items():
            if calls:
                print(f"  - {func} calls: {', '.join(calls)}")
        
        print("\n✅ C++ parser test PASSED!\n")
        return True
    except Exception as e:
        print(f"\n❌ C++ parser test FAILED: {e}\n")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n🧪 C/C++ Parser Test Suite\n")
    
    c_result = test_c_parser()
    cpp_result = test_cpp_parser()
    
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"C Parser:   {'✅ PASSED' if c_result else '❌ FAILED'}")
    print(f"C++ Parser: {'✅ PASSED' if cpp_result else '❌ FAILED'}")
    print()
    
    if c_result and cpp_result:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed!")
        sys.exit(1)
