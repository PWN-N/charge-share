
(()=>{
const $=s=>document.querySelector(s);
/* ---------- pricing engine (same rules as pricing.js) ---------- */
const C={mob:150,km:12,sm:1.2,com:.1,gst:.18,eff:.9,caps:{home:[9,15],v2v:[12,18]}};
const r2=n=>Math.round((n+Number.EPSILON)*100)/100;
const inr=n=>'₹'+n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const inr0=n=>'₹'+Math.round(Math.abs(n)).toLocaleString('en-IN');
const isNight=()=>{const h=+new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:'Asia/Kolkata'}).format(new Date());return h>=23||h<6};
function price(o){const [lo,hi]=C.caps[o.type],rate=Math.min(hi,Math.max(lo,o.rate)),kwh=r2(o.cap*o.d/100),base=r2(kwh*rate),
 disp=o.mode==='call_provider',mob=disp?C.mob:0,trv=disp?r2(o.km*C.km):0,conv=r2(mob+trv),sg=o.night?r2(base*(C.sm-1)):0,
 gross=r2(base+conv+sg),com=r2(gross*C.com),gst=r2((com+conv)*C.gst),total=r2(gross+com+gst),dc=r2(kwh*21);
 return{kwh,rate,base,mob,trv,conv,sg,gross,com,gst,total,payout:gross,km:o.km,tm:o.eta,cm:Math.ceil(kwh/(Math.min(o.kw,o.maxKw||99)*C.eff)*60),dc,save:r2(dc-total),night:o.night,mode:o.mode}}
const EST={self_drive:{type:'home',rate:12,kw:7.4,km:3.2,eta:9},call_provider:{type:'v2v',rate:15,kw:3.3,km:4.5,eta:14}};
const CAR={model:'Tata Nexon EV',cap:40.5,conn:'CCS2',maxKw:7.2};
const CONN=['Type 2 AC','CCS2','Bharat AC-001','16A socket / 3-pin plug','LECCS','CHAdeMO'];
const PV=[{dx:2,dy:-1.5,t:'home'},{dx:-3,dy:2,t:'home'},{dx:4,dy:3,t:'v2v'},{dx:-5,dy:-4,t:'v2v'},{dx:7,dy:-2,t:'home'},{dx:-8,dy:5,t:'v2v'},{dx:9,dy:7,t:'home'}];
 
/* ---------- state ---------- */
const savedRole=(()=>{try{const v=localStorage.getItem('chargesShareRole');return v==='provider'||v==='receiver'?v:null}catch(e){return null}})();
const S={role:savedRole,radius:7,online:false,offer:null,req:null,
 r:{step:1,charger:'default',conn:'CCS2',adapter:'No adapter',cur:12,tgt:30,mode:'self_drive',night:isNight()},
 prof:{type:'home',conn:'CCS2',kw:7.4,rate:12}};
let simId,buzzId,cdId,ctx;
const calc=()=>price({cap:CAR.cap,d:S.r.tgt-S.r.cur,mode:S.r.mode,night:S.r.night,maxKw:CAR.maxKw,...EST[S.r.mode]});
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(t.h);t.h=setTimeout(()=>t.style.display='none',3500)};
 
/* ---------- audio buzzer (must be unlocked by a tap) ---------- */
function unlock(){try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume()}catch(e){}}
function beep(f){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.26);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.26)}
 
/* ---------- views ---------- */
function map(){const k=17,R=S.radius;
 const dots=PV.map(p=>{const inn=Math.hypot(p.dx,p.dy)<=R;return `<circle cx="${320+p.dx*k}" cy="${180+p.dy*k}" r="7" fill="${p.t==='home'?'#3e8e2b':'#2b7bd1'}" opacity="${inn?1:.2}"/>`}).join('');
 const n=t=>PV.filter(p=>p.t===t&&Math.hypot(p.dx,p.dy)<=R).length;
 return `<svg class="map" viewBox="0 0 640 360"><path d="M0 100H640M0 260H640M150 0V360M490 0V360M0 20L640 340M0 340L640 20" stroke="var(--ln)" stroke-width="6" fill="none"/>
 <circle cx="320" cy="180" r="${R*k}" fill="rgba(62,142,43,.10)" stroke="#3e8e2b" stroke-width="2" stroke-dasharray="6 5"/>${dots}
 <circle cx="320" cy="180" r="11" fill="#d93025" stroke="#fff" stroke-width="3"/></svg>
 <div class="leg"><span><i class="dot" style="background:#d93025"></i>You (GPS)</span><span><i class="dot" style="background:#3e8e2b"></i>Home wallbox: ${n('home')}</span><span><i class="dot" style="background:#2b7bd1"></i>V2V cars: ${n('v2v')}</span><span>within ${R} km</span></div>`}
function tl(){const q=S.req,d=q.mode==='call_provider';
 const L=['Finding a provider…','Provider accepted',d?'Provider is on the way':'You’re driving to the host','Charging in progress','Completed – payment settled'],N=['PENDING','ACCEPTED','EN_ROUTE','CHARGING','COMPLETED'];
 return `<ol class="tl">${L.map((l,i)=>`<li class="${i<q.i?'done':i===q.i?'cur':''}"><b>${i<q.i||q.i===4?'✓':i+1}</b><span>${l} <span class="mut">${N[i]}</span></span></li>`).join('')}</ol>`}
function render(){
 $('#who').innerHTML=S.role?`<span class="mut">${S.role==='receiver'?'Receiver':'Provider'} mode · </span><button class="link" data-act="switch">Switch</button>`:'';
 let h='';
 if(!S.role)h=`<h1>How do you want to use ChargeShare?</h1><p class="sub">You can switch any time.</p><div class="grid">
  <button class="card role" data-act="role:receiver"><div class="em">🔋</div><h2>Receiver</h2><p class="mut">My EV is low on charge and I need an emergency top-up.</p></button>
  <button class="card role" data-act="role:provider"><div class="em">🏠</div><h2>Provider</h2><p class="mut">I have a home wallbox or a V2V-capable EV and want to earn.</p></button></div>`;
 else if(S.role==='receiver')h=`<h1>Need a charge?</h1><p class="sub">${CAR.model} · ${CAR.cap} kWh · default charger ${CAR.conn}</p>
  <div class="card">${map()}<label class="f">Search radius: <b id="rv">${S.radius}</b> km</label><input type="range" id="rad" min="5" max="10" value="${S.radius}">
  <p class="mut" style="margin-top:6px">Demo map. In production this is Google Maps with your live GPS and Places search.</p></div>
  ${S.req?`<div class="card"><h3>Your rescue</h3>${tl()}${S.req.i===4?`<p style="margin:12px 0"><b>Paid ${inr(S.req.p.total)}</b></p><button class="btn" data-act="newreq">New request</button>`:''}</div>`
  :`<button class="btn full" data-act="open">⚡ Get emergency charge</button>`}`;
 else h=`<h1>Provider dashboard</h1><p class="sub">Go online to receive rescue requests.</p>
  <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><div><h3>Availability</h3><p class="mut">${S.online?'You will hear an alert for new requests.':'You are hidden from drivers.'}</p></div>
  <button class="sw ${S.online?'on':''}" data-act="online"><i></i>${S.online?'Active / Online':'Inactive / Offline'}</button></div></div>
  <div class="card"><h3>Provider profile</h3><label class="f">Provider type</label><select id="pt"><option value="home" ${S.prof.type==='home'?'selected':''}>Fixed Home Wallbox</option><option value="v2v" ${S.prof.type==='v2v'?'selected':''}>Mobile V2V Vehicle</option></select>
  <label class="f">Connector</label><select id="pc">${CONN.map(c=>`<option ${c===S.prof.conn?'selected':''}>${c}</option>`).join('')}</select>
  <div class="grid"><div><label class="f">Max output (kW)</label><input type="number" id="pk" min="1" max="350" step="0.1" value="${S.prof.kw}"></div>
  <div><label class="f">Rate per kWh (₹)</label><input type="number" id="pr" min="9" max="18" step="0.5" value="${S.prof.rate}"></div></div>
  <p class="mut" style="margin-top:8px">Rate is kept within ₹9–15 for home wallbox and ₹12–18 for V2V so it stays below public stations.</p></div>
  ${S.req?`<div class="card"><h3>Active rescue</h3>${tl()}${S.req.i===4?`<p style="margin:12px 0"><b>You earned ${inr(S.req.p.payout)}</b></p>`:''}</div>`
  :`<button class="btn out full" data-act="sim" ${S.online?'':'disabled'}>Simulate an incoming rescue request</button><p class="mut" style="margin-top:8px">${S.online?'No backend here, so this button plays the request that the server would push.':'Go online first.'}</p>`}`;
 $('#marketApp').innerHTML=h}
 
function recvModal(){const r=S.r,p=calc(),dk=r.tgt-r.cur,e=EST[r.mode];
 let b;
 if(r.step===1)b=`<div id="s1"><h3>1. Your charger</h3>
  <button class="ch ${r.charger==='default'?'on':''}" data-act="chg:default"><b>Use Default Verified Charger</b><span>${CAR.conn} · from your ${CAR.model} profile</span></button>
  <button class="ch ${r.charger==='custom'?'on':''}" data-act="chg:custom"><b>Select / Edit Different Charger</b><span>Pick another connector or use an adapter</span></button>
  ${r.charger==='custom'?`<div class="grid"><select id="cc">${CONN.map(c=>`<option ${c===r.conn?'selected':''}>${c}</option>`).join('')}</select><select id="ca">${['No adapter','Type 2 ↔ 3-pin adapter','CCS2 ↔ CHAdeMO adapter'].map(c=>`<option ${c===r.adapter?'selected':''}>${c}</option>`).join('')}</select></div>`:''}
  <h3 style="margin-top:18px">2. How much charge?</h3>
  <label class="f" style="margin-top:0">Current battery: <b id="cv">${r.cur}%</b></label><input type="range" id="cur" min="1" max="90" value="${r.cur}">
  <label class="f">Target battery: <b id="tv">${r.tgt}%</b></label><input type="range" id="tgt" min="${r.cur+1}" max="100" value="${r.tgt}">
  <div class="badge" id="dk">+${dk}% ≈ ${p.kwh} kWh (${CAR.cap} × ${dk} ÷ 100)</div>
  <h3>3. How should help reach you?</h3>
  <button class="ch ${r.mode==='self_drive'?'on':''}" data-act="mode:self_drive"><b>Self-Drive to Provider</b><span>Home wallbox or parked V2V car · no travel fee</span></button>
  <button class="ch ${r.mode==='call_provider'?'on':''}" data-act="mode:call_provider"><b>Call Provider to Location</b><span>A V2V car drives to your pin · mobilization fee applies</span></button>
  <button class="btn full" data-act="next" style="margin-top:8px">See price</button></div>`;
 else b=`<div class="badge ${p.save<0?'warn':''}">${p.save>=0?`Saved ${inr0(p.save)} vs Public DC Fast Station`:`${inr0(p.save)} more than a public DC fast station – you’re paying for a doorstep rescue`}<small>Public DC Fast reference ₹18–24/kWh (Maharashtra)</small></div>
  <div class="box"><div class="rw"><span>Distance</span><b>${p.km} km</b></div><div class="rw"><span>Travel time<small>${r.mode==='self_drive'?'Your drive to the host':'Host’s drive to you'}</small></span><b>${p.tm} min</b></div>
  <div class="rw"><span>Charging time<small>Host output ${e.kw} kW</small></span><b>~${p.cm} min</b></div><div class="rw"><span>Energy<small>+${dk}% battery (${r.cur}% → ${r.tgt}%)</small></span><b>${p.kwh} kWh</b></div></div>
  <div class="box"><div class="rw"><span>Base energy<small>${p.kwh} kWh × ₹${p.rate}</small></span><span>${inr(p.base)}</span></div>
  ${r.mode==='call_provider'?`<div class="rw"><span>Mobilization fee<small>₹${C.mob} + ${p.km} km × ₹${C.km}</small></span><span>${inr(p.conv)}</span></div>`:''}
  ${p.night?`<div class="rw"><span>Night urgency surcharge<small>1.2× on energy</small></span><span>${inr(p.sg)}</span></div>`:''}
  <div class="rw"><span>Platform commission<small>10% of service value</small></span><span>${inr(p.com)}</span></div>
  <div class="rw"><span>GST<small>18% on commission &amp; mobilization</small></span><span>${inr(p.gst)}</span></div>
  <div class="rw t"><span>Total payable</span><span>${inr(p.total)}</span></div></div>
  <label class="mut"><input type="checkbox" id="nt" ${r.night?'checked':''}> Preview night rate (11 PM – 6 AM)</label>
  <p class="mut" style="margin:6px 0 12px">Estimate. The final bill is locked by the server and adjusted to the kWh actually delivered.</p>
  <div class="two"><button class="btn out" data-act="back">Back</button><button class="btn" data-act="confirm">Request rescue</button></div>`;
 $('#modal').innerHTML=`<div class="ov"><div class="sheet"><div style="display:flex;justify-content:space-between;align-items:center"><div><div class="mut" style="font-weight:700;color:var(--gd)">STEP ${r.step} OF 2</div><h2>${r.step===1?'Set up your rescue':'Review your bill'}</h2></div><button class="link" data-act="close" aria-label="Close">✕</button></div><div class="pbar"><i style="width:${r.step*50}%"></i></div>${b}</div></div>`}
 
function offerModal(){const o=S.offer,d=o.p.mode==='call_provider';
 $('#modal').innerHTML=`<div class="ov alert" role="alertdialog"><div class="sheet"><div class="hd" id="hd"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:12px;font-weight:700;letter-spacing:.08em">RESCUE REQUEST</div><h2>${d?'Drive to the driver':'Driver is coming to you'}</h2></div><div style="text-align:right"><div class="cd" id="cd">45</div><div style="font-size:12px">seconds left</div></div></div><div class="tbar"><i id="tb" style="width:100%"></i></div></div>
 <div class="box" style="padding:10px 14px"><b>MG ZS EV</b><div class="mut">CCS2 · <b style="color:var(--gd)">Compatible</b></div></div>
 <p>📍 Near Eastern Express Hwy, Thane</p>
 <div class="kp"><div><b>${o.p.km} km</b><span class="mut">Distance</span></div><div><b>${o.p.tm} min</b><span class="mut">ETA</span></div><div><b>${o.p.kwh} kWh</b><span class="mut">Energy</span></div></div>
 <p class="mut" style="text-align:center;margin-bottom:10px">Battery top-up requested: +18%</p>
 <div class="box"><div class="rw"><span>Energy</span><span>${inr(o.p.base)}</span></div>${o.p.conv?`<div class="rw"><span>Mobilization &amp; travel</span><span>${inr(o.p.conv)}</span></div>`:''}${o.p.sg?`<div class="rw"><span>Night surcharge</span><span>${inr(o.p.sg)}</span></div>`:''}<div class="rw t"><span>Your payout</span><span>${inr(o.p.payout)}</span></div></div>
 <div class="two"><button class="btn out" data-act="decline">Decline</button><button class="btn" data-act="accept" style="flex:1.4;font-size:18px">Accept</button></div></div></div>`}
 
/* ---------- logic ---------- */
function startSim(p,mode,from){S.req={i:from,p,mode};render();clearInterval(simId);simId=setInterval(()=>{S.req.i++;render();if(S.req.i>=4)clearInterval(simId)},3000)}
function closeOffer(){clearInterval(buzzId);clearInterval(cdId);navigator.vibrate&&navigator.vibrate(0);S.offer=null;$('#modal').innerHTML=''}
function showOffer(){const mode=S.prof.type==='v2v'?'call_provider':'self_drive',e=EST[mode];
 const p=price({cap:40.5,d:18,mode,night:isNight(),type:S.prof.type,rate:S.prof.rate,kw:S.prof.kw,maxKw:7.2,km:e.km,eta:e.eta});
 S.offer={p,exp:Date.now()+45000};offerModal();let hi=true;
 const tick=()=>{beep(hi?880:660);hi=!hi;navigator.vibrate&&navigator.vibrate([200,100,200])};tick();buzzId=setInterval(tick,600);
 cdId=setInterval(()=>{const s=Math.max(0,Math.ceil((S.offer.exp-Date.now())/1000));$('#cd').textContent=s;$('#tb').style.width=s/45*100+'%';$('#hd').classList.toggle('u',s<=10);
  if(!s){closeOffer();toast('Request expired – auto-declined');}},250)}
 
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const [k,v]=a.dataset.act.split(':'),r=S.r;
 if(k==='role'){S.role=v;try{localStorage.setItem('chargesShareRole',v)}catch(e){}render()}
 if(k==='switch'){S.role=null;try{localStorage.removeItem('chargesShareRole')}catch(e){}S.online=false;S.req=null;clearInterval(simId);render()}
 if(k==='open'){S.r.step=1;S.r.night=isNight();recvModal()}
 if(k==='close')$('#modal').innerHTML='';
 if(k==='chg'){r.charger=v;recvModal()}
 if(k==='mode'){r.mode=v;recvModal()}
 if(k==='next'){r.step=2;recvModal()}
 if(k==='back'){r.step=1;recvModal()}
 if(k==='confirm'){const p=calc();$('#modal').innerHTML='';startSim(p,r.mode,0);setTimeout(()=>{},0)}
 if(k==='newreq'){S.req=null;render()}
 if(k==='online'){if(!S.online)unlock();S.online=!S.online;render()}
 if(k==='sim'){unlock();showOffer()}
 if(k==='accept'){const p=S.offer.p,m=p.mode;closeOffer();toast('Accepted – you will earn '+inr(p.payout));startSim(p,m,1)}
 if(k==='decline'){closeOffer();toast('Request declined')}
});
document.addEventListener('input',e=>{const el=e.target,r=S.r,id=el.id;
 if(id==='rad'){S.radius=+el.value;render()}
 if(id==='cur'){r.cur=+el.value;r.tgt=Math.max(r.tgt,r.cur+1);$('#cv').textContent=r.cur+'%';const t=$('#tgt');t.min=r.cur+1;t.value=r.tgt;$('#tv').textContent=r.tgt+'%'}
 if(id==='tgt'){r.tgt=Math.max(+el.value,r.cur+1);$('#tv').textContent=r.tgt+'%'}
 if(id==='cur'||id==='tgt'){const p=calc(),d=r.tgt-r.cur;$('#dk').textContent=`+${d}% ≈ ${p.kwh} kWh (${CAR.cap} × ${d} ÷ 100)`}
 if(id==='pk')S.prof.kw=+el.value||1;if(id==='pr')S.prof.rate=+el.value||12});
document.addEventListener('change',e=>{const el=e.target,id=el.id;
 if(id==='cc')S.r.conn=el.value;if(id==='ca')S.r.adapter=el.value;
 if(id==='nt'){S.r.night=el.checked;recvModal()}
 if(id==='pt'){S.prof.type=el.value;S.prof.rate=el.value==='v2v'?15:12;S.prof.kw=el.value==='v2v'?3.3:7.4;render()}
 if(id==='pc')S.prof.conn=el.value});
render();
})();
