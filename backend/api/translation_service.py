"""
Translation Service for Thai language support.
Called during report generation to translate content.
"""
import logging
import os
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

# Typhoon API Configuration
TYPHOON_API_URL = "https://api.opentyphoon.ai/v1/chat/completions"
TYPHOON_MODEL = "typhoon-v2.1-12b-instruct"

# Title translations mapping
TITLE_EN_TO_TH: Dict[str, str] = {
    "Fundamentals Review": "ทบทวนปัจจัยพื้นฐาน",
    "Market Analysis": "วิเคราะห์ตลาด",
    "Social Sentiment": "วิเคราะห์ความรู้สึกโซเชียล",
    "News Analysis": "วิเคราะห์ข่าว",
    "Bull Case": "มุมมองขาขึ้น",
    "Bear Case": "มุมมองขาลง",
    "Risk: Conservative": "ความเสี่ยง: ระมัดระวัง",
    "Risk: Aggressive": "ความเสี่ยง: เชิงรุก",
    "Risk: Neutral": "ความเสี่ยง: กลาง",
    "Trader Plan": "แผนเทรดเดอร์",
    "Research Team Decision": "การตัดสินใจทีมวิจัย",
    "Portfolio Management Decision": "การตัดสินใจจัดการพอร์ต",
}


def get_thai_title(english_title: str) -> str:
    """Get Thai translation of a report title."""
    return TITLE_EN_TO_TH.get(english_title, english_title)


async def translate_text(text: str, context: str = "financial analysis") -> str:
    """
    Translate a single text from English to Thai using Typhoon API.
    Returns original text if translation fails.
    """
    if not text or not text.strip():
        return text
    
    api_key = os.getenv("TYPHOON_API_KEY")
    if not api_key:
        logger.warning("TYPHOON_API_KEY not configured, skipping translation")
        return text
    
    prompt = f"""You are a professional translator specializing in financial and investment documents.
Translate the following text from English to Thai.
Context: This is a {context} document. Use appropriate terminology.

Important guidelines:
- Maintain the original meaning and tone
- Keep technical terms accurate
- Preserve any formatting like bullet points, numbers, or lists
- For stock/company names, keep them in English
- Translate naturally, not word-by-word

Text to translate:
{text}

Provide ONLY the translated text, no explanations or additional content."""
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                TYPHOON_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                json={
                    "model": TYPHOON_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a professional translator. Translate accurately and naturally."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.3,
                    "top_p": 0.95,
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Typhoon API error: {response.status_code}")
                return text
            
            result = response.json()
            translated_text = result["choices"][0]["message"]["content"].strip()
            return translated_text
            
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return text


async def translate_content(content: Any, context: str = "stock market financial analysis") -> Any:
    """
    Translate content (string, dict, or JSON) to Thai.
    Handles nested structures recursively.
    """
    if content is None:
        return None
    
    if isinstance(content, str):
        # Check if it's a JSON string
        try:
            import json
            if content.strip().startswith('{') or content.strip().startswith('['):
                parsed = json.loads(content)
                translated = await translate_content(parsed, context)
                return translated
        except (json.JSONDecodeError, Exception):
            pass
        
        # Regular string - translate it
        return await translate_text(content, context)
    
    if isinstance(content, dict):
        translated_dict = {}
        for key, value in content.items():
            # Skip certain keys that shouldn't be translated
            if key in ['_dedup_key', 'raw', 'metadata', 'timestamp', 'id']:
                translated_dict[key] = value
            elif isinstance(value, (str, dict, list)):
                translated_dict[key] = await translate_content(value, context)
            else:
                translated_dict[key] = value
        return translated_dict
    
    if isinstance(content, list):
        translated_list = []
        for item in content:
            if isinstance(item, (str, dict, list)):
                translated_list.append(await translate_content(item, context))
            else:
                translated_list.append(item)
        return translated_list
    
    return content


async def translate_reports_batch(reports: list) -> list:
    """
    Translate a batch of report contents to Thai concurrently.
    Returns reports with Thai translations added.
    """
    import asyncio
    
    api_key = os.getenv("TYPHOON_API_KEY")
    if not api_key:
        logger.warning("TYPHOON_API_KEY not configured, skipping Thai translations")
        return reports
    
    logger.info(f"🇹🇭 Translating {len(reports)} reports to Thai (Parallel Processing)...")
    
    # Limit concurrency to avoid hitting API rate limits too hard
    # Adjust this value based on your API tier
    sem = asyncio.Semaphore(10)
    
    async def _process_single_report(report):
        async with sem:
            try:
                title = report.get("title", "")
                content = report.get("content")
                
                # Translate title
                title_th = get_thai_title(title)
                
                # Context for better translation
                context_str = f"stock market financial analysis report - section: {title}"
                
                if isinstance(content, dict):
                    # For dict content, translate the 'text' key if it exists (optimization)
                    if "text" in content and isinstance(content["text"], str):
                        translated_text = await translate_text(content["text"], context_str)
                        content_th = {"text": translated_text}
                        # Preserve other keys if needed, but usually text is main content
                        for k, v in content.items():
                            if k != "text":
                                content_th[k] = v
                    else:
                        content_th = await translate_content(content, context_str)
                elif isinstance(content, str):
                    content_th = await translate_text(content, context_str)
                else:
                    content_th = content
                
                return {
                    **report,
                    "title_th": title_th,
                    "content_th": content_th
                }
                
            except Exception as e:
                logger.error(f"❌ Failed to translate report '{report.get('title', 'unknown')}': {e}")
                # Return original on error
                return {
                    **report,
                    "title_th": report.get("title", ""),
                    "content_th": report.get("content")
                }

    # Create tasks for all reports
    tasks = [_process_single_report(report) for report in reports]
    
    # Execute all tasks concurrently
    translated_reports = await asyncio.gather(*tasks)
    
    logger.info("✅ Thai translations complete!")
    return translated_reports
