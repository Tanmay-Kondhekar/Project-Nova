# 🚀 AI Testing & Security Automation Platform

> **Stage 1+**: Project Preprocessing, Code Analysis & Semantic Graphs

An intelligent platform that automatically analyzes software projects, extracts metadata, tokenizes code, generates ASTs, and visualizes semantic relationships - preparing them for automated testing and security scanning.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Code Analysis Features](#code-analysis-features)
- [Supported Languages](#supported-languages)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This platform is being built in stages to create a comprehensive AI-assisted testing and security automation system. **Stage 1+** focuses on understanding, preprocessing, and deeply analyzing software projects.

### What Stage 1+ Does:

✅ Accepts project uploads (.zip files or GitHub URLs)  
✅ Detects programming languages and frameworks  
✅ Extracts dependencies from multiple package managers  
✅ Identifies existing test files  
✅ Checks for CI/CD configurations  
✅ Scans for security-relevant files  
✅ Generates project structure visualization  
✅ **NEW**: Tokenizes source code (removes comments, extracts tokens)  
✅ **NEW**: Generates Abstract Syntax Trees (AST) for Python  
✅ **NEW**: Performs semantic analysis (functions, classes, imports)  
✅ **NEW**: Creates semantic graphs showing code relationships  
✅ **NEW**: Calculates code complexity metrics  
✅ Displays results in a beautiful, tabbed UI  

---

## ✨ Features

### 🔍 Project Analysis
- **Multi-language detection**: Python, JavaScript, TypeScript, Java, Go, Rust, Ruby, PHP, C++, C#, Kotlin, Scala, Swift
- **Framework identification**: React, Next.js, Vue.js, Angular, Django, Flask, FastAPI, Spring Boot, Express.js, and more
- **Dependency extraction** from:
  - Python: `requirements.txt`, `Pipfile`, `pyproject.toml`
  - JavaScript/Node: `package.json`, `yarn.lock`
  - Java: `pom.xml`, `build.gradle`
  - Go: `go.mod`
  - Rust: `Cargo.toml`
  - Ruby: `Gemfile`
  - PHP: `composer.json`

### 🔬 Code Analysis (NEW!)
- **Tokenization**
  - Breaks code into tokens (keywords, operators, identifiers)
  - Removes comments automatically
  - Shows first 50 tokens per file
- **AST Generation** (Python)
  - Full Abstract Syntax Trees
  - Up to 3 levels deep
  - Includes line numbers and node types
- **Semantic Extraction**
  - Functions with arguments and decorators
  - Classes with methods and base classes
  - Import statements and dependencies
  - Cyclomatic complexity calculation
- **JavaScript/TypeScript Support**
  - Basic tokenization
  - Regex-based function/class detection
  - Import extraction

### 📊 Semantic Graph (NEW!)
- Hierarchical visualization of code structure
- File → Class → Function relationships
- Color-coded nodes (Files: blue, Classes: purple, Functions: green)
- Node and edge statistics

### 🧪 Test Detection
- Automatically finds test files using pattern matching
- Supports common test naming conventions across languages
- Lists all detected test files with paths

### 🔒 Security Checks
- Detects sensitive files (`.env`, `.pem`, `.key`)
- Warns about exposed credentials
- Checks `.gitignore` configuration
- Flags potential security issues

### 🐳 DevOps Detection
- CI/CD configuration detection (GitHub Actions, GitLab CI, Jenkins, CircleCI, Travis CI)
- Dockerfile presence check
- Container configuration analysis

### 🎨 Modern UI
- Clean, dark-themed interface
- **3 interactive tabs**: Overview, Code Analysis, Semantic Graph
- Collapsible sections for organized viewing
- Real-time processing feedback
- Cross-browser compatible (Chrome, Firefox, Safari, Edge)
- Responsive design
- Custom scrollbars

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.8+** - Core language
- **Uvicorn** - ASGI server
- **python-multipart** - File upload handling
- **ast** - Built-in Python AST parser
- **tokenize** - Built-in Python tokenizer

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Vanilla CSS** - Inline styling (no framework dependencies)

---

## 📦 Installation

### Prerequisites

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** and npm ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/)) - for GitHub repo cloning

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

---

## 🚀 Usage

### Starting the Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

The API will be available at: `http://localhost:8000`

### Starting the Frontend

```bash
cd frontend
npm run dev
```

The UI will be available at: `http://localhost:3000` or `http://localhost:5173`

### Using the Application

1. **Choose Upload Method**:
   - Click "Upload .zip" to upload a zipped project folder
   - Click "GitHub URL" to analyze a public GitHub repository

2. **Upload/Enter URL**:
   - Select your `.zip` file, OR
   - Paste a GitHub repository URL (e.g., `https://github.com/username/repo`)

3. **Run Preprocessing**:
   - Click "Run Preprocessing"
   - Wait for analysis to complete (typically 5-30 seconds)

4. **View Results**:
   - Explore detected languages and frameworks
   - Review dependencies
   - Check identified test files
   - View security warnings
   - Examine project structure

---

## 📁 Project Structure

```
testing-platform/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── preprocessor.py      # Project analysis engine
│   ├── ast_analyzer.py      # Code tokenization & AST generation
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component (with 3 tabs)
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md
├── CODE_ANALYSIS_GUIDE.md   # Detailed code analysis documentation
└── UPDATE_INSTRUCTIONS.md   # Update guide for existing installations
```

---

## 📡 API Documentation

### `POST /preprocess`

Analyzes a software project and returns metadata.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: .zip file (optional)
  - `github_url`: GitHub repository URL (optional)

**Response:**
```json
{
  "languages": ["Python", "JavaScript"],
  "framework": "Django",
  "dependencies": ["django", "requests", "pytest"],
  "test_files_found": ["tests/test_models.py", "tests/test_views.py"],
  "ci_cd_configs": true,
  "dockerfile_found": true,
  "security_warnings": [
    "Environment file found: .env",
    ".env files may not be ignored by git"
  ],
  "project_structure_tree": "project/\n├── manage.py\n├── ...",
  "ast_analysis": {
    "total_files_analyzed": 25,
    "files": [
      {
        "relative_path": "app.py",
        "language": "Python",
        "line_count": 150,
        "token_count": 450,
        "complexity": 12,
        "functions": [
          {
            "name": "process_data",
            "line": 45,
            "args": ["data", "options"],
            "decorators": ["@staticmethod"]
          }
        ],
        "classes": [
          {
            "name": "DataProcessor",
            "line": 20,
            "methods": ["process", "validate", "save"],
            "bases": ["BaseProcessor"]
          }
        ],
        "imports": [
          {"module": "os", "type": "import"},
          {"module": "typing", "names": ["List", "Dict"], "type": "from_import"}
        ],
        "tokens": [
          {"type": "KEYWORD", "string": "import", "line": 1},
          {"type": "IDENTIFIER", "string": "os", "line": 1}
        ]
      }
    ],
    "aggregate_stats": {
      "total_tokens": 11250,
      "total_lines": 3500,
      "total_functions": 85,
      "total_classes": 12,
      "languages": {"Python": 20, "JavaScript": 5}
    },
    "semantic_graph": {
      "nodes": [
        {"id": "file_0", "type": "file", "label": "app.py", "language": "Python"},
        {"id": "class_1", "type": "class", "label": "DataProcessor", "file": "app.py"},
        {"id": "func_2", "type": "function", "label": "process_data", "file": "app.py"}
      ],
      "edges": [
        {"from": "file_0", "to": "class_1", "type": "contains"},
        {"from": "file_0", "to": "func_2", "type": "contains"}
      ]
    }
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid input (bad file type, invalid URL)
- `408`: Git clone timeout
- `500`: Server error

### `GET /`

Health check endpoint.

**Response:**
```json
{
  "message": "AI Testing & Security Platform API - Stage 1"
}
```

---

## 🔬 Code Analysis Features

### Tokenization
- Breaks source code into atomic tokens
- Removes comments and whitespace
- Classifies tokens (keywords, operators, identifiers, etc.)

### AST (Abstract Syntax Tree)
- Full parse tree for Python files
- Hierarchical code structure
- Line number tracking

### Semantic Analysis
- **Functions**: Name, arguments, decorators, complexity
- **Classes**: Name, methods, inheritance
- **Imports**: Module dependencies
- **Complexity**: Cyclomatic complexity score

### Semantic Graph
- Visualizes code relationships
- Nodes: Files, Classes, Functions
- Edges: Contains relationships
- Hierarchical structure

**For detailed information, see `CODE_ANALYSIS_GUIDE.md`**

---

## 🌐 Supported Languages

| Language | Dependency File | Test Pattern | Tokenization | AST | Semantic Analysis |
|----------|----------------|--------------|--------------|-----|-------------------|
| Python | requirements.txt, Pipfile | test_*.py, *_test.py | ✅ Full | ✅ Full | ✅ Full |
| JavaScript | package.json | *.test.js, *.spec.js | ✅ Basic | ❌ | ✅ Regex |
| TypeScript | package.json | *.test.ts, *.spec.ts | ✅ Basic | ❌ | ✅ Regex |
| Java | pom.xml, build.gradle | *Test.java, Test*.java | ❌ | ❌ | ❌ |
| Go | go.mod | *_test.go | ❌ | ❌ | ❌ |
| Rust | Cargo.toml | - | ❌ | ❌ | ❌ |
| Ruby | Gemfile | test_*.rb, *_spec.rb | ❌ | ❌ | ❌ |
| PHP | composer.json | - | ❌ | ❌ | ❌ |
| C++ | - | - | ❌ | ❌ | ❌ |
| C# | - | - | ❌ | ❌ | ❌ |
| Kotlin | - | - | ❌ | ❌ | ❌ |
| Scala | - | - | ❌ | ❌ | ❌ |
| Swift | - | - | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full: Complete support with native parsers
- ✅ Basic: Simple tokenization
- ✅ Regex: Pattern-matching based
- ❌: Not yet supported

---

## 🗺️ Roadmap

### ✅ Stage 1+ - Preprocessing & Code Analysis (COMPLETED)
- Project metadata extraction
- Language and framework detection
- Dependency analysis
- Security file detection
- **Tokenization and AST generation**
- **Semantic analysis (functions, classes, imports)**
- **Code complexity calculation**
- **Semantic graph visualization**
- UI with 3 tabs (Overview, Code Analysis, Semantic Graph)

### 🔄 Stage 2 - Testing & Security (COMING SOON)
- Automated test generation (unit, integration, E2E)
- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Dependency vulnerability scanning
- Container security scanning
- Code smell detection

### 🔮 Stage 3 - AI & Automation (FUTURE)
- AI-powered test case generation
- Vulnerability explanation with AI
- Automated fix suggestions
- CI/CD pipeline generation
- Comprehensive dashboard with insights
- Call graph analysis
- Dead code detection

---

## 🧪 Testing the Platform

### Sample Projects to Test

**Python:**
```bash
# Flask example
https://github.com/pallets/flask
```

**JavaScript:**
```bash
# React example
https://github.com/facebook/create-react-app
```

**Create Your Own Test Project:**
```bash
mkdir my-test-project
cd my-test-project

# Create some files
echo "flask==2.3.0" > requirements.txt
echo "def test_example(): pass" > test_app.py
mkdir src
echo "# Main app" > src/app.py

# Zip it
zip -r my-project.zip .
```

---

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Kill the process
# Windows: netstat -ano | findstr :8000
# macOS/Linux: lsof -ti:8000 | xargs kill -9
```

**Git clone fails:**
- Ensure Git is installed: `git --version`
- Check internet connection
- Verify the GitHub URL is correct and public

### Frontend Issues

**Blank page or errors:**
- Check browser console (F12)
- Ensure backend is running at `http://localhost:8000`
- Verify CORS settings in `main.py`

**CORS errors:**
- Confirm backend is running
- Check that frontend URL is in CORS `allow_origins`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Ameya**
- **Akul**
- **Saloni**
- **Tanmay**

---

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React team for the powerful UI library
- Lucide for the beautiful icons
- Open source community for inspiration

---