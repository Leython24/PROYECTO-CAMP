import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
const root=process.cwd();
const preview=path.join(root,'preview');
const outDir=path.join(root,'artifacts','inline-build');
function replaceOnce(code,from,to){assert.ok(code.includes(from),'No se encontró la inserción: '+from.slice(0,80));return code.replace(from,to)}
await build({configFile:false,root,define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'capm-inline-adapter',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/engine/persistence.ts'))return "import {capmStorage as localStorage} from '../../preview/storage';\n"+code;if(id.replaceAll('\\','/').endsWith('/src/App.tsx')){code="import {capmStorage as localStorage} from '../preview/storage';import {InlineTransfer,PreviewExport,PreviewStatus,showTransfer} from '../preview/Transfer';\n"+code;const start=code.indexOf('function download('),end=code.indexOf('\nfunction Badge',start);assert.ok(start>0&&end>start);code=code.slice(0,start)+"function download(name:string,data:unknown){showTransfer(name,data)}"+code.slice(end);code=replaceOnce(code,'<main id="main" ref={mainRef} tabIndex={-1}>','<main id="main" ref={mainRef} tabIndex={-1}><PreviewStatus/><PreviewExport/>');code=replaceOnce(code,'<Coverage bank={bank}/>','<InlineTransfer onImport={importFile}/><Coverage bank={bank}/>');code=replaceOnce(code,'Progreso en este navegador','Mi progreso guardado');return code}}},react()],build:{outDir,emptyOutDir:true,copyPublicDir:false,minify:true,lib:{entry:path.join(preview,'main.tsx'),name:'CAPMLeython',formats:['iife'],fileName:()=> 'capm.js'},rollupOptions:{output:{inlineDynamicImports:true}},target:'es2022'}});
const js=await fs.readFile(path.join(outDir,'capm.js'),'utf8');
const files=await fs.readdir(outDir);const css=(await Promise.all(files.filter(x=>x.endsWith('.css')).map(x=>fs.readFile(path.join(outDir,x),'utf8')))).join('\n');
assert.ok(!/^\s*import\s/m.test(js),'No se permiten importaciones externas');
const fragment='<div id="capm-leython-preview" lang="es"><style>'+css.replaceAll('</style','<\\/style')+'</style><div id="root"><p>Cargando tu centro de estudio…</p></div><script>'+js.replaceAll('</script','<\\/script')+'</script></div>\n';
assert.ok(Buffer.byteLength(fragment)<1_000_000,'El fragmento excede 1 MB');
const output=path.resolve(root,'..','..','capm-leython.html');await fs.writeFile(output,fragment);
await fs.writeFile(path.join(outDir,'fragment.html'),fragment);
console.log(JSON.stringify({output,bytes:Buffer.byteLength(fragment),questions:JSON.parse(await fs.readFile('src/data/questions.json')).length,sources:JSON.parse(await fs.readFile('src/data/sources.json')).length}));
