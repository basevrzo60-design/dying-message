# เปิดเกมออนไลน์แบบฟรี: Vercel Hobby + Render Free

หน้าเว็บและภาพอยู่บน Vercel ส่วนห้องเกมใช้ Node.js / Socket.IO บน Render ผู้เล่นเปิดลิงก์ Vercel เดียวกันจากเครือข่ายใดก็ได้

## 1. เตรียมโค้ดบน GitHub

นำการเปลี่ยนแปลงล่าสุดขึ้น repository ให้ครบ โดยเฉพาะ `public/goods`, `vercel.json`, `render.yaml` และ `tsconfig.server.json` ทั้งสองบริการต้องใช้ root ของ repository ไม่ใช่โฟลเดอร์ client หรือ server

## 2. สร้างหน้าเว็บบน Vercel

เลือกแผน Hobby สำหรับโปรเจกต์ส่วนตัวที่ไม่ใช่เชิงพาณิชย์ Import repository เลือก Framework เป็น Vite และ Root Directory เป็น root ของ repository ไฟล์ vercel.json กำหนด build และ output ไว้แล้ว รวมถึงการเปิดลิงก์ /lobby/... และ /game/... โดยตรง ใช้โดเมน vercel.app ที่ให้มาฟรี

Deploy เพื่อรับโดเมนหลัก เช่น https://YOUR-SITE.vercel.app ก่อน ในขั้นนี้หน้าเว็บขึ้นได้ แต่ยังเข้าห้องเกมไม่ได้จนกว่าจะเชื่อม backend ในขั้นที่ 4

## 3. สร้างเซิร์ฟเวอร์บน Render

สร้าง Blueprint จาก repository โดยใช้ render.yaml ตั้ง CLIENT_ORIGIN เป็นโดเมนหลัก Vercel จากขั้นก่อน เช่น https://YOUR-SITE.vercel.app ไม่ใส่ path หรือ / ท้าย URL

Blueprint ตั้งเป็น Free แล้ว ใช้ workspace แผนฟรีและโดเมน onrender.com ที่ให้มา ไม่ต้องซื้อโดเมนหรือฐานข้อมูล เลือก Free ในหน้าสร้างบริการด้วย หากมีบริการ Starter ที่สร้างไว้ก่อนแล้ว ต้องเปลี่ยนแผนของบริการนั้นใน Render ด้วย การแก้ไฟล์ในเครื่องยังไม่เปลี่ยนบริการที่ออนไลน์อยู่

เพื่อไม่ให้เกิดค่าใช้จ่ายส่วนเกิน ไม่เพิ่มวิธีชำระเงินหรือเปิดบริการเสียเงิน เมื่อเกินโควตา Render จะพักบริการหรือหยุด build ตามประเภทโควตา หากบัญชีมีวิธีชำระเงินอยู่แล้ว ให้ตรวจการคิดค่า bandwidth และ build ส่วนเกินก่อนใช้งาน

หากตั้งค่าด้วยตนเอง ใช้ Web Service, Node runtime, root directory ว่าง และ:

| รายการ | ค่า |
| --- | --- |
| Instance Type | Free |
| Build Command | npm ci --include=dev && npm run build:server |
| Start Command | npm start |
| Health Check Path | /health |
| NODE_ENV | production |
| CLIENT_ORIGIN | https://YOUR-SITE.vercel.app |
| จำนวน instance | 1 |

ใช้ Node.js 22 รุ่นล่าสุด เซิร์ฟเวอร์อ่าน PORT ที่โฮสต์กำหนดอัตโนมัติ เมื่อสำเร็จ เปิด https://YOUR-SERVER.onrender.com/health ต้องได้ {"ok":true}

## 4. เชื่อมหน้าเว็บกับเซิร์ฟเวอร์

ใน Vercel > Settings > Environment Variables เพิ่ม VITE_SERVER_URL = https://YOUR-SERVER.onrender.com สำหรับ Production แล้ว Redeploy ค่า VITE_SERVER_URL ถูกฝังตอน build จึงต้อง Redeploy ทุกครั้งที่แก้ค่า

ใช้ HTTPS ทั้งสองฝั่งและไม่เติม /socket.io ต่อท้าย URL หากใช้ custom domain ให้เพิ่ม origin นั้นใน CLIENT_ORIGIN คั่นหลายโดเมนด้วย comma อนุญาตเฉพาะโดเมนที่ใช้งานจริง ส่วน Preview deployment ต้องเพิ่ม origin ของ Preview และตั้ง VITE_SERVER_URL ใน environment Preview แยกด้วย

## 5. ตรวจการเล่นจริง

เปิด Vercel บนคอมและมือถือ สร้างห้องแล้วเข้าด้วยรหัสเดียวกัน ใช้ผู้เล่นจริงอย่างน้อย 3 คน กดพร้อมและเริ่มเกม ตรวจการจั่ว ปิดถุง ตรวจสินค้า และแชต จากนั้นรีเฟรชหน้าห้องหนึ่งเครื่องเพื่อทดสอบกลับเข้าห้อง โหมดฝึกกับบอตปิดใน production

## ข้อจำกัดปัจจุบัน

Render Free พักบริการเมื่อไม่มี HTTP request หรือข้อความ WebSocket เข้ามา 15 นาที และใช้เวลาปลุกประมาณ 1 นาที ผู้เล่นที่เปิดคนแรกอาจต้องรอแล้วลองเข้าห้องอีกครั้ง มีโควตา 750 ชั่วโมงต่อ workspace ต่อเดือนร่วมกันทุกบริการ Free และมีโควตา bandwidth/build เพิ่มเติม Render อาจ restart บริการฟรีได้ จึงเหมาะกับเล่นกับเพื่อนหรือทดลอง

ห้องยังอยู่ในหน่วยความจำ การ restart, deploy หรือเครื่องล่มทำให้ห้องเดิมหาย ควร deploy เมื่อไม่มีเกมกำลังเล่น ห้ามเพิ่ม instance หรือเปิด autoscaling จนกว่าจะเพิ่มที่เก็บสถานะร่วมและ Socket.IO adapter การเก็บข้อมูลถาวรด้วย Redis/ฐานข้อมูลยังไม่รวมในชุดนี้

## ตรวจในเครื่อง

`npm run build` ตรวจและสร้างหน้าเว็บ ส่วน `npm run build:server` สร้างเซิร์ฟเวอร์ จากนั้น `npm start` รันเซิร์ฟเวอร์ที่คอมไพล์แล้ว ไม่ใช้ watch mode

ทดสอบกติกาด้วย `npm test` และทดสอบหลายการเชื่อมต่อด้วย `node server/src/multiplayer.test.mjs` โดยตั้ง TEST_SERVER_URL เพื่อชี้เซิร์ฟเวอร์ทดสอบได้ (คำสั่งนี้สร้างห้องทดสอบจริง)

เอกสารอ้างอิง: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [ข้อจำกัด Render Free](https://render.com/docs/free), [Vite บน Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Render Blueprint](https://render.com/docs/blueprint-spec)
