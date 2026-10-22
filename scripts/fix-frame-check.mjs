import fs from 'node:fs/promises';
let s=await fs.readFile('scripts/inline-qa.generated.mjs','utf8');
s=s.replace('context=[...contexts.values()].find(c=>c.auxData?.frameId===frame&&c.auxData?.isDefault)','context=[...contexts.values()].reverse().find(c=>c.auxData?.frameId===frame&&c.auxData?.isDefault)');
s=s.replace("const r=await send('Runtime.evaluate',{contextId:context.id,expression,returnByValue:true,awaitPromise:true});","let r;try{r=await send('Runtime.evaluate',{contextId:context.id,expression,returnByValue:true,awaitPromise:true})}catch(e){if(e.message.includes('Cannot find context')){contexts.delete(context.id);await delay(100);return evaluate(expression)}throw e};");
await fs.writeFile('scripts/inline-qa.generated.mjs',s);
