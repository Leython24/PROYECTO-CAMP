import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
const base=process.env.CAPM_DEV_URL||'http://localhost:5173',root=path.resolve('dist'),artifacts=path.resolve('artifacts/design-qa');
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
  await send('Page.navigate',{url:base});await wait('!!document.querySelector(".welcome")',20000);await delay(700);
  const pdf=sourceBank.questions.filter(q=>q.collectionId===COLLECTION);
  const revisions=Object.fromEntries(pdf.map(q=>[q.id,q.revision??1]));
  let one,older,third,initial;
  await check('Inicio real, GSAP y Lenis activos, controles nativos y siete destinos accesibles',async()=>{
    assert.equal(await evaluate('document.querySelectorAll(".nav-item").length'),7);
    assert.equal(await evaluate('document.documentElement.dataset.motion'),'full');
    assert.equal(await evaluate('window.lenis.version'),'1.3.27');
    await route('simulacros');
    assert.ok(await evaluate('[...document.querySelectorAll(".checkbox-list input")].every(e=>getComputedStyle(e).width==="18px"&&e.checked)'));
    await route('inicio');await delay(700);await screenshot('inicio-escritorio.png');
  });
  await check('Progreso versión 1 recuperado: 1 respuesta de 150 y 149 omisiones se explican sin inflar el puntaje',async()=>{
    const p=await progress(),now=Date.now();
    function fixture(id,start,finish){return {id,mode:'pdf',collectionId:COLLECTION,collectionIds:[COLLECTION],questionIds:pdf.map(q=>q.id),newIds:pdf.map(q=>q.id),answers:{},flagged:[],index:0,startedAt:start,deadline:start+10800000,durationMs:10800000,pausedAt:null,finishedAt:finish,seed:123,questionRevisions:revisions,questionOrder:'original',shuffleOptions:false}}
    one=fixture('design-one-answer',now-60000,now-1000);one.answers[pdf[0].id]={selectedIds:pdf[0].correctIds,confirmed:false,at:now-2000};
    older=fixture('design-older',now-180000,now-120000);older.answers[pdf[0].id]={selectedIds:pdf[0].options.filter(o=>!pdf[0].correctIds.includes(o.id)).slice(0,1).map(o=>o.id),confirmed:false};
    third={...fixture('design-original-practice',now-300000,now-240000),mode:'practica',collectionId:'original',collectionIds:['original'],questionIds:[bank[0].id,bank[1].id],newIds:[bank[0].id,bank[1].id],answers:{[bank[0].id]:{selectedIds:bank[0].correctIds,confirmed:true}},questionRevisions:undefined,deadline:null,durationMs:0};
    delete third.collectionId;delete third.collectionIds;
    p.attempts=[third,older,one];p.activeId=null;p.notes[bank[0].id]='Nota previa conservada';p.bookmarks=[bank[0].id];p.visited=['D1-T1-proyecto'];
    initial=JSON.parse(JSON.stringify(p));
    await evaluate('localStorage.setItem("leython-capm-v1",'+JSON.stringify(JSON.stringify(p))+');location.hash="resultados"');await reload();await wait('!!document.querySelector(".result-hero")',20000);await delay(800);
    assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['1','0','149','0']);
    const coverage=await evaluate('document.querySelector(".response-coverage").textContent');
    assert.ok(coverage.includes('1 de 150 respondidas'));assert.ok(coverage.includes('149 de 150 quedaron en blanco'));
    assert.ok(await evaluate('document.querySelector(".score-denominator").textContent.includes("1 de 150 preguntas calificables")'));
    assert.ok(await evaluate('document.querySelector(".result-explainer").textContent.includes("Acierto entre respondidas calificables: 1/1 (100%)")'));
    assert.equal((await progress()).notes[bank[0].id],'Nota previa conservada');
    await screenshot('resultados-escritorio.png');
  });
  await check('Historial: búsqueda, colección, comparación y procedencia de las claves',async()=>{
    await click('.compare-check input');await click('.history-item:nth-child(2) .compare-check input');
    assert.equal(await evaluate('document.querySelectorAll(".comparison thead th").length'),3);
    assert.ok(await evaluate('document.querySelector(".comparison").textContent.includes("1/150")'));
    await button('Limpiar');await field('[aria-label="Buscar sesión"]','design-one-answer');
    assert.equal(await evaluate('document.querySelectorAll(".history-item").length'),1);await field('[aria-label="Buscar sesión"]','');
    await select('[aria-label="Colección de resultados"]',COLLECTION);assert.equal(await evaluate('document.querySelectorAll(".history-item").length'),2);
    await click('.result-provenance summary');
    const prov=await evaluate('[...document.querySelectorAll(".provenance-grid>div>b")].map(e=>e.textContent)');
    assert.deepEqual(prov,['0','137','13','0']);
    await select('[aria-label="Colección de resultados"]','all');
  });
  await check('Revisión completa, filtro de omitidas y notas guardadas después de recargar',async()=>{
    await button('Revisar respuestas y explicaciones');await wait('!!document.querySelector(".question-card")');
    assert.equal(await evaluate('document.querySelectorAll(".option-feedback").length'),4);
    await click('.question-tools summary');await field('.question-tools textarea','Nota de revisión conservada');
    await select('[aria-label="Filtrar revisión"]','omitted');assert.equal(await evaluate('document.querySelectorAll(".review-list button").length'),149);
    await reload();await wait('!!document.querySelector(".result-hero")',20000);
    assert.equal((await progress()).notes[pdf[0].id],'Nota de revisión conservada');
    assert.deepEqual((await progress()).attempts,initial.attempts);
    assert.ok(await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Practicar falladas")).disabled'));
  });
  await check('Practicar omitidas utiliza exactamente esa colección; salir confirma, recupera y no borra el intento',async()=>{
    await button('Practicar omitidas (149)');await wait('!!document.querySelector(".question-grid")');
    const a=await active();assert.equal(a.questionIds.length,149);assert.equal(a.collectionId,COLLECTION);assert.ok(!a.questionIds.includes(pdf[0].id));
    await button('Guardar y salir');await wait('!!document.querySelector("dialog[open]")');
    assert.ok(await evaluate('!!document.activeElement.closest("dialog")'));
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait('!document.querySelector("dialog[open]")');
    assert.equal((await active()).id,a.id);
    await button('Guardar y salir');await click('dialog[open] .button.primary');await wait('!!document.querySelector(".welcome")');
    await button('Continuar donde lo dejé');await wait('!!document.querySelector(".question-grid")');assert.equal((await active()).id,a.id);
    await click('.options input[value='+pdf[1].correctIds[0]+']');await button('Confirmar respuesta');await wait('!!document.querySelector(".solution")');
    await finish();assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['1','0','148','0']);
    assert.deepEqual((await progress()).attempts.find(x=>x.id===one.id),one);
  });
  await check('Repetir simulacro conserva los 150 IDs y crea otro intento; finalizar requiere confirmación',async()=>{
    await evaluate('[...document.querySelectorAll(".history-item>button")].find(b=>b.textContent.includes("Simulador 2")&&b.textContent.includes("1/150 respondidas")).click()');await delay(200);
    await button('Repetir simulacro');await wait('!!document.querySelector(".question-grid")');
    const a=await active();assert.notEqual(a.id,one.id);assert.deepEqual(a.questionIds,one.questionIds);assert.deepEqual(a.answers,{});
    await button('Finalizar sesión');assert.ok(await evaluate('document.querySelector("dialog[open]").textContent.includes("150 preguntas sin responder")'));
    await button('Seguir respondiendo');assert.equal((await active()).id,a.id);await finish();
    assert.deepEqual(await evaluate('[...document.querySelectorAll(".result-stats strong")].map(e=>e.textContent)'),['0','0','150','0']);
  });
  await check('Personalizado: controles nativos, pausa, recarga, salida y reanudación conservan el reloj',async()=>{
    await route('simulacros');await field('.custom-sim input[type=number]',3);await button('Crear mi simulacro');await wait('!!document.querySelector(".question-grid")');
    await click('[aria-label="Pausar cronómetro"]');const before=await active();assert.ok(before.pausedAt);
    await reload();await wait('!!document.querySelector(".pause-screen")',20000);assert.deepEqual(await active(),before);
    await button('Reanudar sesión');assert.equal((await active()).pausedAt,null);
    await button('Guardar y salir');await click('dialog[open] .button.primary');await wait('!!document.querySelector(".welcome")');assert.ok((await active()).pausedAt);
    await evaluate('[...document.querySelectorAll(".nav-item")].find(b=>b.textContent.trim()==="Simulacros").click()');await wait('!!document.querySelector(".pdf-collection-card")');assert.ok(await evaluate('document.querySelector(".resume-strip").textContent.includes("Intento activo")'));
    await button('Continuar intento');await wait('!!document.querySelector(".pause-screen")');await button('Reanudar sesión');await finish();
  });
  await check('Ruta y biblioteca: recomendaciones reales, búsqueda, paginación y filtros de colección',async()=>{
    await route('estudio');assert.ok(await evaluate('document.querySelector(".route-progress").textContent.includes("Completado = lectura visitada")'));
    await click('.route-progress .button');await wait('!!document.querySelector(".study-article")');assert.ok(await evaluate('[...document.querySelectorAll("button")].some(b=>b.textContent.includes("Volver a la ruta"))'));
    await route('biblioteca');assert.equal(await evaluate('document.querySelectorAll(".source-card").length'),12);
    await field('#library-search','zz-no-such-source');assert.ok(await evaluate('document.body.textContent.includes("No encontramos coincidencias")'));
    await button('Limpiar búsqueda y filtros');await button('Preguntas y procedencia (497)');
    await select('.library-toolbar select',COLLECTION);assert.ok(await evaluate('document.querySelector(".pagination").textContent.includes("de 150")'));
    assert.equal(await evaluate('document.querySelectorAll(".library-questions article").length'),12);
    await click('[aria-label="Página siguiente"]');assert.ok(await evaluate('document.querySelector(".pagination").textContent.includes("13–24")'));
  });
  await check('Exportación e importación conservan sesiones, notas y marcas con la nueva interfaz',async()=>{
    await route('banco');const dir=await fs.mkdtemp(path.join(artifacts,'downloads-'));await fs.mkdir(dir,{recursive:true});await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:dir},true);
    const before=await progress();await button('Exportar progreso');
    for(let i=0;i<50;i++){try{await fs.stat(path.join(dir,'capm-progreso-v1.json'));break}catch{await delay(100)}}
    const saved=JSON.parse(await fs.readFile(path.join(dir,'capm-progreso-v1.json'),'utf8'));assert.deepEqual(saved,before);
    await evaluate('(()=>{const dt=new DataTransfer();dt.items.add(new File(['+JSON.stringify(JSON.stringify(saved))+'],"progreso.json",{type:"application/json"}));const input=document.querySelectorAll("input[type=file]")[1];input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}))})()');await wait('document.body.textContent.includes("Progreso importado")');
    const after=await progress();assert.deepEqual(after.attempts,saved.attempts);assert.deepEqual(after.notes,saved.notes);assert.deepEqual(after.bookmarks,saved.bookmarks);
    assert.equal(saved.notes[bank[0].id],'Nota previa conservada');
  });
  await check('Todas las pantallas a 1600, 900, 390 y 320 px: sin desbordamiento horizontal y con navegación móvil por teclado',async()=>{
    for(const width of [1600,900,390,320]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
      for(const name of ['inicio','estudio','practica','simulacros','resultados','biblioteca','banco']){
        await route(name);await delay(350);
        const overflow=await evaluate('document.documentElement.scrollWidth-innerWidth');
        if(overflow>1)console.log('Desbordamiento',width,name,await evaluate('[...document.querySelectorAll("main *")].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({tag:e.tagName,class:e.className,right:e.getBoundingClientRect().right}))'));
        assert.ok(overflow<=1,width+' '+name+' overflow '+overflow);
      }
      if(width===390){await click('[aria-label="Abrir menú"]');assert.equal(await evaluate('document.querySelector(".sidebar").inert'),false);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait('document.querySelector(".sidebar").inert');assert.equal(await evaluate('document.activeElement.id'),'mobile-menu-button');}
    }
  });
  await check('Movimiento reducido desactiva Lenis y mantiene todas las acciones disponibles',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(200);
    assert.equal(await evaluate('document.documentElement.dataset.motion'),'reduced');assert.equal(await evaluate('document.documentElement.classList.contains("lenis")'),false);
    await route('resultados');assert.ok(await evaluate('!!document.querySelector(".result-hero")'));
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await delay(300);
    assert.equal(await evaluate('document.documentElement.dataset.motion'),'full');
  });
  await check('Capturas finales del caso 1/150 sin modificar el progreso personal',async()=>{
    await route('resultados');await evaluate('[...document.querySelectorAll(".history-item>button")].find(b=>b.textContent.includes("1/150 respondidas")).click()');await delay(200);
    for(const width of [1600,390]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<600});
      await evaluate('window.scrollTo({top:0,behavior:"instant"})');await delay(900);await screenshot('resultado-'+width+'.png');
    }
  });
  const errors=browserErrors.filter(e=>!e.includes('gc.kis.v2.scr.kaspersky-labs.com')&&!e.includes('Content Security Policy'));assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(artifacts,'results.json'),JSON.stringify({date:new Date().toISOString(),checks,browserErrors,note:'Pruebas de diseño en perfiles de Chrome aislados; datos de casos de prueba, sin modificar el progreso del usuario.'},null,2));
}catch(error){console.error(error.stack);console.log(JSON.stringify({browserErrors}));console.log(await evaluate('({url:location.href,body:document.body.innerText.slice(-5000)})').catch(()=>({})));await screenshot('error.png').catch(()=>{});process.exitCode=1}
finally{await send('Browser.close',{},true).catch(()=>child.kill());for(const task of pending.values())clearTimeout(task.timer)}
