export type Role = 'forensic' | 'murderer' | 'investigator';
export type Phase = 'lobby' | 'reveal' | 'crime' | 'forensic' | 'investigation' | 'result';
export type Card = { id: string; name: string };
export type Scene = { id: string; title: string; options: string[]; chosen: number | null };
export type Person = { id: string; name: string; connected: boolean; ready: boolean; means: Card[]; clues: Card[]; attempted: boolean };
export type View = { code: string; name: string; capacity: number; hostId: string; phase: Phase; round: number; paused: boolean; players: Person[]; scene: Scene[]; forensicReady: boolean; me: {id: string; role: Role | null; confirmed: boolean; solution: {murdererId:string;meansId:string;clueId:string}|null}; result: {winner:'investigators'|'murderer'; murdererId:string;meansId:string;clueId:string}|null; log: {name:string;round:number;correct:boolean}[] };
export const meansDeck = ['มีดพก','เชือก','ปืน','ยาพิษ','ค้อน','ขวาน','กรรไกร','กระบอง','ไขควง','ประแจ','เข็มฉีดยา','ก้อนหิน','น้ำมัน','ผ้าพันคอ','แก้วแตก','สายไฟ','ไม้เบสบอล','ธนู','อิฐ','น้ำแข็ง','สเปรย์','หมอน','โซ่','กรด','ยาสลบ','ร่ม','เทียน','กระจก','ไม้เท้า','ประตู','ถุงพลาสติก','เข็ม','ขวดแก้ว','ท่อเหล็ก','คีม','ไฟแช็ก','สายรัด','เก้าอี้','ผ้าเช็ดตัว','ยาฆ่าแมลง'];
export const clueDeck = ['ตั๋วรถไฟ','นาฬิกา','กุญแจ','จดหมาย','ถุงมือ','โทรศัพท์','แว่นตา','รูปถ่าย','รอยเท้า','สร้อยคอ','กระเป๋าสตางค์','ไฟฉาย','สมุดบันทึก','ใบเสร็จ','แผนที่','ร่มเปียก','ผ้าเช็ดหน้า','บัตรประจำตัว','ขวดน้ำ','หนังสือ','หมวก','ผ้าพันแผล','กล้องถ่ายรูป','ซองจดหมาย','เหรียญ','กล่องยา','ลิปสติก','บัตรโดยสาร','กระดุม','แหวน','รองเท้า','ดอกไม้','ขนม','ปากกา','หูฟัง','เข็มกลัด','สายชาร์จ','แก้วกาแฟ','กุญแจรถ','กระดาษโน้ต'];
export const sceneDeck: Omit<Scene,'chosen'>[] = [
  {id:'cause',title:'สาเหตุการตาย',options:['เสียเลือด','ขาดอากาศ','บาดเจ็บรุนแรง','พิษ','ไฟไหม้','ไม่ชัดเจน']},
  {id:'location',title:'สถานที่เกิดเหตุ',options:['บ้านพัก','ที่ทำงาน','ริมถนน','สถานบันเทิง','พื้นที่กลางแจ้ง','สถานที่ลับ']},
  {id:'time',title:'ช่วงเวลา',options:['รุ่งเช้า','กลางวัน','เย็น','ดึก','เที่ยงคืน','ไม่แน่ชัด']},
  {id:'weather',title:'สภาพแวดล้อม',options:['แห้ง','เปียก','ร้อน','เย็น','มืด','เสียงดัง']},
  {id:'body',title:'สภาพศพ',options:['มีบาดแผล','ไม่มีแผลภายนอก','มีรอยฟกช้ำ','มีรอยไหม้','มีร่องรอยต่อสู้','ถูกเคลื่อนย้าย']},
  {id:'trace',title:'ร่องรอยในที่เกิดเหตุ',options:['เลือด','รอยนิ้วมือ','รอยเท้า','คราบสาร','สิ่งของแตก','แทบไม่มีร่องรอย']},
  {id:'relationship',title:'ความสัมพันธ์',options:['คนรู้จัก','คนแปลกหน้า','คนใกล้ชิด','เพื่อนร่วมงาน','คู่ขัดแย้ง','ยังไม่ทราบ']},
  {id:'motive',title:'แรงจูงใจ',options:['เงิน','ความโกรธ','ปกปิดความลับ','แก้แค้น','อุบัติเหตุ','ยังไม่ทราบ']},
  {id:'witness',title:'พยานเห็นอะไร',options:['คนวิ่งหนี','พาหนะ','สิ่งของ','เสียงแปลก','แสงไฟ','ไม่มีพยาน']},
  {id:'method',title:'ลักษณะการลงมือ',options:['ระยะประชิด','ระยะไกล','วางแผนล่วงหน้า','ฉับพลัน','ใช้สิ่งรอบตัว','หลอกล่อ']},
  {id:'evidence',title:'สภาพหลักฐาน',options:['ใหม่','เก่า','เสียหาย','เปียก','ถูกซ่อน','ถูกทิ้ง']},
];
