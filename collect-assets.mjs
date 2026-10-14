import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root = new URL('./',import.meta.url);
await mkdir(new URL('dist/assets/',root),{recursive:true});
const pages = await Promise.all([readFile(new URL('source-telegram.html',root),'utf8'), ...[1025,1005,978].map(async n => {const r=await fetch(`https://t.me/s/kosova_studio?before=${n}`); if(!r.ok) throw new Error(r.status); return r.text();})]);
const photos=new Map();
for(const html of pages){
 for(const m of html.matchAll(/<a\b[^>]*class="[^"]*tgme_widget_message_photo_wrap[^>]*>/g)){
  const tag=m[0], u=tag.match(/background-image:url\('([^']+)'\)/)?.[1], id=tag.match(/kosova_studio\/(\d+)\?single/)?.[1];
  if(u&&id) photos.set(id,u.replaceAll('&amp;','&'));
 }
}
const out=[];
await Promise.all([...photos].map(async ([id,url])=>{try {const r=await fetch(url); if(!r.ok) throw new Error(r.status); const buf=Buffer.from(await r.arrayBuffer()); await writeFile(new URL(`dist/assets/post-${id}.jpg`,root),buf); out.push({id,path:`assets/post-${id}.jpg`,source:`https://t.me/kosova_studio/${id}`,bytes:buf.length});}catch(e){console.error('Photo',id,e.message)}}));
out.sort((a,b)=>a.id-b.id); await writeFile(new URL('asset-sources.json',root),JSON.stringify(out,null,2));
console.log(out.map(x=>`${x.id}: ${Math.round(x.bytes/1024)}KB`).join('\n'));
const fonts=await fetch('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Golos+Text:wght@400;500;600&display=swap',{headers:{'User-Agent':'Mozilla/5.0'}}).then(r=>r.text());
let css=fonts; const urls=[...new Set([...fonts.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))];
for(let i=0;i<urls.length;i++){const r=await fetch(urls[i]); const ext=urls[i].split('.').at(-1); const name=`font-${i}.${ext}`; await writeFile(new URL(`dist/assets/${name}`,root),Buffer.from(await r.arrayBuffer())); css=css.replaceAll(urls[i],`./${name}`);}
await writeFile(new URL('dist/assets/fonts.css',root),css);
console.log('Fonts downloaded:',urls.length);
