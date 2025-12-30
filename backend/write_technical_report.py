from fpdf import FPDF
import os
from datetime import datetime

class ReportPDF(FPDF):
    def __init__(self):
        super().__init__(format='A4', unit='mm')
        self.set_margins(left=15, top=20, right=15)
        self.set_auto_page_break(auto=True, margin=15)
    
    def header(self):
        # Main Title
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(0, 51, 102) # Dark Blue
        self.cell(0, 8, 'TECHNICAL REPORT', ln=1)
        
        # Subtitle
        self.set_font('Helvetica', '', 12)
        self.set_text_color(100, 100, 100) # Grey
        self.cell(0, 6, 'TradingAgents Platform - Architecture & Maintenance', ln=1)
        
        # Separator Line
        self.set_draw_color(0, 51, 102)
        self.set_line_width(0.3)
        self.line(15, self.get_y() + 4, 195, self.get_y() + 4)
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 3, f'Page {self.page_no()}', align='R', ln=1)
        self.cell(0, 3, f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', align='R')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(0, 51, 102)
        self.set_fill_color(240, 245, 255) # Light Blue Background
        self.cell(0, 8, f'  {title}', ln=1, fill=True)
        self.ln(3)

    def sub_chapter_title(self, title):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(0, 0, 0)
        self.cell(0, 6, title, ln=1)

    def body_text(self, text, indent=0):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(0, 0, 0)
        if indent > 0:
            self.cell(indent)
        self.multi_cell(0, 5, text)
        self.ln(1)
        
    def bullet_point(self, text, indent=5):
        self.set_font('Helvetica', '', 10)
        # Move to start position + indent
        self.set_x(self.l_margin + indent)
        # Draw bullet
        self.cell(5, 5, '-', align='C')
        # Multi_cell will automatically wrap. It uses current X.
        # But we want the text to indent on new lines too? 
        # FPDF1 simple bullet:
        # Just use multi_cell for text.
        self.multi_cell(0, 5, text)
    
    def status_line(self, label, status, indent=5):
        self.set_font('Helvetica', 'B', 10)
        self.set_x(self.l_margin + indent)
        self.cell(40, 5, f"{label}:")
        self.set_font('Helvetica', '', 10)
        self.multi_cell(0, 5, status)

def create_technical_report(filename):
    pdf = ReportPDF()
    pdf.add_page()
    
    # 1. TECHNICAL STACK
    pdf.chapter_title('1. TECHNOLOGY STACK')
    
    pdf.sub_chapter_title('1.1 Frontend')
    pdf.bullet_point('Framework: Next.js 16.0.6 (React 19.2.0)')
    pdf.bullet_point('Language: TypeScript 5.9.3')
    pdf.bullet_point('Styling: TailwindCSS 4.1.17')
    pdf.bullet_point('Bundler: Webpack (Turbopack disabled due to Unicode issues)')
    pdf.bullet_point('PDF Export: jsPDF 3.0.4')
    pdf.ln(2)
    
    pdf.sub_chapter_title('1.2 Backend')
    pdf.bullet_point('Framework: FastAPI 0.116.2')
    pdf.bullet_point('Language: Python 3.12')
    pdf.bullet_point('ORM: SQLAlchemy 2.0.45 (async)')
    pdf.bullet_point('Agent Framework: LangGraph 1.0.1')
    pdf.bullet_point('LLM Integration: Google GenAI, OpenAI, Anthropic')
    pdf.ln(2)
    
    pdf.sub_chapter_title('1.3 Infrastructure')
    pdf.bullet_point('Containerization: Docker & Docker Compose')
    pdf.bullet_point('Database: PostgreSQL 16')
    pdf.bullet_point('Management UI: PgAdmin 4')
    pdf.ln(4)

    # 2. SYSTEM ARCHITECTURE
    pdf.chapter_title('2. SYSTEM ARCHITECTURE')
    pdf.sub_chapter_title('2.1 Core Structure')
    pdf.bullet_point('Frontend: Next.js Pages (Generate, History, Contact), WebSocket Client')
    pdf.bullet_point('Backend: FastAPI REST Endpoints + WebSocket Handler')
    pdf.bullet_point('Agent System: TradingAgentsGraph (LangGraph)')
    pdf.bullet_point('Data Layer: PostgreSQL (ExecutionHistory, ReportResult)')
    pdf.ln(2)

    pdf.sub_chapter_title('2.2 Multi-Agent Teams')
    pdf.bullet_point('Market Analyst: Technical indicators (RSI, MAXD, SMA, etc.)')
    pdf.bullet_point('News/Social Analyst: Sentiment tracking (Reddit, Mastodon)')
    pdf.bullet_point('Fundamentals Analyst: Valuation & Financials')
    pdf.bullet_point('Bull/Bear Researchers: Debate framework')
    pdf.bullet_point('Risk Management: Conservative/Aggressive/Neutral analysis')
    pdf.ln(4)

    # 3. KEY FEATURES
    pdf.chapter_title('3. ALGORITHMIC & API FEATURES')
    pdf.sub_chapter_title('3.1 Real-time Analysis')
    pdf.bullet_point('Streaming: WebSocket-based live updates')
    pdf.bullet_point('Tracking: Per-agent progress monitoring')
    pdf.ln(2)
    
    pdf.sub_chapter_title('3.2 Security')
    pdf.bullet_point('Auth: JWT-based authentication')
    pdf.bullet_point('Hashing: bcrypt password protection')
    pdf.ln(4)

    # 4. TECHNICAL ISSUES & RESOLUTIONS
    pdf.chapter_title('4. KNOWN ISSUES & STATUS')
    
    pdf.sub_chapter_title('4.1 Critical Issues')
    pdf.status_line('Turbopack Unicode', 'Status: [WORKAROUND] using Webpack fallback')
    pdf.status_line('Google API Quota', 'Status: [OPEN] Monitoring needed')
    pdf.ln(2)

    pdf.sub_chapter_title('4.2 Resolved Issues')
    pdf.status_line('Env Loading', 'Status: [FIXED] Explicit path loading implemented')
    pdf.status_line('Port Conflicts', 'Status: [MITIGATED] Termination scripts provided')
    pdf.ln(4)

    # 5. PERFORMANCE METRICS
    pdf.chapter_title('5. PERFORMANCE CHARACTERISTICS')
    pdf.bullet_point('API Initial Start: ~2-5 seconds')
    pdf.bullet_point('Agent Execution: 30-120 seconds (Research depth dependent)')
    pdf.bullet_point('Report Generation: 5-10 seconds')
    pdf.bullet_point('Backend Memory: 500MB - 1GB')
    pdf.bullet_point('Frontend Bundle: ~2-3MB (gzipped)')
    pdf.ln(4)

    # 6. MAINTENANCE STATUS
    pdf.chapter_title('6. MAINTENANCE STATUS')
    pdf.sub_chapter_title('6.1 System Health: [OK] OPERATIONAL')
    pdf.bullet_point('Frontend: Port 3000 [OK]')
    pdf.bullet_point('Backend: Port 8000 [OK]')
    pdf.bullet_point('Database: PostgreSQL 16 [OK]')
    pdf.ln(2)

    pdf.sub_chapter_title('6.2 Recent Fixes')
    pdf.bullet_point('[FIX] pandas_ta module installed')
    pdf.bullet_point('[FIX] Google API Authentication (Application Default Credentials)')
    pdf.bullet_point('[FIX] UnboundLocalError in exception handling')
    pdf.ln(4)

    # 7. RECOMMENDATIONS
    pdf.chapter_title('7. STRATEGIC RECOMMENDATIONS')
    
    pdf.sub_chapter_title('7.1 Immediate (1-2 Weeks)')
    pdf.bullet_point('Implement quota exhaustion detection')
    pdf.bullet_point('Add model fallback mechanism')
    pdf.ln(2)
    
    pdf.sub_chapter_title('7.2 Medium-term (1-2 Months)')
    pdf.bullet_point('Add monitoring dashboard')
    pdf.bullet_point('Implement caching layer for common queries')
    pdf.ln(4)

    # 8. SUMMARY
    pdf.chapter_title('8. SUMMARY')
    pdf.bullet_point('System is fully operational for core trading tasks.')
    pdf.bullet_point('Primary maintenance focus: Quota management & Error handling.')
    pdf.bullet_point('Overall Health: GREEN (Good)')

    pdf.output(filename)
    print(f"Technical Report created successfully: {filename}")

if __name__ == "__main__":
    create_technical_report('Technical_Report_TradingAgents.pdf')
