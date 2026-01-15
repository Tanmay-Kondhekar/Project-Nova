import ast
from typing import Dict, List, Set, Tuple
import logging

logger = logging.getLogger(__name__)

class RobustCFGGenerator:
    """
    Enhanced Control Flow Graph generator with better error handling
    and more robust parsing
    """
    
    def __init__(self):
        self.user_functions = set()
        self.calls = {}
        self.errors = []
    
    def extract_user_functions_and_calls(self, source_code: str) -> Dict[str, Set[str]]:
        """
        Parses source code and returns a dict mapping each user-defined function
        to the set of user-defined functions it calls.
        Filters out private functions (starting with _).
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
        
        # First pass: collect all user-defined function names (skip private)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Skip private functions and dunder methods
                if not node.name.startswith('_'):
                    self.user_functions.add(node.name)
        
        # Second pass: for each function, collect calls to user-defined functions
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_name = node.name
                if func_name.startswith('_'):  # Skip private functions
                    continue
                
                self.calls[func_name] = set()
                
                # Walk through the function body
                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        called_funcs = self._extract_called_function(child)
                        for called in called_funcs:
                            if called in self.user_functions:
                                self.calls[func_name].add(called)
        
        return self.calls
    
    def _extract_called_function(self, call_node: ast.Call) -> List[str]:
        """
        Extract function name(s) from a Call node.
        Handles various call patterns.
        """
        called = []
        
        try:
            # Direct function calls: func()
            if isinstance(call_node.func, ast.Name):
                called.append(call_node.func.id)
            
            # Method calls: self.method() or obj.method()
            elif isinstance(call_node.func, ast.Attribute):
                if isinstance(call_node.func.value, ast.Name):
                    if call_node.func.value.id == 'self':
                        called.append(call_node.func.attr)
                    # Could also be class.method() - add method name
                    else:
                        called.append(call_node.func.attr)
            
            # Nested attribute calls: obj.attr.method()
            elif isinstance(call_node.func, ast.Attribute):
                attr_name = self._get_full_attribute_name(call_node.func)
                if attr_name:
                    # Extract just the final method name
                    parts = attr_name.split('.')
                    if parts:
                        called.append(parts[-1])
        
        except Exception as e:
            logger.warning(f"Failed to extract function name from call: {e}")
        
        return called
    
    def _get_full_attribute_name(self, node: ast.Attribute) -> str:
        """
        Recursively extract full attribute name (e.g., 'obj.attr.method')
        """
        try:
            if isinstance(node.value, ast.Name):
                return f"{node.value.id}.{node.attr}"
            elif isinstance(node.value, ast.Attribute):
                return f"{self._get_full_attribute_name(node.value)}.{node.attr}"
            else:
                return node.attr
        except:
            return ""
    
    def build_cfg_json(self, source_code: str) -> Dict:
        """
        Returns a JSON-serializable dict representing the control flow graph.
        Nodes: user-defined public functions
        Edges: function calls between them
        """
        calls = self.extract_user_functions_and_calls(source_code)
        
        if not calls:
            # If no functions found, return empty graph with error info
            return {
                "nodes": [],
                "edges": [],
                "stats": {
                    "total_functions": 0,
                    "total_calls": 0,
                    "connected_functions": 0
                },
                "errors": self.errors if self.errors else ["No functions found in code"]
            }
        
        # Only include connected functions (functions that call or are called)
        connected_functions = set()
        for src, targets in calls.items():
            if targets:  # Function makes calls
                connected_functions.add(src)
                connected_functions.update(targets)
        
        # Also include functions that are called but don't call others
        for src, targets in calls.items():
            for target in targets:
                connected_functions.add(target)
        
        # If no connections found, include all functions
        if not connected_functions:
            connected_functions = set(calls.keys())
        
        # Build nodes
        nodes = []
        for name in sorted(connected_functions):
            nodes.append({
                "id": name,
                "label": name
            })
        
        # Build edges (deduplicate)
        edges = []
        edge_set = set()
        
        for src, targets in calls.items():
            if src in connected_functions:
                for tgt in targets:
                    if tgt in connected_functions:
                        edge_key = (src, tgt)
                        if edge_key not in edge_set:
                            edges.append({
                                "from": src,
                                "to": tgt
                            })
                            edge_set.add(edge_key)
        
        # Calculate stats
        stats = {
            "total_functions": len(calls),
            "total_calls": sum(len(targets) for targets in calls.values()),
            "connected_functions": len(connected_functions),
            "isolated_functions": len(calls) - len(connected_functions)
        }
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": stats,
            "errors": self.errors if self.errors else None
        }


def build_cfg_json(source_code: str) -> Dict:
    """
    Main entry point for CFG generation.
    Wrapper function for backward compatibility.
    """
    generator = RobustCFGGenerator()
    return generator.build_cfg_json(source_code)


# Example usage and testing
if __name__ == "__main__":
    # Test with sample code
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

def _private_function():
    # This should be ignored
    pass
"""
    
    generator = RobustCFGGenerator()
    cfg = generator.build_cfg_json(test_code)
    
    print("CFG Result:")
    print(f"Nodes: {cfg['nodes']}")
    print(f"Edges: {cfg['edges']}")
    print(f"Stats: {cfg['stats']}")
    print(f"Errors: {cfg['errors']}")