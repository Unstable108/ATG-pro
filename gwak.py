import os
import re
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# ====================== CONFIG ======================
# You now set the REAL chapter numbers you want
START_CHAPTER = 1   # Test with 2103
END_CHAPTER   = 10

DELAY = 1.5
OUTPUT_DIR = "chapterGwak"
# The URL on the site might be offset from the real chapter number.
# E.g., Real Chapter 6 = URL Chapter 7 (Offset is 1)
URL_OFFSET = 1 

# Base URL for the novel
BASE_URL = "https://freewebnovel.com/novel/martial-artist-lee-gwak/chapter"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_content(soup):
    """
    Removes junk elements, extracts clean content, and removes translator notes.
    """
    # Define a pattern to identify the start of translator/site notes
    # We look for the exact header "SoundlessWind21s Notes:" or similar common endings.
    NOTE_PATTERN = r"(SoundlessWind21s Notes:|Translator's Note|T\.L\. Notes|If you wish to support my translations|Thank you for reading!)"
    
    # Remove ads/scripts/navigation elements
    for trash in soup.select("script, style, .ads, .navigate, a[href*='javascript']"):
        trash.decompose()

    # Get all <p> tags with real content
    paragraphs = []
    # Find the main content div if possible, otherwise use the whole soup
    content_area = soup.find("div", class_="txt") or soup 
    
    for p in content_area.find_all("p"):
        # Use get_text with separator=' ' to preserve spaces from inline elements
        text = p.get_text(separator=' ', strip=False)
        
        # Clean up multiple spaces/newlines from separator
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Skip very short lines (ads, nav)
        if len(text) < 10 or "arrow keys" in text.lower() or "prev/next" in text.lower():
            continue
        
        # Ignore common boilerplate headers like volume/chapter info in <p> tags
        if re.match(r"(volume|light novel).+\d+", text, re.I):
            continue
            
        # Check if this paragraph contains the start of the notes
        if re.search(NOTE_PATTERN, text, re.I):
            # If found, extract only the content *before* the note pattern
            # Split the text by the pattern and take the first part
            parts = re.split(NOTE_PATTERN, text, maxsplit=1, flags=re.I)
            pre_note_text = parts[0].strip()
            
            # If there is meaningful content before the note, add it and stop processing
            if len(pre_note_text) > 50:
                 paragraphs.append(pre_note_text)
            
            # Stop the loop immediately as we've reached the notes section
            break 
            
        # Standard content cleanup for paragraphs that are not notes
        
        # Remove reaction numbers like "text2"
        text = re.sub(r'([.!?])\s*\d+$', r'\1', text)
        
        # Fix common mangling: Ensure ellipses (...) have spaces around if needed
        text = re.sub(r'([a-zA-Z])\.\.\.([a-zA-Z])', r'\1... \2', text)
            
        paragraphs.append(text)

    full_text = "\n\n".join(paragraphs).strip()
    return full_text if len(full_text) > 800 else "Content too short"

def extract_real_title_and_number(soup):
    """
    Extracts the clean chapter title by looking for the 'chapter' class.
    It handles both 'Chapter N - Title' and 'Chapter N: Title'.
    """
    # Method 1: Look for <span class="chapter"> like: Chapter 6: A Small Leaf...
    span = soup.find("span", class_="chapter")
    if span:
        text = span.get_text(strip=True)
        # Use [:\-] to match either a colon or a hyphen after the chapter number
        match = re.match(r"Chapter\s*\d+\s*[:\-]\s*(.+)", text, re.I)
        if match:
            # Group 1 is the part after the chapter number and separator
            return match.group(1).strip()

    # Method 2: From <h1> (Fallback)
    h1 = soup.find("h1")
    if h1:
        text = h1.get_text(strip=True)
        match = re.match(r"Chapter\s*\d+\s*[:\-]\s*(.+)", text, re.I)
        if match:
            return match.group(1).strip()

    # Fallback
    return "Unknown Title"

# Start the scraping process
for real_chap in range(START_CHAPTER, END_CHAPTER + 1):
    url_chap = real_chap + URL_OFFSET
    filename = f"{OUTPUT_DIR}/chapter-{real_chap}.md"
    
    if os.path.exists(filename):
        print(f"Skipping chapter {real_chap} (already exists)")
        continue

    url = f"{BASE_URL}-{url_chap}"
    print(f"Fetching real chapter {real_chap} -> URL chapter-{url_chap}")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        # Implementing basic retry logic with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                r = requests.get(url, headers=headers, timeout=15)
                r.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
                break # Success
            except requests.exceptions.RequestException as e:
                print(f"Attempt {attempt + 1}/{max_retries} failed: {e}. Retrying in {2**attempt}s...")
                time.sleep(2**attempt)
                if attempt == max_retries - 1:
                    print(f"Failed to fetch {url} after {max_retries} attempts.")
                    raise # Re-raise the exception to be caught below
        
        if r.status_code == 404:
            print(f"Chapter URL {url_chap} not found. Stopping the process.")
            break
        
        soup = BeautifulSoup(r.content, "html.parser")
        
        # Extract correct title using the improved function
        chapter_title = extract_real_title_and_number(soup)
        
        # Get content
        content = clean_content(soup)
        
        if len(content) < 1000:
            print(f"Content too short ({len(content)} chars). Skipping...")
            continue

        # Frontmatter with CORRECT chapter number and title
        frontmatter = f"""---
chapterNumber: {real_chap}
title: "{chapter_title.replace('"', '\\"')}"
publishedAt: "{datetime.now().strftime('%Y-%m-%d')}"
---
"""

        # Write content
        with open(filename, "w", encoding="utf-8") as f:
            f.write(frontmatter + "\n" + content)

        print(f"SAVED chapter-{real_chap}.md -> \"{chapter_title}\" ({len(content)} chars)")

        time.sleep(DELAY)

    except Exception as e:
        print(f"Error on chapter {real_chap}: {e}")

print("All done! Files saved with correct chapter numbers and titles.")