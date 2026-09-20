import {authConfigured,getSession} from '../lib/auth.js';
const KEY='mmass:pricing:v1';

function env(){
  const url=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
  return {url:url&&url.replace(/\/$/,''),token};
}

async function command(args){
  const {url,token}=env();
  if(!url||!token) throw new Error('Upstash environment variables are not available to this deployment.');
  const r=await fetch(url,{
    method:'POST',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify(args)
  });
  const j=await r.json().catch(()=>({}));
  if(!r.ok||j.error) throw new Error(j.error||('Upstash request failed ('+r.status+')'));
  return j.result;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  if(authConfigured()&&!getSession(req)) return res.status(401).json({error:'Sign in required.'});
  try{
    if(req.method==='GET'){
      const raw=await command(['GET',KEY]);
      if(!raw) return res.status(200).json({data:null,updatedAt:0});
      const doc=JSON.parse(raw);
      return res.status(200).json({data:doc.data||doc,updatedAt:doc.updatedAt||0});
    }
    if(req.method==='POST'){
      const data=req.body&&Object.prototype.hasOwnProperty.call(req.body,'data')?req.body.data:req.body;
      if(!data||typeof data!=='object') return res.status(400).json({error:'Invalid data payload.'});
      const doc={data,updatedAt:Date.now()};
      await command(['SET',KEY,JSON.stringify(doc)]);
      return res.status(200).json({ok:true,updatedAt:doc.updatedAt});
    }
    res.setHeader('Allow','GET, POST');
    return res.status(405).json({error:'Method not allowed.'});
  }catch(e){
    console.error('MMASS cloud API:',e);
    return res.status(503).json({error:e.message||'Cloud database unavailable.'});
  }
}
