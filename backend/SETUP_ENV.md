# วิธีตั้งค่าไฟล์ .env สำหรับ Gmail App Password

## ขั้นตอนที่ 1: สร้าง Gmail App Password

1. ไปที่ [Google Account Settings](https://myaccount.google.com/)
2. คลิกที่ **Security** (ความปลอดภัย) ในเมนูด้านซ้าย
3. เปิดใช้งาน **2-Step Verification** (การยืนยันตัวตน 2 ขั้นตอน) ถ้ายังไม่ได้เปิด
4. หลังจากเปิด 2-Step Verification แล้ว:
   - เลื่อนลงไปหา **App Passwords** (รหัสผ่านของแอป)
   - หรือไปที่: https://myaccount.google.com/apppasswords
5. คลิก **Select app** → เลือก **Mail**
6. คลิก **Select device** → เลือก **Other (Custom name)** → พิมพ์ "TradingAgents"
7. คลิก **Generate** (สร้าง)
8. Google จะแสดงรหัสผ่าน 16 ตัวอักษร (เช่น: `abcd efgh ijkl mnop`)
9. **คัดลอกรหัสผ่านนี้** (ไม่ต้องมีช่องว่าง)

## ขั้นตอนที่ 2: สร้างไฟล์ .env

1. ไปที่โฟลเดอร์ `backend/`
2. สร้างไฟล์ใหม่ชื่อ `.env` (ไม่มีนามสกุล)
3. คัดลอกเนื้อหาด้านล่างไปใส่ในไฟล์ `.env`:

```env
# JWT Settings
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Settings (Gmail SMTP)
# IMPORTANT: Use Gmail App Password, NOT your regular Gmail password
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Frontend URL (for email verification links)
FRONTEND_URL=http://localhost:3000

# API Keys (for TradingAgents)
OPENAI_API_KEY=your_openai_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key

# Telegram Bot Settings (optional)
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

4. แก้ไขค่าต่อไปนี้:
   - `EMAIL_USERNAME`: ใส่อีเมล Gmail ของคุณ (เช่น: `yourname@gmail.com`)
   - `EMAIL_PASSWORD`: ใส่ Gmail App Password ที่สร้างไว้ (16 ตัวอักษร ไม่มีช่องว่าง)
   - `SECRET_KEY`: สร้างรหัสลับที่แข็งแกร่ง (ใช้สำหรับ JWT tokens)

## ตัวอย่างไฟล์ .env ที่ถูกต้อง

```env
# JWT Settings
SECRET_KEY=my-super-secret-key-12345-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Settings (Gmail SMTP)
EMAIL_USERNAME=yourname@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## หมายเหตุสำคัญ

⚠️ **อย่าใช้รหัสผ่าน Gmail ปกติ** ต้องใช้ App Password เท่านั้น

⚠️ **อย่า commit ไฟล์ .env ขึ้น Git** ไฟล์นี้มีข้อมูลลับ

⚠️ **Gmail App Password จะมี 16 ตัวอักษร** (ไม่มีช่องว่าง)

## ทดสอบการตั้งค่า

หลังจากตั้งค่าแล้ว ให้ restart Backend:

```bash
cd backend
python start_api.py
```

ตรวจสอบ logs ว่ามีข้อความ:
- ✅ "Email configuration validated" = ตั้งค่าถูกต้อง
- ⚠️ "EMAIL_USERNAME not configured" = ยังไม่ได้ตั้งค่า













