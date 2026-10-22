import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist'),port=Number(process.env.CAPM_PORT||5173);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('CAPM_PORT debe estar entre 1024 y 65535.');
try{await stat(path.join(root,'index.html'))}catch{console.error('No se encontró dist/index.html. Ejecuta npm run build o utiliza el paquete completo.');process.exit(1)}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/markdown; charset=utf-8','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}if(file===root)file=path.join(root,'index.html');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none';"});res.end(bytes)}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('No se encontró este archivo.')}});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'El puerto '+port+' está ocupado. Cierra la otra instancia o utiliza CAPM_PORT.':e.message);process.exitCode=1});
server.listen(port,'127.0.0.1',()=>console.log('\nCAPM — Centro de estudio de Leython\nAbre http://127.0.0.1:'+port+'/\nProgreso local en tu navegador. Ctrl+C para detener.\n'));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
