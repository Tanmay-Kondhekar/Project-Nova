import ast
from pathlib import Path
from typing import Dict

def extract_user_functions_and_calls_from_file(file_path: Path) -> Dict[str, set]:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        tree = ast.parse(code)
    except Exception:
        return {}
    user_functions = set()
    calls = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            user_functions.add(node.name)
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_name = node.name
            calls[func_name] = set()
            for child in ast.walk(node):
                if isinstance(child, ast.Call):
                    if isinstance(child.func, ast.Name):
                        called = child.func.id
                        if called in user_functions:
                            calls[func_name].add(called)
    return calls

def build_project_cfg_json(project_path: Path) -> Dict:
    """
    Returns a JSON-serializable dict representing the control flow graph for all Python files in the project.
    """
    all_calls = {}
    all_functions = set()
    
    # First pass: collect all functions
    for py_file in project_path.rglob('*.py'):
        file_calls = extract_user_functions_and_calls_from_file(py_file)
        all_functions.update(file_calls.keys())
        for func, targets in file_calls.items():
            if func not in all_calls:
                all_calls[func] = set()
            all_calls[func].update(targets)
    
    # Include all functions as nodes, even if they don't call anything
    nodes = [{"id": name, "label": name} for name in all_functions]
    edges = []
    for src, targets in all_calls.items():
        for tgt in targets:
            if tgt in all_functions:  # Only add edges to existing functions
                edges.append({"from": src, "to": tgt})
    return {"nodes": nodes, "edges": edges}
