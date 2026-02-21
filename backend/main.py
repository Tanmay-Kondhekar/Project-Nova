from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import tempfile
import zipfile
import os
import shutil
from pathlib import Path
from typing import Optional
import subprocess
import logging
import io

from preprocessor import ProjectPreprocessor
from ast_analyzer import ASTAnalyzer
from cfg_generator import build_cfg_json
from project_cfg import build_project_cfg_json
from aws_client import AWSJobClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Testing Platform API")

# AWS Configuration
AWS_API_GATEWAY_URL = "https://51wycsacok.execute-api.ap-south-1.amazonaws.com/prod/submit"
AWS_STATUS_TABLE_NAME = "job-status-table"
AWS_REGION = "ap-south-1"

from decimal import Decimal
from urllib.parse import urlparse

def normalize(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, dict):
        return {k: normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize(v) for v in obj]
    return obj

def extract_repo_name(git_url: str) -> str:
    """
    Extract repository name from git URL
    e.g., https://github.com/user/repo.git -> user/repo
    """
    if not git_url:
        return "Unknown"
    try:
        parsed = urlparse(git_url)
        path = parsed.path.strip('/')
        # Remove .git extension if present
        if path.endswith('.git'):
            path = path[:-4]
        return path
    except:
        return git_url


# Initialize AWS client
try:
    aws_client = AWSJobClient(
        api_gateway_url=AWS_API_GATEWAY_URL,
        status_table_name=AWS_STATUS_TABLE_NAME,
        region=AWS_REGION
    )
    logger.info("AWS client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize AWS client: {e}")
    aws_client = None

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

preprocessor = ProjectPreprocessor()
ast_analyzer = ASTAnalyzer()


# --- AWS Job endpoints ---
from pydantic import BaseModel

class AWSJobRequest(BaseModel):
    github_url: str
    branch: str = "main"

@app.post("/submit-aws-job")
async def submit_aws_job(request: AWSJobRequest):
    """
    Submit a GitHub repository to AWS for processing
    """
    if not aws_client:
        raise HTTPException(status_code=503, detail="AWS client not initialized")
    
    try:
        job_id = aws_client.submit_job(
            git_url=request.github_url,
            branch=request.branch
        )
        
        return JSONResponse(content={
            "job_id": job_id,
            "status": "SUBMITTED",
            "message": "Job submitted successfully",
            "git_url": request.github_url,
            "branch": request.branch
        })
    except Exception as e:
        logger.error(f"Failed to submit AWS job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/aws-job-status/{job_id}")
async def get_aws_job_status(job_id: str):
    """
    Get the status of an AWS job
    """
    if not aws_client:
        raise HTTPException(status_code=503, detail="AWS client not initialized")
    
    try:
        status = aws_client.get_job_status(job_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return JSONResponse(content=normalize(status))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/aws-job-result/{job_id}")
async def get_aws_job_result(job_id: str):
    """
    Download and extract the results from a completed AWS job
    """
    if not aws_client:
        raise HTTPException(status_code=503, detail="AWS client not initialized")
    
    try:
        # Get job status first
        status = aws_client.get_job_status(job_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if status.get('status') != 'COMPLETED':
            raise HTTPException(
                status_code=400, 
                detail=f"Job not completed. Current status: {status.get('status')}"
            )
        
        # Download the result zip
        result_data = aws_client.download_result(status)
        
        if not result_data:
            raise HTTPException(status_code=500, detail="Failed to download result")
        
        # Extract the zip and read the files
        with zipfile.ZipFile(io.BytesIO(result_data)) as zip_ref:
            file_names = zip_ref.namelist()
            
            results = {}
            for file_name in file_names:
                if file_name.endswith('.txt'):
                    with zip_ref.open(file_name) as f:
                        content = f.read().decode('utf-8', errors='ignore')
                        # Use just the filename without path
                        simple_name = os.path.basename(file_name)
                        results[simple_name] = content
        
        return JSONResponse(content={
            "job_id": job_id,
            "files": results
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/aws-jobs")
async def list_aws_jobs():
    """
    List all AWS jobs from DynamoDB with enhanced metadata
    """
    if not aws_client:
        raise HTTPException(status_code=503, detail="AWS client not initialized")
    
    try:
        # Scan the entire DynamoDB table
        response = aws_client.table.scan()
        items = response.get('Items', [])
        
        # Enhance each job with additional metadata
        enhanced_jobs = []
        for item in items:
            enhanced_job = dict(item)
            
            # Extract repo name from git_url
            if 'git_url' in item:
                enhanced_job['repo_name'] = extract_repo_name(item['git_url'])
            else:
                enhanced_job['repo_name'] = 'Unknown'
            
            # Use updated_at if available, otherwise use timestamp
            enhanced_job['display_time'] = item.get('updated_at') or item.get('timestamp', 'N/A')
            
            enhanced_jobs.append(enhanced_job)
        
        # Sort by timestamp (newest first)
        enhanced_jobs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return JSONResponse(content=normalize({
            "jobs": enhanced_jobs,
            "count": len(enhanced_jobs)
        }))
        
    except Exception as e:
        logger.error(f"Failed to list jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/aws-job-download/{job_id}")
async def download_aws_job_zip(job_id: str):
    """
    Download the raw zip file from a completed AWS job
    """
    if not aws_client:
        raise HTTPException(status_code=503, detail="AWS client not initialized")
    
    try:
        # Get job status first
        status = aws_client.get_job_status(job_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if status.get('status') != 'COMPLETED':
            raise HTTPException(
                status_code=400, 
                detail=f"Job not completed. Current status: {status.get('status')}"
            )
        
        # Download the result zip
        result_data = aws_client.download_result(status)
        
        if not result_data:
            raise HTTPException(status_code=500, detail="Failed to download result")
        
        # Return as downloadable file
        return StreamingResponse(
            io.BytesIO(result_data),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=aws_job_{job_id[:8]}.zip"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download job zip: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- CFG endpoint ---

class CodeRequest(BaseModel):
    code: str
    language: Optional[str] = "python"

@app.post("/cfg")
async def generate_cfg(request: CodeRequest):
    """
    Accepts code and returns a control flow graph (CFG) as JSON.
    Supports Python, C, and C++.
    
    Args:
        code: Source code to analyze
        language: Language of the code ('python', 'c', 'cpp'). Default: 'python'
    """
    try:
        cfg = build_cfg_json(request.code, language=request.language)
        return JSONResponse(content=cfg)
    except Exception as e:
        logger.error(f"CFG generation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

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
        
        # Auto-detect primary language for CFG
        detected_language = 'python'  # default
        if 'languages' in results and results['languages']:
            langs = results['languages']
            # Priority: C++ > C > Python > others
            if 'C++' in langs:
                detected_language = 'cpp'
            elif 'C' in langs:
                detected_language = 'c'
            elif 'Python' in langs:
                detected_language = 'python'
        
        logger.info(f"Detected primary language: {detected_language}")

        # Run AST analysis
        ast_results = ast_analyzer.analyze_codebase(Path(project_path))
        results["ast_analysis"] = ast_results

        # Run project-wide CFG analysis with detected language
        cfg = build_project_cfg_json(Path(project_path), language=detected_language)
        results["control_flow_graph"] = cfg
        results["detected_language"] = detected_language

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