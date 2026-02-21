import ast
from pathlib import Path
from typing import Dict, Set, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Import C/C++ parser
try:
    from cpp_parser import CppParser
    CPP_PARSER_AVAILABLE = True
except ImportError:
    logger.warning("C/C++ parser not available")
    CPP_PARSER_AVAILABLE = False

class ImprovedProjectCFGGenerator:
    """
    Enhanced project-wide Control Flow Graph that:
    - Shows ALL functions across all files
    - Better cross-file function tracking
    - Handles imports and module references
    - More comprehensive visualization
    """
    
    def __init__(self, include_private: bool = False, max_nodes: int = 200):
        self.include_private = include_private
        self.max_nodes = max_nodes
        self.all_functions = {}  # func_name -> list of file_paths where defined
        self.all_calls = {}  # (file, func_name) -> set of called functions
        self.file_imports = {}  # file_path -> dict of imports
        self.function_metadata = {}  # (file, func) -> metadata
        self.errors = []
    
    def extract_functions_from_file(self, file_path: Path) -> Tuple[Set[str], Dict[str, Set[str]]]:
        """
        Extract ALL functions and their calls from a single file.
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
            
            tree = ast.parse(code)
        except SyntaxError as e:
            logger.warning(f"Syntax error in {file_path}: {e}")
            self.errors.append(f"Syntax error in {file_path.name}: {str(e)}")
            return set(), {}
        except Exception as e:
            logger.warning(f"Failed to parse {file_path}: {e}")
            self.errors.append(f"Parse error in {file_path.name}: {str(e)}")
            return set(), {}
        
        functions = set()
        calls = {}
        imports = self._extract_imports(tree)
        
        # Store imports for this file
        self.file_imports[str(file_path)] = imports
        
        # Collect ALL functions (including class methods)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                func_name = node.name
                
                # Skip dunder methods only (unless include_private is True)
                if not self.include_private and func_name.startswith('__') and func_name.endswith('__'):
                    continue
                
                functions.add(func_name)
                
                # Store metadata
                self.function_metadata[(str(file_path), func_name)] = {
                    'line': node.lineno,
                    'args': [arg.arg for arg in node.args.args],
                    'is_async': isinstance(node, ast.AsyncFunctionDef),
                    'is_private': func_name.startswith('_'),
                    'decorators': self._extract_decorators(node),
                    'is_method': self._is_class_method(node, tree)
                }
        
        # Extract function calls
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                func_name = node.name
                
                if not self.include_private and func_name.startswith('__') and func_name.endswith('__'):
                    continue
                
                calls[func_name] = set()
                
                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        called = self._extract_called_functions(child, imports)
                        calls[func_name].update(called)
        
        return functions, calls
    
    def _extract_imports(self, tree: ast.AST) -> Dict[str, str]:
        """
        Extract import statements to help resolve function calls.
        Returns dict mapping imported names to module names.
        """
        imports = {}
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    name = alias.asname if alias.asname else alias.name
                    imports[name] = alias.name
            
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                for alias in node.names:
                    name = alias.asname if alias.asname else alias.name
                    imports[name] = f"{module}.{alias.name}" if module else alias.name
        
        return imports
    
    def _extract_decorators(self, node) -> List[str]:
        """Extract decorator names."""
        decorators = []
        for dec in node.decorator_list:
            if isinstance(dec, ast.Name):
                decorators.append(dec.id)
            elif isinstance(dec, ast.Call) and isinstance(dec.func, ast.Name):
                decorators.append(dec.func.id)
            elif isinstance(dec, ast.Attribute):
                decorators.append(dec.attr)
        return decorators
    
    def _is_class_method(self, func_node, tree: ast.AST) -> bool:
        """Check if a function is a class method."""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for item in node.body:
                    if item == func_node:
                        return True
        return False
    
    def _extract_called_functions(self, call_node: ast.Call, imports: Dict[str, str]) -> Set[str]:
        """
        Extract function names, handling various call patterns.
        """
        called = set()
        
        try:
            # Direct function call: func()
            if isinstance(call_node.func, ast.Name):
                func_name = call_node.func.id
                called.add(func_name)
                
                # Check if it's an imported function
                if func_name in imports:
                    # Add both the alias and the original name
                    original = imports[func_name].split('.')[-1]
                    called.add(original)
            
            # Attribute call: obj.method() or module.func()
            elif isinstance(call_node.func, ast.Attribute):
                method_name = call_node.func.attr
                called.add(method_name)
                
                # Get the object/module name
                if isinstance(call_node.func.value, ast.Name):
                    obj_name = call_node.func.value.id
                    
                    # Handle different cases
                    if obj_name == 'self':
                        # self.method() - add method name
                        called.add(method_name)
                    elif obj_name in imports:
                        # imported_module.function()
                        module_path = imports[obj_name]
                        called.add(method_name)
                        called.add(f"{obj_name}.{method_name}")
                    else:
                        # obj.method() or Class.method()
                        called.add(method_name)
                        called.add(f"{obj_name}.{method_name}")
                
                # Handle chained calls
                elif isinstance(call_node.func.value, ast.Attribute):
                    full_path = self._get_attribute_path(call_node.func)
                    if full_path:
                        called.add(full_path)
                        # Also add just the method name
                        parts = full_path.split('.')
                        if parts:
                            called.add(parts[-1])
        
        except Exception as e:
            logger.debug(f"Error extracting function call: {e}")
        
        return called
    
    def _get_attribute_path(self, node: ast.Attribute) -> str:
        """Get full attribute path."""
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
    
    def build_project_cfg_json(self, project_path: Path) -> Dict:
        """
        Build comprehensive CFG for entire project showing ALL functions.
        """
        self.all_functions = {}
        self.all_calls = {}
        self.function_metadata = {}
        self.errors = []
        
        # Collect Python files
        python_files = []
        try:
            python_files = list(project_path.rglob('*.py'))
        except Exception as e:
            logger.error(f"Failed to list Python files: {e}")
            self.errors.append(f"Failed to scan project: {str(e)}")
            return self._empty_result()
        
        # Skip common directories
        skip_dirs = {'__pycache__', 'venv', 'env', '.git', 'node_modules', 'build', 'dist', '.venv', 'site-packages'}
        python_files = [
            f for f in python_files 
            if not any(skip_dir in f.parts for skip_dir in skip_dirs)
        ]
        
        # Optionally skip test files for cleaner visualization
        # Comment this out if you want to include test files
        python_files = [
            f for f in python_files
            if not f.name.startswith('test_') and not f.name.endswith('_test.py')
        ]
        
        if not python_files:
            self.errors.append("No Python files found in project")
            return self._empty_result()
        
        # Process each file
        file_count = 0
        for py_file in python_files:
            try:
                functions, calls = self.extract_functions_from_file(py_file)
                
                if functions:
                    file_count += 1
                    rel_path = str(py_file.relative_to(project_path))
                    
                    # Store all functions with their locations
                    for func in functions:
                        if func not in self.all_functions:
                            self.all_functions[func] = []
                        self.all_functions[func].append(rel_path)
                    
                    # Store calls with file context
                    for func, targets in calls.items():
                        key = (rel_path, func)
                        self.all_calls[key] = targets
            
            except Exception as e:
                logger.warning(f"Error processing {py_file}: {e}")
                continue
        
        if file_count == 0:
            self.errors.append("No valid Python files with functions found")
            return self._empty_result()
        
        # Build comprehensive graph
        return self._build_graph()
    
    def _build_graph(self) -> Dict:
        """
        Build the final graph with ALL functions.
        """
        # Get all unique function names
        all_function_names = set(self.all_functions.keys())
        
        if not all_function_names:
            return self._empty_result()
        
        # Determine connections
        connected_functions = set()
        all_called_functions = set()
        
        for (file, func), targets in self.all_calls.items():
            user_targets = {t for t in targets if t in all_function_names}
            if user_targets:
                connected_functions.add(func)
                connected_functions.update(user_targets)
            
            # Track all called functions
            all_called_functions.update(targets)
        
        # Find functions that are called but not defined (external)
        external_functions = all_called_functions - all_function_names
        # Filter out obvious builtins
        builtins_to_exclude = {'print', 'len', 'range', 'str', 'int', 'list', 'dict', 'set', 'tuple', 'open', 'type', 'isinstance', 'hasattr', 'getattr', 'setattr'}
        external_functions = {f for f in external_functions if f not in builtins_to_exclude and not f.startswith('__')}
        
        # Limit nodes if too many
        nodes_to_display = all_function_names.copy()
        warning = None
        
        if len(nodes_to_display) > self.max_nodes:
            # Prioritize connected functions
            if len(connected_functions) <= self.max_nodes:
                nodes_to_display = connected_functions
                warning = f"Showing {len(connected_functions)} connected functions out of {len(all_function_names)} total"
            else:
                # Sort by connection count and take top N
                func_scores = []
                for func in all_function_names:
                    # Count incoming edges
                    in_degree = sum(1 for (_, f), targets in self.all_calls.items() 
                                   if func in targets)
                    # Count outgoing edges
                    out_degree = sum(len({t for t in targets if t in all_function_names}) 
                                    for (_, f), targets in self.all_calls.items() 
                                    if f == func)
                    # Count files where function is defined
                    file_count = len(self.all_functions.get(func, []))
                    
                    score = in_degree * 2 + out_degree + file_count
                    func_scores.append((func, score))
                
                func_scores.sort(key=lambda x: x[1], reverse=True)
                nodes_to_display = {f for f, _ in func_scores[:self.max_nodes]}
                warning = f"Large codebase: showing top {self.max_nodes} most connected functions out of {len(all_function_names)} total"
        
        # Build nodes with rich metadata
        nodes = []
        for func_name in sorted(nodes_to_display):
            file_locations = self.all_functions.get(func_name, ['unknown'])
            primary_file = file_locations[0]
            
            # Get metadata from primary location
            metadata = self.function_metadata.get((primary_file, func_name), {})
            
            is_connected = func_name in connected_functions
            
            node = {
                "id": func_name,
                "label": func_name,
                "file": primary_file,
                "title": f"{func_name}\n{primary_file}\nLine: {metadata.get('line', '?')}",
                "connected": is_connected,
                "is_private": metadata.get('is_private', False),
                "is_method": metadata.get('is_method', False),
                "is_async": metadata.get('is_async', False),
                "defined_in_files": len(file_locations),
                "decorators": metadata.get('decorators', [])
            }
            nodes.append(node)
        
        # Add some important external references
        for func_name in sorted(list(external_functions)[:20]):  # Limit external nodes
            nodes.append({
                "id": func_name,
                "label": func_name,
                "title": f"{func_name} (external reference)",
                "external": True,
                "connected": True
            })
        
        # Build edges
        edges = []
        edge_set = set()
        node_ids = {n['id'] for n in nodes}
        
        for (file, src_func), targets in self.all_calls.items():
            if src_func in node_ids:
                for tgt in targets:
                    if tgt in node_ids:
                        edge_key = (src_func, tgt)
                        if edge_key not in edge_set:
                            edges.append({
                                "from": src_func,
                                "to": tgt,
                                "file": file
                            })
                            edge_set.add(edge_key)
        
        # Calculate comprehensive stats
        isolated_functions = all_function_names - connected_functions
        
        stats = {
            "total_functions": len(all_function_names),
            "displayed_functions": len([n for n in nodes if not n.get('external')]),
            "total_calls": len(edges),
            "connected_functions": len(connected_functions),
            "isolated_functions": len(isolated_functions),
            "external_references": len([n for n in nodes if n.get('external')]),
            "files_processed": len(set(f for files in self.all_functions.values() for f in files)),
            "private_functions": sum(1 for metadata in self.function_metadata.values() 
                                    if metadata.get('is_private', False)),
            "async_functions": sum(1 for metadata in self.function_metadata.values() 
                                  if metadata.get('is_async', False)),
            "class_methods": sum(1 for metadata in self.function_metadata.values() 
                                if metadata.get('is_method', False))
        }
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": stats,
            "errors": self.errors if self.errors else None,
            "warning": warning
        }
    
    def _empty_result(self) -> Dict:
        """Return empty result with errors."""
        return {
            "nodes": [],
            "edges": [],
            "stats": {
                "total_functions": 0,
                "displayed_functions": 0,
                "total_calls": 0,
                "connected_functions": 0,
                "isolated_functions": 0,
                "external_references": 0,
                "files_processed": 0
            },
            "errors": self.errors
        }


class CppProjectCFGGenerator:
    """
    Project-wide Control Flow Graph generator for C/C++ projects
    """
    
    def __init__(self, include_private: bool = False, max_nodes: int = 200):
        self.include_private = include_private
        self.max_nodes = max_nodes
        self.all_functions = {}  # func_name -> list of file_paths where defined
        self.all_calls = {}  # (file, func_name) -> set of called functions
        self.file_includes = {}  # file_path -> list of includes
        self.function_metadata = {}  # (file, func) -> metadata
        self.errors = []
        
        if not CPP_PARSER_AVAILABLE:
            self.parser = None
        else:
            try:
                self.parser = CppParser()
            except Exception as e:
                logger.error(f"Failed to initialize C/C++ parser: {e}")
                self.parser = None
    
    def build_project_cfg_json(self, project_path: Path, is_cpp: bool = True) -> Dict:
        """
        Build comprehensive CFG for entire C/C++ project
        
        Args:
            project_path: Root path of the project
            is_cpp: True for C++, False for C
        """
        if not self.parser:
            return self._empty_result()
        
        self.all_functions = {}
        self.all_calls = {}
        self.function_metadata = {}
        self.errors = []
        
        # Collect C/C++ files
        if is_cpp:
            extensions = ['*.cpp', '*.cc', '*.cxx', '*.hpp']
        else:
            extensions = ['*.c', '*.h']
        
        cpp_files = []
        try:
            for ext in extensions:
                cpp_files.extend(list(project_path.rglob(ext)))
        except Exception as e:
            logger.error(f"Failed to list C/C++ files: {e}")
            self.errors.append(f"Failed to scan project: {str(e)}")
            return self._empty_result()
        
        # Skip common directories
        skip_dirs = {'build', 'dist', '.git', 'node_modules', 'target', 'out', 'bin', 'obj'}
        cpp_files = [
            f for f in cpp_files
            if not any(skip_dir in f.parts for skip_dir in skip_dirs)
        ]
        
        if not cpp_files:
            self.errors.append(f"No {'C++' if is_cpp else 'C'} files found in project")
            return self._empty_result()
        
        # Process each file
        file_count = 0
        for cpp_file in cpp_files:
            try:
                with open(cpp_file, 'r', encoding='utf-8', errors='ignore') as f:
                    code = f.read()
                
                # Parse the file
                tree = self.parser.parse(code, is_cpp=is_cpp)
                
                # Extract functions
                functions = self.parser.extract_functions(tree, code, is_cpp=is_cpp)
                
                # Extract call graph
                call_graph = self.parser.build_call_graph(tree, code, is_cpp=is_cpp)
                
                # Extract includes
                includes = self.parser.extract_includes(tree, code)
                self.file_includes[str(cpp_file)] = includes
                
                if functions:
                    file_count += 1
                    rel_path = str(cpp_file.relative_to(project_path))
                    
                    # Store functions with their locations
                    for func in functions:
                        func_name = func['name']
                        
                        # For C++ methods, use ClassName::methodName
                        if func.get('class_name') and is_cpp:
                            full_name = f"{func['class_name']}::{func_name}"
                        else:
                            full_name = func_name
                        
                        if full_name not in self.all_functions:
                            self.all_functions[full_name] = []
                        self.all_functions[full_name].append(rel_path)
                        
                        # Store metadata
                        self.function_metadata[(rel_path, full_name)] = {
                            'line': func['line'],
                            'return_type': func.get('return_type', 'void'),
                            'parameters': func.get('parameters', []),
                            'is_method': func.get('is_method', False),
                            'class_name': func.get('class_name'),
                            'namespace': func.get('namespace'),
                            'is_static': func.get('is_static', False),
                            'is_template': func.get('is_template', False)
                        }
                    
                    # Store calls
                    for func_name, targets in call_graph.items():
                        key = (rel_path, func_name)
                        self.all_calls[key] = targets
            
            except Exception as e:
                logger.warning(f"Error processing {cpp_file}: {e}")
                continue
        
        if file_count == 0:
            self.errors.append(f"No valid {'C++' if is_cpp else 'C'} files with functions found")
            return self._empty_result()
        
        # Build the graph
        return self._build_graph(is_cpp)
    
    def _build_graph(self, is_cpp: bool) -> Dict:
        """Build the final graph"""
        all_function_names = set(self.all_functions.keys())
        
        if not all_function_names:
            return self._empty_result()
        
        # Determine connections
        connected_functions = set()
        all_called_functions = set()
        
        for (file, func), targets in self.all_calls.items():
            user_targets = {t for t in targets if t in all_function_names}
            if user_targets:
                connected_functions.add(func)
                connected_functions.update(user_targets)
            all_called_functions.update(targets)
        
        # Find external references (called but not defined)
        external_functions = all_called_functions - all_function_names
        # Filter out standard library functions
        std_lib_funcs = {'printf', 'scanf', 'malloc', 'free', 'strlen', 'strcpy', 'strcmp',
                        'cout', 'cin', 'endl', 'new', 'delete', 'vector', 'string', 'map'}
        external_functions = {f for f in external_functions 
                            if f not in std_lib_funcs and not f.startswith('std::')}
        
        # Limit nodes if too many
        nodes_to_display = all_function_names.copy()
        warning = None
        
        if len(nodes_to_display) > self.max_nodes:
            if len(connected_functions) <= self.max_nodes:
                nodes_to_display = connected_functions
                warning = f"Showing {len(connected_functions)} connected functions out of {len(all_function_names)} total"
            else:
                # Sort by connection count
                func_scores = []
                for func in all_function_names:
                    in_degree = sum(1 for (_, f), targets in self.all_calls.items() 
                                   if func in targets)
                    out_degree = sum(len({t for t in targets if t in all_function_names})
                                    for (_, f), targets in self.all_calls.items()
                                    if f == func)
                    file_count = len(self.all_functions.get(func, []))
                    
                    score = in_degree * 2 + out_degree + file_count
                    func_scores.append((func, score))
                
                func_scores.sort(key=lambda x: x[1], reverse=True)
                nodes_to_display = {f for f, _ in func_scores[:self.max_nodes]}
                warning = f"Large codebase: showing top {self.max_nodes} most connected functions out of {len(all_function_names)} total"
        
        # Build nodes
        nodes = []
        for func_name in sorted(nodes_to_display):
            file_locations = self.all_functions.get(func_name, ['unknown'])
            primary_file = file_locations[0]
            
            metadata = self.function_metadata.get((primary_file, func_name), {})
            is_connected = func_name in connected_functions
            
            node = {
                "id": func_name,
                "label": func_name,
                "file": primary_file,
                "title": f"{func_name}\n{primary_file}\nLine: {metadata.get('line', '?')}\nType: {metadata.get('return_type', 'void')}",
                "connected": is_connected,
                "is_method": metadata.get('is_method', False),
                "class_name": metadata.get('class_name'),
                "namespace": metadata.get('namespace'),
                "is_static": metadata.get('is_static', False),
                "is_template": metadata.get('is_template', False),
                "defined_in_files": len(file_locations)
            }
            nodes.append(node)
        
        # Add some external references
        for func_name in sorted(list(external_functions)[:20]):
            nodes.append({
                "id": func_name,
                "label": func_name,
                "title": f"{func_name} (external reference)",
                "external": True,
                "connected": True
            })
        
        # Build edges
        edges = []
        edge_set = set()
        node_ids = {n['id'] for n in nodes}
        
        for (file, src_func), targets in self.all_calls.items():
            if src_func in node_ids:
                for tgt in targets:
                    if tgt in node_ids:
                        edge_key = (src_func, tgt)
                        if edge_key not in edge_set:
                            edges.append({
                                "from": src_func,
                                "to": tgt,
                                "file": file
                            })
                            edge_set.add(edge_key)
        
        # Calculate stats
        isolated_functions = all_function_names - connected_functions
        
        stats = {
            "total_functions": len(all_function_names),
            "displayed_functions": len([n for n in nodes if not n.get('external')]),
            "total_calls": len(edges),
            "connected_functions": len(connected_functions),
            "isolated_functions": len(isolated_functions),
            "external_references": len([n for n in nodes if n.get('external')]),
            "files_processed": len(set(f for files in self.all_functions.values() for f in files)),
            "static_functions": sum(1 for metadata in self.function_metadata.values()
                                   if metadata.get('is_static', False)),
            "template_functions": sum(1 for metadata in self.function_metadata.values()
                                     if metadata.get('is_template', False)),
            "class_methods": sum(1 for metadata in self.function_metadata.values()
                                if metadata.get('is_method', False))
        }
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": stats,
            "errors": self.errors if self.errors else None,
            "warning": warning,
            "language": "C++" if is_cpp else "C"
        }
    
    def _empty_result(self) -> Dict:
        """Return empty result with errors"""
        return {
            "nodes": [],
            "edges": [],
            "stats": {
                "total_functions": 0,
                "displayed_functions": 0,
                "total_calls": 0,
                "connected_functions": 0,
                "isolated_functions": 0,
                "external_references": 0,
                "files_processed": 0
            },
            "errors": self.errors
        }


def build_project_cfg_json(project_path: Path, include_private: bool = False, max_nodes: int = 200, language: Optional[str] = None) -> Dict:
    """
    Main entry point for project CFG generation.
    Supports Python, C, and C++.
    
    Args:
        project_path: Root path of the project
        include_private: Whether to include private functions (_function)
        max_nodes: Maximum number of nodes to display (default: 200)
        language: Language to analyze ('python', 'c', 'cpp'). If None, auto-detects from files.
    """
    # Auto-detect language if not specified
    if language is None:
        # Check which files exist
        py_files = list(project_path.rglob('*.py'))
        c_files = list(project_path.rglob('*.c'))
        cpp_files = list(project_path.rglob('*.cpp'))
        
        if cpp_files:
            language = 'cpp'
        elif c_files:
            language = 'c'
        else:
            language = 'python'
    
    language = language.lower()
    
    if language == 'python':
        generator = ImprovedProjectCFGGenerator(
            include_private=include_private,
            max_nodes=max_nodes
        )
        return generator.build_project_cfg_json(project_path)
    elif language == 'c':
        generator = CppProjectCFGGenerator(
            include_private=include_private,
            max_nodes=max_nodes
        )
        return generator.build_project_cfg_json(project_path, is_cpp=False)
    elif language in ['cpp', 'c++', 'cxx']:
        generator = CppProjectCFGGenerator(
            include_private=include_private,
            max_nodes=max_nodes
        )
        return generator.build_project_cfg_json(project_path, is_cpp=True)
    else:
        return {
            "nodes": [],
            "edges": [],
            "stats": {"total_functions": 0},
            "errors": [f"Unsupported language: {language}"]
        }


# Old function signature for backward compatibility
def build_project_cfg_json_old(project_path: Path, include_private: bool = False, max_nodes: int = 200) -> Dict:
    generator = ImprovedProjectCFGGenerator(
        include_private=include_private,
        max_nodes=max_nodes
    )
    return generator.build_project_cfg_json(project_path)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        project_path = Path(sys.argv[1])
        
        print("Generating Improved Project-Wide CFG...")
        print("=" * 60)
        
        cfg = build_project_cfg_json(project_path, include_private=False)
        
        print(f"\n📊 Statistics:")
        for key, value in cfg['stats'].items():
            print(f"  {key}: {value}")
        
        print(f"\n📦 Nodes: {len(cfg['nodes'])}")
        print(f"🔗 Edges: {len(cfg['edges'])}")
        
        if cfg.get('warning'):
            print(f"\n⚠️  Warning: {cfg['warning']}")
        
        if cfg.get('errors'):
            print(f"\n❌ Errors:")
            for error in cfg['errors']:
                print(f"  - {error}")
        
        # Show sample nodes
        print(f"\n📝 Sample nodes (first 10):")
        for node in cfg['nodes'][:10]:
            status = "🔗" if node.get('connected') else "⭕"
            external = " [EXT]" if node.get('external') else ""
            private = " [PRIV]" if node.get('is_private') else ""
            method = " [METHOD]" if node.get('is_method') else ""
            print(f"  {status} {node['label']}{external}{private}{method}")
            print(f"      File: {node.get('file', 'N/A')}")
        
        # Show sample edges
        if cfg['edges']:
            print(f"\n🔗 Sample edges (first 10):")
            for edge in cfg['edges'][:10]:
                print(f"  {edge['from']} → {edge['to']}")
    else:
        print("Usage: python improved_project_cfg.py <project_path>")