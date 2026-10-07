BunBun Toast - เว็บรับออเดอร์ + ระบบหลังบ้าน

ไฟล์หลัก
- index.html       หน้าเว็บลูกค้า
- admin.html       หลังบ้านร้าน
- style.css        ดีไซน์ทั้งหมด
- script.js        ระบบตะกร้า/รับออเดอร์
- admin.js         ระบบล็อกอิน/ออเดอร์/จัดการเมนู
- config.js        ใส่ Supabase URL + Publishable/Anon Key
- supabase.sql     SQL สำหรับสร้างฐานข้อมูล
- logo.png         โลโก้ BunBun Toast ที่คุณส่งมา

วิธีเปิดระบบ
1. สร้างโปรเจกต์ Supabase
2. ไป SQL Editor แล้ววาง supabase.sql ทั้งหมด จากนั้นกด Run
3. ไป Authentication > Users > Add user
   สร้างอีเมลและรหัสผ่านสำหรับเจ้าของร้าน
4. เปิด config.js แล้วใส่ SUPABASE_URL และ SUPABASE_ANON_KEY
5. อัปโหลดไฟล์ทั้งหมดขึ้น GitHub Pages
6. หน้าเว็บลูกค้า: index.html
7. หลังบ้าน: admin.html

หมายเหตุความปลอดภัย
ระบบนี้ใช้ Supabase Auth สำหรับล็อกอินหลังบ้าน และ RLS สำหรับจำกัดการอ่าน/แก้ไขออเดอร์ให้เฉพาะผู้ที่ล็อกอิน
ห้ามใส่ Service Role Key ใน config.js เด็ดขาด ใช้ Publishable/Anon Key เท่านั้น

การใช้งานจริง
- เปลี่ยนเมนู/ราคาได้จากหลังบ้าน
- เปิด/ปิดขายได้
- ลูกค้าสั่งซื้อจากหน้าเว็บ
- ออเดอร์เข้าหลังบ้าน
- เปลี่ยนสถานะออเดอร์ได้
- หลังบ้านอัปเดตออเดอร์ใหม่แบบ realtime
