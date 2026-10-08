const money = n => "฿" + Number(n || 0).toLocaleString("th-TH");
// =============================
// ตรวจสอบเวลาเปิด-ปิดร้าน
// =============================
let shopOpenTime = "09:00";
let shopCloseTime = "20:00";
let shopIsOpen = false;

async function loadShopStatus(){
  const {data,error} = await sb
    .from("bunbun_settings")
    .select("open_time, close_time, is_open")
    .eq("id",1)
    .single();

  if(error){
    console.error("โหลดเวลาร้านไม่ได้:", error);
    return;
  }

  shopOpenTime = data.open_time.slice(0,5);
  shopCloseTime = data.close_time.slice(0,5);
  shopIsOpen = data.is_open;

  updateShopStatus();
}

function checkShopOpen(){
  if(!shopIsOpen) return false;

  const now = new Date();
  const current =
    now.getHours() * 60 + now.getMinutes();

  const [oh,om] = shopOpenTime.split(":").map(Number);
  const [ch,cm] = shopCloseTime.split(":").map(Number);

  const open = oh * 60 + om;
  const close = ch * 60 + cm;

  return current >= open && current < close;
}

function updateShopStatus(){
  const open = checkShopOpen();
  const checkout = $("checkout");
  const shopState = $("shopState");

  if(shopState){
    if(open){
      shopState.textContent = "🟢 เปิดรับออเดอร์";
    }else{
      shopState.textContent =
        `🔴 ร้านปิด • เปิด ${shopOpenTime} น.`;
    }
  }

  if(checkout){
    checkout.disabled = !open;

    if(open){
      checkout.textContent = "สั่งซื้อ";
    }else{
      checkout.textContent = "🔴 ร้านปิดรับออเดอร์";
    }
  }
}
let products = [];
let cart = JSON.parse(localStorage.getItem("bunbun_cart") || "[]");

const $ = id => document.getElementById(id);
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }
function saveCart(){localStorage.setItem("bunbun_cart",JSON.stringify(cart)); renderCart();}

async function loadProducts(){
  const {data,error}=await sb.from("products").select("*").eq("available",true).order("created_at",{ascending:true});
  if(error){ $("shopState").textContent="กรุณาตั้งค่า Supabase ก่อน"; renderDemoProducts(); return; }
  products=data||[]; $("shopState").textContent=products.length ? "พร้อมรับออเดอร์ 🐰" : "ยังไม่มีเมนู";
  renderProducts();
}
function renderDemoProducts(){
  products=[
    {id:"demo1",name:"เนยนม",price:35,description:"หอมเนย นมฉ่ำ ๆ",image_url:"",available:true},
    {id:"demo2",name:"ช็อกโกแลต",price:40,description:"ช็อกโกแลตเข้มข้น",image_url:"",available:true},
    {id:"demo3",name:"สตรอว์เบอร์รี",price:40,description:"หวานอมเปรี้ยวกำลังดี",image_url:"",available:true},
    {id:"demo4",name:"นูเทลลา",price:45,description:"ช็อกโกแลตเฮเซลนัทแน่น ๆ",image_url:"",available:true}
  ]; $("shopState").textContent="โหมดตัวอย่าง — ตั้งค่า Supabase เพื่อรับออเดอร์"; renderProducts();
}
function renderProducts(){
  $("products").innerHTML=products.map(p=>`
    <article class="product-card">
      <div class="product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}">`:`<div class="product-placeholder">🍞</div>`}</div>
      <h3>${esc(p.name)}</h3><p>${esc(p.description||"อร่อยทุกคำจาก BunBun")}</p>
      <div class="price-row"><span class="price">${money(p.price)}</span><button class="add" onclick="addToCart('${p.id}')">+ เพิ่ม</button></div>
    </article>`).join("");
}
function addToCart(id){
  const p=products.find(x=>String(x.id)===String(id)); if(!p)return;
  const found=cart.find(x=>String(x.id)===String(id)); if(found)found.qty++; else cart.push({id:p.id,qty:1});
  saveCart(); toast("เพิ่มลงตะกร้าแล้ว 🐰");
}
function getCartRows(){return cart.map(c=>({ ...c, product:products.find(p=>String(p.id)===String(c.id))})).filter(x=>x.product)}
function renderCart(){
  const rows=getCartRows(); $("cartCount").textContent=rows.reduce((s,x)=>s+x.qty,0);
  if(!rows.length){$("cartItems").innerHTML=`<div style="text-align:center;padding:60px 15px;color:#9a7768">ตะกร้ายังว่างอยู่ 🐰<br>เลือกขนมปังที่ชอบได้เลย</div>`;$("cartTotal").textContent="฿0";return}
  $("cartItems").innerHTML=rows.map(x=>`<div class="cart-item"><div><strong>${esc(x.product.name)}</strong><div>${money(x.product.price*x.qty)}</div><button class="remove" onclick="removeItem('${x.id}')">ลบ</button></div><div class="qty"><button onclick="changeQty('${x.id}',-1)">−</button><b>${x.qty}</b><button onclick="changeQty('${x.id}',1)">+</button></div></div>`).join("");
  $("cartTotal").textContent=money(rows.reduce((s,x)=>s+x.product.price*x.qty,0));
}
function changeQty(id,d){const x=cart.find(c=>String(c.id)===String(id));if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(c=>String(c.id)!==String(id));saveCart()}
function removeItem(id){cart=cart.filter(c=>String(c.id)!==String(id));saveCart()}
function openCart(){$("cart").classList.add("open");$("overlay").classList.add("show")}
function closeCart(){$("cart").classList.remove("open");$("overlay").classList.remove("show")}
function openOrder(){
  const rows=getCartRows();if(!rows.length){toast("กรุณาเลือกเมนูก่อน 🐰");return}
  $("orderSummary").innerHTML=rows.map(x=>`<div class="summary-line"><span>${esc(x.product.name)} × ${x.qty}</span><b>${money(x.product.price*x.qty)}</b></div>`).join("")+`<div class="summary-total"><span>รวม</span><span>${money(rows.reduce((s,x)=>s+x.product.price*x.qty,0))}</span></div>`;
  $("orderResult").textContent="";$("orderModal").classList.add("show");
}
function closeOrder(){$("orderModal").classList.remove("show")}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
$("openCart").onclick=openCart;
$("closeCart").onclick=closeCart;
$("overlay").onclick=closeCart;

$("checkout").onclick=()=>{
  if(!checkShopOpen()){
    toast(`🔴 ร้านปิดรับออเดอร์ เปิด ${shopOpenTime} น.`);
    return;
  }

  closeCart();
  openOrder();
};

$("closeOrder").onclick=closeOrder;
$("fulfillment").onchange=e=>$("addressField").classList.toggle("hidden",e.target.value!=="delivery");

$("confirmOrder").onclick=async()=>{
  if(!checkShopOpen()){
    toast(`🔴 ร้านปิดรับออเดอร์ เปิด ${shopOpenTime} น.`);
    closeOrder();
    return;
  }

  const rows=getCartRows(), name=$("customerName").value.trim(), phone=$("customerPhone").value.trim(), fulfillment=$("fulfillment").value, address=$("customerAddress").value.trim(), note=$("customerNote").value.trim();
  if(!name||!phone){toast("กรุณากรอกชื่อและเบอร์โทร");return}
  if(fulfillment==="delivery"&&!address){toast("กรุณากรอกที่อยู่จัดส่ง");return}
  const total=rows.reduce((s,x)=>s+x.product.price*x.qty,0);
  if(fulfillment==="delivery" && total < 100){
  toast("ยอดสั่งขั้นต่ำสำหรับจัดส่งคือ ฿100");
  return;
}
  const orderItems=rows.map(x=>({product_id:x.product.id,name:x.product.name,price:x.product.price,qty:x.qty}));
  const btn=$("confirmOrder");btn.disabled=true;btn.textContent="กำลังส่งออเดอร์...";
  const {data,error}=await sb.from("bunbun_orders").insert({customer_name:name,customer_phone:phone,fulfillment,address:fulfillment==="delivery"?address:"",note,total,items:orderItems,order_source: "online",status:"new"}).select("order_no").single();
  btn.disabled=false;btn.textContent="🐰 ยืนยันออเดอร์";
  if(error){$("orderResult").textContent="ส่งออเดอร์ไม่สำเร็จ กรุณาตรวจสอบ Supabase";console.error(error);return}
cart=[];
saveCart();

$("orderResult").innerHTML = `
  <div class="success-popup-content">

    <div class="success-bunny">🐰</div>

    <h3>สั่งซื้อสำเร็จแล้ว! 🎉</h3>

    <p class="success-text">
      ขอบคุณที่อุดหนุน BunBun Toast 💕
    </p>

    <div class="order-number-box">
      <div class="order-label">🎫 เลขออเดอร์ของคุณ</div>

      <strong id="successOrderNumber">
        ${esc(data.order_no)}
      </strong>

      <button
        type="button"
        class="copy-order-btn"
        onclick="copyOrderNumber('${esc(data.order_no)}', this)"
      >
        📋 คัดลอกเลขออเดอร์
      </button>
    </div>

    <div class="save-order">
      📌 กรุณาบันทึกเลขออเดอร์นี้ไว้<br>
      ใช้สำหรับเช็กสถานะและรับสินค้า
    </div>

    <button
      type="button"
      class="success-close-btn"
      onclick="closeOrder()"
    >
      🐰 ตกลง
    </button>

  </div>
`;
};
async function copyOrderNumber(orderNo, btn){

  try{
    await navigator.clipboard.writeText(orderNo);

    const oldText = btn.textContent;

    btn.textContent = "✅ คัดลอกเลขออเดอร์แล้ว!";

    btn.classList.add("copied");

    setTimeout(()=>{
      btn.textContent = oldText;
      btn.classList.remove("copied");
    },2000);

  }catch(error){

    console.error("คัดลอกไม่ได้:",error);

    toast("กรุณากดค้างเพื่อคัดลอกเลขออเดอร์");
  }

}
renderCart();
loadProducts();
loadShopStatus();
// =============================
// เช็คสถานะออเดอร์
// =============================
$("checkOrderBtn").onclick = async () => {
  const orderNo = $("checkOrderNo").value.trim().toUpperCase();
  const result = $("orderStatusResult");

  if (!orderNo) {
    result.innerHTML = `
      <div class="status-error">
        กรุณากรอกเลขออเดอร์ก่อนนะครับ 🐰
      </div>
    `;
    return;
  }

  result.innerHTML = `
    <div class="status-loading">
      🔎 กำลังตรวจสอบออเดอร์...
    </div>
  `;

  const { data, error } = await sb
    .from("bunbun_orders")
    .select("order_no, customer_name, status, total, created_at")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (error) {
    console.error(error);

    result.innerHTML = `
      <div class="status-error">
        ❌ ไม่สามารถตรวจสอบออเดอร์ได้
      </div>
    `;
    return;
  }

  if (!data) {
    result.innerHTML = `
      <div class="status-error">
        ❌ ไม่พบเลขออเดอร์นี้
      </div>
    `;
    return;
  }

  const statusNames = {
    new: "🆕 รับออเดอร์แล้ว",
    preparing: "👩‍🍳 กำลังทำ",
    ready: "📦 พร้อมรับสินค้า",
    delivering: "🛵 กำลังจัดส่ง",
    done: "✅ เสร็จแล้ว",
    cancelled: "❌ ยกเลิก"
  };

  result.innerHTML = `
    <div class="status-result">
      <div class="status-order-no">
        🎫 ${esc(data.order_no)}
      </div>

      <div class="status-customer">
        คุณ ${esc(data.customer_name)}
      </div>

    <div class="status-steps">

  <div class="status-step ${data.status === "new" ? "active" : ""}">
    <div class="step-icon">🆕</div>
    <span>รับออเดอร์</span>
  </div>

  <div class="status-line"></div>

  <div class="status-step ${data.status === "preparing" ? "active" : ""}">
    <div class="step-icon">👩‍🍳</div>
    <span>กำลังทำ</span>
  </div>

  <div class="status-line"></div>

  <div class="status-step ${["ready","delivering"].includes(data.status) ? "active" : ""}">
    <div class="step-icon">
      ${data.status === "delivering" ? "🛵" : "📦"}
    </div>
    <span>
      ${data.status === "delivering" ? "กำลังส่ง" : "พร้อมรับ"}
    </span>
  </div>

  <div class="status-line"></div>

  <div class="status-step ${data.status === "done" ? "active" : ""}">
    <div class="step-icon">✅</div>
    <span>เสร็จแล้ว</span>
  </div>

</div>
    </div>
  `;
};
