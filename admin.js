const money = n => "฿" + Number(n || 0).toLocaleString("th-TH");
const $=id=>document.getElementById(id);
let orders=[], products=[];
const statusNames={new:"ออเดอร์ใหม่",preparing:"กำลังทำ",ready:"พร้อมรับ",delivering:"กำลังส่ง",done:"เสร็จแล้ว",cancelled:"ยกเลิก"};
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function init(){
  const {data:{session}}=await sb.auth.getSession();
  if(session) showApp(); else showLogin();
  sb.auth.onAuthStateChange((_e,s)=>s?showApp():showLogin());
}
function showLogin(){$("loginScreen").classList.remove("hidden");$("adminApp").classList.add("hidden")}
function showApp(){$("loginScreen").classList.add("hidden");$("adminApp").classList.remove("hidden");loadAll()}
$("loginBtn").onclick=async()=>{
  const username=$("loginUsername").value.trim(),password=$("loginPassword").value;
  $("loginMsg").textContent="";
  if(username!=="BunBun1" || password!=="bunbun168"){
    $("loginMsg").textContent="ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    return;
  }
  $("loginMsg").textContent="กำลังเข้าสู่ระบบ...";
  // ใช้ Supabase Auth ด้วยอีเมลเทคนิคที่ซ่อนจากผู้ใช้
  const {error}=await sb.auth.signInWithPassword({
    email:"bunbun1@bunbuntoast.local",
    password
  });
  if(error)$("loginMsg").textContent="เข้าสู่ระบบไม่สำเร็จ: "+error.message;
};
$("logoutBtn").onclick=()=>sb.auth.signOut();
$("refreshBtn").onclick=loadAll;

async function loadAll(){await Promise.all([loadOrders(),loadProducts()]);}
async function loadOrders(){
  const {data,error}=await sb.from("orders").select("*").order("created_at",{ascending:false}).limit(100);
  if(error){$("ordersList").innerHTML=`<div class="error">โหลดออเดอร์ไม่ได้: ${esc(error.message)}</div>`;return}
  orders=data||[];renderOrders();renderStats();
}
function renderStats(){
  const today=new Date();const key=today.toLocaleDateString("en-CA",{timeZone:"Asia/Bangkok"});
  const todayRows=orders.filter(o=>String(o.created_at).slice(0,10)===key);
  $("todayOrders").textContent=todayRows.length;
  $("todaySales").textContent=money(todayRows.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+Number(o.total||0),0));
  $("pendingOrders").textContent=orders.filter(o=>["new","preparing","ready","delivering"].includes(o.status)).length;
}
function renderOrders(){
  const filter=$("orderFilter").value;const rows=filter==="all"?orders:orders.filter(o=>o.status===filter);
  if(!rows.length){$("ordersList").innerHTML=`<div class="order-card" style="text-align:center;color:#947568;padding:35px">ยังไม่มีออเดอร์</div>`;return}
  $("ordersList").innerHTML=rows.map(o=>`
  <article class="order-card">
    <div class="order-top"><div><div class="order-no">#${esc(o.order_no)}</div><div class="order-info">${esc(o.customer_name)} • ${esc(o.customer_phone)}<br>${o.fulfillment==="delivery"?"🛵 จัดส่ง: "+esc(o.address||"-"):"🏪 รับที่ร้าน"}${o.note?`<br>📝 ${esc(o.note)}`:""}</div></div><span class="badge">${statusNames[o.status]||o.status}</span></div>
    <div class="order-items">${(o.items||[]).map(i=>`<div class="order-item-line"><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join("")}</div>
    <div class="order-bottom"><span class="order-total">${money(o.total)}</span>
      <select class="status-select" onchange="updateStatus('${o.id}',this.value)">
        ${Object.entries(statusNames).map(([v,n])=>`<option value="${v}" ${o.status===v?"selected":""}>${n}</option>`).join("")}
      </select>
    </div>
  </article>`).join("");
}
$("orderFilter").onchange=renderOrders;
async function updateStatus(id,status){
  const {error}=await sb.from("orders").update({status}).eq("id",id);
  if(error){toast("เปลี่ยนสถานะไม่สำเร็จ");return}
  const o=orders.find(x=>x.id===id);if(o)o.status=status;renderOrders();renderStats();toast("อัปเดตสถานะแล้ว");
}
function subscribeOrders(){
  sb.channel("bunbun-orders").on("postgres_changes",{event:"*",schema:"public",table:"orders"},()=>loadOrders()).subscribe();
}

async function loadProducts(){
  const {data,error}=await sb.from("products").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:true});
  if(error){$("adminProducts").innerHTML=`<div class="error">โหลดเมนูไม่ได้: ${esc(error.message)}</div>`;return}
  products=data||[];renderProducts();
}
function renderProducts(){
  $("adminProducts").innerHTML=products.map(p=>`<article class="admin-product">
    ${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:`<div style="aspect-ratio:1.3/1;border-radius:13px;background:#fff1ef;display:grid;place-items:center;font-size:70px">🍞</div>`}
    <h3>${esc(p.name)} ${p.available?"":"<span style='font-size:11px;color:#b24e59'>ปิดขาย</span>"}</h3><p>${money(p.price)} • ${esc(p.description||"")}</p>
    <div class="admin-product-actions"><button onclick="editProduct('${p.id}')">แก้ไข</button><button onclick="toggleProduct('${p.id}',${!p.available})">${p.available?"ปิดขาย":"เปิดขาย"}</button><button onclick="deleteProduct('${p.id}')">ลบ</button></div>
  </article>`).join("");
}
$("addProductBtn").onclick=()=>openProduct();
$("closeProduct").onclick=()=>$("productModal").classList.remove("show");
function openProduct(p=null){
  $("productModalTitle").textContent=p?"แก้ไขเมนู":"เพิ่มเมนู";$("productId").value=p?.id||"";$("productName").value=p?.name||"";$("productPrice").value=p?.price||"";$("productDescription").value=p?.description||"";$("productImage").value=p?.image_url||"";$("productAvailable").checked=p?p.available:true;$("productMsg").textContent="";$("productModal").classList.add("show");
}
window.editProduct=id=>openProduct(products.find(p=>p.id===id));
$("saveProductBtn").onclick=async()=>{
  const id=$("productId").value,name=$("productName").value.trim(),price=Number($("productPrice").value),description=$("productDescription").value.trim(),image_url=$("productImage").value.trim(),available=$("productAvailable").checked;
  if(!name||price<0){$("productMsg").textContent="กรุณากรอกชื่อและราคา";return}
  const payload={name,price,description,image_url,available};
  const q=id?sb.from("products").update(payload).eq("id",id):sb.from("products").insert(payload);
  const {error}=await q;
  if(error){$("productMsg").textContent=error.message;return}
  $("productModal").classList.remove("show");await loadProducts();toast("บันทึกเมนูแล้ว");
};
window.toggleProduct=async(id,value)=>{const {error}=await sb.from("products").update({available:value}).eq("id",id);if(error){toast("ทำรายการไม่สำเร็จ");return}await loadProducts();toast(value?"เปิดขายแล้ว":"ปิดขายแล้ว")};
window.deleteProduct=async id=>{if(!confirm("ลบเมนูนี้ใช่ไหม?"))return;const {error}=await sb.from("products").delete().eq("id",id);if(error){toast("ลบไม่สำเร็จ");return}await loadProducts();toast("ลบเมนูแล้ว")};
init();
