"""
A2 - OCR Service
Handles PDF and Image OCR using pytesseract and pdfplumber
"""
import pytesseract
import pdfplumber
from PIL import Image, ImageEnhance
import io
from typing import Union
import os

class OCRService:
    """Service to extract text from images and PDFs"""
    
    def __init__(self):
        """Initialize OCR service"""
        self.pytesseract_available = self._check_tesseract()
    
    def _check_tesseract(self) -> bool:
        """Check if pytesseract is properly configured"""
        try:
            pytesseract.pytesseract.get_tesseract_version()
            return True
        except pytesseract.TesseractNotFoundError:
            print("Warning: Tesseract not found. Please install Tesseract-OCR from https://github.com/UB-Mannheim/tesseract/wiki")
            return False
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR results
        - Convert to grayscale
        - Increase contrast
        - Optionally resize if too small
        """
        # Convert to grayscale
        grayscale = image.convert('L')
        
        # Increase contrast for better text recognition
        enhancer = ImageEnhance.Contrast(grayscale)
        enhanced = enhancer.enhance(1.5)
        
        # Optionally increase sharpness
        sharpness_enhancer = ImageEnhance.Sharpness(enhanced)
        sharpened = sharpness_enhancer.enhance(1.2)
        
        # Ensure minimum size (upscale if too small)
        min_width = 800
        if sharpened.width < min_width:
            scale_factor = min_width / sharpened.width
            new_size = (int(sharpened.width * scale_factor), int(sharpened.height * scale_factor))
            sharpened = sharpened.resize(new_size, Image.Resampling.LANCZOS)
        
        return sharpened
    
    def extract_text_from_image(self, image_bytes: bytes) -> str:
        """
        Extract text from image file
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Extracted text as string
        """
        if not self.pytesseract_available:
            raise RuntimeError("Tesseract OCR not available. Please install it first.")
        
        try:
            # Load image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            
            # Preprocess image
            processed_image = self.preprocess_image(image)
            
            # Extract text using pytesseract
            text = pytesseract.image_to_string(processed_image, lang='eng')
            
            return text.strip()
        except Exception as e:
            raise ValueError(f"Failed to extract text from image: {str(e)}")
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """
        Extract text from PDF file
        
        Args:
            pdf_bytes: Raw PDF file bytes
            
        Returns:
            Extracted text as string
        """
        try:
            # Read PDF from bytes
            pdf_file = io.BytesIO(pdf_bytes)
            
            extracted_text = []
            
            with pdfplumber.open(pdf_file) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Extract text from page
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text.append(f"--- Page {page_num + 1} ---\n{page_text}")
                    
                    # Also try to extract text from images in PDF (lab reports often have scanned images)
                    try:
                        page_image = page.to_image()
                        image_text = self._extract_text_from_page_image(page_image)
                        if image_text:
                            extracted_text.append(f"--- OCR from Page {page_num + 1} ---\n{image_text}")
                    except Exception as e:
                        print(f"Warning: Could not extract image from page {page_num + 1}: {str(e)}")
            
            return "\n".join(extracted_text).strip()
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
    
    def _extract_text_from_page_image(self, page_image) -> str:
        """Extract text from a page image using OCR"""
        if not self.pytesseract_available:
            return ""
        
        try:
            # Convert PIL Image to processed format
            processed = self.preprocess_image(page_image.original)
            text = pytesseract.image_to_string(processed, lang='eng')
            return text.strip()
        except Exception as e:
            print(f"Warning: OCR extraction failed: {str(e)}")
            return ""
    
    def extract_text(self, file_bytes: bytes, file_type: str) -> str:
        """
        Universal text extraction method
        
        Args:
            file_bytes: Raw file bytes
            file_type: "image" or "pdf"
            
        Returns:
            Extracted text
        """
        if file_type.lower() == "pdf":
            return self.extract_text_from_pdf(file_bytes)
        elif file_type.lower() in ["image", "jpg", "jpeg", "png"]:
            return self.extract_text_from_image(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")


# Create singleton instance
ocr_service = OCRService()
