import http from 'node:http';
import { randomUUID } from 'node:crypto';
const token = process.env.FIGMA_BRIDGE_TOKEN || randomUUID();
let revision = 0;
let desired = {revision, label:'Live probe', width:240};
let status = null;
const server = http.createServer(async (req,res) => {
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Access-Control-Allow-Headers','Content-Type');
 if(req.method === 'OPTIONS'){res.writeHead(204);res.end();return;}
 const url = new URL(req.url,'http://localhost');
 if(url.searchParams.get('token') !== token){res.writeHead(401);res.end();return;}
 const json = value => {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
 if(req.method === 'GET' && url.pathname === '/desired') return json(desired);
 if(req.method === 'GET' && url.pathname === '/status') return json(status);
 if(req.method === 'POST' && ['/desired','/status'].includes(url.pathname)) {
  let body='';for await(const chunk of req){body+=chunk;if(body.length>65536){res.writeHead(413);res.end();return;}}
  try {const value=JSON.parse(body);
   if(url.pathname === '/status') status=value;
   else {if(typeof value.label!=='string'||!Number.isFinite(value.width)||value.width<1||value.width>2000) throw Error('Invalid desired state');desired={label:value.label,width:value.width,revision:++revision};}
   return json(url.pathname === '/status'?status:desired);
  } catch {res.writeHead(400);res.end();return;}
 }
 res.writeHead(404);res.end();
});
server.listen(3847,'127.0.0.1',()=>console.log(`Bridge http://localhost:3847 — token ${token}`));
