// In-page probes (plain JS strings, so the same code runs in Chrome over CDP and in Playwright WebKit).

// Sideways scroll + elements poking past the viewport (ignoring ones inside a clipping/scrolling
// ancestor — carousels), words split mid-word, amounts/dates/times split over lines, card buttons.
export const LAYOUT = `(()=>{
const vw=document.documentElement.clientWidth, res={};
res.sw=document.documentElement.scrollWidth-vw;
const clipAnc=e=>{for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(/(hidden|clip|auto|scroll)/.test(s.overflowX)&&p.getBoundingClientRect().width<=vw+1)return true;}return false};
const out=[];for(const e of document.querySelectorAll('main *, header *, footer *')){const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;if((r.right>vw+1||r.left<-1)&&!clipAnc(e)){const pr=e.parentElement.getBoundingClientRect();if(pr.right>vw+1||pr.left<-1)continue;out.push((e.tagName+'.'+(typeof e.className==='string'?e.className:'').split(' ').slice(0,4).join('.')).slice(0,90)+' ['+Math.round(r.left)+','+Math.round(r.right)+']')}}
res.out=out.slice(0,6);
const broken=[],multi=[];const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
const rx=/€\\s?[\\d.,]+\\s?[kmb]?|\\b\\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\b|\\b\\d{2}:\\d{2}(:\\d{2})?\\b|\\b\\d+(\\.\\d+)?%/g;
const lines=(node,a,b)=>{const r=document.createRange();r.setStart(node,a);r.setEnd(node,b);return new Set([...r.getClientRects()].filter(x=>x.width>0.5).map(x=>Math.round(x.top/4))).size};
while(n=tw.nextNode()){const t=n.textContent;const el=n.parentElement;if(!el||(!el.offsetParent&&getComputedStyle(el).position!=='fixed'))continue;if(el.closest('script,style,[aria-hidden=true] svg'))continue;
 for(const m of t.matchAll(/[^\\s\\u00a0]{2,}/g)){if(lines(n,m.index,m.index+m[0].length)>1)broken.push(m[0])}
 for(const m of t.matchAll(rx)){if(lines(n,m.index,m.index+m[0].length)>1)multi.push(m[0])}}
// A break right after a hyphen ("short-|dated") is allowed — that is where Figma breaks too.
res.broken=[...new Set(broken)].filter(w=>!/[-\\u2011]/.test(w)).slice(0,8);res.hyphen=[...new Set(broken)].filter(w=>/-/.test(w)).slice(0,8);
res.multi=[...new Set(multi)].slice(0,8);
const btn=[];for(const b of document.querySelectorAll('main a[class*=rounded-control], main button[class*=rounded-control]')){const card=b.closest('[class*=rounded-card],[class*=rounded-panel]');if(!card||b.closest('[role=group],ol,ul'))continue;const cs=getComputedStyle(card);const cw=card.getBoundingClientRect().width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);const w=b.getBoundingClientRect().width;if(w>40)btn.push({t:b.textContent.trim().slice(0,22),w:Math.round(w),cw:Math.round(cw)})}
res.btn=btn;return JSON.stringify(res)})()`;

export const quickOverflow = `document.documentElement.scrollWidth-document.documentElement.clientWidth`;

// Open every toggle (story years, FAQ items, tabs), one at a time, and look for overflow after each.
export const STATE_TOGGLES = `(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const vw=document.documentElement.clientWidth;const issues=[];
const btns=[...document.querySelectorAll('main button[aria-expanded], main [role=tab], main button')].filter((b,i,a)=>a.indexOf(b)===i&&b.offsetParent&&(b.hasAttribute('aria-expanded')||b.getAttribute('role')==='tab'||/^20\\d\\d/.test(b.textContent.trim())));
for(const b of btns){b.scrollIntoView({block:'center'});b.click();await sleep(450);
 const sw=document.documentElement.scrollWidth-vw;if(sw>0)issues.push((b.textContent||'').trim().slice(0,20)+': sideways '+sw);
 const box=(b.closest('section')||document.body);for(const t of box.querySelectorAll('p,li,span')){const s=getComputedStyle(t);if(s.overflow==='hidden'&&t.scrollHeight>t.clientHeight+2&&!/truncate|line-clamp/.test(t.className)){issues.push((b.textContent||'').trim().slice(0,20)+': clipped text "'+t.textContent.trim().slice(0,30)+'"');break}}}
return JSON.stringify({clicked:btns.length,issues:[...new Set(issues)].slice(0,6)})})()`;
