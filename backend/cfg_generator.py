import ast
from typing import Dict, List, Set

def extract_user_functions_and_calls(source_code: str) -> Dict[str, Set[str]]:
    """
    Parses the source code and returns a dict mapping each user-defined function
    to the set of user-defined functions it calls.
    """
    tree = ast.parse(source_code)
    user_functions = set()
    calls = {}

    # First pass: collect all user-defined function names
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            user_functions.add(node.name)

    # Second pass: for each function, collect calls to user-defined functions
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_name = node.name
            calls[func_name] = set()
            for child in ast.walk(node):
                if isinstance(child, ast.Call):
                    # Only consider direct function calls (not methods for now)
                    if isinstance(child.func, ast.Name):
                        called = child.func.id
                        if called in user_functions:
                            calls[func_name].add(called)
    return calls

def build_cfg_json(source_code: str) -> Dict:
    """
    Returns a JSON-serializable dict representing the control flow graph.
    Nodes: user-defined functions
    Edges: function calls between them
    """
    calls = extract_user_functions_and_calls(source_code)
    nodes = [{"id": name, "label": name} for name in calls.keys()]
    edges = []
    for src, targets in calls.items():
        for tgt in targets:
            edges.append({"from": src, "to": tgt})
    return {"nodes": nodes, "edges": edges}
