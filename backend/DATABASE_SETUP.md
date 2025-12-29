# Database Setup Guide

## วิธีแก้ปัญหา "Database error while checking user"

### 1. ตรวจสอบ Database Connection

รันสคริปต์ตรวจสอบ:
```bash
cd backend
python check_database.py
```

สคริปต์นี้จะ:
- ตรวจสอบการเชื่อมต่อ database
- สร้าง tables อัตโนมัติถ้ายังไม่มี
- แสดง error message ที่ชัดเจน

### 2. ตั้งค่า DATABASE_URL

ตรวจสอบไฟล์ `.env` ในโฟลเดอร์ `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/trading_db
```

**แก้ไขให้ตรงกับ:**
- `username`: ชื่อผู้ใช้ PostgreSQL ของคุณ (เช่น `postgres`)
- `password`: รหัสผ่าน PostgreSQL ของคุณ
- `localhost:5432`: host และ port (default: localhost:5432)
- `trading_db`: ชื่อ database

### 3. สร้าง Database (ถ้ายังไม่มี)

#### Windows (ใช้ Command Prompt หรือ PowerShell):
```bash
# เชื่อมต่อ PostgreSQL
psql -U postgres

# หรือถ้าใช้ pgAdmin, เปิด pgAdmin และสร้าง database ผ่าน GUI
```

#### ใน PostgreSQL:
```sql
-- สร้าง database
CREATE DATABASE trading_db;

-- สร้าง user (ถ้ายังไม่มี)
CREATE USER your_username WITH PASSWORD 'your_password';

-- ให้สิทธิ์
GRANT ALL PRIVILEGES ON DATABASE trading_db TO your_username;
```

### 4. ตรวจสอบว่า PostgreSQL กำลังรันอยู่

#### Windows:
- เปิด **Services** (กด Win+R แล้วพิมพ์ `services.msc`)
- หา **postgresql** service
- ตรวจสอบว่า status เป็น **Running**

#### หรือใช้ Command Prompt:
```bash
# ตรวจสอบว่า PostgreSQL กำลังรัน
sc query postgresql-x64-XX  # XX = version number
```

### 5. เริ่มต้น Backend Server

หลังจากตั้งค่า database แล้ว:

```bash
cd backend
python start_api.py
```

หรือ:

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. ตรวจสอบ Logs

เมื่อเริ่ม backend server ควรเห็น:
```
✅ Database initialized
```

ถ้าเห็น error ให้ดู error message ที่แสดง

## Troubleshooting

### Error: "could not connect to server"
- **สาเหตุ**: PostgreSQL ไม่ได้รันอยู่
- **แก้ไข**: เริ่ม PostgreSQL service

### Error: "authentication failed"
- **สาเหตุ**: username หรือ password ผิด
- **แก้ไข**: ตรวจสอบ DATABASE_URL ในไฟล์ `.env`

### Error: "database does not exist"
- **สาเหตุ**: database ยังไม่ได้สร้าง
- **แก้ไข**: สร้าง database ตามขั้นตอนที่ 3

### Error: "relation does not exist"
- **สาเหตุ**: tables ยังไม่ได้สร้าง
- **แก้ไข**: รัน `python check_database.py` เพื่อสร้าง tables

## ตัวอย่าง DATABASE_URL

```env
# สำหรับ PostgreSQL default installation
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/trading_db

# สำหรับ custom user
DATABASE_URL=postgresql+asyncpg://myuser:mypassword@localhost:5432/trading_db

# สำหรับ remote database
DATABASE_URL=postgresql+asyncpg://user:password@remote-host:5432/trading_db
```

## หมายเหตุ

- ไฟล์ `.env` ควรอยู่ในโฟลเดอร์ `backend/`
- อย่า commit ไฟล์ `.env` ลงใน Git (ควรอยู่ใน `.gitignore`)
- ใช้ `check_database.py` เพื่อตรวจสอบก่อนเริ่ม server

















