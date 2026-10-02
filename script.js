"use strict";

/* =========================================================
   VIRTUAL ATM PRO — FINAL FRONTEND ENGINE
   HTML + CSS + JavaScript
   No MariaDB / No Python required
========================================================= */

const USERS = [
 {name:"Rishi Shah",acc:"9876543210",pin:"1234",initial:75000},
 {name:"Priya Sharma",acc:"9876543211",pin:"2345",initial:62000},
 {name:"Aarav Patel",acc:"9876543212",pin:"3456",initial:48500},
 {name:"Neha Singh",acc:"9876543213",pin:"4567",initial:91000},
 {name:"Rahul Verma",acc:"9876543214",pin:"5678",initial:33500},
 {name:"Sneha Joshi",acc:"9876543215",pin:"6789",initial:128000},
 {name:"Aditya Mehta",acc:"9876543216",pin:"7890",initial:54000},
 {name:"Kavya Shah",acc:"9876543217",pin:"8901",initial:82000},
 {name:"Vivek Patil",acc:"9876543218",pin:"9012",initial:46500},
 {name:"Ananya Rao",acc:"9876543219",pin:"1122",initial:103000}
];

function makeInitialData(){
 const obj={};
 USERS.forEach(u=>{
   obj[u.acc]={
     balance:u.initial,
     tx:[],
     notes:[]
   };
 });
 return obj;
}

let data;
try{
 data=JSON.parse(localStorage.getItem("ATM_FINAL_DATA")||"null");
}catch(e){
 data=null;
}
if(!data)data=makeInitialData();

let current=null;
let accInput="";
let pinInput="";
let tries=3;
let selected=null;
let sound=localStorage.getItem("ATM_SOUND")!=="off";
let theme=localStorage.getItem("ATM_THEME")||"dark";
let lastReceipt=null;

const $=id=>document.getElementById(id);

function save(){
 localStorage.setItem("ATM_FINAL_DATA",JSON.stringify(data));
}

function money(n){
 return "₹"+Number(n||0).toLocaleString("en-IN");
}

function ref(){
 return "ATM"+Date.now().toString().slice(-10);
}

function show(id){
 document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
 const el=$(id);
 if(el)el.classList.add("active");
}

function toast(text){
 const t=$("toast");
 if(!t)return;
 t.innerHTML=text;
 t.style.display="block";
 clearTimeout(window.toastTimer);
 window.toastTimer=setTimeout(()=>{
   t.style.display="none";
 },2500);
}

function beep(freq=650){
 if(!sound)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;
  const ac=new AC();
  const osc=ac.createOscillator();
  const gain=ac.createGain();
  osc.frequency.value=freq;
  gain.gain.value=.025;
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime+.07);
 }catch(e){}
}

function applyTheme(){
 document.body.classList.toggle("light",theme==="light");
 document.body.classList.toggle("midnight",theme==="midnight");
 document.body.classList.toggle("emerald",theme==="emerald");
 localStorage.setItem("ATM_THEME",theme);
}

applyTheme();

/* =========================
   KEY PADS
========================= */

function makeKeypad(id,type){
 const box=$(id);
 if(!box)return;

 box.innerHTML="";

 [1,2,3,4,5,6,7,8,9,"C",0,"⌫"].forEach(k=>{
   const b=document.createElement("button");
   b.textContent=k;
   b.dataset.key=k;
   b.dataset.type=type;
   box.appendChild(b);
 });
}

makeKeypad("accountKeys","account");
makeKeypad("pinKeys","pin");

function updateAccount(){
 if($("accountValue"))
  $("accountValue").textContent=accInput||"ENTER ACCOUNT";
}

function updatePin(){
 if(!$("pinValue"))return;
 $("pinValue").textContent=
  pinInput
  ? ($("showPin")?.checked ? pinInput : "•".repeat(pinInput.length))
  : "____";
}

/* =========================
   LOGIN
========================= */

function startATM(){
 accInput="";
 updateAccount();
 show("account");
}

function accountEnter(){
 const user=USERS.find(u=>u.acc===accInput);

 if(!user){
   toast("❌ ACCOUNT NOT FOUND");
   beep(180);
   return;
 }

 current=user;
 pinInput="";
 tries=3;

 $("pinUser").textContent=
   user.name+" • Account "+user.acc;

 $("attempts").textContent="3 attempts remaining";

 updatePin();
 show("pin");
}

function login(){
 if(!current)return;

 if(pinInput!==current.pin){
   tries--;
   pinInput="";
   updatePin();

   $("attempts").textContent=
     tries+" attempts remaining";

   toast("❌ WRONG PIN");
   beep(180);

   if(tries<=0){
     toast("🔒 DEMO ACCOUNT TEMPORARILY LOCKED");
     setTimeout(()=>show("welcome"),1500);
   }
   return;
 }

 openApp();
}

function openApp(){
 $("sideName").textContent=current.name;
 $("sideAcc").textContent="••••"+current.acc.slice(-4);
 $("avatar").textContent=current.name.charAt(0).toUpperCase();

 show("app");
 page("dashboard");

 toast("✅ Welcome, "+current.name);
 beep(850);
}

/* =========================
   DASHBOARD
========================= */

function page(name){
 switch(name){
   case"dashboard":return dashboard();
   case"withdraw":return withdraw();
   case"deposit":return deposit();
   case"transfer":return transfer();
   case"balance":return balance();
   case"statement":return statement();
   case"card":return card();
   case"security":return security();
   case"notifications":return notifications();
   case"settings":return settings();
   case"help":return help();
   case"aboutApp":return aboutApp();
 }
}

function dashboard(){
 const d=data[current.acc];

 const withdrawals=d.tx
  .filter(x=>x.type==="Withdrawal")
  .reduce((a,x)=>a+x.amount,0);

 const deposits=d.tx
  .filter(x=>x.type==="Deposit")
  .reduce((a,x)=>a+x.amount,0);

 $("main").innerHTML=`
 <div class="hero">
  <div>
   <p class="muted">SECURE ATM SESSION</p>
   <h1>Welcome, ${current.name.split(" ")[0]} 👋</h1>
   <p class="muted">Your personal virtual banking dashboard</p>
  </div>

  <div class="balance">
   <small>AVAILABLE BALANCE</small>
   <strong>${money(d.balance)}</strong>
   <span>•••• ${current.acc.slice(-4)}</span>
  </div>
 </div>

 <div class="cards">
  <button class="action" data-page="withdraw">
   💸<b>Withdraw</b><small>Take cash from account</small>
  </button>

  <button class="action" data-page="deposit">
   💰<b>Deposit</b><small>Add money to account</small>
  </button>

  <button class="action" data-page="transfer">
   🔄<b>Send Money</b><small>Transfer to another user</small>
  </button>

  <button class="action" data-page="statement">
   🧾<b>Statement</b><small>View complete history</small>
  </button>

  <button class="action" data-page="card">
   💳<b>My Card</b><small>Virtual debit card</small>
  </button>

  <button class="action" data-page="security">
   🔐<b>Security</b><small>Account protection</small>
  </button>
 </div>

 <div class="stats">
  <div class="stat">
   <small>AVAILABLE</small>
   <b>${money(d.balance)}</b>
  </div>

  <div class="stat">
   <small>WITHDRAWN</small>
   <b>${money(withdrawals)}</b>
  </div>

  <div class="stat">
   <small>DEPOSITED</small>
   <b>${money(deposits)}</b>
  </div>

  <div class="stat">
   <small>TRANSACTIONS</small>
   <b>${d.tx.length}</b>
  </div>
 </div>

 <h2>🕘 Recent Transactions</h2>

 ${
  d.tx.length
  ? d.tx.slice().reverse().slice(0,5).map(transactionHTML).join("")
  : `<p class="muted">No transactions yet.</p>`
 }`;
}

function transactionHTML(x){
 return `
 <div class="activity">
  <div>
   <b>${x.type}</b>
   <small>${x.note||""}</small>
  </div>
  <div>
   <b>${money(x.amount)}</b>
   <small>${new Date(x.date).toLocaleString()}</small>
  </div>
 </div>`;
}

/* =========================
   WITHDRAW
========================= */

function withdraw(){
 $("main").innerHTML=`
 <div class="service">
  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>💸 Withdraw Cash</h1>
  <p class="muted">
   Select a quick amount or enter any amount.
  </p>

  <div class="amounts">
   ${[500,1000,2000,5000,10000].map(n=>
    `<button data-withdraw="${n}">${money(n)}</button>`
   ).join("")}
  </div>

  <input id="amount"
   class="field"
   type="number"
   min="1"
   placeholder="Enter custom amount">

  <button class="service-btn"
   data-action="withdraw-confirm">
   💵 DISPENSE CASH
  </button>
 </div>`;
}

function doWithdraw(value){
 const amount=Number(value);
 const d=data[current.acc];

 if(!amount||amount<=0){
   toast("⚠️ Enter a valid amount");
   return;
 }

 if(amount>d.balance){
   toast("❌ INSUFFICIENT BALANCE");
   return;
 }

 const reference=ref();

 d.balance-=amount;

 d.tx.push({
   type:"Withdrawal",
   amount,
   note:"ATM Cash Withdrawal",
   reference,
   date:new Date().toISOString()
 });

 d.notes.push(
   `Withdrawal of ${money(amount)} successful`
 );

 save();

 showSuccessReceipt({
   type:"WITHDRAWAL",
   message:`${money(amount)} withdrawal successful`,
   amount,
   reference
 });
}

/* =========================
   DEPOSIT
========================= */

function deposit(){
 $("main").innerHTML=`
 <div class="service">
  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>💰 Deposit Money</h1>

  <div class="amounts">
   ${[500,1000,5000,10000,25000].map(n=>
    `<button data-deposit="${n}">${money(n)}</button>`
   ).join("")}
  </div>

  <input id="amount"
   class="field"
   type="number"
   placeholder="Enter any amount">

  <button class="service-btn"
   data-action="deposit-confirm">
   💰 CONFIRM DEPOSIT
  </button>
 </div>`;
}

function doDeposit(value){
 const amount=Number(value);

 if(!amount||amount<=0){
   toast("⚠️ Enter a valid amount");
   return;
 }

 const reference=ref();

 data[current.acc].balance+=amount;

 data[current.acc].tx.push({
   type:"Deposit",
   amount,
   note:"ATM Cash Deposit",
   reference,
   date:new Date().toISOString()
 });

 data[current.acc].notes.push(
   `Deposit of ${money(amount)} successful`
 );

 save();

 showSuccessReceipt({
   type:"DEPOSIT",
   message:`${money(amount)} deposited successfully`,
   amount,
   reference
 });
}

/* =========================
   TRANSFER
========================= */

function transfer(){
 selected=null;

 $("main").innerHTML=`
 <div class="service">
  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>🔄 Send Money</h1>

  <p class="muted">
   Select a demo user below.
  </p>

  <input id="search"
   class="field"
   placeholder="🔍 Search name or account number">

  <div id="recipients" class="recipients"></div>

  <div id="selectedBox"></div>

  <input id="amount"
   class="field"
   type="number"
   placeholder="Enter transfer amount">

  <button class="service-btn"
   data-action="send">
   🔄 CONTINUE TO CONFIRM
  </button>
 </div>`;

 renderRecipients();
}

function renderRecipients(){
 const box=$("recipients");
 if(!box)return;

 const q=($("search")?.value||"").toLowerCase();

 const list=USERS
  .filter(u=>u.acc!==current.acc)
  .filter(u=>
    (u.name+" "+u.acc).toLowerCase().includes(q)
  );

 box.innerHTML=list.map(u=>`
  <button class="recipient ${selected?.acc===u.acc?"selected":""}"
   data-recipient="${u.acc}">

   <span class="recipient-avatar">
    ${u.name.charAt(0)}
   </span>

   <span>
    <b>${u.name}</b>
    <small>Account No: ${u.acc}</small>
   </span>

   <strong>›</strong>
  </button>
 `).join("");
}

function chooseRecipient(acc){
 selected=USERS.find(u=>u.acc===acc);

 $("selectedBox").innerHTML=`
 <div class="selected-recipient">
  <div class="recipient-avatar">
   ${selected.name.charAt(0)}
  </div>

  <div>
   <small>RECIPIENT</small>
   <b>${selected.name}</b>
   <span>Account No: ${selected.acc}</span>
  </div>

  <button data-action="clear-recipient">×</button>
 </div>`;

 renderRecipients();
}

function sendMoney(){
 if(!selected){
   toast("⚠️ Please select recipient");
   return;
 }

 const amount=Number($("amount")?.value);

 if(!amount||amount<=0){
   toast("⚠️ Enter valid amount");
   return;
 }

 if(amount>data[current.acc].balance){
   toast("❌ INSUFFICIENT BALANCE");
   return;
 }

 showTransferConfirm(amount);
}

function showTransferConfirm(amount){
 const reference=ref();

 $("main").innerHTML=`
 <div class="service confirmation">
  <div class="success-icon">🔄</div>

  <h1>Confirm Transfer</h1>

  <div class="confirm-box">

   <div>
    <small>SENDING FROM</small>
    <b>${current.name}</b>
    <span>Account: ${current.acc}</span>
   </div>

   <div class="arrow">↓</div>

   <div>
    <small>SENDING TO</small>
    <b>${selected.name}</b>
    <span>Account: ${selected.acc}</span>
   </div>

   <div class="confirm-amount">
    ${money(amount)}
   </div>

   <div>
    <small>REFERENCE</small>
    <b>${reference}</b>
   </div>

  </div>

  <button class="service-btn"
   data-action="final-send"
   data-amount="${amount}"
   data-reference="${reference}">
   ✅ CONFIRM & SEND
  </button>

  <button class="sub-btn"
   data-page="transfer">
   ← CANCEL
  </button>
 </div>`;
}

function finalSend(amount,reference){
 amount=Number(amount);

 data[current.acc].balance-=amount;
 data[selected.acc].balance+=amount;

 data[current.acc].tx.push({
  type:"Transfer Sent",
  amount,
  note:`To ${selected.name} • ${selected.acc}`,
  reference,
  date:new Date().toISOString()
 });

 data[selected.acc].tx.push({
  type:"Transfer Received",
  amount,
  note:`From ${current.name} • ${current.acc}`,
  reference,
  date:new Date().toISOString()
 });

 data[current.acc].notes.push(
  `Sent ${money(amount)} to ${selected.name} (${selected.acc})`
 );

 data[selected.acc].notes.push(
  `Received ${money(amount)} from ${current.name} (${current.acc})`
 );

 save();

 showSuccessReceipt({
  type:"MONEY TRANSFER",
  message:`${money(amount)} sent successfully`,
  amount,
  reference,
  receiver:selected
 });
}

/* =========================
   SUCCESS POPUP
========================= */

function showSuccessReceipt(info){
 lastReceipt={
  ...info,
  sender:current,
  balance:data[current.acc].balance,
  date:new Date()
 };

 const old=document.querySelector(".receipt-overlay");
 if(old)old.remove();

 const receiver=info.receiver;

 const overlay=document.createElement("div");
 overlay.className="receipt-overlay";

 overlay.innerHTML=`
 <div class="receipt-popup">

  <div class="success-circle">✓</div>

  <h2>TRANSACTION SUCCESSFUL</h2>

  <p class="success-message">
   ${info.message}
  </p>

  <div class="receipt-mini">

   <div class="receipt-row">
    <span>Transaction</span>
    <b>${info.type}</b>
   </div>

   <div class="receipt-row big">
    <span>Amount</span>
    <b>${money(info.amount)}</b>
   </div>

   ${
    receiver
    ? `
    <div class="receipt-row">
     <span>Sent To</span>
     <b>${receiver.name}</b>
    </div>

    <div class="receipt-row">
     <span>Account No.</span>
     <b>${receiver.acc}</b>
    </div>
    `
    : ""
   }

   <div class="receipt-row">
    <span>Reference</span>
    <b>${info.reference}</b>
   </div>

   <div class="receipt-row">
    <span>New Balance</span>
    <b>${money(data[current.acc].balance)}</b>
   </div>

   <div class="receipt-row">
    <span>Date</span>
    <b>${new Date().toLocaleString()}</b>
   </div>

  </div>

  <div class="receipt-actions">

   <button data-action="download-receipt">
    📄 DOWNLOAD PDF
   </button>

   <button data-action="close-receipt">
    ✓ DONE
   </button>

  </div>

 </div>`;

 document.body.appendChild(overlay);

 beep(950);
}

/* =========================
   REAL PDF GENERATOR
   Browser-native download
========================= */

function escapePDF(text){
 return String(text)
  .replace(/\\/g,"\\\\")
  .replace(/\(/g,"\\(")
  .replace(/\)/g,"\\)");
}

function makePDF(info){
 const receiver=info.receiver;

 const lines=[
  "VIRTUAL ATM PRO",
  "TRANSACTION RECEIPT",
  "--------------------------------",
  "Transaction : "+info.type,
  "Status      : SUCCESSFUL",
  "Customer    : "+current.name,
  "Account     : "+current.acc,
  "Amount      : "+money(info.amount),
  receiver ? "Receiver    : "+receiver.name : "",
  receiver ? "Receiver A/C : "+receiver.acc : "",
  "Reference   : "+info.reference,
  "Balance     : "+money(data[current.acc].balance),
  "Date        : "+new Date().toLocaleString(),
  "--------------------------------",
  "Educational ATM Simulator",
  "No real banking transaction."
 ].filter(Boolean);

 let content="BT\n/F1 12 Tf\n50 790 Td\n";

 lines.forEach((line,index)=>{
   content+=`(${escapePDF(line)}) Tj\n0 -30 Td\n`;
 });

 content+="ET";

 const objects=[
  "",
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
 ];

 let pdf="%PDF-1.4\n";
 const offsets=[0];

 for(let i=1;i<objects.length;i++){
  offsets[i]=pdf.length;
  pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;
 }

 const xref=pdf.length;

 pdf+=`xref
0 ${objects.length}
0000000000 65535 f 
`;

 for(let i=1;i<objects.length;i++){
  pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
 }

 pdf+=`trailer
<< /Size ${objects.length} /Root 1 0 R >>
startxref
${xref}
%%EOF`;

 const blob=new Blob([pdf],{type:"application/pdf"});
 const url=URL.createObjectURL(blob);

 const a=document.createElement("a");
 a.href=url;
 a.download=`ATM-${info.type.replaceAll(" ","-")}-${info.reference}.pdf`;

 document.body.appendChild(a);
 a.click();
 a.remove();

 setTimeout(()=>URL.revokeObjectURL(url),3000);

 toast("📄 PDF DOWNLOADED");
}

/* =========================
   BALANCE
========================= */

function balance(){
 $("main").innerHTML=`
 <div class="service">

  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>💳 Account Balance</h1>

  <div class="balance">
   <small>AVAILABLE BALANCE</small>
   <strong>${money(data[current.acc].balance)}</strong>
  </div>

  <div class="stats">

   <div class="stat">
    <small>ACCOUNT</small>
    <b>${current.acc}</b>
   </div>

   <div class="stat">
    <small>STATUS</small>
    <b style="color:#20e69a">ACTIVE</b>
   </div>

   <div class="stat">
    <small>ATM LIMIT</small>
    <b>₹50,000</b>
   </div>

   <div class="stat">
    <small>TRANSACTIONS</small>
    <b>${data[current.acc].tx.length}</b>
   </div>

  </div>

  <br>

  <button class="service-btn"
   data-action="balance-pdf">
   📄 DOWNLOAD BALANCE PDF
  </button>

 </div>`;
}

/* =========================
   STATEMENT
========================= */

function statement(){
 $("main").innerHTML=`
 <div class="service">

  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>🧾 Mini Statement</h1>

  <input id="searchTx"
   class="field"
   placeholder="🔍 Search transaction">

  <div id="table"></div>

 </div>`;

 renderTable(data[current.acc].tx.slice().reverse());
}

function renderTable(rows){
 if(!$("table"))return;

 $("table").innerHTML=rows.length
 ? `
 <table class="table">
  <tr>
   <th>TYPE</th>
   <th>AMOUNT</th>
   <th>DETAIL</th>
   <th>DATE</th>
   <th>REFERENCE</th>
  </tr>

  ${rows.map(x=>`
  <tr>
   <td>${x.type}</td>
   <td>${money(x.amount)}</td>
   <td>${x.note||"-"}</td>
   <td>${new Date(x.date).toLocaleString()}</td>
   <td>${x.reference||"-"}</td>
  </tr>
  `).join("")}

 </table>`
 : `<p class="muted">No transactions.</p>`;
}

/* =========================
   CARD
========================= */

function card(){
 $("main").innerHTML=`
 <div class="service">

  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>💳 My Virtual Card</h1>

  <div class="virtual-card">

   <div class="card-bank">VIRTUAL ATM PRO</div>

   <div class="chip">▦</div>

   <div class="card-no">
    5412 •••• •••• ${current.acc.slice(-4)}
   </div>

   <div class="card-bottom">
    <span>${current.name.toUpperCase()}</span>
    <span>12/29</span>
   </div>

  </div>

  <br>

  <button class="service-btn"
   data-action="lock">
   🔒 LOCK CARD
  </button>

  <br><br>

  <button class="service-btn"
   data-action="replace">
   ♻️ REPLACE CARD
  </button>

 </div>`;
}

/* =========================
   SECURITY
========================= */

function security(){
 $("main").innerHTML=`
 <div class="service">

  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>🔐 Security Center</h1>

  <div class="setting">
   <span>Account Status</span>
   <b style="color:#20e69a">● SECURE</b>
  </div>

  <div class="setting">
   <span>Account Number</span>
   <b>${current.acc}</b>
  </div>

  <div class="setting">
   <span>Last Activity</span>
   <b>${new Date().toLocaleString()}</b>
  </div>

  <br>

  <button class="service-btn"
   data-action="scan">
   🛡️ RUN SECURITY SCAN
  </button>

  <br><br>

  <button class="service-btn"
   data-action="pin-change">
   🔑 CHANGE DEMO PIN
  </button>

 </div>`;
}

/* =========================
   NOTIFICATIONS
========================= */

function notifications(){
 const notes=data[current.acc].notes.slice().reverse();

 $("main").innerHTML=`
 <div class="service">

  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>🔔 Notifications</h1>

  ${
   notes.length
   ? notes.map(n=>`
     <div class="activity">
      🔔 ${n}
     </div>
   `).join("")
   : `<p class="muted">No notifications.</p>`
  }

 </div>`;
}

/* =========================
   SETTINGS
========================= */

function settings(){
 $("main").innerHTML=`
 <div class="service">

  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>⚙️ Settings</h1>

  <div class="setting">
   <span>🔊 Sound</span>
   <button data-action="sound">
    ${sound?"ON":"OFF"}
   </button>
  </div>

  <div class="setting">
   <span>🎨 Theme</span>
   <select id="themeSelect">
    <option value="dark" ${theme==="dark"?"selected":""}>Dark</option>
    <option value="light" ${theme==="light"?"selected":""}>Light</option>
    <option value="midnight" ${theme==="midnight"?"selected":""}>Midnight</option>
    <option value="emerald" ${theme==="emerald"?"selected":""}>Emerald</option>
   </select>
  </div>

  <div class="setting">
   <span>💾 Demo Data</span>
   <button data-action="reset">RESET</button>
  </div>

 </div>`;
}

/* =========================
   HELP
========================= */

function help(){
 $("main").innerHTML=`
 <div class="service">

  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <h1>❓ Help Center</h1>

  <div class="activity">
   🏦 Login
   <span>Use any demo account and PIN.</span>
  </div>

  <div class="activity">
   💸 Withdraw
   <span>Select or type any amount.</span>
  </div>

  <div class="activity">
   💰 Deposit
   <span>Select or type any amount.</span>
  </div>

  <div class="activity">
   🔄 Send Money
   <span>Select recipient, verify details, then confirm.</span>
  </div>

  <div class="activity">
   📄 PDF
   <span>After successful transaction, press Download PDF.</span>
  </div>

  <p class="muted">
   This is an educational banking simulator.
   It does not connect to a real bank.
  </p>

 </div>`;
}

/* =========================
   ABOUT
========================= */

function aboutApp(){
 $("main").innerHTML=`
 <div class="service">

  <button class="sub-btn" data-page="dashboard">← BACK</button>

  <div class="creator">

   <div class="logo small-logo">🏦</div>

   <h1>Virtual ATM Pro</h1>

   <h2>👨‍💻 Created By</h2>

   <h1>Rishi Shah</h1>

   <h3>SYCS Student</h3>

   <p>Roll No. <b>66</b></p>

   <p>
    HTML • CSS • JavaScript
   </p>

  </div>

 </div>`;
}

/* =========================
   DEMO
========================= */

function showDemo(){
 show("demo");

 $("demoList").innerHTML=USERS.map(u=>`
  <div class="demo-card">

   <h2>👤 ${u.name}</h2>

   <p>
    Account:
    <b>${u.acc}</b>
   </p>

   <p>
    PIN:
    <b>${u.pin}</b>
   </p>

   <p>
    Balance:
    <b>${money(data[u.acc].balance)}</b>
   </p>

   <button data-demo="${u.acc}">
    LOGIN AS ${u.name.split(" ")[0]} →
   </button>

  </div>
 `).join("");
}

/* =========================
   LOGOUT
========================= */

function logout(){
 if(confirm("Logout from Virtual ATM?")){
   current=null;
   accInput="";
   pinInput="";
   selected=null;

   show("welcome");

   toast("👋 LOGGED OUT SUCCESSFULLY");
 }
}

/* =========================
   EVENT SYSTEM
========================= */

document.addEventListener("click",e=>{

 const button=e.target.closest("button");
 if(!button)return;

 beep();

 const action=button.dataset.action;
 const pg=button.dataset.page;

 /* navigation */
 if(pg){
   page(pg);
   return;
 }

 /* simple actions */
 if(action==="start"){
   startATM();
   return;
 }

 if(action==="home"){
   show("welcome");
   return;
 }

 if(action==="demo"){
   showDemo();
   return;
 }

 if(action==="about"){
   show("about");
   return;
 }

 if(action==="account-back"){
   show("account");
   return;
 }

 if(action==="account-enter"){
   accountEnter();
   return;
 }

 if(action==="login"){
   login();
   return;
 }

 if(action==="logout"){
   logout();
   return;
 }

 /* keypad */
 if(button.dataset.key!==undefined){

   const k=button.dataset.key;
   const type=button.dataset.type;

   if(type==="account"){

     if(k==="C")accInput="";
     else if(k==="⌫")accInput=accInput.slice(0,-1);
     else if(accInput.length<10)accInput+=k;

     updateAccount();
   }

   if(type==="pin"){

     if(k==="C")pinInput="";
     else if(k==="⌫")pinInput=pinInput.slice(0,-1);
     else if(pinInput.length<4)pinInput+=k;

     updatePin();
   }

   return;
 }

 /* amounts */
 if(button.dataset.withdraw){
   doWithdraw(button.dataset.withdraw);
   return;
 }

 if(button.dataset.deposit){
   doDeposit(button.dataset.deposit);
   return;
 }

 /* recipient */
 if(button.dataset.recipient){
   chooseRecipient(button.dataset.recipient);
   return;
 }

 if(button.dataset.demo){
   const u=USERS.find(x=>x.acc===button.dataset.demo);
   current=u;
   openApp();
   return;
 }

 /* transaction actions */
 if(action==="withdraw-confirm"){
   doWithdraw($("amount")?.value);
   return;
 }

 if(action==="deposit-confirm"){
   doDeposit($("amount")?.value);
   return;
 }

 if(action==="send"){
   sendMoney();
   return;
 }

 if(action==="final-send"){
   finalSend(
    button.dataset.amount,
    button.dataset.reference
   );
   return;
 }

 if(action==="clear-recipient"){
   selected=null;
   transfer();
   return;
 }

 /* popup */
 if(action==="download-receipt"){
   if(lastReceipt)makePDF(lastReceipt);
   return;
 }

 if(action==="close-receipt"){
   document.querySelector(".receipt-overlay")?.remove();
   page("dashboard");
   return;
 }

 /* balance PDF */
 if(action==="balance-pdf"){

   makePDF({
    type:"BALANCE CHECK",
    message:"Balance checked successfully",
    amount:0,
    reference:ref()
   });

   return;
 }

 /* sound */
 if(action==="sound"){
   sound=!sound;
   localStorage.setItem(
    "ATM_SOUND",
    sound?"on":"off"
   );
   settings();
   toast(sound?"🔊 SOUND ON":"🔇 SOUND OFF");
   return;
 }

 /* theme button */
 if(action==="theme"){
   changeTheme();
   return;
 }

 /* card */
 if(action==="lock"){
   toast("🔒 CARD LOCKED — DEMO MODE");
   return;
 }

 if(action==="replace"){
   toast("♻️ CARD REPLACEMENT SIMULATED");
   return;
 }

 /* security */
 if(action==="scan"){
   toast("🛡️ SECURITY SCAN COMPLETE");
   return;
 }

 if(action==="pin-change"){

   const p=prompt("Enter new 4 digit demo PIN:");

   if(!p)return;

   if(!/^\d{4}$/.test(p)){
     toast("❌ PIN MUST BE 4 DIGITS");
     return;
   }

   current.pin=p;

   toast("✅ DEMO PIN CHANGED");

   return;
 }

 /* reset */
 if(action==="reset"){

   if(confirm("Reset ALL demo balances and transactions?")){

     data=makeInitialData();
     save();

     toast("♻️ DEMO DATA RESET");

     setTimeout(()=>{
       page("dashboard");
     },500);
   }

   return;
 }

});

/* =========================
   SEARCH
========================= */

document.addEventListener("input",e=>{

 if(e.target.id==="search"){
   renderRecipients();
 }

 if(e.target.id==="searchTx"){

   const q=e.target.value.toLowerCase();

   const rows=data[current.acc].tx
    .filter(x=>
      (
       x.type+
       x.note+
       (x.reference||"")
      ).toLowerCase().includes(q)
    )
    .reverse();

   renderTable(rows);
 }
});

/* =========================
   THEME
========================= */

function changeTheme(){

 const themes=[
  "dark",
  "light",
  "midnight",
  "emerald"
 ];

 const i=themes.indexOf(theme);

 theme=themes[(i+1)%themes.length];

 applyTheme();

 toast("🎨 Theme: "+theme.toUpperCase());

 if($("main")&&$("app").classList.contains("active"))
   settings();
}

/* =========================
   SELECT THEME
========================= */

document.addEventListener("change",e=>{

 if(e.target.id==="themeSelect"){

   theme=e.target.value;

   applyTheme();

   toast("🎨 "+theme.toUpperCase()+" THEME ACTIVATED");
 }
});

/* =========================
   PIN SHOW/HIDE
========================= */

if($("showPin")){
 $("showPin").addEventListener(
  "change",
  updatePin
 );
}

/* =========================
   KEYBOARD
========================= */

document.addEventListener("keydown",e=>{

 if($("account")?.classList.contains("active")){

   if(/^[0-9]$/.test(e.key)){

     if(accInput.length<10)
       accInput+=e.key;

     updateAccount();
   }

   if(e.key==="Backspace"){

     accInput=accInput.slice(0,-1);

     updateAccount();
   }

   if(e.key==="Enter")
     accountEnter();
 }

 if($("pin")?.classList.contains("active")){

   if(/^[0-9]$/.test(e.key)){

     if(pinInput.length<4)
       pinInput+=e.key;

     updatePin();
   }

   if(e.key==="Backspace"){

     pinInput=pinInput.slice(0,-1);

     updatePin();
   }

   if(e.key==="Enter")
     login();
 }
});

/* =========================
   CLOCK
========================= */

setInterval(()=>{

 const now=new Date();

 if($("welcomeClock"))
   $("welcomeClock").textContent=
    now.toLocaleString();

 if($("clock"))
   $("clock").textContent=
    now.toLocaleTimeString();

},1000);

updateAccount();
updatePin();
