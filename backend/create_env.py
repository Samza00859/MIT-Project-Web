"""
Script to help create .env file for Gmail App Password setup
"""
import os
from pathlib import Path

def create_env_file():
    """Create .env file with user input"""
    env_path = Path(__file__).parent / ".env"
    
    if env_path.exists():
        print("⚠️  ไฟล์ .env มีอยู่แล้ว!")
        response = input("ต้องการเขียนทับหรือไม่? (y/n): ")
        if response.lower() != 'y':
            print("ยกเลิกการสร้างไฟล์")
            return
    
    print("\n" + "="*60)
    print("ตั้งค่าไฟล์ .env สำหรับ Gmail App Password")
    print("="*60 + "\n")
    
    print("📧 Gmail Email Settings:")
    email_username = input("ใส่อีเมล Gmail ของคุณ (เช่น: yourname@gmail.com): ").strip()
    
    if not email_username or "@gmail.com" not in email_username:
        print("⚠️  กรุณาใส่อีเมล Gmail ที่ถูกต้อง")
        return
    
    print("\n🔑 Gmail App Password:")
    print("   หากยังไม่มี App Password:")
    print("   1. ไปที่ https://myaccount.google.com/apppasswords")
    print("   2. สร้าง App Password สำหรับ 'Mail'")
    print("   3. คัดลอกรหัสผ่าน 16 ตัวอักษร\n")
    
    email_password = input("ใส่ Gmail App Password (16 ตัวอักษร): ").strip().replace(" ", "")
    
    if len(email_password) != 16:
        print("⚠️  Gmail App Password ต้องมี 16 ตัวอักษร")
        response = input("ต้องการดำเนินการต่อหรือไม่? (y/n): ")
        if response.lower() != 'y':
            return
    
    print("\n🔐 JWT Secret Key:")
    secret_key = input("ใส่ Secret Key (หรือกด Enter เพื่อใช้ค่าเริ่มต้น): ").strip()
    if not secret_key:
        secret_key = "your-secret-key-change-this-in-production"
    
    print("\n🌐 Frontend URL:")
    frontend_url = input("ใส่ Frontend URL (หรือกด Enter เพื่อใช้ http://localhost:3000): ").strip()
    if not frontend_url:
        frontend_url = "http://localhost:3000"
    
    # Create .env content
    env_content = f"""# JWT Settings
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Settings (Gmail SMTP)
# IMPORTANT: Use Gmail App Password, NOT your regular Gmail password
EMAIL_USERNAME={email_username}
EMAIL_PASSWORD={email_password}
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Frontend URL (for email verification links)
FRONTEND_URL={frontend_url}

# API Keys (for TradingAgents)
OPENAI_API_KEY=your_openai_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key

# Telegram Bot Settings (optional)
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
"""
    
    # Write to file
    try:
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print("\n✅ สร้างไฟล์ .env สำเร็จ!")
        print(f"📁 ตำแหน่งไฟล์: {env_path}")
        print("\n⚠️  หมายเหตุ:")
        print("   - อย่า commit ไฟล์ .env ขึ้น Git")
        print("   - ไฟล์นี้มีข้อมูลลับ")
        print("\n🔄 กรุณา restart Backend เพื่อให้การตั้งค่าใหม่มีผล")
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    create_env_file()












