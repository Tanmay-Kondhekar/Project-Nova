import ast
from typing import Dict, List, Set, Tuple
import logging

logger = logging.getLogger(__name__)

class ImprovedCFGGenerator:
    """
    Enhanced Control Flow Graph generator that shows ALL functions
    and properly detects various types of function calls.
    """
    
    def __init__(self, include_private: bool = False):
        self.include_private = include_private
        self.user_functions = set()
        self.calls = {}
        self.errors = []
        self.function_metadata = {}  # Store additional info about functions
    
    def extract_user_functions_and_calls(self, source_code: str) -> Dict[str, Set[str]]:
        """
        Parses source code and returns a dict mapping each function
        to the set of functions it calls.
        Now includes ALL functions, not just connected ones.
        """
        try:
            tree = ast.parse(source_code)
        except SyntaxError as e:
            logger.error(f"Syntax error in source code: {e}")
            self.errors.append(f"Syntax error: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Failed to parse source code: {e}")
            self.errors.append(f"Parse error: {str(e)}")
            return {}
        
        self.user_functions = set()
        self.calls = {}
        self.function_metadata = {}
        
        # First pass: collect ALL function names with metadata
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                func_name = node.name
                
                # Include private functions if flag is set, otherwise skip dunder methods only
                if not self.include_private and func_name.startswith('__') and func_name.endswith('__'):
                    continue
                
                self.user_functions.add(func_name)
                self.function_metadata[func_name] = {
                    'line': node.lineno,
                    'args': [arg.arg for arg in node.args.args],
                    'is_async': isinstance(node, ast.AsyncFunctionDef),
                    'is_private': func_name.startswith('_'),
                    'decorators': self._extract_decorators(node)
                }
        
        # Second pass: extract ALL function calls for each function
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                func_name = node.name
                
                # Skip dunder methods only
                if func_name.startswith('__') and func_name.endswith('__'):
                    continue
                
                self.calls[func_name] = set()
                
                # Walk through the function body to find all calls
                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        called_funcs = self._extract_called_function(child)
                        # Add ALL calls, even if they're to external functions
                        # We'll filter to user functions later for visualization
                        for called in called_funcs:
                            self.calls[func_name].add(called)
        
        return self.calls
    
    def _extract_decorators(self, node) -> List[str]:
        """Extract decorator names from a function."""
        decorators = []
        for dec in node.decorator_list:
            if isinstance(dec, ast.Name):
                decorators.append(dec.id)
            elif isinstance(dec, ast.Call) and isinstance(dec.func, ast.Name):
                decorators.append(dec.func.id)
            elif isinstance(dec, ast.Attribute):
                decorators.append(dec.attr)
        return decorators
    
    def _extract_called_function(self, call_node: ast.Call) -> List[str]:
        """
        Extract function name(s) from a Call node.
        Handles: func(), self.method(), obj.method(), Class.method(), module.func()
        """
        called = []
        
        try:
            # Direct function calls: func()
            if isinstance(call_node.func, ast.Name):
                called.append(call_node.func.id)
            
            # Attribute calls: obj.method(), self.method(), Class.method()
            elif isinstance(call_node.func, ast.Attribute):
                method_name = call_node.func.attr
                called.append(method_name)
                
                # Also try to get the full path for context
                if isinstance(call_node.func.value, ast.Name):
                    # self.method() or obj.method()
                    obj_name = call_node.func.value.id
                    if obj_name != 'self':
                        # Could be Class.method() or module.function()
                        full_name = f"{obj_name}.{method_name}"
                        called.append(full_name)
                
                # Handle chained calls: obj.attr.method()
                elif isinstance(call_node.func.value, ast.Attribute):
                    full_path = self._get_full_attribute_path(call_node.func)
                    if full_path:
                        called.append(full_path)
            
            # Subscript calls: obj[key]()
            elif isinstance(call_node.func, ast.Subscript):
                # Handle dict-based function calls
                if isinstance(call_node.func.value, ast.Name):
                    called.append(call_node.func.value.id)
        
        except Exception as e:
            logger.debug(f"Could not extract function from call: {e}")
        
        return called
    
    def _get_full_attribute_path(self, node: ast.Attribute) -> str:
        """
        Recursively extract full attribute path (e.g., 'module.submodule.function')
        """
        try:
            parts = []
            current = node
            
            while isinstance(current, ast.Attribute):
                parts.append(current.attr)
                current = current.value
            
            if isinstance(current, ast.Name):
                parts.append(current.id)
            
            return '.'.join(reversed(parts))
        except:
            return ""
    
    def build_cfg_json(self, source_code: str) -> Dict:
        """
        Returns a JSON-serializable dict representing the control flow graph.
        NOW INCLUDES ALL FUNCTIONS, not just connected ones.
        """
        calls = self.extract_user_functions_and_calls(source_code)
        
        if not calls:
            return {
                "nodes": [],
                "edges": [],
                "stats": {
                    "total_functions": 0,
                    "total_calls": 0,
                    "connected_functions": 0,
                    "isolated_functions": 0
                },
                "errors": self.errors if self.errors else ["No functions found in code"]
            }
        
        # Include ALL user-defined functions in the graph
        all_function_names = set(calls.keys())
        
        # Also include functions that are called but not defined (external references)
        called_but_not_defined = set()
        for targets in calls.values():
            for target in targets:
                # Only include simple names that match our function patterns
                if '.' not in target and target not in all_function_names:
                    # Check if this might be a user function (not a builtin)
                    if not target.startswith('__') and target not in ['print', 'len', 'range', 'str', 'int', 'list', 'dict', 'set', 'tuple']:
                        called_but_not_defined.add(target)
        
        # Determine which functions are truly connected
        connected_functions = set()
        for src, targets in calls.items():
            # Filter to only user-defined functions
            user_targets = {t for t in targets if t in all_function_names}
            if user_targets:
                connected_functions.add(src)
                connected_functions.update(user_targets)
        
        # Also mark functions as connected if they are called by others
        for src, targets in calls.items():
            for target in targets:
                if target in all_function_names:
                    connected_functions.add(target)
        
        # Build nodes for ALL functions
        nodes = []
        for func_name in sorted(all_function_names):
            metadata = self.function_metadata.get(func_name, {})
            is_connected = func_name in connected_functions
            
            node = {
                "id": func_name,
                "label": func_name,
                "connected": is_connected,
                "line": metadata.get('line'),
                "is_private": metadata.get('is_private', False),
                "is_async": metadata.get('is_async', False),
                "decorators": metadata.get('decorators', [])
            }
            nodes.append(node)
        
        # Add nodes for external references (called but not defined)
        for func_name in sorted(called_but_not_defined):
            nodes.append({
                "id": func_name,
                "label": func_name,
                "connected": True,
                "external": True
            })
        
        # Build edges
        edges = []
        edge_set = set()
        
        all_node_ids = {n['id'] for n in nodes}
        
        for src, targets in calls.items():
            if src in all_node_ids:
                for tgt in targets:
                    # Include edges to user functions AND external references
                    if tgt in all_node_ids:
                        edge_key = (src, tgt)
                        if edge_key not in edge_set:
                            edges.append({
                                "from": src,
                                "to": tgt
                            })
                            edge_set.add(edge_key)
        
        # Calculate comprehensive stats
        isolated_functions = all_function_names - connected_functions
        
        stats = {
            "total_functions": len(all_function_names),
            "displayed_functions": len(nodes),
            "total_calls": len(edges),
            "connected_functions": len(connected_functions),
            "isolated_functions": len(isolated_functions),
            "external_references": len(called_but_not_defined),
            "private_functions": sum(1 for m in self.function_metadata.values() if m.get('is_private', False)),
            "async_functions": sum(1 for m in self.function_metadata.values() if m.get('is_async', False))
        }
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": stats,
            "errors": self.errors if self.errors else None
        }


def build_cfg_json(source_code: str, include_private: bool = False) -> Dict:
    """
    Main entry point for CFG generation.
    """
    generator = ImprovedCFGGenerator(include_private=include_private)
    return generator.build_cfg_json(source_code)


# Example usage and testing
if __name__ == "__main__":
    test_code = """
def calculate_sum(a, b):
    result = add_numbers(a, b)
    return result

def add_numbers(x, y):
    return x + y

def multiply(a, b):
    return a * b

def complex_calculation(x, y):
    sum_result = calculate_sum(x, y)
    mult_result = multiply(sum_result, 2)
    return mult_result

def isolated_function():
    # This function doesn't call anything and isn't called
    return 42

def _private_helper():
    return "helper"

def uses_private():
    return _private_helper()

class Calculator:
    def add(self, a, b):
        return self.validate(a) + self.validate(b)
    
    def validate(self, num):
        return num if num > 0 else 0
    
    def calculate(self):
        result = self.add(5, 10)
        return multiply(result, 2)
"""
    
    print("Testing Improved CFG Generator:")
    print("=" * 60)
    
    # Test without private functions
    generator = ImprovedCFGGenerator(include_private=False)
    cfg = generator.build_cfg_json(test_code)
    
    print(f"\nStats: {cfg['stats']}")
    print(f"\nNodes ({len(cfg['nodes'])}):")
    for node in cfg['nodes']:
        status = "🔗" if node.get('connected') else "⭕"
        external = " [EXTERNAL]" if node.get('external') else ""
        private = " [PRIVATE]" if node.get('is_private') else ""
        print(f"  {status} {node['label']}{external}{private}")
    
    print(f"\nEdges ({len(cfg['edges'])}):")
    for edge in cfg['edges']:
        print(f"  {edge['from']} → {edge['to']}")
    
    # Test with private functions
    print("\n" + "=" * 60)
    print("Testing with include_private=True:")
    print("=" * 60)
    
    generator2 = ImprovedCFGGenerator(include_private=True)
    cfg2 = generator2.build_cfg_json(test_code)
    print(f"\nStats: {cfg2['stats']}")
    print(f"Total nodes: {len(cfg2['nodes'])}")