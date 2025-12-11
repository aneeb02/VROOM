import os,asyncio,json
from groq import Groq,BadRequestError
from typing import Optional
import logging
from AI_diagnosis.models.request_response import LLMResponse,QuickFix
from AI_diagnosis.prompts.template import build_prompt
from dotenv import load_dotenv

logger = logging.getLogger("llm_service")
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
GROQ_MODEL   = os.getenv("GROQ_MODEL",   "qwen/qwen3-32b")

client = Groq(api_key=GROQ_API_KEY)

REQUEST_TIMEOUT = 20

async def call_groq(catalogue: dict, reddit: str, vehicle: dict, pid: dict) -> Optional[LLMResponse]:
    try:

        prompt = build_prompt(catalogue, reddit, vehicle, pid)
        messages = [
            {"role": "system", "content": prompt["system"]},
            {"role": "user", "content": prompt["user"]}
        ]
        print(f"System prompt: {prompt['system']}")
        print(f"User prompt: {prompt['user']}")

        
        def _do_request():
            return client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.0,
                max_tokens=2048,
                presence_penalty=0.0,
                response_format={"type": "json_object"},
            )

        try:
            resp = await asyncio.wait_for(asyncio.to_thread(_do_request), timeout=REQUEST_TIMEOUT)
        except asyncio.TimeoutError:
            logger.error("Groq API timed out after %s seconds", REQUEST_TIMEOUT)
            return None

        if not resp or not resp.choices or not resp.choices[0].message:
            logger.warning("Empty response from Groq.")
            return None

        content = resp.choices[0].message.content
        try:
            llm= LLMResponse.model_validate_json(content)
            
        except Exception as ve:
            logger.error("Invalid JSON structure: %s", ve)
            return None
        has_catalogue = bool(catalogue.get("has_catalogue", True))
        code = catalogue.get("code")
        desc = catalogue.get("description")

        # Aensure dtc_code is set to the actual code string
        if code:
            llm.dtc_code = code
        else:
            llm.dtc_code = llm.dtc_code or "UNKNOWN"

        # Only force dtc_meaning from catalogue when we *really* have an entry
        if has_catalogue and desc:
            llm.dtc_meaning = desc
        else:
            # No catalogue entry: keep LLM's wording, or fall back to a generic label
            if not llm.dtc_meaning:
                llm.dtc_meaning = f"DTC {code or llm.dtc_code or 'Unknown code'}"

        return llm

    # JSON validation error, attempt fallback
    except BadRequestError as e:
        if "json_validate_failed" in str(e):
            logger.warning("Groq JSON generation failed, retrying in text mode...")
            try:
                fallback = client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=messages,
                    temperature=0.0,
                    max_tokens=2048,
                )
                text = fallback.choices[0].message.content
                cleaned_text = text.strip()
                json_start, json_end = cleaned_text.find("{"), cleaned_text.rfind("}")
                if json_start != -1 and json_end != -1:
                    snippet = text[json_start:json_end + 1]
                    llm = LLMResponse.model_validate_json(snippet)
                    has_catalogue = bool(catalogue.get("has_catalogue", True))
                    code = catalogue.get("code")
                    desc = catalogue.get("description")

                    # Always ensure dtc_code is set to the actual code string
                    if code:
                        llm.dtc_code = code
                    else:
                        llm.dtc_code = llm.dtc_code or "UNKNOWN"

                    # Only force dtc_meaning from catalogue when we *really* have an entry
                    if has_catalogue and desc:
                        llm.dtc_meaning = desc
                    else:
                        # No catalogue entry: keep LLM's wording, or fall back to a generic label
                        if not llm.dtc_meaning:
                            llm.dtc_meaning = f"DTC {code or llm.dtc_code or 'Unknown code'}"

                    return llm
                            
            except Exception as re:
                logger.error("Retry also failed: %s", re)
        else:
            logger.exception("Groq BadRequestError: %s", e)
        return None

    except Exception as e:
        logger.exception("Unexpected error in call_groq: %s", e)
        return None