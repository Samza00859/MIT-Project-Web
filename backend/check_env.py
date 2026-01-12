"""Check if .env file exists and show configuration"""
import os
from pathlib import Path

env_path = Path(__file__).parent / ".env"

print("=" * 60)
print("ตรวจสอบไฟล์ .env")
print("=" * 60)

if env_path.exists():
    print(f"\n✅ พบไฟล์ .env ที่: {env_path.absolute()}")
    print(f"ขนาดไฟล์: {env_path.stat().st_size} bytes")
    
    # Read and show content (hide sensitive data)
    with open(env_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"\nจำนวนบรรทัด: {len(lines)}")
    print("\nเนื้อหาบางส่วน (ซ่อนข้อมูลลับ):")
    print("-" * 60)
    
    for i, line in enumerate(lines[:20], 1):
        line = line.strip()
        if not line or line.startswith('#'):
            print(f"{i:3}: {line}")
        else:
            # Hide sensitive values
            if '=' in line:
                key, value = line.split('=', 1)
                if 'PASSWORD' in key.upper() or 'SECRET' in key.upper() or 'KEY' in key.upper():
                    if value and value != '':
                        masked_value = '*' * min(len(value), 8) + '...' if len(value) > 8 else '*' * len(value)
                        print(f"{i:3}: {key}={masked_value}")
                    else:
                        print(f"{i:3}: {key}=")
                else:
                    print(f"{i:3}: {line}")
            else:
                print(f"{i:3}: {line}")
    
    # Check required variables
    print("\n" + "-" * 60)
    print("ตรวจสอบ Environment Variables:")
    print("-" * 60)
    
    from dotenv import load_dotenv
    load_dotenv(env_path)
    
    required_vars = {
        'EMAIL_USERNAME': os.getenv('EMAIL_USERNAME'),
        'EMAIL_PASSWORD': os.getenv('EMAIL_PASSWORD'),
        'SMTP_USERNAME': os.getenv('SMTP_USERNAME'),
        'SMTP_PASSWORD': os.getenv('SMTP_PASSWORD'),
        'EMAIL_SENDING': os.getenv('EMAIL_SENDING'),
        'SECRET_KEY': os.getenv('SECRET_KEY'),
        'FRONTEND_URL': os.getenv('FRONTEND_URL'),
    }
    
    for var_name, var_value in required_vars.items():
        if var_value and var_value not in ['your_email@gmail.com', 'your_app_password', 'your-secret-key']:
            if 'PASSWORD' in var_name or 'SECRET' in var_name or 'KEY' in var_name:
                masked = '*' * min(len(var_value), 8) + '...' if len(var_value) > 8 else '*' * len(var_value)
                print(f"✅ {var_name}: {masked}")
            else:
                print(f"✅ {var_name}: {var_value}")
        else:
            print(f"⚠️  {var_name}: ยังไม่ได้ตั้งค่า (ใช้ค่าเริ่มต้น)")
    
else:
    print(f"\n❌ ไม่พบไฟล์ .env ที่: {env_path.absolute()}")
    print("\n💡 คำแนะนำ:")
    print("   1. สร้างไฟล์ .env ในโฟลเดอร์ backend/")
    print("   2. คัดลอกจาก env.example")
    print("   3. ตั้งค่า Gmail App Password และ SECRET_KEY")

print("\n" + "=" * 60)



