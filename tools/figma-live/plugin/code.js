figma.showUI(__html__, {width:320,height:180});
let revision=-1;
let running=false;
figma.ui.onmessage=async message=>{
 if(message.type!=='apply'||running) return;
 running=true;
 try {
  const d=message.desired;
  if(d.revision===revision) return;
  await figma.currentPage.loadAsync();
  const matches=figma.currentPage.findAll(n=>n.getPluginData('probeRenderId')==='figma-live-probe/root');
  if(matches.length>1) throw Error('Duplicate probe identities; choose a clean Draft/page.');
  let root=matches[0];
  if(root && root.type!=='FRAME') throw Error('Probe root has incompatible type');
  if(!root){root=figma.createFrame();root.setPluginData('probeRenderId','figma-live-probe/root');}
  root.name=d.label;root.resize(d.width,120);
  root.fills=[{type:'SOLID',color:{r:0.2,g:0.4,b:0.9}}];
  revision=d.revision;
  figma.ui.postMessage({type:'applied',revision,nodeId:root.id,label:root.name,width:root.width});
 } catch(error){figma.ui.postMessage({type:'error',message:String(error)});}
 finally {running=false;}
};
