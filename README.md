# 🎓 Activity Hub - SNRU

ระบบบันทึกการเข้าร่วมกิจกรรมนักศึกษา คณะครุศาสตร์ มหาวิทยาลัยราชภัฏสกลนคร

## ✨ ฟีเจอร์หลัก

### 👨‍🎓 สำหรับนักศึกษา
- เข้าสู่ระบบ / ลงทะเบียน
- สแกน QR Code เพื่อเช็คอินเข้าร่วมกิจกรรม
- ประเมินความพึงพอใจ (1-5 ดาว + ความคิดเห็น)
- ดูประวัติการเช็คอินพร้อมคะแนนที่เคยให้

### 👨‍🏫 สำหรับอาจารย์/เจ้าหน้าที่
- สร้าง / แก้ไข / ลบ กิจกรรม (CRUD)
- สร้าง QR Code อัตโนมัติสำหรับแต่ละกิจกรรม
- ดูรายชื่อนักศึกษาที่เช็คอิน พร้อมจำนวนรวม
- วิเคราะห์ผลประเมินความพึงพอใจ (คะแนนเฉลี่ย, กราฟ, ความคิดเห็น)
- ส่งออกรายงานเป็น CSV (รองรับภาษาไทย)
- พิมพ์รายงาน / บันทึกเป็น PDF

## 🛠 เทคโนโลยี

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide React Icons
- **Backend:** Firebase (Auth + Firestore)
- **Hosting:** Firebase Hosting (Static Export)
- **QR:** Browser BarcodeDetector API + QR Server API

## 📁 โครงสร้างโปรเจกต์

```
activity-hub/
├── public/              # ไฟล์ static (favicon, logo)
├── src/
│   ├── app/
│   │   ├── page.tsx                    # หน้า Login
│   │   ├── layout.tsx                  # Layout หลัก
│   │   ├── globals.css                 # CSS ทั้งระบบ
│   │   ├── register/page.tsx           # หน้าลงทะเบียน
│   │   ├── student/
│   │   │   ├── dashboard/page.tsx      # Dashboard นักศึกษา
│   │   │   └── scan/page.tsx           # สแกน QR + ประเมิน
│   │   └── lecturer/
│   │       └── dashboard/page.tsx      # Dashboard อาจารย์
│   ├── components/
│   │   └── StarRating.tsx              # Component ให้คะแนนดาว
│   └── firebase/
│       └── config.ts                   # Firebase configuration
├── firebase.json        # Firebase Hosting config
├── .firebaserc          # Firebase project ID
├── next.config.js       # Next.js config (static export)
├── tailwind.config.js   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies
```

## 🚀 วิธีติดตั้งและ Deploy

### ขั้นตอนที่ 1: ติดตั้ง Dependencies

```bash
# ต้องมี Node.js 18+ ติดตั้งในเครื่องก่อน
# ดาวน์โหลดได้ที่: https://nodejs.org/

cd activity-hub
npm install
```

### ขั้นตอนที่ 2: ทดสอบบนเครื่อง (Development)

```bash
npm run dev
```
เปิด http://localhost:3000 ในเบราว์เซอร์

### ขั้นตอนที่ 3: Build สำหรับ Production

```bash
npm run build
```
ไฟล์ที่ build แล้วจะอยู่ในโฟลเดอร์ `out/`

### ขั้นตอนที่ 4: Deploy ขึ้น Firebase Hosting

```bash
# ติดตั้ง Firebase CLI (ทำครั้งเดียว)
npm install -g firebase-tools

# Login เข้า Firebase
firebase login

# Deploy
firebase deploy --only hosting
```

เว็บไซต์จะพร้อมใช้งานที่:
**https://studio-960211918-17fe3.web.app**

## ⚙️ ตั้งค่า Firebase (ถ้ายังไม่เคยตั้ง)

### Firestore Rules
ไปที่ Firebase Console > Firestore Database > Rules แล้ววาง:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อนุญาตให้ผู้ใช้ที่ login แล้วอ่านเขียนได้
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /checkins/{checkinId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### เปิดใช้ Authentication
1. ไปที่ Firebase Console > Authentication > Sign-in method
2. เปิดใช้ **Email/Password**

## 📱 การใช้งาน

### สำหรับนักศึกษา
1. กดปุ่ม **"ลงทะเบียน"** ที่หน้าแรก
2. กรอกข้อมูลและเลือก **"นักศึกษา"**
3. เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
4. กดปุ่ม **"สแกน QR Code"**
5. เปิดกล้องแล้วส่องไปที่ QR Code ของกิจกรรม
6. ให้คะแนนประเมินและกดส่ง

### สำหรับอาจารย์
1. ลงทะเบียนและเลือก **"อาจารย์"**
2. เข้าสู่ระบบ → เข้าหน้า Dashboard
3. กด **"สร้างกิจกรรมใหม่"** เพื่อสร้างกิจกรรม
4. กดปุ่ม **"QR"** เพื่อแสดง/ดาวน์โหลด QR Code
5. กดปุ่ม **"รายชื่อ"** เพื่อดูรายชื่อเช็คอิน + ผลประเมิน
6. กดปุ่ม **"ส่งออก CSV"** หรือ **"พิมพ์"** เพื่อสร้างรายงาน

## 📝 หมายเหตุ

- QR Scanner ใช้ BarcodeDetector API ซึ่งรองรับ Chrome, Edge, Android
  หากเบราว์เซอร์ไม่รองรับ สามารถกรอกรหัสกิจกรรมด้วยมือได้
- ระบบรองรับ Mobile First (Responsive 100%)
- รายงานที่พิมพ์ออกมาจะมีรูปแบบสวยงามพร้อมใช้งาน

---
**คณะครุศาสตร์ มหาวิทยาลัยราชภัฏสกลนคร**
