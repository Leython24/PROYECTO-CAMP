import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
const base=process.env.CAPM_DEV_URL||'http://localhost:5173',root=path.resolve('dist'),artifacts=path.resolve('artifacts/review-qa');
await fs.mkdir(artifacts,{recursive:true});
const profile=await fs.mkdtemp(path.join(artifacts,'chrome-qa-'));
const chrome=process.env.CAPM_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run','--disable-gpu','--disable-extensions','--disable-background-networking','--remote-debugging-pipe','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe','pipe','pipe'],windowsHide:true});
let seq=0,buffer='',sessionId;const pending=new Map(),browserErrors=[],checks=[];
child.on('error',error=>{for(const x of pending.values())x.reject(error)});
child.stdio[4].on('data',data=>{buffer+=data.toString();let i;while((i=buffer.indexOf('\0'))!==-1){const message=buffer.slice(0,i);buffer=buffer.slice(i+1);if(!message)continue;const m=JSON.parse(message);if(m.id&&pending.has(m.id)){const task=pending.get(m.id);clearTimeout(task.timer);pending.delete(m.id);m.error?task.reject(Error(JSON.stringify(m.error))):task.resolve(m.result)}if(m.method==='Fetch.requestPaused')fulfillDocument(m.params).catch(e=>browserErrors.push(e.message));if(m.method==='Runtime.exceptionThrown')browserErrors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')browserErrors.push(m.params.entry.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')browserErrors.push(m.params.args.map(a=>a.description||a.value).join(' '))}});
async function fulfillDocument(params){const html=Buffer.from(await (await fetch(base+'/')).text());await send('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html; charset=utf-8'},{name:'Content-Length',value:String(html.length)}],body:html.toString('base64')})}
function send(method,params={},browser=false){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Tiempo agotado: '+method))},45000);pending.set(id,{resolve,reject,timer});child.stdio[3].write(JSON.stringify({id,method,params,...(!browser&&sessionId?{sessionId}:{})})+'\0')})}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);if(r.result.subtype==='error')throw Error(r.result.description);return r.result.value}
async function reload(){const stamp=await evaluate('performance.timeOrigin');await send('Page.reload');await wait('performance.timeOrigin!=='+stamp+'&&document.readyState==="complete"&&!!document.querySelector("main#main")',25000)}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(expression,ms=10000){const end=Date.now()+ms;while(Date.now()<end){try{if(await evaluate(expression))return}catch(e){if(!/navigated|closed|context|Cannot find/i.test(e.message))throw e}await delay(80)}throw Error('No se cumplió: '+expression)}
async function click(selector){await wait('!!document.querySelector('+JSON.stringify(selector)+')');await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await delay(100)}
async function button(text){await wait('[...document.querySelectorAll("button")].some(b=>b.textContent.trim()==='+JSON.stringify(text)+')');await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+').click()');await delay(100)}
async function route(route){await evaluate('location.hash='+JSON.stringify(route));await delay(150)}
async function field(selector,value){await evaluate('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(e.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,"value").set.call(e,'+JSON.stringify(String(value))+');e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));})()');await delay(100)}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(artifacts,name),Buffer.from(r.data,'base64'))}
async function check(name,fn){await fn();checks.push({name,status:'passed'});console.log('✓ '+name)}
const progress=()=>evaluate('JSON.parse(localStorage.getItem("leython-capm-v1"))');
const bank=JSON.parse(await fs.readFile('src/data/questions.json','utf8'));
const sourceBank=JSON.parse(await fs.readFile('public/downloads/capm-banco-v1.json','utf8'));


const COLLECTION='exitos-simulador-01';
const select=async(selector,value)=>{await evaluate('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');e.value='+JSON.stringify(value)+';e.dispatchEvent(new Event("change",{bubbles:true}))})()');await delay(200)};
const upload=async(text)=>{await evaluate('(()=>{const f=new File(['+JSON.stringify(text)+'],"fixture-coleccion.json",{type:"application/json"});const dt=new DataTransfer();dt.items.add(f);const input=document.querySelector("input[type=file]");input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}))})()');await delay(300)};
try{
 const target=await send('Target.createTarget',{url:'about:blank'},true);sessionId=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},true)).sessionId;
 await send('Browser.setPermission',{permission:{name:'loopback-network'},setting:'granted',origin:base},true);
 await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
 await send('Fetch.enable',{patterns:[{urlPattern:base+'/',resourceType:'Document',requestStage:'Response'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base});await wait('!!document.querySelector(".welcome")',20000);
 const pdf=JSON.parse(await fs.readFile('src/data/collections/exitos-simulador-01.json','utf8'));
 const original=JSON.parse(await fs.readFile('src/data/collections/exitos-simulador-01-v1.json','utf8'));
 const active=async()=>{const p=await progress();return p.attempts.find(a=>a.id===p.activeId)};
 const finish=async()=>{await button('Finalizar sesión');await button('Finalizar ahora');await wait('!!document.querySelector(".result-hero")')};
 const jump=async n=>click('.question-grid button:nth-child('+n+')');
 await check('La colección real tiene 150 preguntas, 55 respuestas IA revisadas y conserva cuatro dominios',async()=>{
   assert.equal(pdf.length,150);assert.equal(pdf.filter(q=>q.grading.keyOrigin==='ia-authored').length,55);
   assert.equal(await evaluate('document.querySelectorAll(".domain-card").length'),4);
   assert.equal(await evaluate('getComputedStyle(document.querySelector(".button.primary")).backgroundColor'),'rgb(89, 52, 154)');
 });
 let legacy;
 await check('Recuperación de un intento anterior con 14 alternativas elegidas, notas y marcas sin sobrescribir',async()=>{
   const p=await progress(),q=original[26],now=Date.now();
   legacy={id:'legacy-review-qa',mode:'practica',questionIds:[original[7].id,q.id],newIds:[original[7].id,q.id],answers:{[original[7].id]:{selectedIds:['a'],confirmed:true,at:now-1000},[q.id]:{selectedIds:q.options.map(o=>o.id),confirmed:true,at:now-500}},flagged:[original[7].id],index:1,startedAt:now-2000,deadline:null,durationMs:0,pausedAt:null,finishedAt:null,seed:123,collectionId:COLLECTION,collectionIds:[COLLECTION],shuffleOptions:false,questionOrder:'original'};
   p.attempts=[legacy];p.activeId=legacy.id;p.notes[bank[0].id]='Nota original conservada';p.notes[original[7].id]='Nota del círculo antiguo';p.bookmarks=[bank[0].id,original[7].id];p.seen=[original[7].id,q.id];
   p.history=legacy.questionIds.map(id=>({questionId:id,selectedIds:legacy.answers[id].selectedIds,at:now-500,attemptId:legacy.id,wasNew:true}));
   const oldSources=[...JSON.parse(await fs.readFile('src/data/sources.json','utf8')),...JSON.parse(await fs.readFile('src/data/collections/exitos-sources.json','utf8'))];
   await evaluate('localStorage.setItem("leython-capm-v1",'+JSON.stringify(JSON.stringify(p))+');localStorage.setItem("leython-capm-bank-v1",'+JSON.stringify(JSON.stringify({formatVersion:1,questions:[...bank,...original],sources:oldSources}))+');location.hash="practica"');
   await reload();await wait('!!document.querySelector(".solution.ungraded")',20000);
   assert.equal(await evaluate('document.querySelectorAll(".options input:checked").length'),14);
   assert.equal(await evaluate('document.querySelector(".question-stem").textContent'),original[26].stem);
   assert.ok(await evaluate('document.body.textContent.includes("Esta sesión conserva")'));
   assert.equal((await progress()).notes[bank[0].id],'Nota original conservada');
   assert.ok((await progress()).bookmarks.includes(original[7].id));
   await finish();
   assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['0','0','0','2']);
   assert.ok(await evaluate('document.querySelector(".result-score").textContent.includes("Sin calificación")'));
 });
 await check('La tarjeta y los filtros muestran 150 calificables y 95 claves del material pendientes',async()=>{
   await route('simulacros');await wait('!!document.querySelector(".pdf-collection-card")');
   assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-collection=exitos-simulador-01] .collection-counters dd")].map(e=>e.textContent)'),['150','150','150','95']);
   assert.equal(await evaluate('document.querySelector(".pdf-collection-card .button.primary").disabled'),false);
   assert.equal(await evaluate('document.querySelectorAll(".pdf-collection-card .notice input[type=checkbox]").length'),0);
   await screenshot('revision-coleccion.png');
   await route('practica');await select('[aria-label="Colección de práctica"]',COLLECTION);
   assert.ok(await evaluate('document.querySelector(".practice-number").textContent.trim().startsWith("150")'));
   await select('[aria-label="Colección de práctica"]','all');
   assert.ok(await evaluate('document.querySelector(".practice-number").textContent.trim().startsWith("497")'));
 });
 await check('Práctica: ejercicio equivalente 8, original consultable, clave IA y fuentes solo tras confirmar',async()=>{
   await route('simulacros');await button('Practicar una selección');await field('.collection-selection input[type=number]',30);
   await button('Practicar esta colección');await wait('!!document.querySelector(".question-card")');
   assert.equal((await active()).questionRevisions[pdf[7].id],2);
   await jump(8);
   assert.equal(await evaluate('document.querySelector(".question-stem").textContent'),pdf[7].stem);
   assert.equal(await evaluate('document.querySelectorAll(".solution,.ai-answer,.option-sources").length'),0);
   await click('.original-question summary');await wait('document.querySelector(".original-question img")?.naturalWidth===165');
   assert.ok(await evaluate('document.querySelector(".original-question").textContent.includes("círculo")'));
   await click('.options input[value=a]');await button('Confirmar respuesta');await wait('!!document.querySelector(".solution.success")');
   assert.ok(await evaluate('document.querySelector(".ai-answer").textContent.includes("Respuesta elaborada por IA")'));
   assert.equal(await evaluate('document.querySelectorAll(".option-feedback").length'),3);
   assert.ok(await evaluate('document.querySelectorAll(".option-sources a").length>=3'));
   assert.equal((await progress()).notes[pdf[7].id],'Nota del círculo antiguo');
   await evaluate('document.querySelector(".question-card").scrollIntoView()');await screenshot('revision-pregunta8.png');
 });
 await check('Práctica de 14 alternativas: clave múltiple, errores y letras originales o–bb',async()=>{
   await jump(27);
   assert.equal(await evaluate('document.querySelectorAll(".options input[type=checkbox]").length'),14);
   for(const id of pdf[26].correctIds)await click('.options input[value="'+id+'"]');
   await button('Confirmar respuesta');await wait('!!document.querySelector(".solution.success")');
   assert.equal(await evaluate('document.querySelectorAll(".option.right").length'),4);
   await jump(28);
   for(const id of ['c','g','h','l'])await click('.options input[value="'+id+'"]');
   await button('Confirmar respuesta');await wait('!!document.querySelector(".solution.error")');
   assert.ok(await evaluate('document.querySelector(".solution").textContent.includes("Faltaron:")'));
   await jump(30);
   assert.deepEqual(await evaluate('[...document.querySelectorAll(".option-letter")].map(e=>e.textContent)'),['o','p','q','r','s','t','u','v','w','x','y','z','aa','bb']);
   for(const id of pdf[29].correctIds)await click('.options input[value="'+id+'"]');
   await button('Confirmar respuesta');await wait('!!document.querySelector(".solution.success")');
   await finish();
   assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['3','1','26','0']);
 });
 await check('Las 150 preguntas se abren y responden en simulacro; sin soluciones durante el intento',async()=>{
   await route('simulacros');await button('Iniciar este simulacro');await wait('!!document.querySelector(".question-map")');
   assert.deepEqual((await active()).questionIds,pdf.map(q=>q.id));
   assert.equal(await evaluate('document.querySelectorAll(".question-grid button").length'),150);
   for(let i=0;i<pdf.length;i++){
     if(i)await jump(i+1);
     const q=pdf[i];
     assert.equal(await evaluate('document.querySelector(".question-stem").textContent'),q.stem);
     for(const id of q.correctIds)await click('.options input[value="'+id+'"]');
     assert.deepEqual((await active()).answers[q.id].selectedIds,q.correctIds);
     assert.equal(await evaluate('document.querySelectorAll(".solution,.option-feedback,.ai-answer").length'),0);
     if(i===19||i===97||i===102||i===106)assert.ok(await evaluate('document.querySelector(".question-diagram img")?.naturalWidth>0'));
     if(i===49){
       await button('Marcar duda');await click('.question-top .icon-button');
       await click('.question-tools summary');await field('.question-tools textarea','Reserva de contingencia: nota de revisión');
     }
     if(i===74){
       const before=await active();await reload();await wait('!!document.querySelector(".question-map")',20000);
       const after=await active();assert.equal(after.id,before.id);assert.equal(after.index,74);assert.equal(after.deadline,before.deadline);
       assert.deepEqual(after.answers,before.answers);assert.deepEqual(after.flagged,before.flagged);
       assert.equal((await progress()).notes[pdf[49].id],'Reserva de contingencia: nota de revisión');
       console.log('  Recarga tras la pregunta 75: respuestas, reloj y revisiones recuperados');
     }
     if((i+1)%25===0)console.log('  Preguntas comprobadas en navegador: '+(i+1)+'/150');
   }
   assert.equal(Object.keys((await active()).answers).length,150);
   await screenshot('revision-simulacro150.png');await finish();
 });
 await check('Puntaje real del simulacro: 150 aciertos sobre 150, sin omisiones ni no calificadas',async()=>{
   assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['150','0','0','0']);
   assert.ok(await evaluate('document.querySelector(".result-score").textContent.includes("100")'));
   assert.equal(await evaluate('document.querySelectorAll(".review-list button").length'),150);
   const p=await progress();assert.equal(p.activeId,null);
   const a=p.attempts.find(a=>a.mode==='pdf');assert.equal(a.questionRevisions[pdf[7].id],2);
   assert.equal(p.attempts.find(a=>a.id===legacy.id).questionRevisions,undefined);
   await screenshot('revision-puntaje150.png');
 });
 await check('Las 55 revisadas muestran explicación de cada alternativa, clave IA y enlaces primarios de respaldo',async()=>{
   for(const q of pdf.filter(q=>q.revision===2)){
     await click('.review-list button:nth-child('+q.originalNumber+')');await wait('!!document.querySelector(".ai-answer")');
     assert.equal(await evaluate('document.querySelector(".question-stem").textContent'),q.stem);
     assert.equal(await evaluate('document.querySelectorAll(".option-feedback").length'),q.options.length);
     assert.equal(await evaluate('document.querySelectorAll(".option.right").length'),q.correctIds.length);
     const links=await evaluate('[...document.querySelectorAll(".option-sources a")].map(a=>a.href)');
     for(const o of q.options)for(const id of o.sourceIds){
       const s=sourceBank.sources.find(s=>s.id===id);assert.ok(s, id);assert.ok(links.includes(s.url),s.url);
     }
     assert.ok(await evaluate('document.querySelector(".reference-answer").textContent.length>15'));
   }
 });
 await check('Una corrección no sobrescribe la clave histórica ni recalifica el intento anterior',async()=>{
   await click('.review-list button:nth-child(48)');await wait('!!document.querySelector(".ai-answer")');
   assert.ok(await evaluate('document.querySelector(".option.right input").value==="c"'));
   assert.ok(await evaluate('document.querySelector(".reference-answer").textContent.includes("d) Dependencia externa")'));
   const p=await progress();assert.ok(p.attempts.find(a=>a.id===legacy.id).finishedAt);
   assert.equal(p.notes[bank[0].id],'Nota original conservada');
   assert.equal(p.notes[pdf[7].id],'Nota del círculo antiguo');
   assert.ok(p.bookmarks.includes(pdf[49].id));
   await evaluate('document.querySelector(".question-card").scrollIntoView()');await screenshot('revision-clave48.png');
 });
 let exportedProgress;
 await check('Exportación incluye versiones, 497 preguntas, 85 fuentes y progreso de ambas revisiones',async()=>{
   await route('banco');const downloads=await fs.mkdtemp(path.join(artifacts,'downloads-'));await fs.mkdir(downloads,{recursive:true});
   await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads},true);
   await button('Exportar banco JSON');await button('Exportar progreso');
   for(let i=0;i<60;i++){try{await fs.stat(path.join(downloads,'capm-banco-v1.json'));await fs.stat(path.join(downloads,'capm-progreso-v1.json'));break}catch{await delay(100)}}
   const b=JSON.parse(await fs.readFile(path.join(downloads,'capm-banco-v1.json'),'utf8'));
   exportedProgress=JSON.parse(await fs.readFile(path.join(downloads,'capm-progreso-v1.json'),'utf8'));
   assert.equal(b.questions.length,497);assert.equal(b.sources.length,85);
   assert.equal(b.questions.filter(q=>q.collectionId===COLLECTION&&q.grading?.keyOrigin==='ia-authored').length,55);
   assert.equal(exportedProgress.attempts.length,3);
   assert.equal(exportedProgress.attempts.find(a=>a.mode==='pdf').questionRevisions[pdf[7].id],2);
 });
 await check('Importar banco de la versión anterior y progreso exportado recupera todo tras recargar',async()=>{
   await route('inicio');await evaluate('localStorage.clear()');await reload();await wait('!!document.querySelector(".welcome")',20000);
   await route('banco');
   const oldSources=[...JSON.parse(await fs.readFile('src/data/sources.json','utf8')),...JSON.parse(await fs.readFile('src/data/collections/exitos-sources.json','utf8'))];
   await upload(JSON.stringify({formatVersion:1,questions:[...bank,...original],sources:oldSources}));
   await wait('document.body.textContent.includes("0 preguntas nuevas")');
   assert.equal(await evaluate('document.querySelectorAll(".import-error").length'),0);
   await evaluate('(()=>{const f=new File(['+JSON.stringify(JSON.stringify(exportedProgress))+'],"progreso.json",{type:"application/json"});const dt=new DataTransfer();dt.items.add(f);const input=document.querySelectorAll("input[type=file]")[1];input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}))})()');
   await wait('document.body.textContent.includes("Progreso importado")');
   await reload();await wait('document.body.textContent.includes("Gestionar banco")',20000);
   assert.deepEqual((await progress()).attempts,exportedProgress.attempts);
   assert.deepEqual((await progress()).notes,exportedProgress.notes);
   await route('resultados');await wait('!!document.querySelector(".result-hero")');
   assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['150','0','0','0']);
 });
 await check('Originales, PDF, TXT y cinco diagramas permanecen disponibles en localhost',async()=>{
   for(const file of ['Simulador_Exitos_150_COMPATIBLE.pdf','Simulador_Exitos_150_TEXTO.txt',...new Set(original.flatMap(q=>(q.diagrams??[]).map(d=>d.src.split('/').pop())))]){
     const route='/collections/'+COLLECTION+'/'+file,r=await fetch(base+route);
     assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),await fs.readFile('public'+route));
   }
 });
 await check('Diseño conservado a 390 y 320 píxeles: claves, enlaces y originales no desbordan',async()=>{
   for(const width of [390,320]){
     await send('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:true});
     await route('simulacros');await wait('!!document.querySelector(".pdf-collection-card")');
     assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
     await evaluate('document.querySelector(".pdf-collection-card").scrollIntoView()');await screenshot('revision-'+width+'.png');
     await route('resultados');
     if(!await evaluate('document.querySelector(".review-list button:nth-child(27)").classList.contains("selected")'))await click('.review-list button:nth-child(27)');
     await wait('!!document.querySelector(".ai-answer")');
     assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
     await evaluate('document.querySelector(".question-card").scrollIntoView()');await screenshot('revision-alternativas-'+width+'.png');
   }
 });
 const errors=browserErrors.filter(e=>!e.includes('gc.kis.v2.scr.kaspersky-labs.com')&&!e.includes('Content Security Policy'));assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(artifacts,'results.json'),JSON.stringify({date:new Date().toISOString(),checks,browserErrors,note:'Se respondieron las 150 preguntas reales mediante controles de React y se revisaron las 55 claves IA, en un perfil aislado. No se tocó el progreso del navegador personal.'},null,2));
}catch(error){console.error(error.stack);console.log(JSON.stringify({browserErrors}));console.log(await evaluate('({url:location.href,body:document.body.innerText.slice(-6000)})').catch(()=>({})));await screenshot('error.png').catch(()=>{});process.exitCode=1}
finally{await send('Browser.close',{},true).catch(()=>child.kill());for(const task of pending.values())clearTimeout(task.timer)}
