import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const watch=process.argv.includes('--watch');
const root=path.resolve('dist');
const port=Number(process.env.CAPM_PORT||5173);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('CAPM_PORT debe ser un puerto entre 1024 y 65535.');
const args=['node_modules/vite/bin/vite.js','build','--configLoader','native',...(watch?['--watch']:[])];
const build=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true});
let server;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/markdown; charset=utf-8','.svg':'image/svg+xml'};
async function start(){server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}let target=file;try{if((await stat(target)).isDirectory())target=path.join(target,'index.html')}catch{target=path.join(root,'index.html')}const data=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','Content-Length':data.length,'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none';"});res.end(data)}catch{res.writeHead(500);res.end('No se pudo abrir el archivo local.')}});server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'El puerto '+port+' está ocupado. Detén la otra instancia o define CAPM_PORT con otro puerto.':e.message);build.kill();process.exitCode=1});server.listen(port,'127.0.0.1',()=>console.log('\nCAPM disponible en http://127.0.0.1:'+port+'\n'+(watch?'Vite reconstruye al editar. Actualiza la página para ver los cambios.':'Usa Ctrl+C para detener.')))}
if(watch){let ready=false;const check=setInterval(async()=>{try{await stat(path.join(root,'index.html'));if(!ready){ready=true;clearInterval(check);await start()}}catch{}},500)}else build.on('exit',code=>{if(code===0)start();else process.exitCode=code||1});
function stop(){build.kill();server?.close();process.exit(0)}process.on('SIGINT',stop);process.on('SIGTERM',stop);
