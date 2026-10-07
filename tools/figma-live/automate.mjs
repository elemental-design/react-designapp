import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const endpoint=process.env.FIGMA_CDP_URL || 'http://127.0.0.1:9222';
const browser=await chromium.connectOverCDP(endpoint);
try {
 const pages=browser.contexts().flatMap(c=>c.pages());
 const page=pages.find(p=>process.env.FIGMA_DRAFT_URL ? p.url().split('?')[0]===process.env.FIGMA_DRAFT_URL.split('?')[0] : /figma.com\/(design|file)\//.test(p.url()));
 if(!page) throw Error('Open a disposable Figma Draft in the attached app first.');
 if(process.argv[2]==='discover'){
  await mkdir('artifacts',{recursive:true});
  const inventory=[];
  for(const frame of page.frames()) inventory.push({url:frame.url(),elements:await frame.locator('[data-testid], [role], button, input').evaluateAll(elements=>elements.map(e=>({tag:e.tagName,testId:e.getAttribute('data-testid'),role:e.getAttribute('role'),label:e.getAttribute('aria-label'),text:e.textContent?.slice(0,120)})))});
  await writeFile('artifacts/selectors.json',JSON.stringify(inventory,null,2));
  await page.screenshot({path:'artifacts/figma.png'});
  console.log('Captured observed selectors and screenshot in artifacts/.');
 } else {
  const token=process.env.FIGMA_BRIDGE_TOKEN;if(!token)throw Error('Set FIGMA_BRIDGE_TOKEN to the running bridge token.');
  let previousNodeId;
  if(process.argv[2]==='restart'){
   const response=await fetch('http://localhost:3847/status?token='+encodeURIComponent(token));
   const previous=await response.json();previousNodeId=previous?.nodeId;
   if(!previousNodeId)throw Error('Run smoke before restart to establish identity.');
   await page.getByTestId('pluginModalWindow').getByLabel('Close',{exact:true}).click();
   await page.getByTestId('pluginModalWindow').waitFor({state:'hidden'});
  }
  if(process.env.FIGMA_PLUGIN_LAUNCH_SELECTOR) await page.locator(process.env.FIGMA_PLUGIN_LAUNCH_SELECTOR).click();
  else if(!await page.getByTestId('pluginModalWindow').isVisible()){
   await page.keyboard.press('Meta+k');
   await page.getByTestId('quick-actions-search-input').fill('react-designapp live probe');
   await page.getByTestId('plugins-menu-item').filter({hasText:'react-designapp live probe'}).click();
  }
  // These launch test IDs were observed on Figma Desktop 126.9.11.
  // Search actual frames because Figma may nest the plugin iframe.
  let ui;
  const deadline=Date.now()+20000;
  while(Date.now()<deadline&&!ui){for(const candidate of page.frames())if(await candidate.locator('#connect').isVisible()) {ui=candidate;break;}if(!ui)await new Promise(r=>setTimeout(r,250));}
  if(!ui)throw Error('Plugin UI missing. Run plugin or configure an observed launch selector.');
  await ui.locator('#token').fill(token);await ui.locator('#connect').click();
  const call=async(path,body)=>{const res=await fetch('http://localhost:3847'+path+'?token='+encodeURIComponent(token),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});if(!res.ok)throw Error('Bridge '+res.status);return res.json();};
  const wait=async revision=>{const end=Date.now()+15000;while(Date.now()<end){const s=await call('/status');if(s?.type==='error')throw Error(s.message);if(s?.revision===revision)return s;await new Promise(r=>setTimeout(r,250));}throw Error('Timed out waiting for plugin acknowledgement');};
  const a=await call('/desired',{label:'Probe initial',width:240});const initial=await wait(a.revision);
  const b=await call('/desired',{label:'Probe updated',width:320});const updated=await wait(b.revision);
  if((previousNodeId && initial.nodeId!==previousNodeId)||initial.nodeId!==updated.nodeId||updated.width!==320||updated.label!=='Probe updated')throw Error('Identity/update assertion failed');
  console.log(JSON.stringify({initial,updated},null,2));
 }
} finally {await browser.close();}
