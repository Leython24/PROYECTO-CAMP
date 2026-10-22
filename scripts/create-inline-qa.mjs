import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
let code=await fs.readFile('scripts/browser-qa.mjs','utf8');
function edit(a,b){assert.ok(code.includes(a),'No se encontró: '+a);code=code.replace(a,b)}
edit("root=path.resolve('dist'),artifacts=path.resolve('artifacts')","root=path.resolve('artifacts/inline-qa-dist'),artifacts=path.resolve('artifacts/inline-qa')");
edit("let seq=0,buffer='',sessionId;", "let seq=0,buffer='',sessionId;const contexts=new Map();");
edit("if(m.method==='Fetch.requestPaused')", "if(m.method==='Runtime.executionContextCreated')contexts.set(m.params.context.id,m.params.context);if(m.method==='Runtime.executionContextDestroyed')contexts.delete(m.params.executionContextId);if(m.method==='Runtime.executionContextsCleared')contexts.clear();if(m.method==='Fetch.requestPaused')");
edit("async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});", "async function evaluate(expression){let context;for(let i=0;i<40&&!context;i++){const tree=await send('Page.getFrameTree');const frame=tree.frameTree.childFrames?.[0]?.frame.id;context=[...contexts.values()].find(c=>c.auxData?.frameId===frame&&c.auxData?.isDefault);if(!context)await delay(50)}if(!context)throw Error('No hay contexto de iframe');const r=await send('Runtime.evaluate',{contextId:context.id,expression,returnByValue:true,awaitPromise:true});");
// All progress mutations go through the real preview storage adapter.
code=code.replaceAll('localStorage','capmPreviewStorage');
code=code.replaceAll("await send('Page.reload')", "await evaluate('capmPreviewSaved()');await send('Page.reload')");
// Frame document routes do not survive a shell reload; the adapter restores lastPage.
edit("width:1440,height:1100", "width:1024,height:1100");
edit("const appErrors=browserErrors.filter(e=>!e.includes('gc.kis.v2.scr.kaspersky-labs.com'));", "const appErrors=browserErrors.filter(e=>!['gc.kis.v2.scr.kaspersky-labs.com','unpkg.com','cdnjs.cloudflare.com','net::ERR','Content Security Policy'].some(x=>e.includes(x)));");
const start=code.indexOf(" await check('Exportaciones JSON descargables");
const end=code.indexOf(" await check('Móvil:",start);
assert.ok(start>0&&end>start);
code=code.slice(0,start)+` await check('Exportación e importación JSON mediante texto dentro del visor',async()=>{await button('Exportar banco JSON');await wait('!!document.querySelector(".preview-export textarea")');const b=JSON.parse(await evaluate('document.querySelector(".preview-export textarea").value'));assert.equal(b.formatVersion,1);assert.equal(b.questions.length,198);await button('Cerrar exportación');await button('Exportar progreso');const exported=await evaluate('document.querySelector(".preview-export textarea").value');const p=JSON.parse(exported);assert.equal(p.version,1);assert.ok(p.attempts.length>=4);await button('Seleccionar todo el JSON');assert.equal(await evaluate('document.querySelector(".preview-export textarea").selectionEnd'),exported.length);await button('Cerrar exportación');await click('.preview-import summary');await field('.preview-import textarea',exported);await button('Validar e importar JSON');await wait('document.body.textContent.includes("Progreso importado")');assert.deepEqual((await progress()).history,p.history);await field('.preview-import textarea','{INVALIDO');await button('Validar e importar JSON');await wait('!!document.querySelector(".import-error")');assert.deepEqual((await progress()).history,p.history);await evaluate('capmPreviewSaved()');await send('Page.reload');await wait('!!document.querySelector(".preview-storage.saved")');assert.equal(JSON.parse(await evaluate('capmPreviewStorage.getItem("leython-capm-bank-v1")')).questions.length,198);assert.deepEqual((await progress()).history,p.history)});\n`+code.slice(end);
// A frame's location resets on reload, so navigate after reload for the mobile check.
edit("await wait('!!document.querySelector(\".welcome\")');await delay(400);assert.ok", "await route('inicio');await wait('!!document.querySelector(\".welcome\")');await delay(400);assert.ok");
await fs.mkdir('artifacts/inline-qa-dist',{recursive:true});
await fs.copyFile('artifacts/inline-preview.html','artifacts/inline-qa-dist/index.html');
await fs.writeFile('scripts/inline-qa.generated.mjs',code);
console.log('Prueba de iframe preparada: banco completo, almacenamiento mediante el puente oficial y transferencia JSON.');
