import {authConfigured,createSession,sessionCookie,validCredentials} from '../lib/auth.js';

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'Method not allowed.'});
  }
  if(!authConfigured())return res.status(503).json({error:'App login is not configured yet.'});
  const body=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch{return {}}})():req.body||{};
  const email=String(body.email||'').trim().toLowerCase();
  const password=String(body.password||'');
  if(!validCredentials(email,password)){
    await new Promise(r=>setTimeout(r,300));
    return res.status(401).json({error:'Invalid email or password.'});
  }
  res.setHeader('Set-Cookie',sessionCookie(createSession(email)));
  return res.status(200).json({ok:true,email});
}
