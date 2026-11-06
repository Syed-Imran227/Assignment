import re
from typing import Optional, Tuple

def normalize_whitespace(text: str) -> str:
    """Normalize internal whitespace and strip leading/trailing spaces."""
    return re.sub(r'\s+', ' ', text).strip()

def verify_quote_in_source(quote: Optional[str], source_text: str) -> Tuple[bool, Optional[int], Optional[int]]:
    """
    Verify if a quote exists verbatim or with normalized whitespace in source_text.
    Returns (verified, start_index, end_index).
    Uses fast substring matching with zero catastrophic regex backtracking.
    """
    if not quote or not source_text:
        return False, None, None
    
    quote_clean = quote.strip()
    if not quote_clean:
        return False, None, None

    # 1. Exact match attempt
    idx = source_text.find(quote_clean)
    if idx != -1:
        return True, idx, idx + len(quote_clean)

    # 2. Case-insensitive exact match
    idx = source_text.lower().find(quote_clean.lower())
    if idx != -1:
        return True, idx, idx + len(quote_clean)

    # 3. Normalized whitespace match
    norm_source = normalize_whitespace(source_text).lower()
    norm_quote = normalize_whitespace(quote_clean).lower()
    idx = norm_source.find(norm_quote)
    if idx != -1:
        return True, idx, idx + len(norm_quote)

    return False, None, None
