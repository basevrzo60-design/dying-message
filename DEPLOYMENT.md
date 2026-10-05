# เผยแพร่หนูชีสผ่าน GitHub, Vercel และ Render

Repository: https://github.com/basevrzo60-design/dying-message

## Vercel — หน้าเกม

- ใช้โปรเจกต์เดิม dying-message ซึ่งเชื่อมกับ branch main
- Root Directory: root ของ repository
- Framework: Vite
- Install Command: npm ci --include=dev
- Build Command: npm run build:client
- Output Directory: dist
- Production environment: VITE_SERVER_URL=https://dying-message-jgyq.onrender.com
- URL หน้าเกม: https://dying-message.vercel.app

ไฟล์ vercel.json กำหนด build และ SPA rewrite ให้แล้ว VITE_SERVER_URL ถูกฝังลงในหน้าเว็บตอน build หากเปลี่ยน URL backend ต้อง redeploy หน้าเว็บ ค่า VITE_* เป็นข้อมูลสาธารณะ ห้ามใส่ secrets

## Render — เซิร์ฟเวอร์ Socket.IO

ใช้บริการเดิมที่เชื่อมกับ repository และ branch main:

- Build Command: npm ci --include=dev && npm run build:server
- Start Command: npm start
- Health Check Path: /health
- Environment: NODE_ENV=production, CLIENT_ORIGIN=https://dying-message.vercel.app
- URL backend: https://dying-message-jgyq.onrender.com
- Socket.IO namespace: /cheese

Render กำหนด PORT ให้อัตโนมัติ เซิร์ฟเวอร์ฟังที่ 0.0.0.0 และใช้ PORT จาก environment สามารถเพิ่ม CLIENT_ORIGIN หลายโดเมนโดยคั่นด้วยจุลภาค สำหรับ Vercel previews ให้เพิ่ม URL ของ preview ที่ต้องการทดสอบ

render.yaml เป็น Blueprint สำหรับตั้งบริการ backend หากใช้บริการเดิมที่สร้างผ่าน Dashboard ให้ตรวจ build/start/environment ใน Dashboard ด้วย ไม่ต้องสร้างบริการซ้ำ

## ตรวจหลัง deploy

1. เปิด https://dying-message-jgyq.onrender.com/health ต้องได้ {"ok":true}
2. เปิด https://dying-message.vercel.app ต้องเห็นหนูชีสและสถานะออนไลน์
3. สร้างห้องจากเครื่องหนึ่ง แล้วเข้าจากอีกเครื่องด้วยรหัสเดียวกัน
4. ทดสอบเลือกบทบาท/ทอยเวลา/โหวตและคืนที่นั่งหลังรีเฟรช

ห้องและสถานะผู้เล่นอยู่ในหน่วยความจำ Deploy ใหม่หรือรีสตาร์ตจะทำให้ห้องหาย ใช้ server instance เดียว ห้องยังไม่รองรับการกระจายข้ามหลาย instance
