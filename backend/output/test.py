import streamlit as st
import json
import os

# Load Data
# Assuming the script is run from backend/output or we need to look into full/ folder
base_path = "full" 

def load_json(filename):
    # Try current directory + full/
    path = os.path.join(os.path.dirname(__file__), base_path, filename)
    if not os.path.exists(path):
        # Fallback if running from backend root
        path = os.path.join("output", base_path, filename)
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        st.error(f"File not found: {path}")
        return {}

# Load variable data
data_debate = load_json("full_neutral.json") 
data_funda = load_json("full_funda.json")
data_news = load_json("full_news.json")

# ==========================================
# ส่วนแสดงผล (User Interface)
# ==========================================

# สร้าง Tab เพื่อแยกหมวดหมู่ข้อมูล
tab1, tab2, tab3 = st.tabs(["🗣️ Debate Analysis", "📊 Fundamentals", "📰 News & Sentiment"])

# --- TAB 1: การแสดงผลไฟล์กลุ่ม Debate (ต้องแกะ JSON ซ้อน) ---
with tab1:
    st.header("Debate: Aggressive/Neutral/Safe")
    
    if data_debate:
        # 1. ดึง String ออกมาก่อน
        raw_decision = data_debate.get("judge_decision", "{}")
        
        # 2. แปลง String ให้เป็น Object (หัวใจสำคัญคือบรรทัดนี้)
        try:
            if isinstance(raw_decision, str):
                decision_obj = json.loads(raw_decision)
            else:
                decision_obj = raw_decision
        except json.JSONDecodeError:
            decision_obj = {"recommendation": "Error", "reasoning": "Could not parse JSON", "refined_trader_plan": ""}
        
        # แสดงผลเฉพาะข้อความ
        st.subheader(f"Recommendation: {decision_obj.get('recommendation', 'N/A')}")
        
        st.info(f"**Reasoning:**\n\n{decision_obj.get('reasoning', 'N/A')}")
        st.warning(f"**Plan:**\n\n{decision_obj.get('refined_trader_plan', 'N/A')}")
        
        st.divider()
        st.markdown("### Analyst Quotes")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Risky View:**")
            st.write(data_debate.get("current_risky_response", "N/A"))
        with col2:
            st.markdown("**Safe View:**")
            st.write(data_debate.get("current_safe_response", "N/A"))

# --- TAB 2: การแสดงผลไฟล์กลุ่ม Fundamental (List ธรรมดา) ---
with tab2:
    st.header("Fundamental Data")
    
    if data_funda:
        # แสดงข้อความตรงๆ
        st.markdown(f"**Status:** `{data_funda.get('valuation_status', 'N/A')}`")
        st.write(data_funda.get('executive_summary', 'N/A'))
        
        st.subheader("Key Strengths")
        # วนลูป (Loop) เพื่อดึงข้อความใน List ออกมาแสดงทีละบรรทัด
        strengths = data_funda.get('key_strengths_analysis', [])
        if isinstance(strengths, list):
            for point in strengths:
                st.markdown(f"✅ {point}")
        else:
             st.write(strengths)

# --- TAB 3: การแสดงผลไฟล์กลุ่ม News (List of Objects) ---
with tab3:
    st.header("Market News")
    
    if data_news:
        st.write(data_news.get('executive_summary', 'N/A'))
        
        st.subheader("Top Developments")
        # วนลูปดึงหัวข้อข่าว
        developments = data_news.get('top_news_developments', [])
        if isinstance(developments, list):
            for news in developments:
                with st.expander(f"{news.get('sentiment', 'N/A')}: {news.get('headline', 'N/A')}"):
                    st.write(f"**Implication:** {news.get('implication', 'N/A')}")
        else:
            st.write(developments)