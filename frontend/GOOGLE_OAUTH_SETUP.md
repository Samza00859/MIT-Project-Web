# Google OAuth Setup Guide

## ขั้นตอนการตั้งค่า Google OAuth

### 1. สร้าง Google OAuth Client ID

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่หรือเลือกโปรเจกต์ที่มีอยู่
3. เปิดใช้งาน Google+ API:
   - ไปที่ **APIs & Services** > **Library**
   - ค้นหา "Google+ API" หรือ "Google Identity Services"
   - คลิก **Enable**

4. สร้าง OAuth 2.0 Client ID:
   - ไปที่ **APIs & Services** > **Credentials**
   - คลิก **Create Credentials** > **OAuth client ID**
   - เลือก **Web application** เป็น Application type
   - ตั้งชื่อ (เช่น "Trading Agents Web App")

5. ตั้งค่า Authorized JavaScript origins:
   - สำหรับ development: `http://localhost:3000`
   - สำหรับ production: `https://yourdomain.com`

6. ตั้งค่า Authorized redirect URIs (ถ้าจำเป็น):
   - สำหรับ development: `http://localhost:3000`
   - สำหรับ production: `https://yourdomain.com`

7. คลิก **Create** และคัดลอก **Client ID**

### 2. ตั้งค่า Environment Variables

1. สร้างไฟล์ `.env.local` ในโฟลเดอร์ `frontend/`:
   ```bash
   cd frontend
   touch .env.local
   ```

2. เพิ่ม Google Client ID ในไฟล์ `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

   **ตัวอย่าง:**
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   ```

### 3. รีสตาร์ท Development Server

```bash
# หยุด server ที่กำลังรัน (Ctrl+C)
# แล้วรันใหม่
npm run dev
```

### 4. ทดสอบ

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000/Auth/register` หรือ `http://localhost:3000/Auth/login`
2. คลิกปุ่ม **Google**
3. ควรจะเห็น Google Sign-In popup

## หมายเหตุ

- **อย่า commit ไฟล์ `.env.local`** ลงใน Git (ไฟล์นี้อยู่ใน `.gitignore` แล้ว)
- Client ID ที่ได้จาก Google Cloud Console จะมีรูปแบบ: `xxxxx-xxxxx.apps.googleusercontent.com`
- สำหรับ production ต้องตั้งค่า Authorized JavaScript origins ให้ตรงกับ domain ของคุณ

## Troubleshooting

### Error: "Google Sign-In is not configured"
- ตรวจสอบว่าไฟล์ `.env.local` มีอยู่และตั้งค่าถูกต้อง
- ตรวจสอบว่า environment variable ชื่อ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ถูกต้อง
- รีสตาร์ท development server หลังจากแก้ไข `.env.local`

### Error: "redirect_uri_mismatch"
- ตรวจสอบว่า Authorized JavaScript origins ใน Google Cloud Console ตรงกับ URL ของคุณ
- สำหรับ development ต้องเป็น `http://localhost:3000` (ไม่ใช่ `https://`)

### Error: "Invalid client"
- ตรวจสอบว่า Client ID ถูกต้องและคัดลอกมาครบถ้วน
- ตรวจสอบว่าโปรเจกต์ใน Google Cloud Console ถูกต้อง

