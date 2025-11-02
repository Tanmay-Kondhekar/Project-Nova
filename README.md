# 🚀 AI Testing & Security Automation Platform

> **Stage 1**: Project Preprocessing & Metadata Extraction

An intelligent platform that automatically analyzes software projects, extracts metadata, and prepares them for automated testing and security scanning.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Supported Languages](#supported-languages)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

This platform is being built in stages to create a comprehensive AI-assisted testing and security automation system. **Stage 1** focuses on understanding and preprocessing software projects.

### What Stage 1 Does:

✅ Accepts project uploads (.zip files or GitHub URLs)  
✅ Detects programming languages and frameworks  
✅ Extracts dependencies from multiple package managers  
✅ Identifies existing test files  
✅ Checks for CI/CD configurations  
✅ Scans for security-relevant files  
✅ Generates project structure visualization  
✅ Displays results in a beautiful, modern UI  

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
- Collapsible sections for organized viewing
- Real-time processing feedback
- Cross-browser compatible (Chrome, Firefox, Safari, Edge)
- Responsive design

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.8+** - Core language
- **Uvicorn** - ASGI server
- **python-multipart** - File upload handling

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Vanilla CSS** - Inline styling (no Tailwind)

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
│   ├── preprocessor.py      # Analysis engine
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
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
  "project_structure_tree": "project/\n├── manage.py\n├── ..."
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

## 🌐 Supported Languages

| Language | Dependency File | Test Pattern |
|----------|----------------|--------------|
| Python | requirements.txt, Pipfile | test_*.py, *_test.py |
| JavaScript | package.json | *.test.js, *.spec.js |
| TypeScript | package.json | *.test.ts, *.spec.ts |
| Java | pom.xml, build.gradle | *Test.java, Test*.java |
| Go | go.mod | *_test.go |
| Rust | Cargo.toml | - |
| Ruby | Gemfile | test_*.rb, *_spec.rb |
| PHP | composer.json | - |
| C++ | - | - |
| C# | - | - |
| Kotlin | - | - |
| Scala | - | - |
| Swift | - | - |

---

## 🗺️ Roadmap

### ✅ Stage 1 - Preprocessing (COMPLETED)
- Project metadata extraction
- Language and framework detection
- Dependency analysis
- Security file detection
- UI for visualization

### 🔄 Stage 2 - Testing & Security (COMING SOON)
- Automated test generation (unit, integration, E2E)
- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Dependency vulnerability scanning
- Container security scanning

### 🔮 Stage 3 - AI & Automation (FUTURE)
- AI-powered test case generation
- Vulnerability explanation with AI
- Automated fix suggestions
- CI/CD pipeline generation
- Comprehensive dashboard with insights

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

- **Your Name** - Initial work

---

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React team for the powerful UI library
- Lucide for the beautiful icons
- Open source community for inspiration

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: your-email@example.com

---

**Built with ❤️ by the Testing Platform Team**