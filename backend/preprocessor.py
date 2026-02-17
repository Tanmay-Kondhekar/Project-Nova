import os
import json
import re
from pathlib import Path
from typing import List, Dict, Set
from collections import defaultdict

class ProjectPreprocessor:
    """
    Analyzes a software project and extracts metadata
    """
    
    # File extensions for language detection
    LANGUAGE_EXTENSIONS = {
        '.py': 'Python',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript/React',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript/React',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
        '.cs': 'C#',
        '.go': 'Go',
        '.rs': 'Rust',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.swift': 'Swift',
        '.kt': 'Kotlin',
        '.scala': 'Scala',
    }
    
    # Dependency files
    DEPENDENCY_FILES = {
        'requirements.txt': 'Python',
        'Pipfile': 'Python',
        'pyproject.toml': 'Python',
        'package.json': 'JavaScript/Node.js',
        'yarn.lock': 'JavaScript/Yarn',
        'pom.xml': 'Java/Maven',
        'build.gradle': 'Java/Gradle',
        'Gemfile': 'Ruby',
        'Cargo.toml': 'Rust',
        'go.mod': 'Go',
        'composer.json': 'PHP',
    }
    
    # Test file patterns
    TEST_PATTERNS = [
        r'test_.*\.py$',
        r'.*_test\.py$',
        r'.*\.test\.js$',
        r'.*\.spec\.js$',
        r'.*\.test\.ts$',
        r'.*\.spec\.ts$',
        r'Test.*\.java$',
        r'.*Test\.java$',
        r'.*_test\.go$',
        r'test_.*\.rb$',
        r'.*_spec\.rb$',
    ]
    
    # CI/CD config files
    CICD_FILES = [
        '.github/workflows',
        '.gitlab-ci.yml',
        'Jenkinsfile',
        '.circleci/config.yml',
        '.travis.yml',
        'azure-pipelines.yml',
        'bitbucket-pipelines.yml',
    ]
    
    # Security-relevant files
    SECURITY_FILES = [
        '.env',
        '.env.local',
        '.env.production',
        'config.json',
        'secrets.json',
        'credentials.json',
        'id_rsa',
        'id_dsa',
        '.pem',
        '.key',
    ]
    
    # Directories to skip
    SKIP_DIRS = {
        'node_modules', 'venv', 'env', '.git', '__pycache__', 
        'build', 'dist', 'target', '.idea', '.vscode', 'bin',
        'obj', 'out', 'coverage', '.next', '.nuxt'
    }
    
    def __init__(self):
        self.test_regex = [re.compile(pattern) for pattern in self.TEST_PATTERNS]
    
    def analyze_project(self, project_path: str) -> Dict:
        """
        Main analysis function
        """
        project_path = Path(project_path)
        
        # Collect all files
        all_files = self._get_all_files(project_path)
        
        # Extract information
        languages = self._detect_languages(all_files)
        dependencies = self._extract_dependencies(project_path, all_files)
        test_files = self._detect_test_files(all_files, project_path)
        ci_cd_configs = self._check_cicd_configs(project_path)
        dockerfile_found = self._check_dockerfile(project_path)
        security_warnings = self._check_security_issues(all_files, project_path)
        project_tree = self._generate_tree(project_path)
        framework = self._detect_framework(project_path, all_files)
        
        return {
            "languages": languages,
            "framework": framework,
            "dependencies": dependencies,
            "test_files_found": test_files,
            "ci_cd_configs": ci_cd_configs,
            "dockerfile_found": dockerfile_found,
            "security_warnings": security_warnings,
            "project_structure_tree": project_tree,
        }
    
    def _get_all_files(self, project_path: Path) -> List[Path]:
        """
        Recursively get all files, skipping ignored directories
        """
        files = []
        for root, dirs, filenames in os.walk(project_path):
            # Remove skip directories from dirs list (modifies in-place)
            dirs[:] = [d for d in dirs if d not in self.SKIP_DIRS]
            
            for filename in filenames:
                files.append(Path(root) / filename)
        return files
    
    def _detect_languages(self, files: List[Path]) -> List[str]:
        """
        Detect programming languages based on file extensions
        """
        languages = set()
        for file in files:
            ext = file.suffix.lower()
            if ext in self.LANGUAGE_EXTENSIONS:
                languages.add(self.LANGUAGE_EXTENSIONS[ext])
        return sorted(list(languages))
    
    def _extract_dependencies(self, project_path: Path, files: List[Path]) -> List[str]:
        """
        Extract dependencies from various dependency files
        """
        dependencies = []
        
        for file in files:
            filename = file.name
            
            if filename == 'requirements.txt':
                dependencies.extend(self._parse_requirements_txt(file))
            elif filename == 'package.json':
                dependencies.extend(self._parse_package_json(file))
            elif filename == 'pom.xml':
                dependencies.extend(self._parse_pom_xml(file))
            elif filename == 'build.gradle':
                dependencies.extend(self._parse_gradle(file))
            elif filename == 'Gemfile':
                dependencies.extend(self._parse_gemfile(file))
            elif filename == 'Cargo.toml':
                dependencies.extend(self._parse_cargo_toml(file))
            elif filename == 'go.mod':
                dependencies.extend(self._parse_go_mod(file))
        
        return sorted(list(set(dependencies)))
    
    def _parse_requirements_txt(self, file_path: Path) -> List[str]:
        """Parse Python requirements.txt"""
        deps = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        # Remove version specifiers
                        dep = re.split(r'[=<>!]', line)[0].strip()
                        if dep:
                            deps.append(dep)
        except:
            pass
        return deps
    
    def _parse_package_json(self, file_path: Path) -> List[str]:
        """Parse Node.js package.json"""
        deps = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'dependencies' in data:
                    deps.extend(data['dependencies'].keys())
                if 'devDependencies' in data:
                    deps.extend(data['devDependencies'].keys())
        except:
            pass
        return deps
    
    def _parse_pom_xml(self, file_path: Path) -> List[str]:
        """Parse Maven pom.xml"""
        deps = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Simple regex to extract artifactId
                matches = re.findall(r'<artifactId>(.*?)</artifactId>', content)
                deps.extend(matches)
        except:
            pass
        return deps
    
    def _parse_gradle(self, file_path: Path) -> List[str]:
        """Parse Gradle build file"""
        deps = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Look for dependency declarations
                matches = re.findall(r"implementation\s+['\"]([^:'\"]+)", content)
                matches.extend(re.findall(r"compile\s+['\"]([^:'\"]+)", content))
                deps.extend(matches)
        except:
            pass
        return deps
    
    def _parse_gemfile(self, file_path: Path) -> List[str]:
        """Parse Ruby Gemfile"""
        deps = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    match = re.search(r"gem\s+['\"]([^'\"]+)", line)
                    if match:
                        deps.append(match.group(1))
        except:
            pass
        return deps
    
    def _parse_cargo_toml(self, file_path: Path) -> List[str]:
        """Parse Rust Cargo.toml"""
        deps = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                in_dependencies = False
                for line in f:
                    if '[dependencies]' in line:
                        in_dependencies = True
                        continue
                    if in_dependencies:
                        if line.startswith('['):
                            break
                        match = re.match(r'^(\w+)\s*=', line)
                        if match:
                            deps.append(match.group(1))
        except:
            pass
        return deps
    
    def _parse_go_mod(self, file_path: Path) -> List[str]:
        """Parse Go go.mod"""
        deps = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip().startswith('require'):
                        continue
                    match = re.match(r'\s+([^\s]+)\s+v', line)
                    if match:
                        deps.append(match.group(1))
        except:
            pass
        return deps
    
    def _detect_test_files(self, files: List[Path], project_path: Path) -> List[str]:
        """
        Detect test files based on naming patterns
        """
        test_files = []
        for file in files:
            filename = file.name
            for pattern in self.test_regex:
                if pattern.match(filename):
                    # Get relative path
                    rel_path = file.relative_to(project_path)
                    test_files.append(str(rel_path))
                    break
        return sorted(test_files)
    
    def _check_cicd_configs(self, project_path: Path) -> bool:
        """
        Check if CI/CD configuration files exist
        """
        for config in self.CICD_FILES:
            config_path = project_path / config
            if config_path.exists():
                return True
        return False
    
    def _check_dockerfile(self, project_path: Path) -> bool:
        """
        Check if Dockerfile exists
        """
        dockerfile_paths = [
            project_path / 'Dockerfile',
            project_path / 'dockerfile',
        ]
        return any(path.exists() for path in dockerfile_paths)
    
    def _check_security_issues(self, files: List[Path], project_path: Path) -> List[str]:
        """
        Check for potential security issues
        """
        warnings = []
        
        for file in files:
            filename = file.name
            rel_path = str(file.relative_to(project_path))
            
            # Check for env files
            if filename.startswith('.env'):
                warnings.append(f"Environment file found: {rel_path}")
            
            # Check for key files
            if any(filename.endswith(ext) for ext in ['.pem', '.key']):
                warnings.append(f"Private key file found: {rel_path}")
            
            # Check for credentials
            if 'secret' in filename.lower() or 'credential' in filename.lower():
                warnings.append(f"Potential credentials file: {rel_path}")
        
        # Check .gitignore
        gitignore_path = project_path / '.gitignore'
        if not gitignore_path.exists():
            warnings.append("No .gitignore file found")
        else:
            # Check if common sensitive files are ignored
            try:
                with open(gitignore_path, 'r') as f:
                    gitignore_content = f.read()
                    if '.env' not in gitignore_content:
                        warnings.append(".env files may not be ignored by git")
            except:
                pass
        
        return warnings
    
    def _generate_tree(self, project_path: Path, max_depth: int = 3) -> str:
        """
        Generate a tree structure of the project
        """
        def tree_recursive(path: Path, prefix: str = "", depth: int = 0) -> List[str]:
            if depth > max_depth:
                return []
            
            lines = []
            try:
                contents = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name))
                # Filter out skip directories
                contents = [c for c in contents if c.name not in self.SKIP_DIRS]
                
                for i, item in enumerate(contents):
                    is_last = i == len(contents) - 1
                    current_prefix = "└── " if is_last else "├── "
                    lines.append(f"{prefix}{current_prefix}{item.name}")
                    
                    if item.is_dir() and depth < max_depth:
                        next_prefix = prefix + ("    " if is_last else "│   ")
                        lines.extend(tree_recursive(item, next_prefix, depth + 1))
            except PermissionError:
                pass
            
            return lines
        
        tree_lines = [project_path.name + "/"]
        tree_lines.extend(tree_recursive(project_path))
        return "\n".join(tree_lines)
    
    def _detect_framework(self, project_path: Path, files: List[Path]) -> str:
        """
        Detect the framework being used
        """
        # Check for package.json frameworks
        package_json = project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)
                    deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                    
                    if 'react' in deps:
                        if 'next' in deps:
                            return 'Next.js'
                        return 'React'
                    if 'vue' in deps:
                        if 'nuxt' in deps:
                            return 'Nuxt.js'
                        return 'Vue.js'
                    if 'angular' in deps or '@angular/core' in deps:
                        return 'Angular'
                    if 'express' in deps:
                        return 'Express.js'
                    if 'svelte' in deps:
                        return 'Svelte'
            except:
                pass
        
        # Check for Python frameworks
        requirements = project_path / 'requirements.txt'
        if requirements.exists():
            try:
                with open(requirements, 'r') as f:
                    content = f.read().lower()
                    if 'django' in content:
                        return 'Django'
                    if 'flask' in content:
                        return 'Flask'
                    if 'fastapi' in content:
                        return 'FastAPI'
            except:
                pass
        
        # Check for Spring Boot
        pom_xml = project_path / 'pom.xml'
        if pom_xml.exists():
            try:
                with open(pom_xml, 'r') as f:
                    if 'spring-boot' in f.read():
                        return 'Spring Boot'
            except:
                pass
        
        return None