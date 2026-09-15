const messages: Record<string, string> = {
  "Room not found": "ไม่พบห้องนี้",
  "Game already started": "เกมเริ่มแล้ว",
  "Room is full": "ห้องเต็มแล้ว",
  "Incorrect password": "รหัสผ่านไม่ถูกต้อง",
  "Player name is already taken": "มีผู้เล่นใช้ชื่อนี้แล้ว",
  "Choose 3–6 players": "เลือกจำนวนผู้เล่น 3–6 คน",
  "Join a room first": "กรุณาเข้าห้องก่อน",
  "Your session has expired":
    "ห้องหรือการเชื่อมต่อเดิมหมดอายุ กรุณาสร้างหรือเข้าห้องใหม่",
  "This player is already connected in another tab":
    "ผู้เล่นนี้เชื่อมต่ออยู่ในแท็บอื่นแล้ว",
  "Only the host can start": "เฉพาะเจ้าของห้องเท่านั้นที่เริ่มเกมได้",
  "At least 3 connected, ready players are required":
    "ต้องมีผู้เล่นออนไลน์อย่างน้อย 3 คน และทุกคนต้องกดพร้อม",
  "The game is not active": "เกมยังไม่เริ่มหรือจบแล้ว",
  "Not your turn": "ยังไม่ถึงตาของคุณ",
  "Only the Sheriff can decide": "เฉพาะนายอำเภอเท่านั้นที่ตัดสินได้",
  "Bag is already sealed": "ยังจัดถุงไม่ได้หรือถุงถูกปิดแล้ว",
  "Choose up to 5 different cards": "เลือกการ์ดไม่ซ้ำกันได้สูงสุด 5 ใบ",
  "Invalid goods": "การ์ดสินค้าไม่ถูกต้อง",
  "Choose at least one card": "เลือกการ์ดอย่างน้อย 1 ใบ",
  "Not the declaration phase": "ยังไม่ถึงขั้นตอนสำแดงสินค้า",
  "Declare a legal good": "ต้องสำแดงสินค้าถูกกฎหมายเท่านั้น",
  "You must declare the actual number of cards": "ต้องแจ้งจำนวนการ์ดตามจริง",
  "Not the bribe phase": "ยังไม่ถึงขั้นตอนเสนอสินบน",
  "Invalid bribe amount":
    "สินบนต้องเป็นจำนวนเต็ม ไม่ติดลบ และไม่เกินเหรียญที่มี",
  "No bribe to reject": "ไม่มีสินบนให้ปฏิเสธ",
  "Waiting for the merchant": "กำลังรอพ่อค้า",
  "No bribe offered": "ยังไม่มีสินบน",
  "Unsupported action": "ไม่รองรับคำสั่งนี้",
  "Please slow down": "ส่งคำสั่งเร็วเกินไป กรุณารอสักครู่",
  "Something went wrong": "เกิดข้อผิดพลาด กรุณาลองใหม่",
  "Leave your current room first": "กรุณาออกจากห้องเดิมก่อน",
  "Only the host can restart after the game":
    "เจ้าของห้องเริ่มใหม่ได้เมื่อเกมจบแล้วเท่านั้น",
};
export function thaiMessage(message: string) {
  const validation =
    /^(Player name|Room name|Room code|Password|Message) must be 1–(\d+) characters$/.exec(
      message,
    );
  if (validation) {
    const names: Record<string, string> = {
      "Player name": "ชื่อผู้เล่น",
      "Room name": "ชื่อห้อง",
      "Room code": "รหัสห้อง",
      Password: "รหัสผ่าน",
      Message: "ข้อความ",
    };
    return `${names[validation[1]]}ต้องมีความยาว 1–${validation[2]} ตัวอักษร`;
  }
  return messages[message] ?? message;
}
