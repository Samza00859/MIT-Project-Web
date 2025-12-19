from tradingagents.dataflows.core_indicator import get_indicators

res = get_indicators("0700.HK","rsi", curr_date="2023-01-01", look_back_days=10)
print(res)
