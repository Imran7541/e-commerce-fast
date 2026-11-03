const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jspdf.es.min-CVxRTsMF.js","assets/index-BIdHCx7F.js","assets/vendor-DznlNYZn.js","assets/icons-CaRrdofZ.js","assets/index-CglWtS2M.css"])))=>i.map(i=>d[i]);
import{_ as P}from"./index-BIdHCx7F.js";const k={a4:{page:"A4 portrait",margin:"10mm",widthMm:210},mm80:{page:"80mm auto",margin:"2mm",widthMm:80},mm58:{page:"58mm auto",margin:"2mm",widthMm:58}},M=i=>i.replace(/[&<>"]/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[n]),T=()=>Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(i=>i.outerHTML).join(`
`),f=async i=>{const n=Array.from(i.images).map(o=>o.complete?Promise.resolve():new Promise(t=>{o.onload=()=>t(),o.onerror=()=>t()})),e=i.fonts?.ready?.catch?.(()=>{})??Promise.resolve();await Promise.race([Promise.all([...n,e]),new Promise(o=>setTimeout(o,4e3))])};async function A(i,n,e="Invoice"){if(i.length===0)return;const o=k[n],t=document.createElement("iframe");t.setAttribute("aria-hidden","true"),t.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none",document.body.appendChild(t);const a=t.contentDocument,r=t.contentWindow;if(!a||!r){t.remove(),window.print();return}const l=i.map(d=>`<section class="print-sheet">${d.outerHTML}</section>`).join("");a.open(),a.write(`<!doctype html><html><head><meta charset="utf-8"><title>${M(e)}</title>
<base href="${window.location.origin}/">
${T()}
<style>
  @page { size: ${o.page}; margin: ${o.margin}; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body * { visibility: visible !important; }
  .print-sheet { break-after: page; page-break-after: always; }
  .print-sheet:last-child { break-after: auto; page-break-after: auto; }
  .print-sheet .invoice-print-root {
    position: static !important; width: 100% !important; max-width: none !important;
    height: auto !important; max-height: none !important; overflow: visible !important;
    margin: 0 !important; box-shadow: none !important; ${n==="a4"?"padding: 0 !important;":""}
  }
  /* A long invoice continues on the next page without cutting a line in half */
  .print-sheet tr, .print-sheet img { break-inside: avoid; page-break-inside: avoid; }
  .print-sheet thead { display: table-header-group; }
  .no-print { display: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body>${l}</body></html>`),a.close(),await new Promise(d=>{a.readyState==="complete"?d():(t.onload=()=>d(),setTimeout(d,2500))}),await f(a);const s=()=>setTimeout(()=>t.remove(),300);r.addEventListener("afterprint",s,{once:!0}),setTimeout(()=>t.isConnected&&t.remove(),12e4),r.focus(),r.print()}async function H(i,n,e){if(i.length===0)return;const[{default:o},{jsPDF:t}]=await Promise.all([P(()=>import("./html2canvas-pro.esm-B9164ajr.js"),[]),P(()=>import("./jspdf.es.min-CVxRTsMF.js").then(h=>h.j),__vite__mapDeps([0,1,2,3,4]))]),a=k[n],r=n==="a4"?10:2,l=a.widthMm-r*2;let s=null;const d=document.createElement("div");d.setAttribute("aria-hidden","true"),d.style.cssText="position:absolute;left:-20000px;top:0;pointer-events:none;background:#fff",document.body.appendChild(d);try{for(const h of i){const c=h.cloneNode(!0);c.style.height="auto",c.style.maxHeight="none",c.style.overflow="visible",c.style.boxShadow="none",c.style.width=`${h.offsetWidth||Math.round(a.widthMm*3.78)}px`,d.replaceChildren(c),await f(document);const w=Math.ceil(c.scrollHeight),m=await o(c,{scale:2,backgroundColor:"#ffffff",useCORS:!0,logging:!1,height:w,windowHeight:Math.max(w,window.innerHeight),scrollX:0,scrollY:0}),y=m.height*l/m.width;if(n==="a4"){const E=297-r*2;s?s.addPage("a4","portrait"):s=new t({unit:"mm",format:"a4",orientation:"portrait",compress:!0});const b=m.width/l,v=Math.floor(E*b);for(let g=0,x=0;g<m.height;g+=v,x+=1){x>0&&s.addPage("a4","portrait");const p=document.createElement("canvas");p.width=m.width,p.height=Math.min(v,m.height-g),p.getContext("2d").drawImage(m,0,g,m.width,p.height,0,0,m.width,p.height),s.addImage(p.toDataURL("image/jpeg",.92),"JPEG",r,r,l,p.height/b)}}else{const u=[a.widthMm,y+r*2];s?s.addPage(u,"portrait"):s=new t({unit:"mm",format:u,orientation:"portrait",compress:!0}),s.addImage(m.toDataURL("image/jpeg",.92),"JPEG",r,r,l,y)}}}finally{d.remove()}s?.save(e.endsWith(".pdf")?e:`${e}.pdf`)}async function _(i,n="Report"){const e=document.createElement("iframe");e.setAttribute("aria-hidden","true"),e.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none",document.body.appendChild(e);const o=e.contentDocument,t=e.contentWindow;if(!o||!t){e.remove(),window.print();return}o.open(),o.write(`<!doctype html><html><head><meta charset="utf-8"><title>${M(n)}</title>
<base href="${window.location.origin}/">
${T()}
<style>
  @page { size: A4 portrait; margin: 12mm; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body { font-family: var(--font-sans, sans-serif); color: #111827; }
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  svg { max-width: 100% !important; height: auto; }
  .recharts-responsive-container, .recharts-wrapper { width: 100% !important; height: auto !important; }
  .a-card { box-shadow: none !important; break-inside: avoid; page-break-inside: avoid; margin-bottom: 10px; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body class="admin-shell">${i.outerHTML}</body></html>`),o.close(),await new Promise(a=>{o.readyState==="complete"?a():(e.onload=()=>a(),setTimeout(a,2500))}),await f(o),t.addEventListener("afterprint",()=>setTimeout(()=>e.remove(),300),{once:!0}),setTimeout(()=>e.isConnected&&e.remove(),12e4),t.focus(),t.print()}export{_ as a,H as d,A as p};
