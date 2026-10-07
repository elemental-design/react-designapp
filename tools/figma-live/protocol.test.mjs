import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('bridge authenticates, increments revisions and records plugin acknowledgement', async () => {
 const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,FIGMA_BRIDGE_TOKEN:'test-session'},stdio:['ignore','pipe','pipe']});
 try {
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Bridge failed to start');}),new Promise((_,reject)=>{const timeout=setTimeout(()=>reject(Error('Startup timeout')),5000);timeout.unref();})]);
  const base='http://127.0.0.1:3847';
  assert.equal((await fetch(base+'/desired')).status,401);
  const post=async(path,value)=>fetch(base+path+'?token=test-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  assert.equal((await post('/desired',{width:-1,label:'bad'})).status,400);
  const a=await (await post('/desired',{width:240,label:'first'})).json();
  const b=await (await post('/desired',{width:320,label:'second'})).json();
  assert.equal(b.revision,a.revision+1);
  assert.deepEqual(await (await fetch(base+'/desired?token=test-session')).json(),b);
  const status={type:'applied',revision:b.revision,nodeId:'1:2',width:320};
  assert.equal((await post('/status',status)).status,200);
  assert.deepEqual(await (await fetch(base+'/status?token=test-session')).json(),status);
 } finally {if(child.exitCode===null && child.signalCode===null){const exited=once(child,'exit');child.kill();await exited;}}
});
