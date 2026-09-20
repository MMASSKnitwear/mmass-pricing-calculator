import {authConfigured,getSession} from '../lib/auth.js';

export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const configured=authConfigured();
  const session=getSession(req);
  if(!configured)return res.status(200).json({configured:false,authenticated:true,email:''});
  if(!session)return res.status(401).json({configured:true,authenticated:false});
  return res.status(200).json({configured:true,authenticated:true,email:session.email});
}
