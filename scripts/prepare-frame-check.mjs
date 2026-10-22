import fs from 'node:fs/promises';
const fragment=await fs.readFile('../../capm-leython.html','utf8');
const bridge=`<script>window.openai={widgetState:JSON.parse(parent.localStorage.getItem('capm-test-state')||'{}'),statePersistence:'persistent',setWidgetState:async value=>parent.localStorage.setItem('capm-test-state',JSON.stringify(value))};</script>`;
const shell='<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0"><iframe style="border:0;width:100%;height:100vh" id="app"></iframe><script>document.getElementById("app").srcdoc='+JSON.stringify(bridge+fragment).replaceAll('</script','<\\/script')+';</script></body></html>';
await fs.writeFile('artifacts/inline-qa-dist/index.html',shell);

