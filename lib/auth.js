import crypto from 'node:crypto';

export function allowedEmails(){
  return String(process.env.MMASS_ALLOWED_EMAILS||'')
    .split(/[,;\s]+/)
    .map(x=>x.trim().toLowerCase())
    .filter(Boolean);
}

export function authConfigured(){
  return allowedEmails().length>0 && Boolean(process.env.MMASS_LOGIN_PASSWORD);
}

function safeEqual(a,b){
  const A=Buffer.from(String(a)),B=Buffer.from(String(b));
  return A.length===B.length && crypto.timingSafeEqual(A,B);
}

function sign(payload){
  return crypto.createHmac('sha256',String(process.env.MMASS_LOGIN_PASSWORD||''))
    .update(payload).digest('base64url');
}

export function createSession(email){
  const payload=Buffer.from(JSON.stringify({
    email:String(email).toLowerCase(),
    exp:Date.now()+1000*60*60*24*14
  })).toString('base64url');
  return payload+'.'+sign(payload);
}

function cookieValue(req,name){
  const raw=String(req.headers.cookie||'');
  for(const part of raw.split(';')){
    const i=part.indexOf('=');
    if(i<0)continue;
    if(part.slice(0,i).trim()===name)return decodeURIComponent(part.slice(i+1).trim());
  }
  return '';
}

export function getSession(req){
  if(!authConfigured()) return {email:'',bypass:true};
  const token=cookieValue(req,'mmass_session');
  const [payload,sig]=token.split('.');
  if(!payload||!sig||!safeEqual(sign(payload),sig))return null;
  try{
    const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    if(!data.email||!data.exp||Date.now()>data.exp)return null;
    if(!allowedEmails().includes(String(data.email).toLowerCase()))return null;
    return data;
  }catch{return null}
}

export function validCredentials(email,password){
  if(!authConfigured())return false;
  const e=String(email||'').trim().toLowerCase();
  const allowed=allowedEmails().includes(e);
  const pw=String(process.env.MMASS_LOGIN_PASSWORD||'');
  return allowed && safeEqual(String(password||''),pw);
}

export function sessionCookie(token){
  return 'mmass_session='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600';
}

export function clearSessionCookie(){
  return 'mmass_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
