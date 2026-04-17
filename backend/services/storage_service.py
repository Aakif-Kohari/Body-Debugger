"""
A7 - Storage Service
Handles Firebase Storage uploads and downloads
"""
import io
from firebase_admin import storage
from datetime import datetime
import uuid
from typing import Tuple

class StorageService:
    """Service for Firebase Storage operations"""
    
    def __init__(self):
        """Initialize storage service"""
        try:
            self.bucket = storage.bucket()
        except Exception as e:
            print(f"Warning: Could not initialize storage bucket: {e}")
            self.bucket = None
    
    def upload_file(self, 
                   file_bytes: bytes, 
                   directory: str, 
                   filename: str = None,
                   content_type: str = "application/octet-stream") -> str:
        """
        Upload file to Firebase Storage
        
        Args:
            file_bytes: Raw file bytes
            directory: Directory path in storage (e.g., "reports", "records", "prescriptions")
            filename: Optional custom filename. If not provided, a UUID will be generated
            content_type: MIME type of the file
            
        Returns:
            Public URL of the uploaded file
        """
        if not self.bucket:
            raise RuntimeError("Firebase Storage not initialized")
        
        try:
            # Generate filename if not provided
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                random_id = str(uuid.uuid4())[:8]
                filename = f"{timestamp}_{random_id}"
            
            # Create blob path
            blob_path = f"{directory}/{filename}"
            blob = self.bucket.blob(blob_path)
            
            # Upload file
            blob.upload_from_string(file_bytes, content_type=content_type)
            
            # Make it publicly accessible (optional, depends on Firebase security rules)
            # blob.make_public()
            
            # Return the download URL
            # For development, return a path that can be used with download_file()
            return f"gs://{self.bucket.name}/{blob_path}"
        
        except Exception as e:
            raise RuntimeError(f"Failed to upload file to storage: {str(e)}")
    
    def download_file(self, storage_path: str) -> bytes:
        """
        Download file from Firebase Storage
        
        Args:
            storage_path: Path to file in storage (e.g., "gs://bucket/reports/file.pdf")
            
        Returns:
            File bytes
        """
        if not self.bucket:
            raise RuntimeError("Firebase Storage not initialized")
        
        try:
            # Extract path from gs:// URI
            if storage_path.startswith("gs://"):
                path = storage_path.replace(f"gs://{self.bucket.name}/", "")
            else:
                path = storage_path
            
            blob = self.bucket.blob(path)
            return blob.download_as_bytes()
        
        except Exception as e:
            raise RuntimeError(f"Failed to download file from storage: {str(e)}")
    
    def get_public_url(self, storage_path: str) -> str:
        """
        Get public download URL for a file
        
        Args:
            storage_path: Path in storage
            
        Returns:
            Public download URL
        """
        # Firebase Storage files can be accessed via:
        # https://storage.googleapis.com/{bucket}/{path}
        # Or: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}
        
        if storage_path.startswith("gs://"):
            path = storage_path.replace(f"gs://{self.bucket.name}/", "")
        else:
            path = storage_path
        
        # URL-encode the path
        import urllib.parse
        encoded_path = urllib.parse.quote(path, safe='')
        
        return f"https://firebasestorage.googleapis.com/v0/b/{self.bucket.name}/o/{encoded_path}?alt=media"
    
    def delete_file(self, storage_path: str) -> bool:
        """
        Delete file from Firebase Storage
        
        Args:
            storage_path: Path in storage
            
        Returns:
            True if successful
        """
        if not self.bucket:
            raise RuntimeError("Firebase Storage not initialized")
        
        try:
            if storage_path.startswith("gs://"):
                path = storage_path.replace(f"gs://{self.bucket.name}/", "")
            else:
                path = storage_path
            
            blob = self.bucket.blob(path)
            blob.delete()
            return True
        
        except Exception as e:
            print(f"Warning: Failed to delete file: {str(e)}")
            return False


# Create singleton instance
storage_service = StorageService()
