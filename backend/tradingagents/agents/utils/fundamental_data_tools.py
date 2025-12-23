from langchain_core.tools import tool
from typing import Annotated
from tradingagents.dataflows.interface import route_to_vendor


import inspect

# @tool
async def get_fundamentals(
    ticker: Annotated[str, "ticker symbol"],
    curr_date: Annotated[str, "current date you are trading at, yyyy-mm-dd"],
) -> str:
    """
    Retrieve comprehensive fundamental data for a given ticker symbol.
    Uses the configured fundamental_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
        curr_date (str): Current date you are trading at, yyyy-mm-dd
    Returns:
        str: A formatted report containing comprehensive fundamental data
    """
    # print("\n\n\nDEBUG:get_fundamentals")
    # print(route_to_vendor("get_fundamentals", ticker, curr_date))
    # print("\n\n\nFINISH DEBUG:get_fundamentals")
    res = route_to_vendor("get_fundamentals", ticker, curr_date)
    if inspect.isawaitable(res):
        return await res
    return res


@tool
def get_balance_sheet(
    ticker: Annotated[str, "ticker symbol"],
    freq: Annotated[str, "reporting frequency: annual/quarterly"] = "quarterly",
    curr_date: Annotated[str, "current date you are trading at, yyyy-mm-dd"] = None,
) -> str:
    """
    Retrieve balance sheet data for a given ticker symbol.
    Uses the configured fundamental_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
        freq (str): Reporting frequency: annual/quarterly (default quarterly)
        curr_date (str): Current date you are trading at, yyyy-mm-dd
    Returns:
        str: A formatted report containing balance sheet data
    """
    return route_to_vendor("get_balance_sheet", ticker, freq, curr_date)


@tool
def get_cashflow(
    ticker: Annotated[str, "ticker symbol"],
    freq: Annotated[str, "reporting frequency: annual/quarterly"] = "quarterly",
    curr_date: Annotated[str, "current date you are trading at, yyyy-mm-dd"] = None,
) -> str:
    """
    Retrieve cash flow statement data for a given ticker symbol.
    Uses the configured fundamental_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
        freq (str): Reporting frequency: annual/quarterly (default quarterly)
        curr_date (str): Current date you are trading at, yyyy-mm-dd
    Returns:
        str: A formatted report containing cash flow statement data
    """
    return route_to_vendor("get_cashflow", ticker, freq, curr_date)


@tool
def get_income_statement(
    ticker: Annotated[str, "ticker symbol"],
    freq: Annotated[str, "reporting frequency: annual/quarterly"] = "quarterly",
    curr_date: Annotated[str, "current date you are trading at, yyyy-mm-dd"] = None,
) -> str:
    """
    Retrieve income statement data for a given ticker symbol.
    Uses the configured fundamental_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
        freq (str): Reporting frequency: annual/quarterly (default quarterly)
        curr_date (str): Current date you are trading at, yyyy-mm-dd
    Returns:
        str: A formatted report containing income statement data
    """
    # print("\n\n\nDEBUG:get_fundamentals")
    # print(route_to_vendor("get_fundamentals", ticker, curr_date))
    # print("\n\n\nFINISH DEBUG:get_fundamentals")
    return route_to_vendor("get_income_statement", ticker, freq, curr_date)

async def get_all_fundamentals_batch(ticker: str, curr_date: str) -> str:
    """
    Fetch all fundamental data reports in a single batch.
    """
    print(f"📊 Fundamentals Analyst: Pre-fetching data for {ticker}...")
    try:
        # Fetching core fundamentals
        fund_summary = await get_fundamentals(ticker=ticker, curr_date=curr_date)
        
        # Consider fetching financial statements if needed for in-depth analysis
        # For significantly faster speed, we might prioritize just the summary if it's rich enough.
        # But to match 'Deep Research', let's fetch them.
        
        # Note: If these calls are independent network requests, we can parallelize them.
        # Assuming they are likely independent or cached.
        
        # For now, let's just append the summary. If you want full sheets, uncomment below.
        # balance = get_balance_sheet(ticker=ticker, curr_date=curr_date)
        # cash = get_cashflow(ticker=ticker, curr_date=curr_date)
        # income = get_income_statement(ticker=ticker, curr_date=curr_date)
        
        combined_report = f"""
        === FUNDAMENTAL SUMMARY ===
        {fund_summary}
        
        """
        return combined_report
    except Exception as e:
        return f"Error fetching fundamentals: {e}"