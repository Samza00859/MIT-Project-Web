
import pandas as pd
import numpy as np
from io import StringIO

def calculate_sma(df: pd.DataFrame, period: int = 50, column: str = "Close") -> pd.Series:
    return df[column].rolling(window=period).mean()

def calculate_ema(df: pd.DataFrame, period: int = 10, column: str = "Close") -> pd.Series:
    return df[column].ewm(span=period, adjust=False).mean()

def calculate_rsi(df: pd.DataFrame, period: int = 14, column: str = "Close") -> pd.Series:
    delta = df[column].diff(1)
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9, column: str = "Close"):
    exp1 = df[column].ewm(span=fast, adjust=False).mean()
    exp2 = df[column].ewm(span=slow, adjust=False).mean()
    macd_line = exp1 - exp2
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

def calculate_bollinger_bands(df: pd.DataFrame, period: int = 20, num_std: int = 2, column: str = "Close"):
    sma = df[column].rolling(window=period).mean()
    std = df[column].rolling(window=period).std()
    upper_band = sma + (std * num_std)
    lower_band = sma - (std * num_std)
    return upper_band, lower_band

def calculate_atr(df: pd.DataFrame, period: int = 14):
    high_low = df['High'] - df['Low']
    high_close = np.abs(df['High'] - df['Close'].shift())
    low_close = np.abs(df['Low'] - df['Close'].shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    return true_range.rolling(window=period).mean()

def calculate_vwma(df: pd.DataFrame, period: int = 20):
    v = df['Volume'].values
    p = df['Close'].values
    # Check if we have volume
    if 'Volume' not in df.columns or df['Volume'].sum() == 0:
        return calculate_sma(df, period) # Fallback to SMA
    
    vwma = (df['Close'] * df['Volume']).rolling(window=period).sum() / df['Volume'].rolling(window=period).sum()
    return vwma

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
        indicators['close_50_sma'] = calculate_sma(df, 50).iloc[-1]
        indicators['close_200_sma'] = calculate_sma(df, 200).iloc[-1]
        
        # EMA
        indicators['close_10_ema'] = calculate_ema(df, 10).iloc[-1]
        
        # RSI
        indicators['rsi'] = calculate_rsi(df, 14).iloc[-1]
        
        # MACD
        macd, signal, hist = calculate_macd(df)
        indicators['macd'] = macd.iloc[-1]
        indicators['macds'] = signal.iloc[-1]
        indicators['macdh'] = hist.iloc[-1]
        
        # BOLL
        ub, lb = calculate_bollinger_bands(df)
        indicators['boll_ub'] = ub.iloc[-1]
        indicators['boll_lb'] = lb.iloc[-1]
        indicators['boll'] = (ub.iloc[-1] + lb.iloc[-1]) / 2 # Middle band usually
        
        # ATR
        indicators['atr'] = calculate_atr(df).iloc[-1]
        
        # VWMA
        indicators['vwma'] = calculate_vwma(df).iloc[-1]
        
        return indicators, df
    except Exception as e:
        return {"error": str(e)}, None
