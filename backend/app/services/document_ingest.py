import io
import re
import email
from email import policy
from typing import Dict, Any, Tuple

def normalize_text(text: str) -> str:
    """Normalize line breaks and clean whitespace."""
    if not text:
        return ""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace more than 2 consecutive newlines with 2 newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
    """
    Extracts text and page-by-page mapping from PDF bytes.
    Raises ValueError if PDF has no text layer (scanned).
    """
    page_map = {}
    full_text_parts = []

    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for idx, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text() or ""
                page_map[str(idx)] = page_text
                if page_text.strip():
                    full_text_parts.append(f"--- [Page {idx}] ---\n{page_text}")
    except Exception as e:
        # Fallback to pypdf
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            for idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                page_map[str(idx)] = page_text
                if page_text.strip():
                    full_text_parts.append(f"--- [Page {idx}] ---\n{page_text}")
        except Exception as inner_e:
            raise ValueError(f"Unable to read PDF document: {str(inner_e)}")

    full_text = "\n\n".join(full_text_parts).strip()
    
    # Check for scanned PDF (empty text layer)
    non_space_chars = len(re.sub(r"\s+", "", full_text))
    if non_space_chars < 30:
        raise ValueError(
            "This document appears to be a scanned image with no readable text layer. "
            "Please provide a text-searchable PDF, paste the incident details directly, or use an OCR tool."
        )

    return full_text, page_map

def parse_email_content(raw_content: str) -> Tuple[str, Dict[str, str]]:
    """
    Parses .eml format or pasted text with standard email headers.
    Returns (cleaned_formatted_text, headers_dict).
    """
    headers = {}
    body = raw_content

    # Try standard email library parse
    try:
        msg = email.message_from_string(raw_content, policy=policy.default)
        if msg.get("from") or msg.get("subject"):
            headers["From"] = str(msg.get("from", ""))
            headers["To"] = str(msg.get("to", ""))
            headers["Subject"] = str(msg.get("subject", ""))
            headers["Date"] = str(msg.get("date", ""))
            
            if msg.is_multipart():
                parts = []
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        parts.append(part.get_content())
                body = "\n".join(parts)
            else:
                body = msg.get_content() if hasattr(msg, "get_content") else str(msg.get_payload())
    except Exception:
        pass

    # If headers not found by parser, check regex for pasted headers
    if not headers.get("Subject"):
        subject_match = re.search(r"^Subject:\s*(.+)$", raw_content, re.MULTILINE | re.IGNORECASE)
        from_match = re.search(r"^From:\s*(.+)$", raw_content, re.MULTILINE | re.IGNORECASE)
        date_match = re.search(r"^Date:\s*(.+)$", raw_content, re.MULTILINE | re.IGNORECASE)
        
        if subject_match:
            headers["Subject"] = subject_match.group(1).strip()
        if from_match:
            headers["From"] = from_match.group(1).strip()
        if date_match:
            headers["Date"] = date_match.group(1).strip()

    header_summary = []
    if headers.get("Subject"):
        header_summary.append(f"Subject: {headers['Subject']}")
    if headers.get("From"):
        header_summary.append(f"From: {headers['From']}")
    if headers.get("Date"):
        header_summary.append(f"Date: {headers['Date']}")

    if header_summary:
        full_text = "\n".join(header_summary) + "\n\n" + normalize_text(body)
    else:
        full_text = normalize_text(raw_content)

    return full_text, headers

