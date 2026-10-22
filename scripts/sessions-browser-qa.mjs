import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
const base=process.env.CAPM_DEV_URL||'http://localhost:5173',root=path.resolve('dist'),artifacts=path.resolve('artifacts/sessions-qa');
await fs.mkdir(artifacts,{recursive:true});
const profile=await fs.mkdtemp(path.join(artifacts,'chrome-qa-'));
const chrome=process.env.CAPM_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run','--disable-gpu','--disable-extensions','--disable-background-networking','--remote-debugging-pipe','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe','pipe','pipe'],windowsHide:true});
let seq=0,buffer='',sessionId;const pending=new Map(),browserErrors=[],checks=[];
child.on('error',error=>{for(const x of pending.values())x.reject(error)});
child.stdio[4].on('data',data=>{buffer+=data.toString();let i;while((i=buffer.indexOf('\0'))!==-1){const message=buffer.slice(0,i);buffer=buffer.slice(i+1);if(!message)continue;const m=JSON.parse(message);if(m.id&&pending.has(m.id)){const task=pending.get(m.id);clearTimeout(task.timer);pending.delete(m.id);m.error?task.reject(Error(JSON.stringify(m.error))):task.resolve(m.result)}if(m.method==='Fetch.requestPaused')fulfillDocument(m.params).catch(e=>browserErrors.push(e.message));if(m.method==='Runtime.exceptionThrown')browserErrors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')browserErrors.push(m.params.entry.text);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')browserErrors.push(m.params.args.map(a=>a.description||a.value).join(' '))}});
async function fulfillDocument(params){console.log('  HTML interceptado:',params.request.url);const html=Buffer.from(await (await fetch(base+'/',{signal:AbortSignal.timeout(10000)})).text());await send('Fetch.fulfillRequest',{requestId:params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html; charset=utf-8'},{name:'Content-Length',value:String(html.length)}],body:html.toString('base64')})}
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


const COLLECTION='grupo-procesos-simulador-02';
const select=async(selector,value)=>{await evaluate('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');e.value='+JSON.stringify(value)+';e.dispatchEvent(new Event("change",{bubbles:true}))})()');await delay(200)};
const upload=async(text)=>{await evaluate('(()=>{const f=new File(['+JSON.stringify(text)+'],"fixture-coleccion.json",{type:"application/json"});const dt=new DataTransfer();dt.items.add(f);const input=document.querySelector("input[type=file]");input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}))})()');await delay(300)};
const CARD='[data-collection='+COLLECTION+']';
const active=async()=>{const p=await progress();return p.attempts.find(a=>a.id===p.activeId)};
const jump=async n=>click('.question-grid button:nth-child('+n+')');
const finish=async()=>{await button('Finalizar sesión');await button('Finalizar ahora');await wait('!!document.querySelector(".result-hero")')};
async function cardButton(text){await evaluate('(()=>{const b=[...document.querySelectorAll('+JSON.stringify(CARD+' button')+')].find(b=>b.textContent.trim()==='+JSON.stringify(text)+');if(!b||b.disabled)throw Error("Botón no disponible");b.click()})()');await delay(150)}

try {
  const target=await send('Target.createTarget',{url:'about:blank'},true);sessionId=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},true)).sessionId;
  await send('Browser.setPermission',{permission:{name:'loopback-network'},setting:'granted',origin:base},true);
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:base+'/',resourceType:'Document',requestStage:'Response'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1100,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base});await wait('!!document.querySelector(".welcome")',20000);
  const pdf=sourceBank.questions.filter(q=>q.collectionId===COLLECTION),now=Date.now();
  const revisions=Object.fromEntries(pdf.map(q=>[q.id,q.revision??1]));
  const first={id:'sessions-original',mode:'practica',questionIds:[bank[0].id],newIds:[bank[0].id],answers:{[bank[0].id]:{selectedIds:bank[0].correctIds,confirmed:true,at:now-10000}},flagged:[],index:0,startedAt:now-60000,deadline:null,durationMs:0,pausedAt:null,finishedAt:now-50000,seed:12};
  const second={...first,id:'sessions-pdf',mode:'pdf',collectionId:COLLECTION,collectionIds:[COLLECTION],questionIds:pdf.map(q=>q.id),newIds:pdf.map(q=>q.id),answers:{[pdf[0].id]:{selectedIds:pdf[0].correctIds,confirmed:false,at:now-10000}},startedAt:now-40000,finishedAt:now-10000,deadline:now+10800000,durationMs:10800000,questionRevisions:revisions,shuffleOptions:false,questionOrder:'original'};
  let initial;
  await check('Progreso anterior cargado con dos resultados, notas, marcadores e historial',async()=>{
    const p=await progress();p.attempts=[first,second];p.activeId=null;p.seen=[bank[0].id,pdf[0].id];p.notes[bank[0].id]='Nota anterior';p.bookmarks=[bank[0].id];
    p.history=[first,second].map(a=>{const q=a.questionIds[0];return {questionId:q,selectedIds:a.answers[q].selectedIds,at:now-10000,attemptId:a.id,wasNew:true}});
    initial=structuredClone(p);
    await evaluate('localStorage.setItem("leython-capm-v1",'+JSON.stringify(JSON.stringify(p))+');location.hash="simulacros"');await reload();await wait('!!document.querySelector(".pdf-collection-card")',20000);
    assert.deepEqual((await progress()).attempts,initial.attempts);
  });
  await check('Abrir, navegar y marcar sin responder; Salir sin guardar descarta y sigue descartado tras recargar',async()=>{
    await cardButton('Iniciar este simulacro');await wait('!!document.querySelector(".question-grid")');
    const a=await active();await jump(21);await button('Marcar duda');await button('Guardar y salir');
    await wait('!!document.querySelector("dialog[open]")');assert.ok(await evaluate('document.querySelector("dialog[open]").textContent.includes("0 de 150 respondidas")'));
    await click('dialog[open] .button.danger');await wait('!!document.querySelector(".welcome")');await reload();
    const p=await progress();assert.equal(p.activeId,null);assert.deepEqual(p.attempts,initial.attempts);assert.deepEqual(p.history,initial.history);assert.deepEqual(p.seen,initial.seen);assert.ok(!p.attempts.some(x=>x.id===a.id));
  });
  await check('Descartar práctica confirmada quita sus respuestas e historial y conserva notas compartidas',async()=>{
    await route('simulacros');await cardButton('Practicar una selección');await cardButton('Practicar esta colección');await wait('!!document.querySelector(".question-grid")');
    await jump(2);await click('.options input[value='+pdf[1].correctIds[0]+']');await button('Confirmar respuesta');await wait('!!document.querySelector(".solution")');
    await click('.question-tools summary');await field('.question-tools textarea','Nota que deseo conservar');
    const a=await active();assert.ok((await progress()).history.some(h=>h.attemptId===a.id));
    await click('.discard-attempt');await click('dialog[open] .button.danger');await wait('!!document.querySelector(".pdf-collection-card")');await reload();
    const p=await progress();assert.deepEqual(p.attempts,initial.attempts);assert.deepEqual(p.history,initial.history);assert.deepEqual(p.seen,initial.seen);assert.equal(p.notes[pdf[1].id],'Nota que deseo conservar');assert.deepEqual(p.bookmarks,initial.bookmarks);
  });
  let savedId;
  await check('Guardar y salir conserva respuesta, duda e índice y permite continuar desde Mis resultados',async()=>{
    await cardButton('Iniciar este simulacro');await wait('!!document.querySelector(".question-grid")');await jump(3);await click('.options input[value='+pdf[2].correctIds[0]+']');await button('Marcar duda');
    const before=await active();savedId=before.id;
    await button('Guardar y salir');await click('dialog[open] .button.primary');await wait('!!document.querySelector(".welcome")');await reload();
    assert.deepEqual(await active(),before);await route('resultados');await wait('!!document.querySelector(".unfinished-attempt")');
    assert.ok(await evaluate('document.querySelector(".unfinished-attempt").textContent.includes("1/150 respondidas")'));
    await click('.unfinished-attempt .button.primary');await wait('!!document.querySelector(".question-grid")');assert.deepEqual(await active(),before);
    await button('Guardar y salir');await click('dialog[open] .button.primary');await route('resultados');
  });
  await check('Eliminar intento guardado: cancelar y Escape conservan; confirmar elimina solo el elegido',async()=>{
    await click('.unfinished-attempt .button.danger');await button('Conservar intento');assert.equal((await active()).id,savedId);
    await click('.unfinished-attempt .button.danger');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait('!document.querySelector("dialog[open]")');assert.equal((await active()).id,savedId);
    await click('.unfinished-attempt .button.danger');await button('Eliminar definitivamente');await wait('!document.querySelector(".unfinished-attempt")');await reload();
    const p=await progress();assert.equal(p.activeId,null);assert.deepEqual(p.attempts,initial.attempts);assert.deepEqual(p.history,initial.history);assert.deepEqual(p.seen,initial.seen);assert.equal(p.notes[bank[0].id],'Nota anterior');
  });
  await check('Eliminar resultado seleccionado durante comparación no rompe la vista ni altera el otro intento',async()=>{
    await click('.compare-check input');await click('.history-item:nth-child(2) .compare-check input');assert.equal(await evaluate('document.querySelectorAll(".comparison thead th").length'),3);
    await button('Eliminar este intento');await wait('!!document.querySelector("dialog[open]")');
    await screenshot('eliminar-resultado-escritorio.png');await button('Eliminar definitivamente');await wait('document.querySelectorAll(".history-item").length===1');
    assert.equal(await evaluate('document.querySelectorAll(".comparison table").length'),0);
    const p=await progress();assert.deepEqual(p.attempts,[first]);assert.deepEqual(p.history,initial.history.filter(h=>h.attemptId===first.id));assert.deepEqual(p.seen,[bank[0].id]);assert.deepEqual(p.bookmarks,initial.bookmarks);
    await reload();await wait('!!document.querySelector(".result-hero")');assert.ok(await evaluate('document.querySelector(".history-item").textContent.includes("1/1 respondidas")'));
  });
  await check('Eliminar el último resultado muestra el estado vacío; las 497 preguntas siguen disponibles',async()=>{
    await click('.history-item-actions .button.danger');await button('Eliminar definitivamente');await wait('!document.querySelector(".result-hero")');await reload();
    const p=await progress();assert.deepEqual(p.attempts,[]);assert.deepEqual(p.history,[]);assert.equal(p.activeId,null);assert.equal(p.notes[bank[0].id],'Nota anterior');assert.deepEqual(p.bookmarks,initial.bookmarks);
    assert.ok(await evaluate('document.body.textContent.includes("Tu primer resultado empieza aquí")'));
    await route('simulacros');assert.deepEqual(await evaluate('[...document.querySelectorAll(".collection-counters>div:first-child dd")].map(e=>e.textContent)'),['150','150']);
  });
  await check('Eliminar desde la tarjeta PDF cancela o elimina el intento sin tocar la colección',async()=>{
    await cardButton('Iniciar este simulacro');await wait('!!document.querySelector(".question-grid")');const a=await active();
    await button('Guardar y salir');await click('dialog[open] .button.primary');await route('simulacros/catalogo');
    await click(CARD+' .collection-history summary');await click(CARD+' [aria-label="Eliminar intento '+a.id+'"]');await button('Conservar intento');assert.equal((await active()).id,a.id);
    await click(CARD+' [aria-label="Eliminar intento '+a.id+'"]');await button('Eliminar definitivamente');await wait('!(JSON.parse(localStorage.getItem("leython-capm-v1"))).activeId');
    assert.ok(await evaluate('!!document.querySelector('+JSON.stringify(CARD)+')'));assert.equal((await progress()).attempts.length,0);
  });
  await check('Móvil 390 y 320 px: controles y confirmaciones utilizables, sin desbordamiento',async()=>{
    for(const width of [390,320]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:true});
      await route('simulacros');await cardButton('Iniciar este simulacro');await wait('!!document.querySelector(".question-grid")');await click('.discard-attempt');
      const overflow=await evaluate('document.documentElement.scrollWidth-innerWidth');assert.ok(overflow<=1,width+' overflow '+overflow);
      assert.ok(await evaluate('!!document.activeElement.closest("dialog")'));
      if(width===390)await screenshot('salir-movil.png');
      await click('dialog[open] .button.danger');await wait('!!document.querySelector(".pdf-collection-card")');await route('resultados');assert.ok(await evaluate('document.documentElement.scrollWidth-innerWidth<=1'));
    }
  });
  const errors=browserErrors.filter(e=>!e.includes('gc.kis.v2.scr.kaspersky-labs.com')&&!e.includes('Content Security Policy'));assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(artifacts,'results.json'),JSON.stringify({date:new Date().toISOString(),checks,browserErrors,note:'Datos de prueba en perfil aislado; no modifica el progreso personal.'},null,2));
}catch(error){console.error(error.stack);console.log(JSON.stringify({browserErrors}));console.log(await evaluate('({url:location.href,body:document.body.innerText.slice(-5000)})').catch(()=>({})));await screenshot('error.png').catch(()=>{});process.exitCode=1}
finally{await send('Browser.close',{},true).catch(()=>child.kill());for(const task of pending.values())clearTimeout(task.timer)}
