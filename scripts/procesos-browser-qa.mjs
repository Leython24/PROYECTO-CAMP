import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
const base=process.env.CAPM_DEV_URL||'http://localhost:5173',root=path.resolve('dist'),artifacts=path.resolve('artifacts/procesos-qa');
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
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base});await wait('!!document.querySelector(".welcome")',20000);
  const pdf=JSON.parse(await fs.readFile('src/data/collections/'+COLLECTION+'.json','utf8'));
  const oldPdf=JSON.parse(await fs.readFile('src/data/collections/exitos-simulador-01.json','utf8'));
  const oldSources=[...JSON.parse(await fs.readFile('src/data/sources.json','utf8')),...JSON.parse(await fs.readFile('src/data/collections/exitos-sources.json','utf8')),...JSON.parse(await fs.readFile('src/data/collections/exitos-review-sources.json','utf8'))];
  await check('Dos tarjetas PDF independientes: Éxitos 150 y Grupo de Procesos 150 revisadas',async()=>{
    await route('simulacros');await wait('document.querySelectorAll(".pdf-collection-card").length===2');
    assert.deepEqual(await evaluate('[...document.querySelectorAll('+JSON.stringify(CARD+' .collection-counters dd')+')].map(e=>e.textContent)'),['150','150','150','0']);
    assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-collection=exitos-simulador-01] .collection-counters dd")].map(e=>e.textContent)'),['150','150','150','95']);
    assert.ok(await evaluate('document.querySelector('+JSON.stringify(CARD)+').textContent.includes("13 alternativas")'));
    await screenshot('dos-simuladores.png');
  });
  await check('Práctica ofrece la colección y sus filtros sin mezclar los 197 originales',async()=>{
    await route('practica');
    assert.ok(await evaluate('document.querySelector(".practice-number").textContent.trim().startsWith("191")'));
    await select('[aria-label="Colección de práctica"]',COLLECTION);
    assert.ok(await evaluate('document.querySelector(".practice-number").textContent.trim().startsWith("150")'));
    await select('[aria-label="Colección de práctica"]','all');
    assert.ok(await evaluate('document.querySelector(".practice-number").textContent.trim().startsWith("497")'));
  });
  let previous,previousFinished;
  await check('Un banco de 347 preguntas y un simulacro Éxitos en curso se recuperan con notas y reloj',async()=>{
    const p=await progress(),now=Date.now();
    previous={id:'previous-exitos-12',mode:'pdf',collectionId:'exitos-simulador-01',collectionIds:['exitos-simulador-01'],
      questionIds:oldPdf.map(q=>q.id),newIds:oldPdf.map(q=>q.id),answers:{},flagged:[oldPdf[47].id],index:47,
      startedAt:now-60000,deadline:now+10740000,durationMs:10800000,pausedAt:null,finishedAt:null,seed:321,
      questionRevisions:Object.fromEntries(oldPdf.map(q=>[q.id,q.revision??1])),questionOrder:'original',shuffleOptions:false};
    for(const q of [...oldPdf.slice(0,5),oldPdf[47]])previous.answers[q.id]={selectedIds:q.correctIds,confirmed:false,at:now-1000};
    p.attempts=[previous];p.activeId=previous.id;p.notes[bank[0].id]='Nota original antes del simulador 2';p.notes[oldPdf[47].id]='Nota de Éxitos antes de actualizar';p.bookmarks=[bank[0].id,oldPdf[47].id];p.visited=['D1-T1-proyecto'];
    await evaluate('localStorage.setItem("leython-capm-v1",'+JSON.stringify(JSON.stringify(p))+');localStorage.setItem("leython-capm-bank-v1",'+JSON.stringify(JSON.stringify({formatVersion:1,questions:[...bank,...oldPdf],sources:oldSources}))+');location.hash="simulacros"');
    await reload();await wait('!!document.querySelector(".question-grid")',20000);
    assert.equal(await evaluate('document.querySelector(".question-stem").textContent'),oldPdf[47].stem);
    assert.deepEqual(await active(),previous);
    assert.equal((await progress()).notes[bank[0].id],'Nota original antes del simulador 2');
    await finish();
    assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['6','0','144','0']);
    previousFinished=(await progress()).attempts.find(a=>a.id===previous.id);
  });
  await check('Práctica: pregunta 21 íntegra, confirmación, error, originales y explicación importada',async()=>{
    await route('simulacros');await cardButton('Practicar una selección');await field(CARD+' .collection-selection input[type=number]',25);
    await cardButton('Practicar esta colección');await wait('!!document.querySelector(".question-card")');
    assert.equal((await active()).collectionId,COLLECTION);
    assert.equal(await evaluate('document.querySelectorAll(".solution,.document-explanation,.option-feedback").length'),0);
    await click('.options input[value=b]');await button('Confirmar respuesta');await wait('!!document.querySelector(".solution.success")');
    assert.equal(await evaluate('document.querySelectorAll(".option-feedback").length'),4);
    await click('.document-explanation summary');
    assert.equal(await evaluate('document.querySelector(".document-explanation p").textContent'),pdf[0].documentExplanation);
    await jump(2);await click('.options input[value=a]');await button('Confirmar respuesta');await wait('!!document.querySelector(".solution.error")');
    await jump(9);await click('.options input[value=b]');await button('Confirmar respuesta');await wait('!!document.querySelector(".ai-answer")');
    assert.ok(await evaluate('document.querySelector(".reference-answer").textContent.includes("Hoja de ruta")'));
    assert.ok(await evaluate('document.querySelector(".option.right").textContent.includes("Acta de constitución")'));
    await jump(21);assert.equal(await evaluate('document.querySelector(".question-stem").textContent'),pdf[20].stem);
    assert.equal(await evaluate('document.querySelectorAll(".options input").length'),4);
    await click('.options input[value=a]');await button('Confirmar respuesta');await wait('!!document.querySelector(".solution.success")');
    await click('.question-top .icon-button');await click('.question-tools summary');await field('.question-tools textarea','Pregunta 21: estrategia de adquisiciones');
    const before=await active();await reload();await wait('!!document.querySelector(".solution.success")',20000);
    assert.deepEqual(await active(),before);assert.equal((await progress()).notes[pdf[20].id],'Pregunta 21: estrategia de adquisiciones');
    await screenshot('pregunta-21.png');await finish();
    assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['3','1','21','0']);
  });
  await check('Las 150 preguntas se responden en localhost, sin soluciones durante el simulacro',async()=>{
    await route('simulacros');await cardButton('Iniciar este simulacro');await wait('!!document.querySelector(".question-grid")');
    assert.deepEqual((await active()).questionIds,pdf.map(q=>q.id));
    for(let i=0;i<150;i++){
      if(i)await jump(i+1);
      assert.equal(await evaluate('document.querySelector(".question-stem").textContent'),pdf[i].stem);
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".options input")].map(e=>e.value)'),['a','b','c','d']);
      await click('.options input[value='+pdf[i].correctIds[0]+']');
      assert.deepEqual((await active()).answers[pdf[i].id].selectedIds,pdf[i].correctIds);
      assert.equal(await evaluate('document.querySelectorAll(".solution,.option-feedback,.document-explanation").length'),0);
      if(i===74){
        await button('Marcar duda');await click('.question-top .icon-button');await click('.question-tools summary');await field('.question-tools textarea','Seguimiento adaptativo: nota guardada');
        const before=await active();await reload();await wait('!!document.querySelector(".question-grid")',20000);
        assert.deepEqual(await active(),before);assert.equal((await progress()).notes[pdf[i].id],'Seguimiento adaptativo: nota guardada');
        console.log('  Recarga después de 75 respuestas: plazo, selección, notas y marcas recuperados');
      }
      if((i+1)%25===0)console.log('  Grupo de Procesos: '+(i+1)+'/150 preguntas comprobadas');
    }
    await finish();
  });
  await check('Resultado 150/150 y los 150 ejercicios tienen explicación, alternativas y enlaces',async()=>{
    assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['150','0','0','0']);
    assert.ok(await evaluate('document.querySelector(".result-score").textContent.includes("100")'));
    assert.equal(await evaluate('document.querySelectorAll(".review-list button").length'),150);
    await screenshot('resultado-150.png');
    for(const q of pdf){
      await click('.review-list button:nth-child('+q.originalNumber+')');await wait('!!document.querySelector(".document-explanation")');
      assert.equal(await evaluate('document.querySelector(".question-stem").textContent'),q.stem);
      assert.equal(await evaluate('document.querySelectorAll(".option-feedback").length'),4);
      assert.equal(await evaluate('document.querySelector(".option.right input").value'),q.correctIds[0]);
      assert.equal(await evaluate('document.querySelector(".document-explanation p").textContent'),q.documentExplanation);
      const hrefs=await evaluate('[...document.querySelectorAll(".option-sources a")].map(a=>a.href)');
      for(const id of q.options[0].sourceIds)assert.ok(hrefs.includes(sourceBank.sources.find(s=>s.id===id).url));
      assert.equal(await evaluate('document.querySelectorAll(".ai-answer").length'),q.grading.keyOrigin==='ia-authored'?1:0);
      if(q.adaptation)assert.ok(await evaluate('!!document.querySelector(".original-question:not(.document-explanation)")'));
    }
    assert.deepEqual((await progress()).attempts.find(a=>a.id===previous.id),previousFinished);
  });
  let exported;
  await check('Exportación e importación recuperan los tres intentos y notas de las tres colecciones',async()=>{
    await route('banco');const downloads=await fs.mkdtemp(path.join(artifacts,'downloads-'));await fs.mkdir(downloads,{recursive:true});
    await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads},true);await button('Exportar banco JSON');await button('Exportar progreso');
    for(let i=0;i<80;i++){try{await fs.stat(path.join(downloads,'capm-banco-v1.json'));await fs.stat(path.join(downloads,'capm-progreso-v1.json'));break}catch{await delay(100)}}
    const b=JSON.parse(await fs.readFile(path.join(downloads,'capm-banco-v1.json'),'utf8'));exported=JSON.parse(await fs.readFile(path.join(downloads,'capm-progreso-v1.json'),'utf8'));
    assert.equal(b.questions.length,497);assert.equal(b.sources.length,85);assert.equal(exported.attempts.length,3);
    assert.equal(exported.notes[bank[0].id],'Nota original antes del simulador 2');assert.equal(exported.notes[oldPdf[47].id],'Nota de Éxitos antes de actualizar');
    assert.ok(exported.bookmarks.includes(pdf[20].id));assert.ok(exported.bookmarks.includes(pdf[74].id));
    await route('inicio');await evaluate('localStorage.clear()');await reload();await wait('!!document.querySelector(".welcome")',20000);await route('banco');
    await upload(JSON.stringify({formatVersion:1,questions:[...bank,...oldPdf],sources:oldSources}));await wait('document.body.textContent.includes("0 preguntas nuevas")');
    await evaluate('(()=>{const f=new File(['+JSON.stringify(JSON.stringify(exported))+'],"progreso.json",{type:"application/json"});const dt=new DataTransfer();dt.items.add(f);const input=document.querySelectorAll("input[type=file]")[1];input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}))})()');
    await wait('document.body.textContent.includes("Progreso importado")');await reload();await wait('!!document.querySelector("main")',20000);
    assert.deepEqual((await progress()).attempts,exported.attempts);assert.deepEqual((await progress()).notes,exported.notes);
    await route('resultados');await wait('!!document.querySelector(".result-hero")');
    assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['150','0','0','0']);
  });
  await check('PDF completo y TXT extraído disponibles desde localhost',async()=>{
    for(const file of ['Grupo_de_Procesos_150.pdf','Grupo_de_Procesos_150_TEXTO.txt']){
      const url='/collections/'+COLLECTION+'/'+file;const response=await fetch(base+url);assert.equal(response.status,200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()),await fs.readFile('public'+url));
    }
  });
  await check('Las dos tarjetas y las explicaciones se mantienen legibles a 390 y 320 píxeles',async()=>{
    for(const width of [390,320]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:true});
      await route('simulacros');await wait('!!document.querySelector('+JSON.stringify(CARD)+')');
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
      await evaluate('document.querySelector('+JSON.stringify(CARD)+').scrollIntoView()');await screenshot('simulador2-'+width+'.png');
      await route('resultados');if(!await evaluate('document.querySelector(".review-list button:nth-child(150)").classList.contains("selected")'))await click('.review-list button:nth-child(150)');await wait('!!document.querySelector(".document-explanation")');
      await click('.document-explanation summary');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
    }
  });
  const errors=browserErrors.filter(e=>!e.includes('gc.kis.v2.scr.kaspersky-labs.com')&&!e.includes('Content Security Policy'));assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(artifacts,'results.json'),JSON.stringify({date:new Date().toISOString(),checks,browserErrors,note:'Las 150 preguntas del simulador 2 se respondieron y revisaron mediante controles de React en Vite. Prueba con perfil aislado, sin tocar el progreso personal.'},null,2));
}catch(error){console.error(error.stack);console.log(JSON.stringify({browserErrors}));console.log(await evaluate('({url:location.href,body:document.body.innerText.slice(-5000)})').catch(()=>({})));await screenshot('error.png').catch(()=>{});process.exitCode=1}
finally{await send('Browser.close',{},true).catch(()=>child.kill());for(const task of pending.values())clearTimeout(task.timer)}
