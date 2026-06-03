async function sendCode(){
  const email=document.getElementById('email').value.trim();
  const msg=document.getElementById('msg');
  msg.textContent='جاري إرسال الرمز...';
  try{
    const res=await fetch('/api/send-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
    const data=await res.json();
    msg.textContent=data.message;
    if(data.ok) document.getElementById('codeArea').classList.remove('hidden');
  }catch(e){msg.textContent='حدث خطأ بالاتصال بالسيرفر';}
}
async function verifyCode(){
  const email=document.getElementById('email').value.trim();
  const code=document.getElementById('code').value.trim();
  const msg=document.getElementById('msg');
  const res=await fetch('/api/verify-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code})});
  const data=await res.json();
  msg.textContent=data.message;
  if(data.ok) showSite(email);
}
function showSite(email){
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('siteBox').classList.remove('hidden');
  document.getElementById('userEmail').textContent='البريد: '+email;
}
async function logout(){
  await fetch('/api/logout',{method:'POST'});
  location.reload();
}
async function checkLogin(){
  try{
    const res=await fetch('/api/me');
    if(res.ok){
      const data=await res.json();
      showSite(data.email);
    }
  }catch(e){}
}
checkLogin();
