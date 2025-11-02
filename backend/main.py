from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import zipfile
import os
import shutil
from pathlib import Path
from typing import Optional
import subprocess

from preprocessor import ProjectPreprocessor

app = FastAPI(title="Testing Platform API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

preprocessor = ProjectPreprocessor()

@app.get("/")
async def root():
    return {"message": "AI Testing & Security Platform API - Stage 1"}

@app.post("/preprocess")
async def preprocess_project(
    file: Optional[UploadFile] = File(None),
    github_url: Optional[str] = Form(None)
):
    """
    Preprocess a project from either a .zip file or GitHub URL
    """
    temp_dir = None
    
    try:
        # Create temporary directory
        temp_dir = tempfile.mkdtemp()
        project_path = None
        
        if file:
            # Handle .zip file upload
            if not file.filename.endswith('.zip'):
                raise HTTPException(status_code=400, detail="Only .zip files are allowed")
            
            # Save uploaded file
            zip_path = os.path.join(temp_dir, file.filename)
            with open(zip_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Extract zip
            extract_path = os.path.join(temp_dir, "extracted")
            os.makedirs(extract_path, exist_ok=True)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            
            # Find the root project directory (skip if zip contains single parent folder)
            contents = os.listdir(extract_path)
            if len(contents) == 1 and os.path.isdir(os.path.join(extract_path, contents[0])):
                project_path = os.path.join(extract_path, contents[0])
            else:
                project_path = extract_path
                
        elif github_url:
            # Handle GitHub URL
            if not github_url.startswith("https://github.com/"):
                raise HTTPException(status_code=400, detail="Invalid GitHub URL")
            
            # Clone repository
            clone_path = os.path.join(temp_dir, "repo")
            try:
                subprocess.run(
                    ["git", "clone", "--depth", "1", github_url, clone_path],
                    check=True,
                    capture_output=True,
                    timeout=60
                )
                project_path = clone_path
            except subprocess.TimeoutExpired:
                raise HTTPException(status_code=408, detail="Git clone timeout")
            except subprocess.CalledProcessError as e:
                raise HTTPException(status_code=400, detail=f"Failed to clone repository: {e.stderr.decode()}")
            except FileNotFoundError:
                raise HTTPException(status_code=500, detail="Git is not installed on the server")
        else:
            raise HTTPException(status_code=400, detail="Either file or github_url must be provided")
        
        # Run preprocessing
        results = preprocessor.analyze_project(project_path)
        
        return JSONResponse(content=results)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {str(e)}")
    finally:
        # Cleanup temporary directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)