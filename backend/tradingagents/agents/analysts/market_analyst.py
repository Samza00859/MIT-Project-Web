import json
import re
from typing import List, Literal
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser
from tradingagents.dataflows.core_calculator import process_indicators_from_csv
from tradingagents.dataflows.core_stock_price import get_stock_data
from tradingagents.dataflows.core_calculator import (
    process_indicators_from_csv, 
    calculate_sma, calculate_ema, calculate_rsi, calculate_macd, 
    calculate_bollinger_bands, calculate_atr, calculate_vwma
)


# ===================== PYDANTIC MODELS ======================
class MarketOverview(BaseModel):
    trend_direction: Literal["Bullish", "Bearish", "Sideways"] = Field(description="Primary trend direction")
    momentum_state: Literal["Strong", "Weak", "Diverging", "Neutral"] = Field(description="Momentum state")
    volatility_level: Literal["Low", "Moderate", "High"] = Field(description="Volatility based on ATR/Bollinger")
    volume_condition: Literal["Rising", "Falling", "Neutral"] = Field(description="Volume trend analysis")


class IndicatorAnalysis(BaseModel):
    indicator: str = Field(description="Short code of the indicator (e.g. close_50_sma).")
    indicator_full_name: str = Field(description="Full name of the indicator.")
    signal: str = Field(description="Detailed signal description.")
    implication: str = Field(description="Trading implication of the signal.")


class PriceActionSummary(BaseModel):
    recent_high_low: str = Field(description="Price position relative to recent highs/lows.")
    support_levels: List[str] = Field(description="List of immediate support price levels.")
    resistance_levels: List[str] = Field(description="List of immediate resistance price levels.")
    short_term_behavior: str = Field(description="Description of short-term price action.")


class MarketSentiment(BaseModel):
    sentiment_label: str = Field(description="Sentiment label: Bullish/Bearish.")


class MarketReport(BaseModel):
    ticker: str = Field(description="The ticker symbol of the company.")
    date: str = Field(description="The current analysis date (YYYY-MM-DD).")
    selected_indicators: List[str] = Field(description="List of indicators used.")
    market_overview: MarketOverview
    indicator_analysis: List[IndicatorAnalysis]
    price_action_summary: PriceActionSummary
    market_sentiment: MarketSentiment
    key_risks: List[str] = Field(description="List of key technical risks.")
    short_term_outlook: str = Field(description="Concise outlook statement.")

# ===================== AGENT FACTORY ======================
def create_market_analyst(llm):
    parser = JsonOutputParser(pydantic_object=MarketReport)

    def market_analyst_node(state):
        current_date = state["trade_date"]
        ticker = state["company_of_interest"]
        
        # Calculate date range
        try:
            curr_date_obj = datetime.strptime(current_date, "%Y-%m-%d")
            start_date = (curr_date_obj - timedelta(days=365)).strftime("%Y-%m-%d")
        except Exception:
            start_date = "2024-01-01"

        # ===================== PRE-FETCH DATA ======================
        print(f"📊 Market Analyst: Pre-fetching data for {ticker}...")
        try:
            # 1. Fetch Stock Data
            stock_data = get_stock_data(ticker, start_date, current_date)
            
            # 2. Calculate Indicators Locally (No API Call)
            indicators, df = process_indicators_from_csv(stock_data)
            
            indicators_context = ""
            if indicators and "error" not in indicators:
                indicators_context = json.dumps(indicators, indent=2)
                
                # Add Historical Context (Last 5 Days)
                if df is not None and not df.empty:
                                        
                    # Recalculate series for history
                    df['SMA_50'] = calculate_sma(df, 50)
                    # df['SMA_200'] = calculate_sma(df, 200)
                    df['EMA_10'] = calculate_ema(df, 10)
                    df['RSI'] = calculate_rsi(df, 14)
                    macd, signal, hist = calculate_macd(df)
                    df['MACD'] = macd
                    df['MACD_S'] = signal
                    df['MACD_H'] = hist
                    ub, lb = calculate_bollinger_bands(df)
                    df['BOLL_UB'] = ub
                    df['BOLL_LB'] = lb
                    df['ATR'] = calculate_atr(df)
                    df['VWMA'] = calculate_vwma(df)
                    
                    cols = ['Close', 'SMA_50', 'EMA_10', 'RSI', 'MACD','MACD_S','MACD_H','BOLL_UB','BOLL_LB','ATR','VWMA']
                    history_str = df[cols].tail(100).to_string()
                    indicators_context += f"\n\nRECENT HISTORICAL DATA :\n{history_str}"
                    print(history_str)
            else:
                 indicators_context = f"Error calculating indicators: {indicators.get('error')}"

            data_context = f"""
            STOCK PRICE DATA (Last 1 Year - CSV Format):
            {stock_data[-2000:] if len(stock_data) > 2000 else stock_data} 
            
            TECHNICAL INDICATORS (Current & History):
            {indicators_context}
            """
        except Exception as e:
            print(f"⚠️ Data pre-fetch failed: {e}")
            data_context = f"Error fetching data: {e}"

        # ===================== SYSTEM MESSAGE ======================
        system_message = f"""
You are an AI Trading Analysis Agent.

DATA CONTEXT:
{data_context}

Rules:
1) Analyze the provided STOCK PRICE DATA and TECHNICAL INDICATORS.
2) Use ONLY the following indicator names in your report if available:
[
    "close_50_sma", "close_200_sma", "close_10_ema", "macd", "macds", "macdh", 
    "rsi", "boll", "boll_ub", "boll_lb", "atr", "vwma"
]
3) Return the final answer as a valid JSON object ONLY used the schema below.
4) Do NOT output any markdown blocks (```json ... ```). Just the raw JSON string.

OUTPUT FORMAT:
{parser.get_format_instructions()}
"""

        # ===================== PROMPT ======================
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "{system_message}"
            ),
            MessagesPlaceholder(variable_name="messages"),
        ])

        prompt = prompt.partial(system_message=system_message)

        # ===================== CHAIN ======================
        # NO TOOL BINDING - Direct generation
        chain = prompt | llm 

        # Execute
        print("🤖 Market Analyst: Analyzing pre-fetched data...")
        result = chain.invoke(state["messages"])
        
        # ========== PARSE WITH ROBUST ERROR HANDLING ==========
        report_dict = None
        
        raw_content = result.content
        
        # Handle list format (e.g., [{'type': 'text', 'text': '...'}])
        if isinstance(raw_content, list):
            extracted_text = ""
            for item in raw_content:
                if isinstance(item, dict) and item.get('type') == 'text':
                    extracted_text = item.get('text', '')
                    break
            else:
                extracted_text = " ".join([str(item) for item in raw_content])
            raw_content = extracted_text
            
        if raw_content is None:
            raw_content = ""
        
        try:
            # Method 1: Use Parser (handles string cleaning internally)
            report_dict = parser.parse(str(raw_content))
            
        except Exception as e1:
            print(f"⚠️ Parser failed: {e1}")
            
            # Method 2: Clean markdown and extract JSON
            try:
                clean = re.sub(r"```[\w]*\n?", "", str(raw_content)).strip()
                match = re.search(r"\{[\s\S]*\}", clean)
                
                if match:
                    json_str = match.group(0)
                    report_dict = json.loads(json_str)
                    # Validate with Pydantic
                    report_dict = MarketReport.model_validate(report_dict).model_dump()
                else:
                    print("⚠️ No JSON object found in response")
                    report_dict = {"error": "No JSON found", "raw": str(raw_content)[:200]}
                    
            except Exception as e2:
                print(f"⚠️ Fallback parsing failed: {e2}")
                report_dict = {"error": "Parsing failed", "raw": str(raw_content)[:200]}
        
        # If still None (and we expected JSON), return valid structure or error
        if report_dict is None:
            # Check if it was a tool call scenario (though we don't bind tools here)
            if hasattr(result, 'tool_calls') and result.tool_calls:
                 report_dict = {"status": "waiting_for_tool_response"}
            else:
                 report_dict = {"error": "Failed to parse report", "raw": str(raw_content)[:100]}

        # Convert dict to JSON string
        report_json = json.dumps(report_dict, indent=4, ensure_ascii=False)

        print("Market Report JSON:", report_json)

        return {
            "messages": [result],
            "market_report": report_json,  # Return as JSON string
        }

    return market_analyst_node