"""
Translation API Router using Typhoon API for Thai translation.
"""
import os
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/translate", tags=["Translation"])

# Typhoon API Configuration
TYPHOON_API_URL = "https://api.opentyphoon.ai/v1/chat/completions"
TYPHOON_MODEL = "typhoon-v2.1-12b-instruct"


class TranslationRequest(BaseModel):
    """Request model for translation."""
    text: str
    source_lang: str = "en"
    target_lang: str = "th"
    context: Optional[str] = None  # e.g., "financial analysis", "stock market"


class BatchTranslationRequest(BaseModel):
    """Request model for batch translation."""
    texts: List[str]
    source_lang: str = "en"
    target_lang: str = "th"
    context: Optional[str] = None


class TranslationResponse(BaseModel):
    """Response model for translation."""
    original: str
    translated: str
    source_lang: str
    target_lang: str


class BatchTranslationResponse(BaseModel):
    """Response model for batch translation."""
    translations: List[TranslationResponse]


def get_typhoon_api_key() -> str:
    """Get Typhoon API key from environment."""
    api_key = os.getenv("TYPHOON_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="TYPHOON_API_KEY not configured. Please add it to your .env file."
        )
    return api_key


def build_translation_prompt(text: str, source_lang: str, target_lang: str, context: Optional[str] = None) -> str:
    """Build a translation prompt for Typhoon."""
    lang_names = {
        "en": "English",
        "th": "Thai",
    }
    source_name = lang_names.get(source_lang, source_lang)
    target_name = lang_names.get(target_lang, target_lang)
    
    context_hint = ""
    if context:
        context_hint = f"\nContext: This is a {context} document. Use appropriate terminology."
    
    return f"""You are a professional translator specializing in financial and investment documents.
Translate the following text from {source_name} to {target_name}.
{context_hint}

Important guidelines:
- Maintain the original meaning and tone
- Keep technical terms accurate (you may keep English terms for specific jargon if commonly used in Thai financial context)
- Preserve any formatting like bullet points, numbers, or lists
- For stock/company names, keep them in English
- Translate naturally, not word-by-word

Text to translate:
{text}

Provide ONLY the translated text, no explanations or additional content."""


@router.post("/single", response_model=TranslationResponse)
async def translate_single(request: TranslationRequest):
    """
    Translate a single text using Typhoon API.
    """
    api_key = get_typhoon_api_key()
    
    prompt = build_translation_prompt(
        request.text,
        request.source_lang,
        request.target_lang,
        request.context
    )
    
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
                    "temperature": 0.3,  # Lower temperature for more consistent translation
                    "top_p": 0.95,
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Typhoon API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Translation API error: {response.text}"
                )
            
            result = response.json()
            translated_text = result["choices"][0]["message"]["content"].strip()
            
            return TranslationResponse(
                original=request.text,
                translated=translated_text,
                source_lang=request.source_lang,
                target_lang=request.target_lang
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Translation request timed out")
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("/batch", response_model=BatchTranslationResponse)
async def translate_batch(request: BatchTranslationRequest):
    """
    Translate multiple texts using Typhoon API.
    This is more efficient for translating report sections.
    """
    api_key = get_typhoon_api_key()
    translations = []
    
    # Process each text
    for text in request.texts:
        if not text or not text.strip():
            translations.append(TranslationResponse(
                original=text,
                translated=text,
                source_lang=request.source_lang,
                target_lang=request.target_lang
            ))
            continue
            
        prompt = build_translation_prompt(
            text,
            request.source_lang,
            request.target_lang,
            request.context
        )
        
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
                    # On error, keep original text
                    translations.append(TranslationResponse(
                        original=text,
                        translated=text,  # Keep original on error
                        source_lang=request.source_lang,
                        target_lang=request.target_lang
                    ))
                    continue
                
                result = response.json()
                translated_text = result["choices"][0]["message"]["content"].strip()
                
                translations.append(TranslationResponse(
                    original=text,
                    translated=translated_text,
                    source_lang=request.source_lang,
                    target_lang=request.target_lang
                ))
                
        except Exception as e:
            logger.error(f"Translation error for text: {str(e)}")
            # On error, keep original text
            translations.append(TranslationResponse(
                original=text,
                translated=text,
                source_lang=request.source_lang,
                target_lang=request.target_lang
            ))
    
    return BatchTranslationResponse(translations=translations)


@router.get("/status")
async def translation_status():
    """
    Check if translation service is configured and available.
    """
    try:
        api_key = os.getenv("TYPHOON_API_KEY")
        if not api_key:
            return {
                "status": "not_configured",
                "message": "TYPHOON_API_KEY not set in environment"
            }
        
        return {
            "status": "ready",
            "message": "Translation service is configured",
            "model": TYPHOON_MODEL
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
