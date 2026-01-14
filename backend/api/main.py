"""
FastAPI backend for TradingAgents web interface.
Provides WebSocket support for real-time updates.
"""
import asyncio
import json
import os
import datetime
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Database imports
from database.database import AsyncSessionLocal
from database.models import ExecutionHistory, ReportResult
from sqlalchemy import select

try:
    import yfinance as yf
    from tradingagents.graph.trading_graph import TradingAgentsGraph
    from tradingagents.default_config import DEFAULT_CONFIG
    from cli.models import AnalystType
    logger.info("Successfully imported TradingAgents modules and yfinance")
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    raise

# Get the project root directory (parent of api directory)
PROJECT_ROOT = Path(__file__).parent.parent
WEB_DIR = PROJECT_ROOT / "web"

logger.info(f"Project root: {PROJECT_ROOT}")
logger.info(f"Web directory: {WEB_DIR} (exists: {WEB_DIR.exists()})")

# Active WebSocket connections
active_connections: List[WebSocket] = []





class AnalysisRequest(BaseModel):
    """Request model for starting an analysis."""
    ticker: str
    analysis_date: str
    analysts: List[str]  # List of analyst types: ["market", "social", "news", "fundamentals"]
    research_depth: int  # 1, 3, or 5
    llm_provider: str  # "openai", "anthropic", "google", etc.
    backend_url: str or None    
    shallow_thinker: str
    deep_thinker: str
    report_length: Optional[str] = "summary"
    user_id: Optional[int] = 1 # Default for mockup


def extract_content_string(content):
    """Extract string content from various message formats."""
    if isinstance(content, str):
        return content
    elif isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict):
                if item.get('type') == 'text':
                    text_parts.append(item.get('text', ''))
                elif item.get('type') == 'tool_use':
                    text_parts.append(f"[Tool: {item.get('name', 'unknown')}]")
            else:
                text_parts.append(str(item))
        return ' '.join(text_parts)
    else:
        return str(content)


async def send_update(websocket: WebSocket, update_type: str, data: Dict[str, Any]):
    """Send an update to the WebSocket client."""
    try:
        await websocket.send_json({
            "type": update_type,
            "data": data,
            "timestamp": datetime.datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error sending update: {e}")


async def run_analysis_stream(websocket: WebSocket, request: AnalysisRequest):
    """Run the trading analysis and stream updates via WebSocket."""
    try:
        # Create config
        config = DEFAULT_CONFIG.copy()
        config["max_debate_rounds"] = request.research_depth
        config["max_risk_discuss_rounds"] = request.research_depth
        config["quick_think_llm"] = request.shallow_thinker
        config["deep_think_llm"] = request.deep_thinker
        config["backend_url"] = request.backend_url
        config["llm_provider"] = request.llm_provider.lower()

        # Validate analysts list before using
        if request.analysts is None:
            await send_update(websocket, "error", {"message": "Analysts list cannot be None"})
            return
        
        if not isinstance(request.analysts, list) or len(request.analysts) == 0:
            await send_update(websocket, "error", {"message": "Analysts must be a non-empty list"})
            return

        # Initialize the graph
        graph = TradingAgentsGraph(
            request.analysts,
            config=config,
            debug=True
        )

        # Create result directory
        results_base = Path(config.get("results_dir", "./results"))
        if not results_base.is_absolute():
            # Make it relative to project root
            results_base = PROJECT_ROOT / results_base
        results_dir = results_base / request.ticker / request.analysis_date
        results_dir.mkdir(parents=True, exist_ok=True)
        report_dir = results_dir / "reports"
        report_dir.mkdir(parents=True, exist_ok=True)

        # Initialize state
        init_agent_state = graph.propagator.create_initial_state(
            request.ticker, request.analysis_date
        )
        args = graph.propagator.get_graph_args()

        # 📊 1. Create ExecutionHistory record IMMEDIATELY
        execution_id = None
        try:
            logger.info("🔌 Attempting to connect to database...")
            async with AsyncSessionLocal() as db:
                logger.info("✅ Database connection established")
                db_history = ExecutionHistory(
                    ticker=request.ticker,
                    analysis_date=request.analysis_date,
                    status="executing",
                    error_message=None
                )
                db.add(db_history)
                await db.commit()
                await db.refresh(db_history)
                execution_id = db_history.id
                logger.info(f"💾 Created initial history record ID: {execution_id}")
        except Exception as db_init_err:
            logger.error(f"❌ Failed to create initial history record: {db_init_err}")
            import traceback
            traceback.print_exc()
            # Non-fatal for analysis itself, but history won't work
            pass

        # Initialize agent statuses
        agent_status = {
            "Market Analyst": "pending",
            "Social Analyst": "pending",
            "News Analyst": "pending",
            "Fundamentals Analyst": "pending",
            "Bull Researcher": "pending",
            "Bear Researcher": "pending",
            "Research Manager": "pending",
            "Trader": "pending",
            "Risky Analyst": "pending",
            "Neutral Analyst": "pending",
            "Safe Analyst": "pending",
            "Portfolio Manager": "pending",
        }

        # Send initial status
        await send_update(websocket, "status", {
            "message": f"Starting analysis for {request.ticker} on {request.analysis_date}",
            "agents": agent_status
        })

        # Track report sections
        report_sections = {
            "market_report": None,
            "sentiment_report": None,
            "news_report": None,
            "fundamentals_report": None,
            "investment_plan": None,
            "trader_investment_plan": None,
            "final_trade_decision": None,
        }

        # Stream the analysis
        trace = []
        buffered_reports = []  # Buffer for reports

        async for chunk in graph.graph.astream(init_agent_state, **args):
            if len(chunk.get("messages", [])) > 0:
                # Get the last message from the chunk
                last_message = chunk["messages"][-1]

                # Extract message content
                if hasattr(last_message, "content"):
                    content = extract_content_string(last_message.content)
                    msg_type = "Reasoning"
                else:
                    content = str(last_message)
                    msg_type = "System"

                # Send message update
                await send_update(websocket, "message", {
                    "type": msg_type,
                    "content": content
                })

                # Handle tool calls
                if hasattr(last_message, "tool_calls"):
                    for tool_call in last_message.tool_calls:
                        if isinstance(tool_call, dict):
                            tool_name = tool_call.get("name", "unknown")
                            tool_args = tool_call.get("args", {})
                        else:
                            tool_name = tool_call.name
                            tool_args = tool_call.args

                        await send_update(websocket, "tool_call", {
                            "name": tool_name,
                            "args": tool_args
                        })

                # Update agent statuses and reports based on chunk content
                # Analyst Team Reports
                if "market_report" in chunk and chunk["market_report"]:
                    report_sections["market_report"] = chunk["market_report"]
                    agent_status["Market Analyst"] = "completed"
                    # Save report
                    with open(report_dir / "market_report.md", "w", encoding="utf-8") as f:
                        f.write(chunk["market_report"])
                    
                    # Buffer report instead of sending
                    buffered_reports.append({
                        "section": "market_report",
                        "label": "Market Analysis",
                        "content": chunk["market_report"]
                    })
                    
                    if request.analysts and "social" in request.analysts:
                        agent_status["Social Analyst"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                if "sentiment_report" in chunk and chunk["sentiment_report"]:
                    report_sections["sentiment_report"] = chunk["sentiment_report"]
                    agent_status["Social Analyst"] = "completed"
                    # Save report
                    with open(report_dir / "sentiment_report.md", "w", encoding="utf-8") as f:
                        f.write(chunk["sentiment_report"])
                    
                    buffered_reports.append({
                        "section": "sentiment_report",
                        "label": "Social Sentiment",
                        "content": chunk["sentiment_report"]
                    })
                    
                    if request.analysts and "news" in request.analysts:
                        agent_status["News Analyst"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                if "news_report" in chunk and chunk["news_report"]:
                    report_sections["news_report"] = chunk["news_report"]
                    agent_status["News Analyst"] = "completed"
                    # Save report
                    with open(report_dir / "news_report.md", "w", encoding="utf-8") as f:
                        f.write(chunk["news_report"])
                    
                    buffered_reports.append({
                        "section": "news_report",
                        "label": "News Analysis",
                        "content": chunk["news_report"]
                    })
                    
                    if request.analysts and "fundamentals" in request.analysts:
                        agent_status["Fundamentals Analyst"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                if "fundamentals_report" in chunk and chunk["fundamentals_report"]:
                    report_sections["fundamentals_report"] = chunk["fundamentals_report"]
                    agent_status["Fundamentals Analyst"] = "completed"
                    # Save report
                    with open(report_dir / "fundamentals_report.md", "w", encoding="utf-8") as f:
                        f.write(chunk["fundamentals_report"])
                    
                    buffered_reports.append({
                        "section": "fundamentals_report",
                        "label": "Fundamentals Review",
                        "content": chunk["fundamentals_report"]
                    })
                    
                    # Start research team
                    agent_status["Bull Researcher"] = "in_progress"
                    agent_status["Bear Researcher"] = "in_progress"
                    agent_status["Research Manager"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                # Research Team - Handle Investment Debate State
                if "investment_debate_state" in chunk and chunk["investment_debate_state"] is not None:
                    debate_state = chunk["investment_debate_state"]
                    
                    # Safety check: ensure debate_state is a dict
                    if not isinstance(debate_state, dict):
                        debate_state = {}

                    # Update Bull Researcher status and report
                    if debate_state and "bull_history" in debate_state and debate_state.get("bull_history"):
                        agent_status["Bull Researcher"] = "in_progress"
                        agent_status["Bear Researcher"] = "in_progress"
                        agent_status["Research Manager"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        
                        # Extract latest bull response
                        bull_responses = debate_state["bull_history"].split("\n")
                        latest_bull = bull_responses[-1] if bull_responses else ""
                        if latest_bull:
                            await send_update(websocket, "message", {
                                "type": "Reasoning",
                                "content": latest_bull
                            })
                            
                            # Update research report with bull's latest analysis
                            current_plan = report_sections.get("investment_plan") or ""
                            if "Bull Researcher Analysis" not in current_plan:
                                report_sections["investment_plan"] = f"### Bull Researcher Analysis\n{latest_bull}"
                            else:
                                # Update existing bull section
                                parts = current_plan.split("### Bear Researcher Analysis")
                                report_sections["investment_plan"] = f"{parts[0].split('### Bull Researcher Analysis')[0]}### Bull Researcher Analysis\n{latest_bull}" + (f"\n\n### Bear Researcher Analysis{parts[1]}" if len(parts) > 1 else "")
                            
                            # We don't buffer intermediate partial updates for investment plan, 
                            # we wait for the final decision or just update internally.
                            # BUT the frontend might expect updates to see "what's happening".
                            # However, "Report" sections usually are static text. 
                            # Let's buffer the LATEST version of investment plan only when it's final?
                            # The original code sent 'report' updates here.
                            # If we want "show only when finished", we should probably suppress these interim report updates
                            # and only send the final consolidated one.

                    # Update Bear Researcher status and report
                    if debate_state and "bear_history" in debate_state and debate_state.get("bear_history"):
                        agent_status["Bull Researcher"] = "in_progress"
                        agent_status["Bear Researcher"] = "in_progress"
                        agent_status["Research Manager"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        
                        # Extract latest bear response
                        bear_responses = debate_state["bear_history"].split("\n")
                        latest_bear = bear_responses[-1] if bear_responses else ""
                        if latest_bear:
                            await send_update(websocket, "message", {
                                "type": "Reasoning",
                                "content": latest_bear
                            })
                            
                            # Update research report with bear's latest analysis
                            current_plan = report_sections.get("investment_plan") or ""
                            if "Bear Researcher Analysis" not in current_plan:
                                report_sections["investment_plan"] = f"{current_plan}\n\n### Bear Researcher Analysis\n{latest_bear}"
                            else:
                                # Update existing bear section
                                parts = current_plan.split("### Bear Researcher Analysis")
                                report_sections["investment_plan"] = parts[0] + f"\n\n### Bear Researcher Analysis\n{latest_bear}"
                            
                            # Suppress interim report update

                    # Update Research Manager status and final decision
                    if debate_state and "judge_decision" in debate_state and debate_state.get("judge_decision"):
                        agent_status["Bull Researcher"] = "completed"
                        agent_status["Bear Researcher"] = "completed"
                        agent_status["Research Manager"] = "completed"
                        
                        # Append judge decision to investment plan
                        current_plan = report_sections.get("investment_plan") or ""
                        report_sections["investment_plan"] = f"{current_plan}\n\n### Research Manager Decision\n{debate_state['judge_decision']}"
                        
                        # Save report
                        with open(report_dir / "investment_plan.md", "w", encoding="utf-8") as f:
                            f.write(report_sections["investment_plan"])
                        
                        buffered_reports.append({
                            "section": "investment_plan",
                            "label": "Research Team Decision",
                            "content": report_sections["investment_plan"]
                        })
                        
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Research Manager: {debate_state['judge_decision']}"
                        })
                        
                        agent_status["Trader"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})

                # Trading Team
                if "trader_investment_plan" in chunk and chunk["trader_investment_plan"]:
                    report_sections["trader_investment_plan"] = chunk["trader_investment_plan"]
                    agent_status["Trader"] = "completed"
                    # Save report
                    with open(report_dir / "trader_investment_plan.md", "w", encoding="utf-8") as f:
                        f.write(chunk["trader_investment_plan"])
                    
                    buffered_reports.append({
                        "section": "trader_investment_plan",
                        "label": "Trader Investment Plan",
                        "content": chunk["trader_investment_plan"]
                    })
                    
                    agent_status["Risky Analyst"] = "in_progress"
                    await send_update(websocket, "status", {"agents": agent_status})

                # Risk Management Team
                if "risk_debate_state" in chunk and chunk["risk_debate_state"] is not None:
                    risk_state = chunk["risk_debate_state"]
                    
                    # Safety check: ensure risk_state is a dict
                    if not isinstance(risk_state, dict):
                        risk_state = {}

                    if risk_state and "current_risky_response" in risk_state and risk_state.get("current_risky_response"):
                        agent_status["Risky Analyst"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Risky Analyst: {risk_state['current_risky_response']}"
                        })

                    if risk_state and "current_safe_response" in risk_state and risk_state.get("current_safe_response"):
                        agent_status["Safe Analyst"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Safe Analyst: {risk_state['current_safe_response']}"
                        })

                    if risk_state and "current_neutral_response" in risk_state and risk_state.get("current_neutral_response"):
                        agent_status["Neutral Analyst"] = "in_progress"
                        await send_update(websocket, "status", {"agents": agent_status})
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Neutral Analyst: {risk_state['current_neutral_response']}"
                        })

                    if risk_state and "judge_decision" in risk_state and risk_state.get("judge_decision"):
                        agent_status["Risky Analyst"] = "completed"
                        agent_status["Safe Analyst"] = "completed"
                        agent_status["Neutral Analyst"] = "completed"
                        agent_status["Portfolio Manager"] = "completed"
                        
                        # Build final decision report with all risk analysis
                        current_decision = report_sections.get("final_trade_decision") or ""
                        if "Portfolio Manager Decision" not in current_decision:
                            report_sections["final_trade_decision"] = f"{current_decision}\n\n### Portfolio Manager Decision\n{risk_state['judge_decision']}"
                        else:
                            # Update existing decision
                            parts = current_decision.split("### Portfolio Manager Decision")
                            report_sections["final_trade_decision"] = parts[0] + f"\n\n### Portfolio Manager Decision\n{risk_state['judge_decision']}"
                        
                        # Save report
                        with open(report_dir / "final_trade_decision.md", "w", encoding="utf-8") as f:
                            f.write(report_sections["final_trade_decision"])
                        
                        buffered_reports.append({
                            "section": "final_trade_decision",
                            "label": "Portfolio Management Decision",
                            "content": report_sections["final_trade_decision"]
                        })
                        
                        await send_update(websocket, "message", {
                            "type": "Reasoning",
                            "content": f"Portfolio Manager: {risk_state['judge_decision']}"
                        })
                        
                        await send_update(websocket, "status", {"agents": agent_status})

            trace.append(chunk)

        # Send all buffered reports now
        for report in buffered_reports:
            await send_update(websocket, "report", report)
            await asyncio.sleep(0.05)

        # Get final state by merging all trace chunks (each chunk only contains incremental changes)
        final_state_graph = {}
        for chunk in trace:
            if isinstance(chunk, dict):
                final_state_graph.update(chunk)
        
        # Also include the accumulated report_sections which were collected during streaming
        final_state_graph.update(report_sections)
        
        logger.info(f"📊 Final state keys: {list(final_state_graph.keys())}")

        # --- Summarization & Output Logic (Replicating propagate) ---
        try:
            # Import agents here to avoid potential top-level circular dependencies
            from tradingagents.agents import (
                create_summarizer_fundamental,
                create_summarizer_market,
                create_summarizer_social,
                create_summarizer_news,
                create_summarizer_conservative,
                create_summarizer_aggressive,
                create_summarizer_neutral,
                create_summarizer_research_manager,
                create_summarizer_risk_manager,
                create_summarizer_bull_researcher,
                create_summarizer_bear_researcher,
                create_summarizer_trader
            )

            # Create summarizers
            summarizers = {
                "Summarize_fundamentals_report": create_summarizer_fundamental(),
                "Summarize_market_report": create_summarizer_market(),
                "Summarize_social_report": create_summarizer_social(),
                "Summarize_news_report": create_summarizer_news(),
                "Summarize_conservative_report": create_summarizer_conservative(),
                "Summarize_aggressive_report": create_summarizer_aggressive(),
                "Summarize_neutral_report": create_summarizer_neutral(),
                "Summarize_investment_plan_report": create_summarizer_research_manager(),
                "Summarize_final_trade_decision_report": create_summarizer_risk_manager(),
                "bull_researcher_summarizer": create_summarizer_bull_researcher(),
                "bear_researcher_summarizer": create_summarizer_bear_researcher(),
                "trader_summarizer": create_summarizer_trader()
            }

            # Prepare directories
            output_dir = PROJECT_ROOT / "output"
            sum_dir = output_dir / "sum"
            full_dir = output_dir / "full"
            sum_dir.mkdir(parents=True, exist_ok=True)
            full_dir.mkdir(parents=True, exist_ok=True)

            # ============================================================
            # PARALLEL PROCESSING: Summarization + Full Report Translation
            # ============================================================
            # 1. Start translating FULL reports immediately (background)
            # 2. Run summarizers in parallel
            # 3. When summarizers complete, translate summaries in parallel
            # ============================================================
            
            from api.translation_service import translate_text, get_thai_title
            
            logger.info("🚀 Starting PARALLEL processing: Summarization + Full Translation...")
            
            # Prepare full reports for translation (from final_state_graph)
            full_report_keys = [
                ("fundamentals_report", "Fundamentals Review"),
                ("market_report", "Market Analysis"),
                ("sentiment_report", "Social Sentiment"),
                ("news_report", "News Analysis"),
                ("investment_debate_state", "Bull/Bear Debate"),
                ("trader_investment_plan", "Trader Plan"),
                ("risk_debate_state", "Risk Debate"),
                ("investment_plan", "Research Team Decision"),
                ("final_trade_decision", "Portfolio Management Decision"),
            ]
            
            # Storage for translated content
            full_translations = {}  # key -> {title_th, content_th}
            summary_translations = {}  # key -> {title_th, content_th}
            
            async def translate_single_report(key: str, title: str, content, report_type: str):
                """Translate a single report while preserving JSON structure - uses batch processing for speed"""
                try:
                    if content is None:
                        return (key, report_type, None)
                    
                    # Get Thai title
                    title_th = get_thai_title(title)
                    
                    # For string content, translate directly
                    if isinstance(content, str):
                        content_th = await translate_text(content, f"stock analysis - {title}")
                        logger.info(f"✅ Translated {report_type}: {title}")
                        return (key, report_type, {"title": title, "title_th": title_th, "content_th": content_th})
                    
                    # For complex structures (dict/list), collect all strings and translate in batch
                    strings_to_translate = []
                    string_paths = []  # Track path to each string for reconstruction
                    


                    # Pre-process content: Recursively parse any strings that look like JSON
                    def deep_parse_json_strings(obj):
                        if isinstance(obj, str):
                            stripped = obj.strip()
                            
                            # Handle markdown code blocks first (aggressive regex)
                            import re
                            if "```" in stripped:
                                match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', stripped, re.DOTALL)
                                if match:
                                    stripped = match.group(1).strip()
                            
                            # Check if it looks like a JSON object/array
                            # Improved: Try to find JSON structure even if surrounded by text (e.g. headers)
                            json_match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', stripped)
                            if json_match:
                                candidate = json_match.group(1).strip()
                                try:
                                    # 1. Try simple parse of candidate
                                    parsed = json.loads(candidate)
                                    return deep_parse_json_strings(parsed)
                                except (json.JSONDecodeError, TypeError):
                                    pass
                                    
                            if (stripped.startswith('{') and stripped.endswith('}')) or \
                               (stripped.startswith('[') and stripped.endswith(']')):
                                try:
                                    # 1. Try simple parse
                                    parsed = json.loads(stripped)
                                    return deep_parse_json_strings(parsed)
                                except (json.JSONDecodeError, TypeError):
                                    # 2. Try unescaping if simple parse failed
                                    # This handles cases where the LLM output escaped quotes/newlines like: {\n \"key\": \"val\"}
                                    if '\\"' in stripped or '\\n' in stripped:
                                        try:
                                            # Attempt to fix common escape sequences for structure
                                            # CAUTION: This is a heuristic. It assumes the outer structure quotes are escaped.
                                            # Be careful not to break valid inner json strings.
                                            # Safe bet: python's unicode_escape might help, or simple replacement for structure keys.
                                            
                                            # Heuristic: Replace \" with " and \n with real newline, but only if json.loads fails otherwise
                                            unescaped = stripped.replace('\\"', '"').replace('\\n', '\n')
                                            parsed = json.loads(unescaped)
                                            return deep_parse_json_strings(parsed)
                                        except:
                                            pass
                                    pass
                                    
                            return stripped # Return the cleaned string even if not parsed as object
                        
                        elif isinstance(obj, dict):
                            return {k: deep_parse_json_strings(v) for k, v in obj.items()}
                        elif isinstance(obj, list):
                            return [deep_parse_json_strings(item) for item in obj]
                        else:
                            return obj

                    # Apply deep parsing to raw content first
                    content = deep_parse_json_strings(content)

                    def collect_strings(obj, path=""):
                        """Collect all strings and their paths from nested structure"""
                        if isinstance(obj, str):
                            if len(obj.strip()) > 0:
                                strings_to_translate.append(obj)
                                string_paths.append(path)
                        elif isinstance(obj, dict):
                            for k, v in obj.items():
                                collect_strings(v, f"{path}.{k}" if path else k)
                        elif isinstance(obj, list):
                            for i, item in enumerate(obj):
                                collect_strings(item, f"{path}[{i}]")
                    
                    collect_strings(content)
                    
                    # Translate all strings in parallel (batch)
                    # Translate all strings in parallel (batch)
                    if strings_to_translate:
                        translation_tasks = [
                            translate_text(s, f"stock analysis - {title}")
                            for s in strings_to_translate
                        ]
                        
                        # 1. Initial Attempt
                        results = await asyncio.gather(*translation_tasks, return_exceptions=True)
                        translated_strings = list(results) # Convert to mutable list

                        # 2. Check for failures
                        retry_indices = [i for i, res in enumerate(translated_strings) if isinstance(res, Exception)]
                        
                        # 3. Retry loop (Sequential to be kind to rate limits)
                        if retry_indices:
                            logger.warning(f"⚠️ {len(retry_indices)} translations failed initially in {title}. Retrying...")
                            await asyncio.sleep(2) # Cooldown
                            
                            for i in retry_indices:
                                try:
                                    # Retry individual string
                                    translated_strings[i] = await translate_text(strings_to_translate[i], f"stock analysis - {title}")
                                except Exception as e:
                                    logger.error(f"❌ Retry failed for part of {title}: {e}")
                                    # Still an exception, will fallback below

                        # Build translation map
                        translation_map = {}
                        failed_translations = []
                        for i, (orig, trans) in enumerate(zip(strings_to_translate, translated_strings)):
                            if isinstance(trans, Exception):
                                translation_map[string_paths[i]] = orig  # Keep original on error
                                failed_translations.append(string_paths[i])
                            else:
                                translation_map[string_paths[i]] = trans
                        
                        # Log failed translations
                        if failed_translations:
                            logger.error(f"❌ Final Failure: {len(failed_translations)} strings failed to translate in {title}")
                    else:
                        translation_map = {}
                    
                    def reconstruct(obj, path=""):
                        """Reconstruct structure with translated strings"""
                        if isinstance(obj, str):
                            full_path = path
                            return translation_map.get(full_path, obj)
                        elif isinstance(obj, dict):
                            return {k: reconstruct(v, f"{path}.{k}" if path else k) for k, v in obj.items()}
                        elif isinstance(obj, list):
                            return [reconstruct(item, f"{path}[{i}]") for i, item in enumerate(obj)]
                        else:
                            return obj
                    
                    content_th = reconstruct(content)
                    
                    logger.info(f"✅ Translated {report_type}: {title} ({len(strings_to_translate)} strings)")
                    return (key, report_type, {"title": title, "title_th": title_th, "content_th": content_th})
                    
                except Exception as e:
                    logger.error(f"❌ Translation failed for {title}: {e}")
                    return (key, report_type, None)
            
            async def run_single_summarizer(key: str, summarizer_func):
                """Run a single summarizer and return (key, result)"""
                try:
                    update_dict = await summarizer_func(final_state_graph)
                    if update_dict:
                        logger.info(f"✅ Summarizer {key} completed")
                        return (key, update_dict)
                    else:
                        logger.warning(f"⚠️ Summarizer {key} returned empty")
                        return (key, None)
                except Exception as e:
                    logger.error(f"❌ Summarizer {key} error: {e}")
                    return (key, None)
            
            # --- PHASE 1: Run Full Translation + Summarization in PARALLEL ---
            logger.info("📝 PHASE 1: Full Translation + Summarization (parallel)...")
            
            # Create full translation tasks
            full_translation_tasks = []
            for key, title in full_report_keys:
                content = final_state_graph.get(key)
                if content:
                    full_translation_tasks.append(
                        translate_single_report(key, title, content, "full")
                    )
            
            # Create summarizer tasks
            summarizer_tasks = [
                run_single_summarizer(key, func) 
                for key, func in summarizers.items()
            ]
            
            # Run ALL tasks in parallel (translations + summarizers)
            all_phase1_tasks = full_translation_tasks + summarizer_tasks
            phase1_results = await asyncio.gather(*all_phase1_tasks, return_exceptions=True)
            
            # Process results
            for result in phase1_results:
                if isinstance(result, Exception):
                    logger.error(f"❌ Task failed: {result}")
                    continue
                    
                if result is None:
                    continue
                    
                # Check if it's a translation result (3 items) or summarizer result (2 items)
                if len(result) == 3:
                    # Translation result: (key, report_type, data)
                    key, report_type, data = result
                    if data:
                        full_translations[key] = data
                elif len(result) == 2:
                    # Summarizer result: (key, update_dict)
                    key, update_dict = result
                    if update_dict:
                        final_state_graph.update(update_dict)
            
            logger.info(f"✅ PHASE 1 complete: {len(full_translations)} full translations, summarizers updated")
            
            # --- PHASE 2: Translate Summaries in PARALLEL ---
            logger.info("📝 PHASE 2: Summary Translation (parallel)...")
            
            summary_keys = [
                ("Summarize_fundamentals_report", "Fundamentals Review"),
                ("Summarize_market_report", "Market Analysis"),
                ("Summarize_social_report", "Social Sentiment"),
                ("Summarize_news_report", "News Analysis"),
                ("bull_researcher_summarizer", "Bull Case"),
                ("bear_researcher_summarizer", "Bear Case"),
                ("Summarize_conservative_report", "Risk: Conservative"),
                ("Summarize_aggressive_report", "Risk: Aggressive"),
                ("Summarize_neutral_report", "Risk: Neutral"),
                ("trader_summarizer", "Trader Plan"),
                ("Summarize_investment_plan_report", "Research Team Decision"),
                ("Summarize_final_trade_decision_report", "Portfolio Management Decision"),
            ]
            
            summary_translation_tasks = []
            for key, title in summary_keys:
                content = final_state_graph.get(key)
                if content:
                    logger.info(f"📝 Summary key '{key}' has content, will translate")
                    summary_translation_tasks.append(
                        translate_single_report(key, title, content, "summary")
                    )
                else:
                    logger.warning(f"⚠️ Summary key '{key}' is MISSING content, skipping translation")
            
            # Run all summary translations in parallel
            if summary_translation_tasks:
                phase2_results = await asyncio.gather(*summary_translation_tasks, return_exceptions=True)
                
                for result in phase2_results:
                    if isinstance(result, Exception):
                        logger.error(f"❌ Summary translation failed: {result}")
                        continue
                    if result and len(result) == 3:
                        key, report_type, data = result
                        if data:
                            summary_translations[key] = data
            
            logger.info(f"✅ PHASE 2 complete: {len(summary_translations)} summary translations")
            logger.info(f"📋 Summary translations keys: {list(summary_translations.keys())}")
            logger.info(f"🎉 All parallel processing complete!")

            # Define file mappings (Key in State -> (Sum Filename, Full Filename, Full Key in State))
            file_mappings = [
                ("Summarize_fundamentals_report", "sum_funda.txt", "full_funda.json", "fundamentals_report"),
                ("Summarize_market_report", "sum_market.txt", "full_market.json", "market_report"),
                ("Summarize_social_report", "sum_social.txt", "full_social.json", "sentiment_report"),
                ("Summarize_news_report", "sum_news.txt", "full_news.json", "news_report"),
                ("bull_researcher_summarizer", "sum_bull.txt", "full_bull.json", "investment_debate_state"),
                ("bear_researcher_summarizer", "sum_bear.txt", "full_bear.json", "investment_debate_state"),
                ("Summarize_conservative_report", "sum_conservative.txt", "full_conservative.json", "risk_debate_state"),
                ("Summarize_aggressive_report", "sum_aggressive.txt", "full_aggressive.json", "risk_debate_state"),
                ("Summarize_neutral_report", "sum_neutral.txt", "full_neutral.json", "risk_debate_state"),
                ("trader_summarizer", "sum_trader.txt", "full_trader.json", "trader_investment_plan"),
                ("Summarize_investment_plan_report", "sum_investment_plan.txt", "investment_plan.txt", "investment_plan"),
                ("Summarize_final_trade_decision_report", "sum_final_decision.txt", "final_decision.json", "final_trade_decision"),
            ]

            for sum_key, sum_file, full_file, full_key in file_mappings:
                # Write Summary (English)
                sum_content = final_state_graph.get(sum_key)
                if sum_content:
                    with open(sum_dir / sum_file, 'w', encoding='utf-8') as f:
                        f.write(str(sum_content))
                
                # Write Summary (Thai) - _th version
                if sum_key in summary_translations and summary_translations[sum_key].get("content_th"):
                    th_content = summary_translations[sum_key]["content_th"]
                    # Generate Thai filename: sum_funda.txt -> sum_funda_th.txt
                    name_parts = sum_file.rsplit('.', 1)
                    th_sum_file = f"{name_parts[0]}_th.{name_parts[1]}" if len(name_parts) == 2 else f"{sum_file}_th"
                    
                    with open(sum_dir / th_sum_file, 'w', encoding='utf-8') as f:
                        if isinstance(th_content, (dict, list)):
                            json.dump(th_content, f, ensure_ascii=False, indent=4)
                        else:
                            f.write(str(th_content))
                
                # Write Full (English)
                full_content = final_state_graph.get(full_key)
                if full_content:
                    with open(full_dir / full_file, 'w', encoding='utf-8') as f:
                        # If the content is a dict or list, dump as JSON. If string, write as is (or check ext)
                        if full_file.endswith(".json") and not isinstance(full_content, str):
                             json.dump(full_content, f, ensure_ascii=False, indent=4)
                        elif full_file.endswith(".json") and isinstance(full_content, str):
                            # Try to pretty print json string if possible
                            try:
                                json_obj = json.loads(full_content)
                                json.dump(json_obj, f, ensure_ascii=False, indent=4)
                            except:
                                f.write(full_content)
                        else:
                             f.write(str(full_content))
                
                # Write Full (Thai) - _th version
                if full_key in full_translations and full_translations[full_key].get("content_th"):
                    th_content = full_translations[full_key]["content_th"]
                    # Generate Thai filename: full_bear.json -> full_bear_th.json
                    name_parts = full_file.rsplit('.', 1)
                    th_full_file = f"{name_parts[0]}_th.{name_parts[1]}" if len(name_parts) == 2 else f"{full_file}_th"
                    
                    with open(full_dir / th_full_file, 'w', encoding='utf-8') as f:
                        if th_full_file.endswith(".json"):
                            if isinstance(th_content, (dict, list)):
                                json.dump(th_content, f, ensure_ascii=False, indent=4)
                            elif isinstance(th_content, str):
                                try:
                                    json_obj = json.loads(th_content)
                                    json.dump(json_obj, f, ensure_ascii=False, indent=4)
                                except:
                                    f.write(th_content)
                            else:
                                f.write(str(th_content))
                        else:
                            f.write(str(th_content))

            logger.info("✅ Summaries generated and saved directly to backend/output (EN + TH)")
            
            # Send Thai translations via WebSocket for real-time frontend display
            # This includes both full and summary translations
            logger.info("📡 Sending Thai translations via WebSocket...")
            
            # Send full translations
            for full_key, trans_data in full_translations.items():
                if trans_data and trans_data.get("content_th"):
                    await send_update(websocket, "thai_report", {
                        "section": full_key,
                        "report_type": "full",
                        "label": trans_data.get("title_th", trans_data.get("title", full_key)),
                        "content": trans_data["content_th"]
                    })
                    await asyncio.sleep(0.02)
            
            # Send summary translations
            for sum_key, trans_data in summary_translations.items():
                if trans_data and trans_data.get("content_th"):
                    await send_update(websocket, "thai_report", {
                        "section": sum_key,
                        "report_type": "summary",
                        "label": trans_data.get("title_th", trans_data.get("title", sum_key)),
                        "content": trans_data["content_th"]
                    })
                    await asyncio.sleep(0.02)
            
            logger.info(f"📡 Sent {len(full_translations)} full + {len(summary_translations)} summary Thai reports")

            # ==========================================================
            # 💾 Database Completion Block - Read from output files
            # ==========================================================
            logger.info(f"🔍 Checking execution_id: {execution_id}")
            if execution_id:
                try:
                    logger.info(f"💾 Updating execution {execution_id} to success and saving reports from files...")
                    
                    # Import translation service
                    from api.translation_service import get_thai_title
                    
                    async with AsyncSessionLocal() as db:
                        # Get the record
                        stmt = select(ExecutionHistory).where(ExecutionHistory.id == execution_id)
                        res = await db.execute(stmt)
                        db_history = res.scalar_one_or_none()
                        
                        if db_history:
                            db_history.status = "success"
                            
                            # Log the paths we're looking at
                            logger.info(f"📂 sum_dir path: {sum_dir}")
                            logger.info(f"📂 full_dir path: {full_dir}")
                            logger.info(f"📂 sum_dir exists: {sum_dir.exists()}")
                            logger.info(f"📂 full_dir exists: {full_dir.exists()}")
                            
                            # List files in directories
                            if sum_dir.exists():
                                sum_files_list = list(sum_dir.iterdir())
                                logger.info(f"📄 Files in sum_dir: {[f.name for f in sum_files_list]}")
                            if full_dir.exists():
                                full_files_list = list(full_dir.iterdir())
                                logger.info(f"📄 Files in full_dir: {[f.name for f in full_files_list]}")
                            
                            # Collect reports for translation
                            reports_data = []
                            
                            # File mapping: (filename, report_type, title)
                            sum_files = [
                                ("sum_funda.txt", "sum_report", "Fundamentals Review"),
                                ("sum_market.txt", "sum_report", "Market Analysis"),
                                ("sum_social.txt", "sum_report", "Social Sentiment"),
                                ("sum_news.txt", "sum_report", "News Analysis"),
                                ("sum_bull.txt", "sum_report", "Bull Case"),
                                ("sum_bear.txt", "sum_report", "Bear Case"),
                                ("sum_conservative.txt", "sum_report", "Risk: Conservative"),
                                ("sum_aggressive.txt", "sum_report", "Risk: Aggressive"),
                                ("sum_neutral.txt", "sum_report", "Risk: Neutral"),
                                ("sum_trader.txt", "sum_report", "Trader Plan"),
                                ("sum_investment_plan.txt", "sum_report", "Research Team Decision"),
                                ("sum_final_decision.txt", "sum_report", "Portfolio Management Decision"),
                            ]
                            
                            full_files = [
                                ("full_funda.json", "full_report", "Fundamentals Review"),
                                ("full_market.json", "full_report", "Market Analysis"),
                                ("full_social.json", "full_report", "Social Sentiment"),
                                ("full_news.json", "full_report", "News Analysis"),
                                ("full_bull.json", "full_report", "Bull Case"),
                                ("full_bear.json", "full_report", "Bear Case"),
                                ("full_conservative.json", "full_report", "Risk: Conservative"),
                                ("full_aggressive.json", "full_report", "Risk: Aggressive"),
                                ("full_neutral.json", "full_report", "Risk: Neutral"),
                                ("full_trader.json", "full_report", "Trader Plan"),
                                ("investment_plan.txt", "full_report", "Research Team Decision"),
                                ("final_decision.json", "full_report", "Portfolio Management Decision"),
                            ]
                            
                            # Read summary reports
                            for filename, report_type, title in sum_files:
                                filepath = sum_dir / filename
                                if filepath.exists():
                                    try:
                                        with open(filepath, 'r', encoding='utf-8') as f:
                                            content = f.read()
                                        if content.strip():
                                            reports_data.append({
                                                "execution_id": execution_id,
                                                "report_type": report_type,
                                                "title": title,
                                                "content": {"text": content}
                                            })
                                            logger.info(f"📄 Collected sum: {title}")
                                    except Exception as read_err:
                                        logger.warning(f"⚠️ Failed to read {filename}: {read_err}")
                            
                            # Read full reports
                            for filename, report_type, title in full_files:
                                filepath = full_dir / filename
                                if filepath.exists():
                                    try:
                                        with open(filepath, 'r', encoding='utf-8') as f:
                                            raw_content = f.read()
                                        
                                        if raw_content.strip():
                                            if filename.endswith('.json'):
                                                try:
                                                    content = json.loads(raw_content)
                                                except json.JSONDecodeError:
                                                    content = {"text": raw_content}
                                            else:
                                                content = {"text": raw_content}
                                            
                                            reports_data.append({
                                                "execution_id": execution_id,
                                                "report_type": report_type,
                                                "title": title,
                                                "content": content
                                            })
                                            logger.info(f"📄 Collected full: {title}")
                                    except Exception as read_err:
                                        logger.warning(f"⚠️ Failed to read {filename}: {read_err}")
                            
                            # Use PRE-TRANSLATED content from parallel processing
                            # No need to call translate_reports_batch again!
                            logger.info(f"🇹🇭 Using pre-translated content: {len(full_translations)} full, {len(summary_translations)} summary")
                            
                            # Map titles to translation keys
                            title_to_full_key = {
                                "Fundamentals Review": "fundamentals_report",
                                "Market Analysis": "market_report",
                                "Social Sentiment": "sentiment_report",
                                "News Analysis": "news_report",
                                "Research Team Decision": "investment_debate_state",
                                "Trader Plan": "trader_investment_plan",
                                "Portfolio Management Decision": "risk_debate_state",
                                "Bull Case": "investment_debate_state",
                                "Bear Case": "investment_debate_state",
                                "Risk: Conservative": "risk_debate_state",
                                "Risk: Aggressive": "risk_debate_state",
                                "Risk: Neutral": "risk_debate_state",
                            }
                            
                            title_to_sum_key = {
                                "Fundamentals Review": "Summarize_fundamentals_report",
                                "Market Analysis": "Summarize_market_report",
                                "Social Sentiment": "Summarize_social_report",
                                "News Analysis": "Summarize_news_report",
                                "Bull Case": "bull_researcher_summarizer",
                                "Bear Case": "bear_researcher_summarizer",
                                "Risk: Conservative": "Summarize_conservative_report",
                                "Risk: Aggressive": "Summarize_aggressive_report",
                                "Risk: Neutral": "Summarize_neutral_report",
                                "Trader Plan": "trader_summarizer",
                                "Research Team Decision": "Summarize_investment_plan_report",
                                "Portfolio Management Decision": "Summarize_final_trade_decision_report",
                            }
                            
                            # Create ReportResult objects with Thai translations from pre-processed data
                            reports_to_add = []
                            for report in reports_data:
                                title = report["title"]
                                report_type = report["report_type"]
                                
                                # Get pre-translated content
                                title_th = get_thai_title(title)
                                content_th = None
                                
                                if report_type == "full_report":
                                    # Look up in full_translations
                                    full_key = title_to_full_key.get(title)
                                    if full_key and full_key in full_translations:
                                        trans_data = full_translations[full_key]
                                        title_th = trans_data.get("title_th", title_th)
                                        content_th = trans_data.get("content_th")
                                elif report_type == "sum_report":
                                    # Look up in summary_translations
                                    sum_key = title_to_sum_key.get(title)
                                    if sum_key and sum_key in summary_translations:
                                        trans_data = summary_translations[sum_key]
                                        title_th = trans_data.get("title_th", title_th)
                                        content_th = trans_data.get("content_th")
                                
                                reports_to_add.append(ReportResult(
                                    execution_id=report["execution_id"],
                                    report_type=report["report_type"],
                                    title=report["title"],
                                    title_th=title_th,
                                    content=report["content"],
                                    content_th=content_th
                                ))
                            
                            logger.info(f"📊 Adding {len(reports_to_add)} reports to database (with pre-translated Thai)...")
                            db.add_all(reports_to_add)
                            await db.commit()
                            logger.info(f"✅ Database update complete for execution {execution_id} - Saved {len(reports_to_add)} reports")
                        else:
                            logger.warning(f"⚠️ ExecutionHistory with id {execution_id} not found")

                except Exception as db_err:
                    logger.error(f"❌ Database update failed: {db_err}")
                    import traceback
                    traceback.print_exc()
            else:
                logger.warning("⚠️ No execution_id available - skipping database save")

        except Exception as e:
            logger.error(f"❌ Failed to run summarization logic: {e}")
            import traceback
            traceback.print_exc()

        
        decision = graph.process_signal(final_state_graph.get("final_trade_decision", ""))

        # Prepare final state to send to frontend (include summaries)
        frontend_final_state = {
            # Original Keys (Now using raw state for Full Reports where applicable)
            "market_report": final_state_graph.get("market_report"),
            "sentiment_report": final_state_graph.get("sentiment_report"),
            "news_report": final_state_graph.get("news_report"),
            "fundamentals_report": final_state_graph.get("fundamentals_report"),
            "investment_plan": final_state_graph.get("investment_debate_state"), # Send Dict for JSON printing
            "trader_investment_plan": final_state_graph.get("trader_investment_plan"),
            "final_trade_decision": final_state_graph.get("risk_debate_state"), # Send Dict for JSON printing

            # Summary Keys
            "Summarize_market_report": final_state_graph.get("Summarize_market_report"),
            "Summarize_social_report": final_state_graph.get("Summarize_social_report"),
            "Summarize_news_report": final_state_graph.get("Summarize_news_report"),
            "Summarize_fundamentals_report": final_state_graph.get("Summarize_fundamentals_report"),
            "Summarize_investment_plan_report": final_state_graph.get("Summarize_investment_plan_report"),
            "Summarize_final_trade_decision_report": final_state_graph.get("Summarize_final_trade_decision_report"),
            "Summarize_conservative_report": final_state_graph.get("Summarize_conservative_report"),
            "Summarize_aggressive_report": final_state_graph.get("Summarize_aggressive_report"),
            "Summarize_neutral_report": final_state_graph.get("Summarize_neutral_report"),
            "bull_researcher_summarizer": final_state_graph.get("bull_researcher_summarizer"),
            "bear_researcher_summarizer": final_state_graph.get("bear_researcher_summarizer"),
            "trader_summarizer": final_state_graph.get("trader_summarizer"),
        }

        # Send completion
        await send_update(websocket, "complete", {
            "decision": decision,
            "final_state": frontend_final_state
        })

    except asyncio.CancelledError:
        logger.info(f"🛑 Analysis for {request.ticker} was cancelled.")
        # Update database status to cancelled
        if execution_id:
            try:
                async with AsyncSessionLocal() as db:
                    stmt = select(ExecutionHistory).where(ExecutionHistory.id == execution_id)
                    res = await db.execute(stmt)
                    db_history = res.scalar_one_or_none()
                    if db_history:
                        db_history.status = "cancelled"
                        db_history.error_message = "Analysis was cancelled by user"
                        await db.commit()
                        logger.info(f"💾 Updated history {execution_id} with cancelled status.")
            except Exception as db_cancel_err:
                logger.error(f"❌ Failed to update history status on cancel: {db_cancel_err}")
        await send_update(websocket, "error", {"message": "Analysis cancelled."})
        raise

    except Exception as e:
        logger.error(f"❌ Analysis failed for {request.ticker}: {e}")
        if execution_id:
            try:
                async with AsyncSessionLocal() as db:
                    stmt = select(ExecutionHistory).where(ExecutionHistory.id == execution_id)
                    res = await db.execute(stmt)
                    db_history = res.scalar_one_or_none()
                    if db_history:
                        db_history.status = "error"
                        db_history.error_message = str(e)
                        await db.commit()
                        logger.info(f"💾 Updated history {execution_id} with error status.")
            except Exception as db_update_err:
                logger.error(f"❌ Failed to update history status on error: {db_update_err}")

        await send_update(websocket, "error", {
            "message": str(e)
        })
        raise

from api.history_router import router as history_router
from api.report_router import router as report_router
from api.translation_router import router as translation_router
# ↑ path ต้องตรงจริง ๆ

# Create FastAPI app
app = FastAPI(title="TradingAgents API", version="1.0.0")

# Startup event - Create database tables
@app.on_event("startup")
async def startup_event():
    from database.database import init_db
    logger.info("🚀 Starting up - initializing database...")
    try:
        await init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.warning(f"⚠️ Database connection failed (server will continue without database features): {e}")
        # Don't print full traceback - just log the warning
        # The server can still function without the database for basic features

app.include_router(history_router)
app.include_router(report_router)
app.include_router(translation_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for web interface
if WEB_DIR.exists():
    app.mount("/web", StaticFiles(directory=str(WEB_DIR), html=True), name="web")


@app.get("/")
async def root():
    """Redirect to web interface."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/web/")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time analysis updates."""
    await websocket.accept()
    active_connections.append(websocket)
    
    analysis_task: Optional[asyncio.Task] = None

    try:
        while True:
            # Wait for any message
            data = await websocket.receive_json()
            
            action = data.get("action")
            
            if action == "start_analysis":
                # Cancel existing task if running
                if analysis_task and not analysis_task.done():
                    analysis_task.cancel()
                    try:
                        await analysis_task
                    except asyncio.CancelledError:
                        pass
                
                request_data = data.get("request")
                if not request_data:
                    await send_update(websocket, "error", {"message": "Missing request data"})
                    continue
                
                # Create request model
                try:
                    request = AnalysisRequest(**request_data)
                except Exception as e:
                    await send_update(websocket, "error", {"message": f"Invalid request: {str(e)}"})
                    continue
                
                # Run analysis in background task
                analysis_task = asyncio.create_task(run_analysis_stream(websocket, request))
                
            elif action == "stop":
                if analysis_task and not analysis_task.done():
                    analysis_task.cancel()
                    try:
                        await analysis_task
                    except asyncio.CancelledError:
                        pass
                    analysis_task = None
                    await send_update(websocket, "error", {"message": "Analysis stopped. System ready."})
                    logger.info("🛑 Analysis stopped by user. System reset and ready.")
                
            elif action == "ping":
                await send_update(websocket, "pong", {})
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        if analysis_task and not analysis_task.done():
            analysis_task.cancel()
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if analysis_task and not analysis_task.done():
            analysis_task.cancel()
        if websocket in active_connections:
            active_connections.remove(websocket)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "connections": len(active_connections),
        "project_root": str(PROJECT_ROOT),
        "web_dir_exists": WEB_DIR.exists()
    }


@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify API is working."""
    try:
        # Test imports
        from tradingagents.graph.trading_graph import TradingAgentsGraph
        from tradingagents.default_config import DEFAULT_CONFIG
        
        return {
            "status": "ok",
            "message": "API is working correctly",
            "tradingagents_imported": True,
            "config_loaded": True
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }


@app.get("/api/search")
async def search_ticker(q: str, market: str = "US"):
    """
    Search for a ticker by name or symbol using Yahoo Finance API.
    market filters: 'US', 'TH' (Thai), 'CN' (China), 'GOLD'.
    """
    import requests
    try:
        url = "https://query2.finance.yahoo.com/v1/finance/search"
        params = {
            "q": q,
            "quotesCount": 20, # Fetch more to allow for filtering
            "newsCount": 0,
            "enableFuzzyQuery": "false",
            "quotesQueryId": "tss_match_phrase_query"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code != 200:
            logger.error(f"Yahoo Search API Error: {resp.status_code}")
            return []

        data = resp.json()
        quotes = data.get("quotes", [])
        
        # Filtering Logic
        market = market.upper()
        filtered_results = []
        
        for item in quotes:
            symbol = item.get("symbol", "")
            exch = item.get("exchDisp", "").upper()
            qtype = item.get("quoteType", "").upper()
            name = (item.get("shortname") or item.get("longname") or "").upper()
            
            if not symbol: continue

            # Filter by Market
            is_match = False
            
            if market == "TH":
                if symbol.endswith(".BK") or exch == "SET":
                    is_match = True
            
            elif market == "CN":
                if symbol.endswith(".SS") or symbol.endswith(".SZ"):
                    is_match = True
            
            elif market == "GOLD":
                # Matches Gold Futures, ETFs, or Spot
                if "GOLD" in name or "XAU" in symbol or "GC=F" in symbol:
                     is_match = True
            
            else: # Default "US" or others
                # US stocks typically don't have .XX suffixes (except specialized classes)
                # And usually are on NYSE, NASDAQ, etc.
                if "." not in symbol: 
                     is_match = True
                elif exch in ["NYSE", "NASDAQ", "NYQ", "NMS", "NGM", "OPR", "CME"]:
                     is_match = True

            if is_match:
                filtered_results.append({
                    "symbol": item.get("symbol"),
                    "name": item.get("shortname") or item.get("longname") or item.get("symbol"),
                    "type": qtype,
                    "exchange": item.get("exchDisp", "")
                })
            
        return filtered_results[:10] # Return top 10 after filtering
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return []


@app.get("/api/tickers")
async def get_market_tickers(market: str):
    """
    Get a list of curated tickers for a specific market directly from backend data.
    """
    try:
        # Try importing from api package first (common in uvicorn run from root)
        from api.stock_data import get_tickers_by_market
        return get_tickers_by_market(market)
    except ImportError:
        try:
             # Fallback: relative import or same directory
             from stock_data import get_tickers_by_market
             return get_tickers_by_market(market)
        except Exception as e:
            logger.error(f"Failed to import stock_data: {e}")
            return []
    except Exception as e:
        logger.error(f"Error fetching tickers: {e}")
        return []


class TelegramConnectRequest(BaseModel):
    chat_id: str

class TelegramDetectRequest(BaseModel):
     start_time: Optional[float] = None

@app.post("/api/telegram/connect")
async def connect_telegram(request: TelegramConnectRequest):
    """
    Connect Telegram account by setting the chat_id in environment.
    """
    try:
        # Update current process environment
        os.environ["TELEGRAM_CHAT_ID"] = request.chat_id
        
        # Update .env file for persistence
        # PROJECT_ROOT is defined as Path(__file__).parent.parent which is 'backend'
        env_path = PROJECT_ROOT / ".env"
        
        # Simple .env writer to avoid extra dependencies if possible, 
        # but using python-dotenv feature if available is better.
        # Check if dotenv.set_key is available or just append/replace string.
        
        # We will try to read the file and replace the line or append if not found.
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            new_lines = []
            found = False
            for line in lines:
                if line.strip().startswith("TELEGRAM_CHAT_ID="):
                    new_lines.append(f"TELEGRAM_CHAT_ID={request.chat_id}\n")
                    found = True
                else:
                    new_lines.append(line)
            
            if not found:
                if new_lines and not new_lines[-1].endswith("\n"):
                    new_lines[-1] += "\n"
                new_lines.append(f"TELEGRAM_CHAT_ID={request.chat_id}\n")
                
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        else:
            # Create new .env
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(f"TELEGRAM_CHAT_ID={request.chat_id}\n")
        
        return {"status": "success", "message": "Telegram connected successfully"}
    except Exception as e:
        logger.error(f"Failed to connect telegram: {e}")


@app.post("/api/telegram/detect")
async def detect_latest_chat_id(request: Optional[TelegramDetectRequest] = None):
    """
    Check the latest update from the Telegram bot.
    If a user has interacted recently, capture their Chat ID.
    """
    token = os.getenv("TELEGRAM_TOKEN")
    if not token:
        raise HTTPException(status_code=400, detail="Telegram token not configured")
    
    try:
        import requests
        # Get updates (allowed to be empty)
        url = f"https://api.telegram.org/bot{token}/getUpdates?limit=5&offset=-5" # Get last 5 updates to find the right one
        resp = requests.get(url, timeout=10)
        
        if resp.status_code != 200:
             raise HTTPException(status_code=502, detail="Failed to reach Telegram API")
             
        data = resp.json()
        if not data.get("ok"):
             raise HTTPException(status_code=502, detail=f"Telegram Error: {data.get('description')}")
             
        results = data.get("result", [])
        if not results:
             return {"found": False, "message": "No messages found. Please send a message to the bot first."}
        
        # Iterate backwards to find the most recent valid message
        valid_message = None
        
        # Determine strict time filter (default 120s if not provided by frontend)
        import time
        current_time = time.time()
        start_time_limit = request.start_time if request and request.start_time else (current_time - 120)
        
        for update in reversed(results):
            message = update.get("message") or update.get("my_chat_member") or update.get("channel_post")
            if not message: continue
            
            msg_date = message.get("date")
            if msg_date:
                # Check if message is newer than the start_time (when user clicked connect)
                if msg_date >= start_time_limit:
                    valid_message = message
                    break # Found the most recent valid one
        
        if not valid_message:
             return {"found": False, "message": "No new messages found since you clicked connect."}
             
        message = valid_message
        chat = message.get("chat") or message.get("from") # my_chat_member has 'chat'
        
        if not chat:
             return {"found": False, "message": "Could not identify chat details."}
             
        chat_id = str(chat["id"])
        first_name = chat.get("first_name", "User")
        username = chat.get("username", "")



        request = TelegramConnectRequest(chat_id=chat_id)
        os.environ["TELEGRAM_CHAT_ID"] = chat_id
        env_path = PROJECT_ROOT / ".env"
        
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            found = False
            for line in lines:
                if line.strip().startswith("TELEGRAM_CHAT_ID="):
                    new_lines.append(f"TELEGRAM_CHAT_ID={chat_id}\n")
                    found = True
                else:
                    new_lines.append(line)
            if not found:
                if new_lines and not new_lines[-1].endswith("\n"):
                    new_lines[-1] += "\n"
                new_lines.append(f"TELEGRAM_CHAT_ID={chat_id}\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        else:
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(f"TELEGRAM_CHAT_ID={chat_id}\n")
        
        # Send Welcome Message
        try:
            requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id, 
                    "text": "✅ *Connection Successful!*\n\nYou have successfully connected your Telegram account to the Trading Agent.\nYou will now receive real-time trading notifications here.",
                    "parse_mode": "Markdown"
                },
                timeout=5
            )
        except Exception as e:
            logger.error(f"Failed to send welcome message: {e}")

        return {
            "found": True, 
            "chat_id": chat_id, 
            "username": username or first_name,
            "message": "Successfully detected and connected!"
        }
        
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/telegram/status")
async def get_telegram_status():
    """
    Get current Telegram connection status and bot info.
    """
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    token = os.getenv("TELEGRAM_TOKEN")
    
    bot_name = None
    if token:
        try:
            # Simple synchronous call to avoid adding async http client for now, or use httpx if available.
            # Since requests is used elsewhere, we can use it, but preferably async.
            # using requests (synch) inside async fastAPI could block, but for low traffic ok.
            import requests
            url = f"https://api.telegram.org/bot{token}/getMe"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("ok"):
                    bot_name = data["result"]["username"]
        except Exception as e:
            logger.error(f"Failed to fetch bot info: {e}")

    return {
        "connected": bool(chat_id),
        "chat_id": chat_id,
        "bot_name": bot_name 
    }



@app.get("/quote/{ticker}")
async def get_quote(ticker: str):
    """Fetch real-time quote data for a ticker."""
    try:
        t = yf.Ticker(ticker)
        
        # Get fast price data
        # Try intraday 5m data first for "Live" feel
        hist = t.history(period="1d", interval="5m")
        
        if hist.empty or len(hist) < 2:
            # Fallback to 5d hourly if 1d is empty or too short (e.g. pre-market or just opened)
            hist = t.history(period="5d", interval="60m")
        
        if hist.empty:
             raise HTTPException(status_code=404, detail="Ticker not found or no data available")

        current_price = hist["Close"].iloc[-1]
        
        # Get metadata (slower, but useful)
        try:
            info = t.info
        except:
            info = {}
        
        # Calculate change if possible
        previous_close = info.get("previousClose")
        if not previous_close and len(hist) > 1:
             previous_close = hist["Close"].iloc[-2]
        
        if not previous_close:
             previous_close = current_price # Fallback
             
        change = current_price - previous_close
        percent_change = (change / previous_close) * 100

        # Attempt to get logo
        logo_url = info.get("logo_url", "")
        if not logo_url and info.get("website"):
            try:
                from urllib.parse import urlparse
                domain = urlparse(info.get("website")).netloc
                if domain.startswith("www."):
                    domain = domain[4:]
                if domain:
                     logo_url = f"https://logo.clearbit.com/{domain}"
            except:
                pass
        
        # Prepare Sparkline Data (last 30 points or available duration)
        # Drop NaNs to prevent frontend rendering issues
        clean_hist = hist["Close"].dropna()
        sparkline = clean_hist.tolist()
        
        # Downsample if too many points to keep payload small, e.g. take last 50
        if len(sparkline) > 50:
            sparkline = sparkline[-50:]
        
        return {
            "symbol": ticker.upper(),
            "shortName": info.get("shortName", ticker.upper()),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "percentChange": round(percent_change, 2),
            "volume": info.get("volume", hist["Volume"].iloc[-1]),
            "sector": info.get("sector", "Unknown"),
            "logo_url": logo_url,
            "website": info.get("website", ""),
            "sparkline": sparkline
        }
    except Exception as e:
        logger.error(f"Error fetching quote for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)