from langchain_core.tools import tool
from typing import Annotated
from tradingagents.dataflows.interface import route_to_vendor
import inspect


# @tool
def get_news(
    ticker: Annotated[str, "Ticker symbol"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """
    Retrieves company-specific news and headlines.
    Useful for analyzing sentiment, earnings reports, and major events.
    """
    # print("\n\n\nDEBUG:get_news")
    # print(route_to_vendor("get_news", ticker, start_date, end_date))
    # print("\n\n\nFINISH DEBUG:get_news")
    return route_to_vendor("get_news", ticker, start_date, end_date)

# @tool
def get_global_news(
    curr_date: Annotated[str, "Current date in yyyy-mm-dd format"],
    look_back_days: Annotated[int, "Number of days to look back"] = 7,
    limit: Annotated[int, "Maximum number of articles to return"] = 5,
) -> str:
    """
    Retrieve global news data.
    Uses the configured news_data vendor.
    Args:
        curr_date (str): Current date in yyyy-mm-dd format
        look_back_days (int): Number of days to look back (default 7)
        limit (int): Maximum number of articles to return (default 5)
    Returns:
        str: A formatted string containing global news data
    """
    return route_to_vendor("get_global_news", curr_date, look_back_days, limit)

@tool
def get_insider_sentiment(
    ticker: Annotated[str, "ticker symbol for the company"],
    curr_date: Annotated[str, "current date you are trading at, yyyy-mm-dd"],
) -> str:
    """
    Retrieve insider sentiment information about a company.
    Uses the configured news_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
        curr_date (str): Current date you are trading at, yyyy-mm-dd
    Returns:
        str: A report of insider sentiment data
    """
    return route_to_vendor("get_insider_sentiment", ticker, curr_date)

@tool
def get_insider_transactions(
    ticker: Annotated[str, "ticker symbol"],
    curr_date: Annotated[str, "current date you are trading at, yyyy-mm-dd"],
) -> str:
    """
    Retrieve insider transaction information about a company.
    Uses the configured news_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
        curr_date (str): Current date you are trading at, yyyy-mm-dd
    Returns:
        str: A report of insider transaction data
    """
    return route_to_vendor("get_insider_transactions", ticker, curr_date)

# @tool
async def get_social(
    ticker: Annotated[str, "ticker symbol"],
) -> str:
    """
    Retrieve social media sentiment data about a company.
    Uses the configured news_data vendor.
    Args:
        ticker (str): Ticker symbol of the company
    Returns:
        str: A report of social media sentiment data
    """
    
    # print("\n\n\nDEBUG:get_social")
    # print(route_to_vendor("get_social", ticker))
    # print("\n\n\nFINISH DEBUG:get_social")
    res = route_to_vendor("get_social", ticker)

    if inspect.isawaitable(res):
        return await res
    return res


import asyncio



async def get_all_news_batch(ticker: str, start_date: str, end_date: str) -> str:
    """
    Fetch both company-specific news and global macro news in parallel.
    Uses asyncio for concurrent execution.
    """
    print(f"📰 News Analyst: Pre-fetching data for {ticker}...")
    
    # Define tasks to run in thread pool to avoid blocking the event loop
    # get_news takes (ticker, start_date, end_date)
    task_company = asyncio.to_thread(get_news, ticker, start_date, end_date)
    
    # get_global_news takes (curr_date, look_back_days=7)
    # We pass arguments positionally or via kwargs in to_thread? 
    # asyncio.to_thread(func, *args, **kwargs) is available in Python 3.9+
    task_global = asyncio.to_thread(get_global_news, curr_date=end_date, look_back_days=7)

    results = await asyncio.gather(task_company, task_global, return_exceptions=True)
    
    company_news = results[0]
    global_news = results[1]

    # Handle exceptions
    if isinstance(company_news, Exception):
        company_news = f"Error fetching company news: {company_news}"
    
    if isinstance(global_news, Exception):
        global_news = f"Error fetching global news: {global_news}"

    combined_report = f"""
    === GLOBAL MACRO NEWS ===
    {global_news}

    === COMPANY SPECIFIC NEWS ({ticker}) ===
    {company_news}
    """
    
    return combined_report

async def fetch_social_data(ticker: str) -> str:
    """
    Fetch social media data.
    """
    print(f"💬 Social Analyst: Pre-fetching data for {ticker}...")
    try:
        return await get_social(ticker)
    except Exception as e:
        return f"Error fetching social data: {e}"