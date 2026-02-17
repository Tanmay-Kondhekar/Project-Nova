import ast
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import tokenize
import io

class ASTAnalyzer:
    """
    Advanced code analysis: tokenization, AST generation, and semantic analysis
    """
    
    def __init__(self):
        self.supported_extensions = {'.py', '.js', '.jsx', '.ts', '.tsx'}
    
    def analyze_codebase(self, project_path: Path, max_files: int = 50) -> Dict:
        """
        Analyze multiple files and generate comprehensive code insights
        """
        files_to_analyze = []
        
        # Collect code files
        for ext in self.supported_extensions:
            files = list(project_path.rglob(f'*{ext}'))[:max_files]
            files_to_analyze.extend(files)
        
        results = {
            "total_files_analyzed": len(files_to_analyze),
            "files": [],
            "aggregate_stats": {
                "total_tokens": 0,
                "total_lines": 0,
                "total_functions": 0,
                "total_classes": 0,
                "languages": {}
            },
            "semantic_graph": {
                "nodes": [],
                "edges": []
            }
        }
        
        node_id = 0
        
        for file_path in files_to_analyze[:max_files]:  # Limit to avoid overwhelming
            try:
                file_analysis = self._analyze_file(file_path, project_path)
                if file_analysis:
                    # Add to results
                    results["files"].append(file_analysis)
                    
                    # Update aggregate stats
                    results["aggregate_stats"]["total_tokens"] += file_analysis["token_count"]
                    results["aggregate_stats"]["total_lines"] += file_analysis["line_count"]
                    results["aggregate_stats"]["total_functions"] += len(file_analysis.get("functions", []))
                    results["aggregate_stats"]["total_classes"] += len(file_analysis.get("classes", []))
                    
                    lang = file_analysis["language"]
                    if lang not in results["aggregate_stats"]["languages"]:
                        results["aggregate_stats"]["languages"][lang] = 0
                    results["aggregate_stats"]["languages"][lang] += 1
                    
                    # Build semantic graph
                    file_node = {
                        "id": f"file_{node_id}",
                        "type": "file",
                        "label": file_analysis["relative_path"],
                        "language": file_analysis["language"]
                    }
                    results["semantic_graph"]["nodes"].append(file_node)
                    
                    # Add class nodes (only if substantial - has methods or is exported)
                    for cls in file_analysis.get("classes", []):
                        # Filter out trivial classes
                        if cls.get("methods") or len(cls.get("name", "")) > 2:
                            node_id += 1
                            class_node = {
                                "id": f"class_{node_id}",
                                "type": "class",
                                "label": cls["name"],
                                "file": file_analysis["relative_path"]
                            }
                            results["semantic_graph"]["nodes"].append(class_node)
                            results["semantic_graph"]["edges"].append({
                                "from": file_node["id"],
                                "to": class_node["id"],
                                "type": "contains"
                            })
                    
                    # Add function nodes (filter out private/helper functions)
                    for func in file_analysis.get("functions", []):
                        func_name = func["name"]
                        # Skip private functions and trivial names
                        if not func_name.startswith("_") and len(func_name) > 2:
                            node_id += 1
                            func_node = {
                                "id": f"func_{node_id}",
                                "type": "function",
                                "label": func_name,
                                "file": file_analysis["relative_path"]
                            }
                            results["semantic_graph"]["nodes"].append(func_node)
                            results["semantic_graph"]["edges"].append({
                                "from": file_node["id"],
                                "to": func_node["id"],
                                "type": "contains"
                            })
                    
                    node_id += 1
                    
            except Exception as e:
                continue
        
        return results
    
    def _analyze_file(self, file_path: Path, project_root: Path) -> Optional[Dict]:
        """
        Analyze a single file: tokenize, parse AST, extract semantics
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            extension = file_path.suffix
            relative_path = str(file_path.relative_to(project_root))
            
            result = {
                "relative_path": relative_path,
                "language": self._get_language(extension),
                "size_bytes": len(content.encode('utf-8')),
                "line_count": len(content.splitlines()),
            }
            
            # Language-specific analysis
            if extension == '.py':
                result.update(self._analyze_python(content))
            elif extension in ['.js', '.jsx', '.ts', '.tsx']:
                result.update(self._analyze_javascript(content))
            
            return result
            
        except Exception as e:
            return None
    
    def _get_language(self, extension: str) -> str:
        """Map file extension to language name"""
        mapping = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.jsx': 'JavaScript/React',
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript/React'
        }
        return mapping.get(extension, 'Unknown')
    
    def _analyze_python(self, content: str) -> Dict:
        """
        Deep analysis of Python code
        """
        result = {
            "tokens": [],
            "token_count": 0,
            "ast_structure": None,
            "functions": [],
            "classes": [],
            "imports": [],
            "complexity": 0
        }
        
        try:
            # Tokenization
            tokens = self._tokenize_python(content)
            result["tokens"] = tokens
            result["token_count"] = len(tokens)
            
            # AST parsing
            tree = ast.parse(content)
            result["ast_structure"] = self._ast_to_dict(tree)
            
            # Extract semantic information
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    result["functions"].append({
                        "name": node.name,
                        "line": node.lineno,
                        "args": [arg.arg for arg in node.args.args],
                        "decorators": [self._get_decorator_name(d) for d in node.decorator_list]
                    })
                    result["complexity"] += self._calculate_complexity(node)
                
                elif isinstance(node, ast.ClassDef):
                    methods = [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
                    result["classes"].append({
                        "name": node.name,
                        "line": node.lineno,
                        "methods": methods,
                        "bases": [self._get_name(base) for base in node.bases]
                    })
                
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        result["imports"].append({
                            "module": alias.name,
                            "alias": alias.asname,
                            "type": "import"
                        })
                
                elif isinstance(node, ast.ImportFrom):
                    result["imports"].append({
                        "module": node.module,
                        "names": [alias.name for alias in node.names],
                        "type": "from_import"
                    })
        
        except SyntaxError as e:
            result["error"] = f"Syntax error: {str(e)}"
        except Exception as e:
            result["error"] = f"Analysis error: {str(e)}"
        
        return result
    
    def _tokenize_python(self, content: str) -> List[Dict]:
        """
        Tokenize Python code and remove comments
        """
        tokens = []
        try:
            readline = io.StringIO(content).readline
            for tok in tokenize.generate_tokens(readline):
                # Skip comments and encoding declarations
                if tok.type not in [tokenize.COMMENT, tokenize.ENCODING, tokenize.NL]:
                    tokens.append({
                        "type": tokenize.tok_name[tok.type],
                        "string": tok.string,
                        "line": tok.start[0]
                    })
        except tokenize.TokenError:
            pass
        
        return tokens
    
    def _ast_to_dict(self, node: ast.AST, max_depth: int = 3, current_depth: int = 0) -> Dict:
        """
        Convert AST to JSON-serializable dictionary
        """
        if current_depth >= max_depth:
            return {"type": node.__class__.__name__, "truncated": True}
        
        result = {"type": node.__class__.__name__}
        
        # Add line number if available
        if hasattr(node, 'lineno'):
            result["line"] = node.lineno
        
        # Add specific attributes based on node type
        if isinstance(node, ast.Name):
            result["id"] = node.id
        elif isinstance(node, ast.Constant):
            result["value"] = str(node.value)[:50]  # Truncate long values
        elif isinstance(node, ast.FunctionDef):
            result["name"] = node.name
            result["args"] = [arg.arg for arg in node.args.args]
        elif isinstance(node, ast.ClassDef):
            result["name"] = node.name
        
        # Recursively process child nodes (limit children)
        children = []
        for field, value in ast.iter_fields(node):
            if isinstance(value, list):
                for item in value[:5]:  # Limit to 5 children per field
                    if isinstance(item, ast.AST):
                        children.append(self._ast_to_dict(item, max_depth, current_depth + 1))
            elif isinstance(value, ast.AST):
                children.append(self._ast_to_dict(value, max_depth, current_depth + 1))
        
        if children:
            result["children"] = children
        
        return result
    
    def _calculate_complexity(self, node: ast.FunctionDef) -> int:
        """
        Calculate cyclomatic complexity
        """
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        return complexity
    
    def _get_decorator_name(self, decorator) -> str:
        """Extract decorator name"""
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Call):
            if isinstance(decorator.func, ast.Name):
                return decorator.func.id
        return "unknown"
    
    def _get_name(self, node) -> str:
        """Extract name from AST node"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_name(node.value)}.{node.attr}"
        return "unknown"
    
    def _analyze_javascript(self, content: str) -> Dict:
        """
        Basic JavaScript/TypeScript analysis (simplified - full JS parser would need esprima/babel)
        """
        result = {
            "tokens": [],
            "token_count": 0,
            "functions": [],
            "classes": [],
            "imports": [],
            "complexity": 0
        }
        
        try:
            # Remove comments
            content_no_comments = self._remove_js_comments(content)
            
            # Simple tokenization
            tokens = self._tokenize_javascript(content_no_comments)
            result["tokens"] = tokens
            result["token_count"] = len(tokens)
            
            # Extract functions (simple regex-based)
            func_pattern = r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(\w+)\s*\([^)]*\)\s*\{)'
            for match in re.finditer(func_pattern, content_no_comments):
                func_name = match.group(1) or match.group(2) or match.group(3)
                if func_name:
                    result["functions"].append({
                        "name": func_name,
                        "line": content[:match.start()].count('\n') + 1
                    })
            
            # Extract classes
            class_pattern = r'class\s+(\w+)'
            for match in re.finditer(class_pattern, content_no_comments):
                result["classes"].append({
                    "name": match.group(1),
                    "line": content[:match.start()].count('\n') + 1
                })
            
            # Extract imports
            import_pattern = r'import\s+(?:{[^}]+}|\w+)\s+from\s+[\'"]([^\'"]+)[\'"]'
            for match in re.finditer(import_pattern, content_no_comments):
                result["imports"].append({
                    "module": match.group(1),
                    "type": "import"
                })
            
            # Simple complexity (count control flow keywords)
            complexity_keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch']
            for keyword in complexity_keywords:
                result["complexity"] += len(re.findall(r'\b' + keyword + r'\b', content_no_comments))
        
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def _remove_js_comments(self, content: str) -> str:
        """Remove JavaScript comments"""
        # Remove single-line comments
        content = re.sub(r'//.*?$', '', content, flags=re.MULTILINE)
        # Remove multi-line comments
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        return content
    
    def _tokenize_javascript(self, content: str) -> List[Dict]:
        """
        Simple JavaScript tokenization
        """
        # Basic token patterns
        token_pattern = r'(\w+|[{}()\[\];,.]|[=<>!]+|[+\-*/]|[\'"`][^\'"]*[\'"`])'
        tokens = []
        
        for i, line in enumerate(content.splitlines(), 1):
            for match in re.finditer(token_pattern, line):
                token = match.group(0)
                if token.strip():
                    tokens.append({
                        "type": self._get_js_token_type(token),
                        "string": token,
                        "line": i
                    })
        
        return tokens[:1000]  # Limit tokens
    
    def _get_js_token_type(self, token: str) -> str:
        """Classify JavaScript token type"""
        keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export']
        if token in keywords:
            return "KEYWORD"
        elif token in ['{', '}', '(', ')', '[', ']']:
            return "DELIMITER"
        elif token in [';', ',', '.']:
            return "PUNCTUATION"
        elif token[0] in ['"', "'", '`']:
            return "STRING"
        elif token.isdigit():
            return "NUMBER"
        elif re.match(r'[=<>!+\-*/]+', token):
            return "OPERATOR"
        else:
            return "IDENTIFIER"