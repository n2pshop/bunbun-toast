// BunBun Toast - Supabase configuration
// 1) เปิด Supabase Project > Settings > API
// 2) ใส่ Project URL และ Publishable/Anon Key ด้านล่าง
const SUPABASE_URL = "https://sdcuzllpkjwoyklylhuo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9MKq7DSsnKbtUDy6VDZ1Vw_WiC-DCkQ";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
