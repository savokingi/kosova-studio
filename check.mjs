import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const root=resolve('dist');let pages=0,links=0,images=0;const errors=[];
async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const file=join(dir,f.name);if(f.isDirectory()){await walk(file);continue}if(!f.name.endsWith('.html'))continue;pages++;const html=await readFile(file,'utf8');if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: needs one h1`);for(const m of html.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){let target=join(root,m[1]);try{if((await stat(target)).isDirectory())target=join(target,'index.html');await stat(target);links++;}catch{errors.push(`${file}: missing ${m[1]}`)}}images+=(html.match(/<img\b/g)||[]).length;}}
await walk(root);if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(`Verified ${pages} pages, ${links} local references, ${images} image placements.`);
