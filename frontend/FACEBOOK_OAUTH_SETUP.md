# Facebook OAuth Setup Guide

## ขั้นตอนการตั้งค่า Facebook OAuth

### 1. สร้าง Facebook App

1. ไปที่ [Facebook Developers](https://developers.facebook.com/)
2. คลิก **My Apps** > **Create App**
3. เลือก **Consumer** เป็น App type
4. ตั้งชื่อ App (เช่น "Trading Agents Web App")
5. ใส่ Contact Email
6. คลิก **Create App**

### 2. เพิ่ม Facebook Login Product

1. ในหน้า App Dashboard คลิก **Add Product**
2. ค้นหา **Facebook Login** และคลิก **Set Up**
3. เลือก **Web** เป็น platform

### 3. ตั้งค่า Facebook Login

1. ไปที่ **Facebook Login** > **Settings**
2. ตั้งค่า **Valid OAuth Redirect URIs**:
   - สำหรับ development: `http://localhost:3000`
   - สำหรับ production: `https://yourdomain.com`
3. ตั้งค่า **Allowed Domains for the JavaScript SDK**:
   - สำหรับ development: `localhost`
   - สำหรับ production: `yourdomain.com`

### 4. ตั้งค่า App Domains

1. ไปที่ **Settings** > **Basic**
2. เพิ่ม **App Domains**:
   - สำหรับ development: `localhost`
   - สำหรับ production: `yourdomain.com`
3. เพิ่ม **Site URL**:
   - สำหรับ development: `http://localhost:3000`
   - สำหรับ production: `https://yourdomain.com`

### 5. ตั้งค่า Environment Variables

1. สร้างหรือแก้ไขไฟล์ `.env.local` ในโฟลเดอร์ `frontend/`
2. เพิ่ม Facebook App ID:

```env
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id_here
```

**ตัวอย่าง:**
```env
NEXT_PUBLIC_FACEBOOK_APP_ID=1234567890123456
```

### 6. รีสตาร์ท Development Server

```bash
# หยุด server ที่กำลังรัน (Ctrl+C)
# แล้วรันใหม่
npm run dev
```

### 7. ทดสอบ

1. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000/Auth/register` หรือ `http://localhost:3000/Auth/login`
2. คลิกปุ่ม **Facebook**
3. ควรจะเห็น Facebook Login popup
4. เลือก Facebook Account และอนุญาตการเข้าถึง
5. ระบบจะ login/register อัตโนมัติ

## หมายเหตุ

- **App ID** จะอยู่ในหน้า **Settings** > **Basic** ใน Facebook Developers
- สำหรับ development ต้องเพิ่ม `localhost` ใน App Domains และ Valid OAuth Redirect URIs
- อย่า commit ไฟล์ `.env.local` ลงใน Git
- Facebook App ต้องอยู่ใน **Development Mode** สำหรับการทดสอบ (สามารถเพิ่ม Test Users ได้)

## Troubleshooting

### Error: "Facebook Sign-In is not configured"
- ตรวจสอบว่าไฟล์ `.env.local` มีอยู่และตั้งค่าถูกต้อง
- ตรวจสอบว่า environment variable ชื่อ `NEXT_PUBLIC_FACEBOOK_APP_ID` ถูกต้อง
- รีสตาร์ท development server หลังจากแก้ไข `.env.local`

### Error: "Invalid OAuth Redirect URI"
- ตรวจสอบว่า Valid OAuth Redirect URIs ใน Facebook App Settings ตรงกับ URL ของคุณ
- สำหรับ development ต้องเป็น `http://localhost:3000` (ไม่ใช่ `https://`)

### Error: "App Not Setup"
- ตรวจสอบว่า Facebook Login Product ถูกเพิ่มแล้ว
- ตรวจสอบว่า App Domains และ Site URL ถูกตั้งค่าแล้ว

### Error: "Invalid App ID"
- ตรวจสอบว่า App ID ถูกต้องและคัดลอกมาครบถ้วน
- ตรวจสอบว่า App อยู่ในสถานะ Active














