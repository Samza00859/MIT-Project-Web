
import unittest
import pandas as pd
import numpy as np
import sys
import os

# Add relevant paths
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from tradingagents.dataflows.core_calculator import (
    calculate_sma, calculate_ema, calculate_rsi, calculate_macd,
    calculate_bollinger_bands, calculate_atr, calculate_vwma,
    process_indicators_from_csv
)

class TestCoreCalculatorTA(unittest.TestCase):
    def setUp(self):
        # Create a sample DataFrame
        dates = pd.date_range(start="2023-01-01", periods=100)
        self.df = pd.DataFrame({
            "Open": np.random.rand(100) * 100,
            "High": np.random.rand(100) * 105,
            "Low": np.random.rand(100) * 95,
            "Close": np.random.rand(100) * 100,
            "Volume": np.random.randint(1000, 10000, 100)
        }, index=dates)

        # Ensure High >= Low
        self.df["High"] = self.df[["Open", "Close", "High"]].max(axis=1)
        self.df["Low"] = self.df[["Open", "Close", "Low"]].min(axis=1)

    def test_sma(self):
        sma = calculate_sma(self.df, period=10)
        self.assertEqual(len(sma), 100)
        self.assertTrue(pd.notna(sma.iloc[-1])) # Check last value is not NaN

    def test_ema(self):
        ema = calculate_ema(self.df, period=10)
        self.assertEqual(len(ema), 100)
        self.assertTrue(pd.notna(ema.iloc[-1]))

    def test_rsi(self):
        rsi = calculate_rsi(self.df, period=14)
        self.assertEqual(len(rsi), 100)
        # RSI range 0-100
        valid_rsi = rsi.dropna()
        self.assertTrue(((valid_rsi >= 0) & (valid_rsi <= 100)).all())

    def test_macd(self):
        macd, signal, hist = calculate_macd(self.df)
        self.assertEqual(len(macd), 100)
        self.assertEqual(len(signal), 100)
        self.assertEqual(len(hist), 100)
        self.assertTrue(pd.notna(macd.iloc[-1]))

    def test_bollinger_bands(self):
        ub, lb = calculate_bollinger_bands(self.df)
        self.assertEqual(len(ub), 100)
        self.assertEqual(len(lb), 100)
        self.assertTrue(pd.notna(ub.iloc[-1]))
        # Upper band should be >= Lower band (ignoring NaNs)
        valid = ub.dropna().index.intersection(lb.dropna().index)
        self.assertTrue((ub[valid] >= lb[valid]).all())

    def test_atr(self):
        atr = calculate_atr(self.df)
        self.assertEqual(len(atr), 100)
        self.assertTrue(pd.notna(atr.iloc[-1]))

    def test_vwma(self):
        vwma = calculate_vwma(self.df)
        self.assertEqual(len(vwma), 100)
        self.assertTrue(pd.notna(vwma.iloc[-1]))

    def test_process_indicators_from_csv(self):
        csv_data = "Date,Open,High,Low,Close,Volume\n"
        for d, row in self.df.iterrows():
            csv_data += f"{d.strftime('%Y-%m-%d')},{row['Open']},{row['High']},{row['Low']},{row['Close']},{row['Volume']}\n"
        
        indicators, df_res = process_indicators_from_csv(csv_data)
        self.assertIsInstance(indicators, dict)
        self.assertNotIn("error", indicators)
        self.assertIn("rsi", indicators)
        self.assertIn("macd", indicators)

if __name__ == '__main__':
    unittest.main()
