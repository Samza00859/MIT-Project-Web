
import pandas as pd
import numpy as np
from io import StringIO
import pandas_ta as ta

def calculate_sma(df: pd.DataFrame, period: int = 50, column: str = "Close") -> pd.Series:
    # Use pandas_ta.sma
    return ta.sma(df[column], length=period)

def calculate_ema(df: pd.DataFrame, period: int = 10, column: str = "Close") -> pd.Series:
    # Use pandas_ta.ema
    return ta.ema(df[column], length=period)

def calculate_rsi(df: pd.DataFrame, period: int = 14, column: str = "Close") -> pd.Series:
    # Use pandas_ta.rsi
    return ta.rsi(df[column], length=period)

def calculate_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9, column: str = "Close"):
    # pandas_ta.macd returns a DataFrame with 3 columns:
    # MACD_{fast}_{slow}_{signal} (Line)
    # MACDh_{fast}_{slow}_{signal} (Histogram)
    # MACDs_{fast}_{slow}_{signal} (Signal)
    macd_df = ta.macd(df[column], fast=fast, slow=slow, signal=signal)
    
    if macd_df is None or macd_df.empty:
        return pd.Series([np.nan]*len(df)), pd.Series([np.nan]*len(df)), pd.Series([np.nan]*len(df))

    # Identify columns by name pattern or index
    # We expect columns in order: macd, histogram, signal (or similar, check pandas_ta docs/implementation)
    # Actually pandas_ta returns: MACD, MACDh (hist), MACDs (signal)
    
    # Construct expected column names
    macd_col = f"MACD_{fast}_{slow}_{signal}"
    hist_col = f"MACDh_{fast}_{slow}_{signal}"
    signal_col = f"MACDs_{fast}_{slow}_{signal}"
    
    macd_line = macd_df[macd_col]
    signal_line = macd_df[signal_col]
    histogram = macd_df[hist_col]
    
    return macd_line, signal_line, histogram

def calculate_bollinger_bands(df: pd.DataFrame, period: int = 20, num_std: int = 2, column: str = "Close"):
    # pandas_ta.bbands returns BBL, BBM, BBU, BBB, BBP
    bb_df = ta.bbands(df[column], length=period, std=num_std)
    
    if bb_df is None or bb_df.empty:
        return pd.Series([np.nan]*len(df)), pd.Series([np.nan]*len(df))
        
    lower_col = f"BBL_{period}_{float(num_std)}"
    upper_col = f"BBU_{period}_{float(num_std)}"
    
    # Handle implicit float formatting in pandas_ta names if needed (e.g. 2.0)
    # Usually it's 'BBL_20_2.0'
    
    # Fallback search if exact name match fails
    if lower_col not in bb_df.columns:
        # Try to find columns starting with BBL and BBU
        lower_vals = bb_df.filter(like="BBL").iloc[:, 0]
        upper_vals = bb_df.filter(like="BBU").iloc[:, 0]
        return upper_vals, lower_vals
    
    upper_band = bb_df[upper_col]
    lower_band = bb_df[lower_col]
    return upper_band, lower_band

def calculate_atr(df: pd.DataFrame, period: int = 14):
    # pandas_ta.atr requires High, Low, Close
    return ta.atr(df["High"], df["Low"], df["Close"], length=period)

def calculate_vwma(df: pd.DataFrame, period: int = 20):
    # pandas_ta.vwma requires Close, Volume
    if 'Volume' not in df.columns or df['Volume'].sum() == 0:
        return calculate_sma(df, period) # Fallback
        
    return ta.vwma(df["Close"], df["Volume"], length=period)

def process_indicators_from_csv(csv_text: str):
    """
    Takes CSV string (Date,Open,High,Low,Close,Volume) and returns calculated indicators.
    """
    try:
        # Ignore comment lines starting with #
        df = pd.read_csv(StringIO(csv_text), comment='#', index_col="Date", parse_dates=True)
        # Ensure column names are stripped/capitalized properly
        df.columns = [c.strip().capitalize() for c in df.columns]
        
        # Calculate All
        indicators = {}
        
        # SMA
        sma_50 = calculate_sma(df, 50)
        if sma_50 is not None: indicators['close_50_sma'] = sma_50.iloc[-1]
        
        sma_200 = calculate_sma(df, 200)
        if sma_200 is not None: indicators['close_200_sma'] = sma_200.iloc[-1]
        
        # EMA
        ema_10 = calculate_ema(df, 10)
        if ema_10 is not None: indicators['close_10_ema'] = ema_10.iloc[-1]
        
        # RSI
        rsi = calculate_rsi(df, 14)
        if rsi is not None: indicators['rsi'] = rsi.iloc[-1]
        
        # MACD
        macd, signal, hist = calculate_macd(df)
        if macd is not None: indicators['macd'] = macd.iloc[-1]
        if signal is not None: indicators['macds'] = signal.iloc[-1]
        if hist is not None: indicators['macdh'] = hist.iloc[-1]
        
        # BOLL
        ub, lb = calculate_bollinger_bands(df)
        if ub is not None and lb is not None:
            indicators['boll_ub'] = ub.iloc[-1]
            indicators['boll_lb'] = lb.iloc[-1]
            indicators['boll'] = (ub.iloc[-1] + lb.iloc[-1]) / 2 # Middle band
        
        # ATR
        atr = calculate_atr(df)
        if atr is not None: indicators['atr'] = atr.iloc[-1]
        
        # VWMA
        # Note: pandas_ta requires DataFrame with DatetimeIndex for some operations, df has it.
        vwma = calculate_vwma(df)
        if vwma is not None: indicators['vwma'] = vwma.iloc[-1]
        
        # Replace NaNs with None for JSON serializability if needed, or handle externally
        # The original code didn't seem to explicitly handle NaNs here but usually returned floats or NaNs.
        # We will return as is.
        
        return indicators, df
    except Exception as e:
        return {"error": str(e)}, None
