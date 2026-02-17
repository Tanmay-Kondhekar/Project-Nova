"""
AWS Client - Submits jobs to AWS and polls for results
Integrated into backend for frontend use
"""

import boto3
import uuid
import time
import json
from typing import Dict, Optional
from datetime import datetime
import requests
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

class AWSJobClient:
    def __init__(
        self,
        api_gateway_url: str,
        status_table_name: str,
        region: str = 'ap-south-1'
    ):
        """
        Initialize the AWS job client
        
        Args:
            api_gateway_url: Your API Gateway endpoint URL
            status_table_name: DynamoDB table name for job status
            region: AWS region
        """
        self.api_gateway_url = api_gateway_url
        self.status_table_name = status_table_name
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.table = self.dynamodb.Table(status_table_name)
        self.s3_client = boto3.client('s3', region_name=region)
    
    def submit_job(self, git_url: str, branch: str = "main", **kwargs) -> str:
        """
        Submit a new job to the processing queue
        
        Args:
            git_url: Git repository URL to clone
            branch: Branch name to checkout
            **kwargs: Any additional parameters to pass to the worker
            
        Returns:
            job_id: Unique identifier for this job
        """
        job_id = str(uuid.uuid4())
        
        payload = {
            "job_id": job_id,
            "git_url": git_url,
            "branch": branch,
            "timestamp": datetime.utcnow().isoformat(),
            **kwargs
        }
        
        logger.info(f"Submitting job {job_id}")
        logger.info(f"  Git URL: {git_url}")
        logger.info(f"  Branch: {branch}")
        
        try:
            response = requests.post(
                self.api_gateway_url,
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            
            logger.info(f"Job submitted successfully!")
            return job_id
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to submit job: {e}")
            raise
    
    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """
        Get the current status of a job
        
        Args:
            job_id: The job identifier
            
        Returns:
            dict with status info or None if not found
        """
        try:
            response = self.table.get_item(Key={'job_id': job_id})
            return response.get('Item')
        except Exception as e:
            logger.error(f"Error fetching status: {e}")
            return None
    
    def download_result(self, job_status: Dict) -> Optional[bytes]:
        """
        Download the result from S3 directly using boto3
        
        Args:
            job_status: Status dict containing s3_url or s3_key
            
        Returns:
            bytes of the zip file or None if failed
        """
        s3_url = job_status.get('s3_url', '')
        
        if not s3_url:
            logger.error("No S3 URL in job status")
            return None
        
        try:
            parsed = urlparse(s3_url)
            
            # Extract bucket name from hostname (bucket.s3.region.amazonaws.com)
            bucket_name = parsed.hostname.split('.')[0]
            
            # Extract key from path (remove leading /)
            s3_key = parsed.path.lstrip('/')
            
            logger.info(f"Downloading from S3: s3://{bucket_name}/{s3_key}")
            
            # Download to memory
            response = self.s3_client.get_object(Bucket=bucket_name, Key=s3_key)
            data = response['Body'].read()
            
            logger.info(f"Download complete!")
            return data
            
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return None