# utils.py
import json
import re

def extract_json(text):
    """Extracts JSON from a string."""
    pattern = r'("?`{3,})?({.*})\1?'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        json_str = match.group(2)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            print("Error decoding JSON")
    return None