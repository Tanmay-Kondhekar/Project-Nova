"""
C/C++ Parser Module using tree-sitter
Handles parsing of C and C++ code for AST analysis and CFG generation
"""

import logging
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional, Any
from tree_sitter import Language, Parser, Node, Tree
import tree_sitter_c
import tree_sitter_cpp

logger = logging.getLogger(__name__)


class CppParser:
    """
    Parser for C/C++ code using tree-sitter
    Supports both C and C++ with advanced features
    """
    
    def __init__(self):
        """Initialize C and C++ parsers"""
        try:
            self.c_language = Language(tree_sitter_c.language())
            self.cpp_language = Language(tree_sitter_cpp.language())
            
            self.c_parser = Parser(self.c_language)
            self.cpp_parser = Parser(self.cpp_language)
            
            logger.info("C/C++ parsers initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize C/C++ parsers: {e}")
            raise
    
    def parse(self, code: str, is_cpp: bool = True) -> Tree:
        """
        Parse C or C++ code
        
        Args:
            code: Source code as string
            is_cpp: True for C++, False for C
            
        Returns:
            tree-sitter Tree object
        """
        parser = self.cpp_parser if is_cpp else self.c_parser
        return parser.parse(bytes(code, 'utf-8'))
    
    def extract_functions(self, tree: Tree, code: str, is_cpp: bool = True) -> List[Dict[str, Any]]:
        """
        Extract all function definitions from the AST
        
        Returns list of function info dicts with:
        - name: function name
        - line: line number
        - return_type: return type
        - parameters: list of parameter info
        - is_method: whether it's a class method (C++ only)
        - class_name: containing class name if method (C++ only)
        - namespace: containing namespace (C++ only)
        - is_static: whether function/method is static
        - is_template: whether function is templated (C++ only)
        """
        functions = []
        
        # Traverse tree manually to find function definitions
        def find_functions(node, parent=None):
            # Check if this node is a function_definition
            if node.type == 'function_definition':
                is_template = parent and parent.type == 'template_declaration'
                capture_name = 'template_function' if is_template else 'function'
                func_info = self._extract_function_info(node, code, is_cpp, capture_name)
                if func_info:
                    functions.append(func_info)
            # Check for template declarations containing functions
            elif node.type == 'template_declaration' and is_cpp:
                for child in node.children:
                    if child.type == 'function_definition':
                        func_info = self._extract_function_info(child, code, is_cpp, 'template_function')
                        if func_info:
                            functions.append(func_info)
            
            # Recurse through children
            for child in node.children:
                find_functions(child, node)
        
        find_functions(tree.root_node)
        return functions
    
    def extract_function_calls(self, tree: Tree, code: str, is_cpp: bool = True) -> List[Dict[str, Any]]:
        """
        Extract all function calls from the AST
        
        Returns list of call info dicts with:
        - name: function name being called
        - line: line number
        - caller: function containing this call (if available)
        - is_method_call: whether it's a method call (C++ only)
        """
        calls = []
        
        # Traverse tree manually to find call expressions
        def find_calls(node):
            if node.type == 'call_expression':
                call_info = self._extract_call_info(node, code, is_cpp)
                if call_info:
                    calls.append(call_info)
            
            # Recurse through children
            for child in node.children:
                find_calls(child)
        
        find_calls(tree.root_node)
        return calls
    
    def extract_includes(self, tree: Tree, code: str) -> List[Dict[str, str]]:
        """
        Extract all include directives
        
        Returns list of include info dicts with:
        - path: included file path
        - line: line number
        - is_system: True for <>, False for ""
        """
        includes = []
        
        # Traverse tree manually to find include directives
        def find_includes(node):
            if node.type == 'preproc_include':
                include_info = self._extract_include_info(node, code)
                if include_info:
                    includes.append(include_info)
            
            # Recurse through children
            for child in node.children:
                find_includes(child)
        
        find_includes(tree.root_node)
        return includes
    
    def extract_classes(self, tree: Tree, code: str) -> List[Dict[str, Any]]:
        """
        Extract all class/struct definitions (C++ only)
        
        Returns list of class info dicts with:
        - name: class name
        - line: line number
        - methods: list of method names
        - base_classes: list of base class names
        - namespace: containing namespace
        - is_template: whether class is templated
        """
        classes = []
        
        # Traverse tree manually to find class definitions
        def find_classes(node, parent=None):
            # Check for class or struct specifiers
            if node.type in ['class_specifier', 'struct_specifier']:
                is_template = parent and parent.type == 'template_declaration'
                capture_name = 'template_class' if is_template else node.type.replace('_specifier', '')
                class_info = self._extract_class_info(node, code, capture_name)
                if class_info:
                    classes.append(class_info)
            # Check for template declarations containing classes
            elif node.type == 'template_declaration':
                for child in node.children:
                    if child.type in ['class_specifier', 'struct_specifier']:
                        class_info = self._extract_class_info(child, code, 'template_class')
                        if class_info:
                            classes.append(class_info)
            
            # Recurse through children
            for child in node.children:
                find_classes(child, node)
        
        find_classes(tree.root_node)
        return classes
    
    def extract_namespaces(self, tree: Tree, code: str) -> List[Dict[str, Any]]:
        """
        Extract all namespace definitions (C++ only)
        
        Returns list of namespace info dicts with:
        - name: namespace name
        - line: line number
        - nested_level: nesting depth
        """
        namespaces = []
        
        # Traverse tree manually to find namespace definitions
        def find_namespaces(node):
            if node.type == 'namespace_definition':
                ns_info = self._extract_namespace_info(node, code)
                if ns_info:
                    namespaces.append(ns_info)
            
            # Recurse through children
            for child in node.children:
                find_namespaces(child)
        
        find_namespaces(tree.root_node)
        return namespaces
    
    def build_call_graph(self, tree: Tree, code: str, is_cpp: bool = True) -> Dict[str, Set[str]]:
        """
        Build a call graph mapping function names to functions they call
        
        Returns dict: {function_name: {set of called function names}}
        """
        call_graph = {}
        
        # Extract functions
        functions = self.extract_functions(tree, code, is_cpp)
        
        # For each function, find calls within it
        for func in functions:
            func_name = func['name']
            if func.get('class_name') and is_cpp:
                # For methods, use ClassName::methodName
                func_name = f"{func['class_name']}::{func_name}"
            
            call_graph[func_name] = set()
            
            # Find the function node to search within
            func_node = self._find_function_node(tree.root_node, func['line'], code)
            if func_node:
                calls = self._extract_calls_from_node(func_node, code, is_cpp)
                call_graph[func_name].update(calls)
        
        return call_graph
    
    # Helper methods
    
    def _get_language(self, is_cpp: bool) -> Language:
        """Get the appropriate language object"""
        return self.cpp_language if is_cpp else self.c_language
    
    def _extract_function_info(self, node: Node, code: str, is_cpp: bool, capture_name: str) -> Optional[Dict[str, Any]]:
        """Extract detailed information about a function"""
        try:
            # Handle template functions
            is_template = 'template' in capture_name
            func_node = node
            
            if is_template:
                # Find the actual function_definition within template
                for child in node.children:
                    if child.type == 'function_definition':
                        func_node = child
                        break
            
            # Get function declarator
            declarator = None
            for child in func_node.children:
                if child.type == 'function_declarator':
                    declarator = child
                    break
            
            if not declarator:
                return None
            
            # Extract function name
            func_name = None
            for child in declarator.children:
                if child.type == 'identifier':
                    func_name = code[child.start_byte:child.end_byte]
                    break
                elif child.type == 'qualified_identifier' or child.type == 'field_identifier':
                    func_name = code[child.start_byte:child.end_byte]
                    break
            
            if not func_name:
                return None
            
            # Extract return type
            return_type = None
            for child in func_node.children:
                if child.type in ['primitive_type', 'type_identifier', 'sized_type_specifier']:
                    return_type = code[child.start_byte:child.end_byte]
                    break
            
            # Extract parameters
            parameters = []
            param_list = None
            for child in declarator.children:
                if child.type == 'parameter_list':
                    param_list = child
                    break
            
            if param_list:
                for param in param_list.children:
                    if param.type == 'parameter_declaration':
                        param_text = code[param.start_byte:param.end_byte]
                        parameters.append(param_text)
            
            # Check if it's a class method (C++ only)
            class_name = None
            is_method = False
            if is_cpp:
                parent = node.parent
                while parent:
                    if parent.type in ['class_specifier', 'struct_specifier']:
                        # Find class name
                        for child in parent.children:
                            if child.type == 'type_identifier':
                                class_name = code[child.start_byte:child.end_byte]
                                is_method = True
                                break
                        break
                    parent = parent.parent
            
            # Extract namespace (C++ only)
            namespace = None
            if is_cpp:
                parent = node.parent
                while parent:
                    if parent.type == 'namespace_definition':
                        for child in parent.children:
                            if child.type == 'identifier':
                                namespace = code[child.start_byte:child.end_byte]
                                break
                        break
                    parent = parent.parent
            
            # Check for static keyword
            is_static = False
            for child in func_node.children:
                if child.type == 'storage_class_specifier':
                    if code[child.start_byte:child.end_byte] == 'static':
                        is_static = True
                        break
            
            return {
                'name': func_name,
                'line': node.start_point[0] + 1,
                'return_type': return_type or 'void',
                'parameters': parameters,
                'is_method': is_method,
                'class_name': class_name,
                'namespace': namespace,
                'is_static': is_static,
                'is_template': is_template
            }
        
        except Exception as e:
            logger.debug(f"Error extracting function info: {e}")
            return None
    
    def _extract_call_info(self, node: Node, code: str, is_cpp: bool) -> Optional[Dict[str, Any]]:
        """Extract information about a function call"""
        try:
            # Get the function being called
            func_expr = None
            for child in node.children:
                if child.type in ['identifier', 'qualified_identifier', 'field_expression']:
                    func_expr = child
                    break
            
            if not func_expr:
                return None
            
            func_name = code[func_expr.start_byte:func_expr.end_byte]
            
            # Check if it's a method call (has . or ->)
            is_method_call = func_expr.type == 'field_expression'
            
            return {
                'name': func_name,
                'line': node.start_point[0] + 1,
                'is_method_call': is_method_call
            }
        
        except Exception as e:
            logger.debug(f"Error extracting call info: {e}")
            return None
    
    def _extract_include_info(self, node: Node, code: str) -> Optional[Dict[str, str]]:
        """Extract information about an include directive"""
        try:
            # Find the path node
            path_node = None
            for child in node.children:
                if child.type in ['string_literal', 'system_lib_string']:
                    path_node = child
                    break
            
            if not path_node:
                return None
            
            path = code[path_node.start_byte:path_node.end_byte]
            is_system = path_node.type == 'system_lib_string' or path.startswith('<')
            
            # Clean up the path (remove quotes/brackets)
            path = path.strip('<>"')
            
            return {
                'path': path,
                'line': node.start_point[0] + 1,
                'is_system': is_system
            }
        
        except Exception as e:
            logger.debug(f"Error extracting include info: {e}")
            return None
    
    def _extract_class_info(self, node: Node, code: str, capture_name: str) -> Optional[Dict[str, Any]]:
        """Extract information about a class/struct"""
        try:
            is_template = 'template' in capture_name
            class_node = node
            
            if is_template:
                # Find the actual class_specifier within template
                for child in node.children:
                    if child.type in ['class_specifier', 'struct_specifier']:
                        class_node = child
                        break
            
            # Get class name
            class_name = None
            for child in class_node.children:
                if child.type == 'type_identifier':
                    class_name = code[child.start_byte:child.end_byte]
                    break
            
            if not class_name:
                return None
            
            # Extract methods
            methods = []
            base_classes = []
            
            # Find field declaration list (class body)
            for child in class_node.children:
                if child.type == 'field_declaration_list':
                    # Walk through body to find methods
                    for item in child.children:
                        if item.type == 'function_definition':
                            # Extract method name
                            for subchild in item.children:
                                if subchild.type == 'function_declarator':
                                    for subsubchild in subchild.children:
                                        if subsubchild.type in ['identifier', 'field_identifier']:
                                            methods.append(code[subsubchild.start_byte:subsubchild.end_byte])
                                            break
                                    break
                
                # Extract base classes
                elif child.type == 'base_class_clause':
                    for item in child.children:
                        if item.type in ['type_identifier', 'qualified_identifier']:
                            base_classes.append(code[item.start_byte:item.end_byte])
            
            # Extract namespace
            namespace = None
            parent = node.parent
            while parent:
                if parent.type == 'namespace_definition':
                    for child in parent.children:
                        if child.type == 'identifier':
                            namespace = code[child.start_byte:child.end_byte]
                            break
                    break
                parent = parent.parent
            
            return {
                'name': class_name,
                'line': node.start_point[0] + 1,
                'methods': methods,
                'base_classes': base_classes,
                'namespace': namespace,
                'is_template': is_template
            }
        
        except Exception as e:
            logger.debug(f"Error extracting class info: {e}")
            return None
    
    def _extract_namespace_info(self, node: Node, code: str) -> Optional[Dict[str, Any]]:
        """Extract information about a namespace"""
        try:
            # Get namespace name
            ns_name = None
            for child in node.children:
                if child.type == 'identifier':
                    ns_name = code[child.start_byte:child.end_byte]
                    break
            
            if not ns_name:
                return None
            
            # Calculate nesting level
            nested_level = 0
            parent = node.parent
            while parent:
                if parent.type == 'namespace_definition':
                    nested_level += 1
                parent = parent.parent
            
            return {
                'name': ns_name,
                'line': node.start_point[0] + 1,
                'nested_level': nested_level
            }
        
        except Exception as e:
            logger.debug(f"Error extracting namespace info: {e}")
            return None
    
    def _find_function_node(self, root: Node, line: int, code: str) -> Optional[Node]:
        """Find the function node at a specific line"""
        # Recursively search for function at the given line
        def search(node):
            if node.type == 'function_definition':
                if node.start_point[0] + 1 == line:
                    return node
            
            for child in node.children:
                result = search(child)
                if result:
                    return result
            
            return None
        
        return search(root)
    
    def _extract_calls_from_node(self, node: Node, code: str, is_cpp: bool) -> Set[str]:
        """Extract all function calls within a given node"""
        calls = set()
        
        def walk(n):
            if n.type == 'call_expression':
                # Extract function name
                for child in n.children:
                    if child.type in ['identifier', 'qualified_identifier', 'field_expression']:
                        func_name = code[child.start_byte:child.end_byte]
                        # For method calls, extract just the method name
                        if '.' in func_name:
                            func_name = func_name.split('.')[-1]
                        if '->' in func_name:
                            func_name = func_name.split('->')[-1]
                        calls.add(func_name)
                        break
            
            for child in n.children:
                walk(child)
        
        walk(node)
        return calls


# Convenience functions for quick analysis

def analyze_c_file(file_path: Path) -> Dict[str, Any]:
    """
    Analyze a C file and extract all information
    
    Returns dict with:
    - functions: list of function info
    - includes: list of include info
    - call_graph: function call relationships
    """
    parser = CppParser()
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        code = f.read()
    
    tree = parser.parse(code, is_cpp=False)
    
    return {
        'functions': parser.extract_functions(tree, code, is_cpp=False),
        'includes': parser.extract_includes(tree, code),
        'call_graph': parser.build_call_graph(tree, code, is_cpp=False)
    }


def analyze_cpp_file(file_path: Path) -> Dict[str, Any]:
    """
    Analyze a C++ file and extract all information
    
    Returns dict with:
    - functions: list of function info
    - classes: list of class info
    - namespaces: list of namespace info
    - includes: list of include info
    - call_graph: function call relationships
    """
    parser = CppParser()
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        code = f.read()
    
    tree = parser.parse(code, is_cpp=True)
    
    return {
        'functions': parser.extract_functions(tree, code, is_cpp=True),
        'classes': parser.extract_classes(tree, code),
        'namespaces': parser.extract_namespaces(tree, code),
        'includes': parser.extract_includes(tree, code),
        'call_graph': parser.build_call_graph(tree, code, is_cpp=True)
    }


if __name__ == "__main__":
    # Test the parser
    test_cpp = """
    #include <iostream>
    #include "myheader.h"
    
    namespace MyNamespace {
        class Calculator {
        public:
            int add(int a, int b) {
                return a + b;
            }
            
            int multiply(int a, int b) {
                int result = add(a, 0);
                return a * b;
            }
        };
    }
    
    void standalone_function() {
        MyNamespace::Calculator calc;
        calc.add(1, 2);
    }
    """
    
    parser = CppParser()
    tree = parser.parse(test_cpp, is_cpp=True)
    
    print("Functions:", parser.extract_functions(tree, test_cpp, is_cpp=True))
    print("Classes:", parser.extract_classes(tree, test_cpp))
    print("Namespaces:", parser.extract_namespaces(tree, test_cpp))
    print("Includes:", parser.extract_includes(tree, test_cpp))
    print("Call graph:", parser.build_call_graph(tree, test_cpp, is_cpp=True))
