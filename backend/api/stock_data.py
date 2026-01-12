"""
Comprehensive lists of major stock tickers for supported markets.
Includes SET100 (Thailand), Major US Indices (S&P 100, NASDAQ 100), and Key Chinese Stocks.
"""

STOCK_LISTS = {
    "US": [
        # Tech / Magnificent 7
        {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ"},
        {"symbol": "AMZN", "name": "Amazon.com, Inc.", "exchange": "NASDAQ"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ"},
        {"symbol": "META", "name": "Meta Platforms, Inc.", "exchange": "NASDAQ"},
        {"symbol": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ"},
        
        # Semiconductors
        {"symbol": "AVGO", "name": "Broadcom Inc.", "exchange": "NASDAQ"},
        {"symbol": "AMD", "name": "Advanced Micro Devices, Inc.", "exchange": "NASDAQ"},
        {"symbol": "INTC", "name": "Intel Corporation", "exchange": "NASDAQ"},
        {"symbol": "QCOM", "name": "Qualcomm Incorporated", "exchange": "NASDAQ"},
        {"symbol": "TXN", "name": "Texas Instruments", "exchange": "NASDAQ"},
        {"symbol": "MU", "name": "Micron Technology", "exchange": "NASDAQ"},
        {"symbol": "AMAT", "name": "Applied Materials", "exchange": "NASDAQ"},
        
        # Financials
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "exchange": "NYSE"},
        {"symbol": "BAC", "name": "Bank of America", "exchange": "NYSE"},
        {"symbol": "WFC", "name": "Wells Fargo", "exchange": "NYSE"},
        {"symbol": "C", "name": "Citigroup", "exchange": "NYSE"},
        {"symbol": "GS", "name": "Goldman Sachs", "exchange": "NYSE"},
        {"symbol": "MS", "name": "Morgan Stanley", "exchange": "NYSE"},
        {"symbol": "V", "name": "Visa Inc.", "exchange": "NYSE"},
        {"symbol": "MA", "name": "Mastercard", "exchange": "NYSE"},
        {"symbol": "AXP", "name": "American Express", "exchange": "NYSE"},
        {"symbol": "BLK", "name": "BlackRock", "exchange": "NYSE"},
        
        # Consumer / Retail
        {"symbol": "WMT", "name": "Walmart Inc.", "exchange": "NYSE"},
        {"symbol": "COST", "name": "Costco Wholesale", "exchange": "NASDAQ"},
        {"symbol": "HD", "name": "Home Depot", "exchange": "NYSE"},
        {"symbol": "LOW", "name": "Lowe's Companies", "exchange": "NYSE"},
        {"symbol": "MCD", "name": "McDonald's", "exchange": "NYSE"},
        {"symbol": "SBUX", "name": "Starbucks", "exchange": "NASDAQ"},
        {"symbol": "NKE", "name": "NIKE, Inc.", "exchange": "NYSE"},
        {"symbol": "PG", "name": "Procter & Gamble", "exchange": "NYSE"},
        {"symbol": "KO", "name": "Coca-Cola", "exchange": "NYSE"},
        {"symbol": "PEP", "name": "PepsiCo", "exchange": "NASDAQ"},
        {"symbol": "DIS", "name": "Walt Disney", "exchange": "NYSE"},
        
        # Healthcare
        {"symbol": "JNJ", "name": "Johnson & Johnson", "exchange": "NYSE"},
        {"symbol": "UNH", "name": "UnitedHealth Group", "exchange": "NYSE"},
        {"symbol": "PFE", "name": "Pfizer Inc.", "exchange": "NYSE"},
        {"symbol": "LLY", "name": "Eli Lilly and Company", "exchange": "NYSE"},
        {"symbol": "ABBV", "name": "AbbVie Inc.", "exchange": "NYSE"},
        {"symbol": "MRK", "name": "Merck & Co.", "exchange": "NYSE"},
        {"symbol": "TMO", "name": "Thermo Fisher Scientific", "exchange": "NYSE"},
        
        # Industrial / Energy
        {"symbol": "XOM", "name": "Exxon Mobil", "exchange": "NYSE"},
        {"symbol": "CVX", "name": "Chevron", "exchange": "NYSE"},
        {"symbol": "BA", "name": "Boeing", "exchange": "NYSE"},
        {"symbol": "CAT", "name": "Caterpillar", "exchange": "NYSE"},
        {"symbol": "GE", "name": "General Electric", "exchange": "NYSE"},
        {"symbol": "UPS", "name": "United Parcel Service", "exchange": "NYSE"},
        {"symbol": "MMM", "name": "3M Company", "exchange": "NYSE"},
        {"symbol": "HON", "name": "Honeywell", "exchange": "NASDAQ"},
        
        # Tech / Software
        {"symbol": "ADBE", "name": "Adobe Inc.", "exchange": "NASDAQ"},
        {"symbol": "CRM", "name": "Salesforce", "exchange": "NYSE"},
        {"symbol": "ORCL", "name": "Oracle", "exchange": "NYSE"},
        {"symbol": "NFLX", "name": "Netflix", "exchange": "NASDAQ"},
        {"symbol": "CSCO", "name": "Cisco Systems", "exchange": "NASDAQ"},
        {"symbol": "ACN", "name": "Accenture", "exchange": "NYSE"},
        {"symbol": "IBM", "name": "IBM", "exchange": "NYSE"},
        
        # ETFs
        {"symbol": "SPY", "name": "SPDR S&P 500 ETF", "exchange": "NYSE"},
        {"symbol": "QQQ", "name": "Invesco QQQ Trust", "exchange": "NASDAQ"},
        {"symbol": "IWM", "name": "iShares Russell 2000", "exchange": "NYSE"},
        {"symbol": "DIA", "name": "Dow Jones ETF", "exchange": "NYSE"},
        {"symbol": "ARKK", "name": "ARK Innovation ETF", "exchange": "NYSE"},
        {"symbol": "SMH", "name": "VanEck Semiconductor ETF", "exchange": "NASDAQ"},
        {"symbol": "VTI", "name": "Vanguard Total Stock Market", "exchange": "NYSE"}
    ],
    "TH": [
        # Energy & Utilities
        {"symbol": "PTT.BK", "name": "PTT Public Company", "exchange": "SET"},
        {"symbol": "PTTEP.BK", "name": "PTT Exploration & Production", "exchange": "SET"},
        {"symbol": "TOP.BK", "name": "Thai Oil", "exchange": "SET"},
        {"symbol": "GULF.BK", "name": "Gulf Energy Development", "exchange": "SET"},
        {"symbol": "EA.BK", "name": "Energy Absolute", "exchange": "SET"},
        {"symbol": "GPSC.BK", "name": "Global Power Synergy", "exchange": "SET"},
        {"symbol": "BGRIM.BK", "name": "B.Grimm Power", "exchange": "SET"},
        {"symbol": "RATCH.BK", "name": "Ratch Group", "exchange": "SET"},
        {"symbol": "EGCO.BK", "name": "Electricity Generating", "exchange": "SET"},
        {"symbol": "BANPU.BK", "name": "Banpu", "exchange": "SET"},
        {"symbol": "OR.BK", "name": "PTT Oil and Retail", "exchange": "SET"},
        {"symbol": "BCP.BK", "name": "Bangchak Corporation", "exchange": "SET"},
        {"symbol": "IVL.BK", "name": "Indorama Ventures", "exchange": "SET"},
        
        # Banking & Finance
        {"symbol": "SCB.BK", "name": "SCB X Public Company", "exchange": "SET"},
        {"symbol": "KBANK.BK", "name": "Kasikornbank", "exchange": "SET"},
        {"symbol": "BBL.BK", "name": "Bangkok Bank", "exchange": "SET"},
        {"symbol": "KTB.BK", "name": "Krung Thai Bank", "exchange": "SET"},
        {"symbol": "TTB.BK", "name": "TMBThanachart Bank", "exchange": "SET"},
        {"symbol": "TISCO.BK", "name": "Tisco Financial Group", "exchange": "SET"},
        {"symbol": "KKP.BK", "name": "Kiatnakin Phatra Bank", "exchange": "SET"},
        {"symbol": "SAWAD.BK", "name": "Srisawad Corporation", "exchange": "SET"},
        {"symbol": "MTC.BK", "name": "Muangthai Capital", "exchange": "SET"},
        {"symbol": "TIDLOR.BK", "name": "Ngern Tid Lor", "exchange": "SET"},
        {"symbol": "JMT.BK", "name": "JMT Network Services", "exchange": "SET"},
        {"symbol": "BAM.BK", "name": "Bangkok Commercial Asset Mgt", "exchange": "SET"},
        
        # Commerce / Retail
        {"symbol": "CPALL.BK", "name": "CP ALL", "exchange": "SET"},
        {"symbol": "CPAXT.BK", "name": "CP Axtra (Makro)", "exchange": "SET"},
        {"symbol": "CRC.BK", "name": "Central Retail Corporation", "exchange": "SET"},
        {"symbol": "CPN.BK", "name": "Central Pattana", "exchange": "SET"},
        {"symbol": "HMPRO.BK", "name": "Home Product Center", "exchange": "SET"},
        {"symbol": "GLOBAL.BK", "name": "Siam Global House", "exchange": "SET"},
        {"symbol": "COM7.BK", "name": "COM7", "exchange": "SET"},
        {"symbol": "JMART.BK", "name": "Jaymart Group", "exchange": "SET"},
        
        # Transport & Logistics
        {"symbol": "AOT.BK", "name": "Airports of Thailand", "exchange": "SET"},
        {"symbol": "BEM.BK", "name": "Bangkok Expressway and Metro", "exchange": "SET"},
        {"symbol": "BTS.BK", "name": "BTS Group Holdings", "exchange": "SET"},
        {"symbol": "AAV.BK", "name": "Asia Aviation", "exchange": "SET"},
        {"symbol": "WICE.BK", "name": "WICE Logistics", "exchange": "SET"},
        
        # Communication
        {"symbol": "ADVANC.BK", "name": "Advanced Info Service", "exchange": "SET"},
        {"symbol": "TRUE.BK", "name": "True Corporation", "exchange": "SET"},
        {"symbol": "INTUCH.BK", "name": "Intouch Holdings", "exchange": "SET"},
        
        # Property / Construction
        {"symbol": "SCC.BK", "name": "Siam Cement Group", "exchange": "SET"},
        {"symbol": "LH.BK", "name": "Land and Houses", "exchange": "SET"},
        {"symbol": "SPALI.BK", "name": "Supalai", "exchange": "SET"},
        {"symbol": "AP.BK", "name": "AP (Thailand)", "exchange": "SET"},
        {"symbol": "SIRI.BK", "name": "Sansiri", "exchange": "SET"},
        {"symbol": "AWC.BK", "name": "Asset World Corp", "exchange": "SET"},
        {"symbol": "WHA.BK", "name": "WHA Corporation", "exchange": "SET"},
        {"symbol": "AMATA.BK", "name": "Amata Corporation", "exchange": "SET"},
        
        # Healthcare
        {"symbol": "BDMS.BK", "name": "Bangkok Dusit Medical Services", "exchange": "SET"},
        {"symbol": "BH.BK", "name": "Bumrungrad Hospital", "exchange": "SET"},
        {"symbol": "BCH.BK", "name": "Bangkok Chain Hospital", "exchange": "SET"},
        {"symbol": "CHG.BK", "name": "Chularat Hospital", "exchange": "SET"},
        
        # Electronics
        {"symbol": "DELTA.BK", "name": "Delta Electronics", "exchange": "SET"},
        {"symbol": "KCE.BK", "name": "KCE Electronics", "exchange": "SET"},
        {"symbol": "HANA.BK", "name": "Hana Microelectronics", "exchange": "SET"},
        
        # Food & Agri
        {"symbol": "CPF.BK", "name": "Charoen Pokphand Foods", "exchange": "SET"},
        {"symbol": "TU.BK", "name": "Thai Union Group", "exchange": "SET"},
        {"symbol": "MINT.BK", "name": "Minor International", "exchange": "SET"},
        {"symbol": "OSP.BK", "name": "Osotspa", "exchange": "SET"},
        {"symbol": "CBG.BK", "name": "Carabao Group", "exchange": "SET"},
        {"symbol": "M.BK", "name": "MK Restaurant Group", "exchange": "SET"}
    ],
    "CN": [
        {"symbol": "BABA", "name": "Alibaba Group (US Listed)", "exchange": "NYSE"},
        {"symbol": "JD", "name": "JD.com (US Listed)", "exchange": "NASDAQ"},
        {"symbol": "BIDU", "name": "Baidu (US Listed)", "exchange": "NASDAQ"},
        {"symbol": "PDD", "name": "PDD Holdings", "exchange": "NASDAQ"},
        {"symbol": "TCEHY", "name": "Tencent Holdings (OTC)", "exchange": "OTC"},
        {"symbol": "NIO", "name": "NIO Inc.", "exchange": "NYSE"},
        {"symbol": "XPEV", "name": "XPeng Inc.", "exchange": "NYSE"},
        {"symbol": "LI", "name": "Li Auto Inc.", "exchange": "NASDAQ"},
        {"symbol": "BILI", "name": "Bilibili Inc.", "exchange": "NASDAQ"},
        {"symbol": "TCOM", "name": "Trip.com Group", "exchange": "NASDAQ"},
        {"symbol": "BEKE", "name": "KE Holdings", "exchange": "NYSE"},
        {"symbol": "YUMC", "name": "Yum China Holdings", "exchange": "NYSE"},
        {"symbol": "ZTO", "name": "ZTO Express", "exchange": "NYSE"},
        {"symbol": "000001.SS", "name": "SSE Composite Index", "exchange": "SSE"},
        {"symbol": "399001.SZ", "name": "Shenzhen Component Index", "exchange": "SZSE"},
        {"symbol": "600519.SS", "name": "Kweichow Moutai", "exchange": "SSE"},
        {"symbol": "300750.SZ", "name": "CATL", "exchange": "SZSE"},
        {"symbol": "601318.SS", "name": "Ping An Insurance", "exchange": "SSE"},
        {"symbol": "600036.SS", "name": "China Merchants Bank", "exchange": "SSE"},
        {"symbol": "000858.SZ", "name": "Wuliangye Yibin", "exchange": "SZSE"},
        {"symbol": "000333.SZ", "name": "Midea Group", "exchange": "SZSE"},
        {"symbol": "601888.SS", "name": "China Tourism Group Duty Free", "exchange": "SSE"},
        {"symbol": "002594.SZ", "name": "BYD Company", "exchange": "SZSE"}, 
        {"symbol": "FXI", "name": "iShares China Large-Cap ETF", "exchange": "NYSE"},
        {"symbol": "KWEB", "name": "KraneShares CSI China Internet ETF", "exchange": "NYSE"},
        {"symbol": "MCHI", "name": "iShares MSCI China ETF", "exchange": "NASDAQ"}
    ],
    "GOLD": [
        {"symbol": "GC=F", "name": "Gold Futures (COMEX)", "exchange": "COMEX"},
        {"symbol": "XAUUSD=X", "name": "Gold Spot / US Dollar", "exchange": "CCY"},
        {"symbol": "GLD", "name": "SPDR Gold Shares", "exchange": "NYSE"},
        {"symbol": "IAU", "name": "iShares Gold Trust", "exchange": "NYSE"},
        {"symbol": "SGOL", "name": "abrdn Physical Gold Shares ETF", "exchange": "NYSE"},
        {"symbol": "OUNZ", "name": "VanEck Merk Gold Trust", "exchange": "NYSE"},
        {"symbol": "BAR", "name": "GraniteShares Gold Trust", "exchange": "NYSE"},
        {"symbol": "NEM", "name": "Newmont Corporation (Miner)", "exchange": "NYSE"},
        {"symbol": "GOLD", "name": "Barrick Gold Corporation (Miner)", "exchange": "NYSE"},
        {"symbol": "AEM", "name": "Agnico Eagle Mines (Miner)", "exchange": "NYSE"},
        {"symbol": "K", "name": "Kinross Gold Corporation (Miner)", "exchange": "NYSE"},
        {"symbol": "AU", "name": "AngloGold Ashanti (Miner)", "exchange": "NYSE"},
        {"symbol": "GDX", "name": "VanEck Gold Miners ETF", "exchange": "NYSE"},
        {"symbol": "GDXJ", "name": "VanEck Junior Gold Miners ETF", "exchange": "NYSE"},
        {"symbol": "FNV", "name": "Franco-Nevada Corporation", "exchange": "NYSE"},
        {"symbol": "WPM", "name": "Wheaton Precious Metals", "exchange": "NYSE"}
    ]
}

def get_tickers_by_market(market: str):
    return STOCK_LISTS.get(market.upper(), [])
