// BunBun Toast - Supabase configuration
// 1) เปิด Supabase Project > Settings > API
// 2) ใส่ Project URL และ Publishable/Anon Key ด้านล่าง
const SUPABASE_URL = "ใส่_SUPABASE_URL_ที่นี่";
const SUPABASE_ANON_KEY = "ใส่_SUPABASE_PUBLISHABLE_OR_ANON_KEY_ที่นี่";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
