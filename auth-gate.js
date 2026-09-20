(async function(){
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
  window.logout=async function(){
    try{await fetch('/api/logout',{method:'POST'})}catch{}
    location.replace('/login.html');
  };
  try{
    const r=await fetch('/api/session',{cache:'no-store'});
    if(r.status===401){location.replace('/login.html');return}
    if(!r.ok)throw new Error('Session check failed');
    const j=await r.json();
    const u=document.querySelector('#userEmail');
    if(u)u.textContent=j.email||'';
    document.body.classList.remove('auth-pending');
    for(const src of ['app1.js','app2.js','app3.js','app4.js']) await load(src);
  }catch(e){
    console.error(e);
    location.replace('/login.html');
  }
})();