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
      classList:{add(){},remove(){},toggle(){}},style:{},focus(){},select(){},click(){this.onclick?.();},
      showModal(){},close(){},getBoundingClientRect(){return {width:1000,height:700,left:0,top:0};},
      getContext(){return new Proxy({},{get(){return ()=>{};},set(){return true;}});},addEventListener(){},
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
fresh.run('fitTarget(true)');
assert(fresh.run('graphNodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y))'));
assert(fresh.run('graphNodes.every(n=>n.x*view.k+width/2+view.x>=0&&n.x*view.k+width/2+view.x<=width)'));
assert(fresh.persisted());
fresh.element('showFiles').checked=false;fresh.run('graph()');
assert.equal(fresh.run('graphNodes.filter(n=>n.kind==="file").length'),0);
fresh.element('showFiles').checked=true;fresh.run('graph()');
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
console.log('PASS: 15 projects, 632 paths, grayscale theme, graph layout, migration, persistence, file loading, refresh, and storage failure handling.');
