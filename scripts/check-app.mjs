import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const seedText = html.match(/<script type="application\/json" id="projectSeed">([\s\S]*?)<\/script>/)[1];
const seed = JSON.parse(seedText);
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
for (const color of css.matchAll(/#([\da-f]{3,8})\b/gi)) {
  const hex=color[1];
  assert(hex.length<=4 ? hex[0]===hex[1]&&hex[1]===hex[2] : hex.slice(0,2)===hex.slice(2,4)&&hex.slice(2,4)===hex.slice(4,6), 'Non-grayscale CSS color: '+hex);
}
assert.equal(seed.projects.length,15);
assert.equal(seed.projects.reduce((n,p)=>n+p.files.length,0),632);
assert.equal(new Set(seed.projects.map(p=>p.id)).size,seed.projects.length);
assert(seed.projects.every(p=>p.full.startsWith('arnaut560000/')));

function harness(saved, failStorage=false){
  const elements=new Map();
  function element(id){
    if(!elements.has(id))elements.set(id,{
      value:id==='libraryKind'?'repo':id==='timeSlider'?'100':'',checked:id==='showFiles',textContent:id==='projectSeed'?seedText:'',options:[],
      classList:{add(){},remove(){},toggle(){}},style:{},focus(){},select(){},click(){this.onclick?.();},setAttribute(k,v){this[k]=v;},setPointerCapture(){},hasPointerCapture(){return true;},releasePointerCapture(){},
      showModal(){},close(){},getBoundingClientRect(){return {width:1000,height:700,left:0,top:0};},
      getContext(){return new Proxy({measureText(text){return {width:text.length*6};}},{get(target,key){return target[key]||(()=>{});},set(){return true;}});},addEventListener(){},
      set innerHTML(value){this.html=value;this.options=[...value.matchAll(/<option value="([^"]*)"/g)].map(m=>({value:m[1]}));},
      get innerHTML(){return this.html||'';}
    });
    return elements.get(id);
  }
  let persisted=saved;
  const context=vm.createContext({
    document:{getElementById:element,addEventListener(){}},localStorage:{getItem(){return persisted||null;},setItem(k,v){if(failStorage)throw Error('Quota');persisted=v;}},
    structuredClone,console,TextDecoder,Uint8Array,atob,URL,Blob,AbortSignal,devicePixelRatio:1,
    ResizeObserver:class{observe(){}},requestAnimationFrame(){return 1;},confirm(){return true;},setTimeout,clearTimeout,
    fetch:async()=>{throw Error('Unexpected network request during startup');}
  });
  vm.runInContext(source,context);
  return {run:code=>vm.runInContext(code,context),element,context,persisted:()=>persisted};
}

const fresh=harness();
assert.equal(fresh.run('db.notes.length'),15);
assert.equal(fresh.run('fileIndex.size'),632);
assert.equal(fresh.run('allNotes().length'),647);
assert(fresh.run('graphNodes.length')>647);
assert.equal(fresh.run('graphEdges.filter(e=>nodesById.get(e.a).kind==="file"||nodesById.get(e.b).kind==="file").length'),632);
assert(fresh.run('graphNodes.every(n=>/^#([a-f0-9]{6})$/i.test(nodeColor(n,false)))'));
assert(!source.includes('hsl('),'Graph must be grayscale, including node labels and edges');
for(let i=0;i<180;i++)fresh.run('loop()');
fresh.run('fitTarget();draw()');
assert(fresh.run('graphNodes.every(n=>n.sx>=0&&n.sx<=width&&n.sy>=0&&n.sy<=height)'),'Perspective globe must fit the canvas');
assert(fresh.run('graphEdges.filter(e=>nodesById.get(e.b).kind==="file").every(e=>e.length<GLOBE_RADIUS*.8)'),'Files must stay within their project neighborhood');
assert(fresh.run('graphEdges.filter(e=>nodesById.get(e.b).kind==="file").reduce((sum,e)=>sum+e.length,0)/fileIndex.size<GLOBE_RADIUS*.3'),'Typical file connections should be short');
assert(fresh.run('graphNodes.filter(n=>n.kind==="file"&&Math.hypot(n.wx,n.wy,n.wz)<GLOBE_RADIUS*.65).length>fileIndex.size*.2'),'Globe must contain files throughout its volume, not just on a hollow shell');
assert(fresh.run('[...ambientEdges].every(e=>graphEdges.includes(e))'),'Only actual relationships may be drawn');
assert(fresh.run('graphNodes.every(n=>[...ambientEdges].filter(e=>e.a===n.id||e.b===n.id).length<=5)'),'Large folders must not create ambient starbursts');
fresh.run('var stablePositions=new Map(graphNodes.map(n=>[n.id,[n.wx,n.wy,n.wz]]))');
assert(fresh.run('graphNodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y))'));
assert(fresh.run('graphNodes.every(n=>n.x*view.k+width/2+view.x>=0&&n.x*view.k+width/2+view.x<=width)'));
assert(fresh.run('graphNodes.every(n=>Math.hypot(n.wx,n.wy,n.wz)<=GLOBE_RADIUS+1e-8)'),'Every node belongs to the same globe');
fresh.run('var beforeRotation=graphNodes.map(n=>({id:n.id,x:n.x,y:n.y,z:n.z}));rotateGlobe(.5,.3);draw()');
assert(fresh.run('graphNodes.every((n,i)=>Math.abs(Math.hypot(n.x,n.y,n.z)-Math.hypot(beforeRotation[i].x,beforeRotation[i].y,beforeRotation[i].z))<1e-7)'),'Rotation must preserve spherical geometry');
assert(fresh.run('graphNodes.some((n,i)=>Math.abs(n.x-beforeRotation[i].x)>1)'));
fresh.run('selected=graphNodes.find(n=>n.kind==="repo").id;flyTo(selected)');
for(let i=0;i<100;i++)fresh.run('loop()');
assert(fresh.run('nodesById.get(selected).z>Math.hypot(nodesById.get(selected).wx,nodesById.get(selected).wy,nodesById.get(selected).wz)*.999'),'Selection must rotate to the front');
fresh.element('spin').onclick();
assert.equal(fresh.run('spinning'),true);
fresh.element('spin').onclick();
assert.equal(fresh.run('spinning'),false);
fresh.run('var originalRotation=JSON.stringify(rotation)');
fresh.element('graph').onpointerdown({clientX:500,clientY:350,pointerId:1,button:0});
fresh.element('graph').onpointermove({clientX:560,clientY:380,pointerId:1});
fresh.element('graph').onpointerup({pointerId:1});
assert(fresh.run('JSON.stringify(rotation)!==originalRotation'),'Dragging must rotate the globe');
fresh.run('var zoomBeforePinch=view.k');
fresh.element('graph').onpointerdown({clientX:400,clientY:350,pointerId:2,button:0});
fresh.element('graph').onpointerdown({clientX:600,clientY:350,pointerId:3,button:0});
fresh.element('graph').onpointermove({clientX:700,clientY:350,pointerId:3});
assert(fresh.run('view.k>zoomBeforePinch'),'Pinching must zoom');
fresh.element('graph').onpointerup({pointerId:2});fresh.element('graph').onpointerup({pointerId:3});
assert.equal(fresh.run('pointers.size'),0);
assert(fresh.persisted());
fresh.element('showFiles').checked=false;fresh.run('graph()');
assert.equal(fresh.run('graphNodes.filter(n=>n.kind==="file").length'),0);
assert(fresh.run('graphNodes.filter(n=>n.kind==="repo").every(n=>JSON.stringify([n.wx,n.wy,n.wz])===JSON.stringify(stablePositions.get(n.id)))'),'Toggling files must not move project territories');
fresh.element('showFiles').checked=true;fresh.run('graph()');
assert(fresh.run('graphNodes.filter(n=>n.kind==="repo").every(n=>focusedEdges(n.id).size<=5)'),'Hover previews should stay limited');
fresh.run('selected=db.notes.find(n=>n.kind==="repo"&&n.files.length>90).id;var connectedSelection=selectionConnections(selected)');
assert(fresh.run('connectedSelection.edges.size>5'),'Clicking must reveal all selected connections beyond the hover limit');
assert(fresh.run('graphEdges.filter(e=>e.a===selected||e.b===selected).every(e=>connectedSelection.edges.has(e)&&connectedSelection.nodes.has(e.a)&&connectedSelection.nodes.has(e.b))'),'Every direct connection must be highlighted');
assert(fresh.run('graphNodes.filter(n=>n.parent===selected).every(n=>connectedSelection.nodes.has(n.id))'),'Selected project must highlight files nested inside folders too');
assert(fresh.run('graphEdges.filter(e=>e.tree&&nodesById.get(e.b).parent===selected).every(e=>connectedSelection.edges.has(e))'),'Nested folder-to-file lines must be highlighted');
assert(fresh.run('graphNodes.filter(n=>connectedSelection.nodes.has(n.id)).every(n=>nodeColor(n,false,true)===SELECTED_NODE_COLOR)'),'Connected nodes must use the green highlight');
fresh.run('selected=graphNodes.find(n=>n.kind==="file"&&n.dir&&connectedSelection.nodes.has(n.id)).id;var fileSelection=selectionConnections(selected)');
assert(fresh.run('!fileSelection.nodes.has(graphNodes.find(n=>n.kind==="repo"&&n.id!==nodesById.get(selected).parent).id)'),'Selecting a file must not color unrelated projects');
assert(fresh.run('selectionConnections(null).nodes.size===0&&selectionConnections(null).edges.size===0'),'Clearing selection must clear the connected highlight');
fresh.run('selected=graphNodes.find(n=>n.kind==="dir"&&n.children.length>1).id;var selectedFolder=selected');
fresh.element('scope').value='local';fresh.run('graph();detail()');
assert(fresh.run('nodesById.has(selectedFolder)&&graphNodes.some(n=>n.dir===selectedFolder)'),'Selected folder view must retain its folder and files');
assert(fresh.run('graphNodes.filter(n=>n.kind==="file").every(n=>n.dir===selectedFolder)'),'Selected folder view should not include unrelated files');
fresh.element('scope').value='all';fresh.run('graph();selected=graphNodes.find(n=>n.kind==="stack").id;detail()');
assert(fresh.element('detail').innerHTML.includes('data-id="repo:'),'Technology details must list their actual connected projects');
fresh.element('tag').value='Python';
assert(fresh.run('visibleNotes().filter(n=>n.kind==="file").length')>0);

const legacy=JSON.parse(fresh.run('JSON.stringify(legacyStarter())'));
legacy.notes.push({...seed.projects[0],body:'My personal annotation',title:'My CRM',files:undefined,synced:'2020-01-01'});
legacy.notes.push({id:'personal',title:'Personal note',folder:'Inbox',tags:['mine'],kind:'note',body:'Keep this'});
const migrated=harness(JSON.stringify(legacy));
assert.equal(migrated.run('db.notes.filter(n=>n.kind==="repo").length'),15);
assert.equal(migrated.run('note("'+seed.projects[0].id+'").body'),'My personal annotation');
assert.equal(migrated.run('note("'+seed.projects[0].id+'").title'),'My CRM');
assert.equal(migrated.run('note("personal").body'),'Keep this');
assert.equal(migrated.run('db.notes.some(n=>n.id==="welcome")'),false);
assert.equal(harness(migrated.persisted()).run('db.notes.length'),16);
const incomplete={version:1,user:seed.user,seedVersion:seed.generated,notes:seed.projects.filter(p=>p.files.length),hiddenSeedIds:[]};
assert.equal(incomplete.notes.length,13);
assert.equal(harness(JSON.stringify(incomplete)).run('db.notes.filter(n=>n.kind==="repo").length'),15,'Repair missing empty projects even at the current seed version');
incomplete.hiddenSeedIds=[seed.projects.find(p=>!p.files.length).id];
assert.equal(harness(JSON.stringify(incomplete)).run('db.notes.filter(n=>n.kind==="repo").length'),14,'Preserve deliberate local removals');
assert(harness(undefined,true).run('storageFailed'));
assert(harness('invalid JSON').run('loadProblem.length')>0);

// A selected indexed file must load into the same saved record, then become searchable.
fresh.element('tag').value='';
fresh.run('selected=[...fileIndex.values()].find(n=>n.sourcePath.endsWith(".md")).id;detail();');
fresh.context.fetch=async()=>({ok:true,json:async()=>({type:'file',size:20,encoding:'base64',content:Buffer.from('# Loaded document\nUnique test phrase').toString('base64')})});
await fresh.element('loadIndexed').onclick();
assert(fresh.run('note().body.includes("Unique test phrase")'));
assert(fresh.run('db.notes.some(n=>n.id===selected)'));

// Refresh metadata, readmes, and source indexes without losing annotations.
fresh.run('db.notes.find(n=>n.kind==="repo").body="Keep annotation after sync"');
const sample=seed.projects[0];
fresh.context.fetch=async(url)=>({ok:true,json:async()=>{
  if(url.includes('/users/'))return [{id:Number(sample.id.slice(5)),private:false,name:sample.title,full_name:sample.full,language:sample.language,topics:[],default_branch:sample.branch,pushed_at:'2099-01-01',description:'Updated description'}];
  if(url.endsWith('/readme'))return {size:10,encoding:'base64',content:Buffer.from('# Updated README').toString('base64')};
  if(url.includes('/git/trees/'))return {truncated:false,tree:[{type:'blob',path:'new-source.js',size:20,sha:'example'}]};
  throw Error('Unexpected test URL');
}});
await fresh.run('syncGithub("arnaut560000")');
assert.equal(fresh.run('db.notes.find(n=>n.kind==="repo").body'),'Keep annotation after sync');
assert.equal(fresh.run('db.notes.find(n=>n.kind==="repo").files[0].path'),'new-source.js');
assert.equal(fresh.run('db.notes.find(n=>n.kind==="repo").readme'),'# Updated README');
console.log('PASS: 15 projects, 632 paths, monochrome globe, 3D rotation, selection, touch zoom, auto-rotate, migration, persistence, file loading, refresh, and storage failure handling.');
