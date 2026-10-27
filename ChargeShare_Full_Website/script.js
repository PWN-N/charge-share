(()=>{
const $=(s)=>document.querySelector(s), app=$('#authApp');
const S={view:'signup',step:0,d:{},f:{},sent:false};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const strength=v=>{let s=0;if(v.length>=8)s++;if(v.length>=12)s++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))s++;if(/\d/.test(v))s++;if(/[^A-Za-z0-9]/.test(v))s++;return Math.min(4,s)};
const meter=v=>{const n=v?strength(v):0,c=['#c62828','#c62828','#e08a00','#8cb82e','#3e8e2b'][n];
  return `<div class="meter" style="--c:${c}">${[1,2,3,4].map(i=>`<i class="${i<=n&&v?'on':''}"></i>`).join('')}</div><div class="mt">${v?['Too weak','Weak','Fair','Good','Strong'][n]:'Use 8+ characters with upper, lower case and a number'}</div>`};
const norm=v=>v.replace(/[\s-]/g,'');

/* ---------- Validation schema: one function per field, returns '' when valid ---------- */
const V={
 name:v=>!v.trim()?'Enter your full name':/^[A-Za-z][A-Za-z .'’-]{2,}$/.test(v.trim())?'':'Use letters only, exactly as on your Aadhaar',
 phone:v=>/^[6-9]\d{9}$/.test(v)?'':'Enter a valid 10-digit mobile number',
 email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())?'':'Enter a valid email address',
 pw:v=>v.length>=8&&/[a-z]/.test(v)&&/[A-Z]/.test(v)&&/\d/.test(v)?'':'Min 8 characters with upper case, lower case and a number',
 cpw:v=>v&&v===S.d.pw?'':'Passwords don’t match',
 ident:v=>{v=v.trim();if(!v)return 'Enter your email, phone number or user ID';
  if(v.includes('@'))return V.email(v);
  if(/^\d+$/.test(v))return V.phone(v);
  return /^[A-Za-z0-9_.-]{4,}$/.test(v)?'':'Enter a valid email, 10-digit phone or user ID'},
 lpw:v=>v?'':'Enter your password',
 dl:v=>/^[A-Z]{2}\d{2}(19|20)\d{9}$/.test(norm(v))?'':'Format: MH04 20110012345 (15 characters)',
 aadhaar:v=>/^[2-9]\d{11}$/.test(v)?'':'Enter a valid 12-digit Aadhaar number',
 pan:v=>/^[A-Z]{5}\d{4}[A-Z]$/.test(v)?'':'Format: ABCDE1234F',
 rc:v=>{const n=norm(v);return /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/.test(n)||/^\d{2}BH\d{4}[A-Z]{1,2}$/.test(n)?'':'Format: MH04AB1234 or 22BH1234AA'},
 vin:v=>/^[A-HJ-NPR-Z0-9]{17}$/.test(v)?'':'Must be exactly 17 characters (no I, O or Q)',
 port:v=>v?'':'Choose your connector type',
 kw:v=>{const n=parseFloat(v);return n>=0.5&&n<=350?'':'Enter a rating between 0.5 and 350 kW'}
};
V.fid=V.ident;

/* ---------- Onboarding schema: 6 steps in 2 phases ---------- */
const PORTS=['Type 2 AC','CCS2','Bharat AC-001','15A socket / 3-pin plug','CHAdeMO'];
const ST=[
 {short:'Licence',t:'Driving licence',d:'Enter your DL number and upload both sides.',f:[{k:'dl',l:'Driving licence number',ph:'MH04 20110012345',max:20,h:'State code, RTO code, year and serial number'},{file:'dlF',l:'Licence – front'},{file:'dlB',l:'Licence – back'}]},
 {short:'Aadhaar',t:'Aadhaar card',d:'We only keep what’s needed to verify you.',f:[{k:'aadhaar',l:'Aadhaar number',ph:'XXXX XXXX XXXX',m:'numeric',max:14,h:'Hidden after you type – only the last 4 digits stay visible'},{file:'aaF',l:'Aadhaar – front'},{file:'aaB',l:'Aadhaar – back'}]},
 {short:'PAN',t:'PAN card',d:'Needed to pay out your charging earnings.',f:[{k:'pan',l:'PAN number',ph:'ABCDE1234F',max:10,h:'5 letters, 4 digits, 1 letter'},{file:'panF',l:'PAN card – front'}]},
 {short:'RC',t:'Registration certificate (RC)',d:'Your vehicle’s registration details.',f:[{k:'rc',l:'Vehicle registration number',ph:'MH04 AB 1234',max:14},{file:'rcF',l:'RC – front'},{file:'rcB',l:'RC – back'}]},
 {short:'Chassis',t:'Chassis number',d:'Printed on your RC and on the dashboard plate.',f:[{k:'vin',l:'Chassis / VIN number',ph:'17 characters',max:17,h:'The letters I, O and Q are never used in a VIN'}]},
 {short:'Charger',t:'EV charger details',d:'Tell us what plug and power you use.',f:[{k:'port',l:'Charging port / connector type',sel:1},{k:'kw',l:'Charger power rating',ph:'7.4',suf:'kW',m:'decimal',max:5}]}
];

/* ---------- UI helpers ---------- */
const F=(id,l,o={})=>`<div class="fld" id="w-${id}"><label for="${id}">${l}</label><div class="ctl">${o.pre?`<span class="pre">${o.pre}</span>`:''}${o.sel?`<select id="${id}"><option value="">Select connector type</option>${PORTS.map(p=>`<option ${S.d[id]===p?'selected':''}>${p}</option>`).join('')}</select>`:`<input id="${id}" type="${o.t||'text'}" placeholder="${o.ph||''}" value="${esc(id==='aadhaar'?aaShow(false):S.d[id]||'')}" ${o.m?`inputmode="${o.m}"`:''} ${o.max?`maxlength="${o.max}"`:''} autocomplete="${o.ac||'off'}">`}${o.suf?`<span class="pre suf">${o.suf}</span>`:''}${o.eye?`<button type="button" class="eye" data-eye="${id}">Show</button>`:''}</div>${o.h?`<small>${o.h}</small>`:''}<em class="err" id="e-${id}"></em></div>`;
const FU=(id,l)=>`<div class="fld" id="w-${id}"><label>${l}</label><label class="drop ${S.f[id]?'has':''}" for="${id}"><input type="file" id="${id}" accept="image/*,application/pdf" hidden>${S.f[id]?'✓ '+esc(S.f[id]):'Tap to upload or drop a file here'}<small>JPG, PNG or PDF · max 5 MB</small></label><em class="err" id="e-${id}"></em></div>`;
function aaShow(masked){const r=S.d.aadhaar||'';if(masked&&V.aadhaar(r)==='')return 'XXXX XXXX '+r.slice(8);return r.replace(/(\d{4})(?=\d)/g,'$1 ')}
const setErr=(id,m)=>{const e=$('#e-'+id),w=$('#w-'+id);if(e)e.textContent=m;if(w)w.classList.toggle('bad',!!m)};
function check(list){let first=null;list.forEach(([id,err])=>{setErr(id,err);if(err&&!first)first=id});if(first){const el=document.getElementById(first);el&&el.scrollIntoView({block:'center'});el&&el.focus&&el.focus()}return !first}

/* ---------- Views ---------- */
const views={
 signup:()=>`<h1>Create your account</h1><p class="sub">Join ChargeShare to find or share EV chargers.</p>
 <form id="signup" novalidate>
 ${F('name','Full name',{ph:'As on your Aadhaar / Government ID',h:'Must match your Government ID exactly – we’ll check it later.',ac:'name'})}
 ${F('phone','Phone number',{pre:'+91',ph:'10-digit mobile number',m:'numeric',max:10,ac:'tel'})}
 ${F('email','Email address',{t:'email',ph:'you@example.com',ac:'email'})}
 ${F('pw','Create password',{t:'password',ph:'Create a strong password',eye:1,ac:'new-password'})}<div id="meter" style="margin:-8px 0 16px">${meter(S.d.pw||'')}</div>
 ${F('cpw','Confirm password',{t:'password',ph:'Re-enter your password',eye:1,ac:'new-password'})}
 <button class="btn" type="submit">Create Account</button></form>
 <p class="sw">Already have an account? <a href="#" data-go="login">Log In</a></p>`,
 login:()=>`<h1>Welcome back</h1><p class="sub">Log in to continue to ChargeShare.</p>
 <form id="login" novalidate>
 ${F('ident','Email / Phone number / User ID',{ph:'Enter email, phone or user ID',ac:'username'})}
 ${F('lpw','Password',{t:'password',ph:'Enter your password',eye:1,ac:'current-password'})}
 <div class="lnk"><a href="#" data-go="forgot">Forgot Password?</a></div>
 <button class="btn" type="submit">Log In</button></form>
 <p class="sw">Don’t have an account? <a href="#" data-go="signup">Sign Up</a></p>`,
 forgot:()=>S.sent?`<div class="ok">✉</div><h1>Check your inbox</h1><p class="sub">If an account exists for that identifier, we’ve sent a reset link.</p><a href="#" data-go="login">← Back to Log In</a>`
 :`<h1>Reset your password</h1><p class="sub">We’ll send a reset link to your email or phone.</p><form id="forgot" novalidate>${F('fid','Email / Phone number / User ID',{ph:'Enter email, phone or user ID'})}<button class="btn" type="submit">Send reset link</button></form><p class="sw"><a href="#" data-go="login">← Back to Log In</a></p>`,
 onboard:()=>{const s=ST[S.step],ins=s.f.filter(x=>!x.file),fs=s.f.filter(x=>x.file),first=(S.d.name||'').trim().split(' ')[0];
  return `<div class="phases"><span class="${S.step<3?'on':''}">Phase 1 · Identity</span><span class="${S.step>=3?'on':''}">Phase 2 · Vehicle &amp; charger</span></div>
  <div class="bar"><i style="width:${(S.step+1)/6*100}%"></i></div>
  <ol class="steps">${ST.map((x,i)=>`<li class="${i<S.step?'done':i===S.step?'cur':''}"><b>${i<S.step?'✓':i+1}</b><span>${x.short}</span></li>`).join('')}</ol>
  <p class="mt">${S.step===0&&first?`Hi ${esc(first)}! `:''}Step ${S.step+1} of 6</p><h1>${s.t}</h1><p class="sub">${s.d}</p>
  <form id="onboard" novalidate>${ins.map(x=>F(x.k,x.l,x)).join('')}${fs.length?`<div class="two">${fs.map(x=>FU(x.file,x.l)).join('')}</div>`:''}
  <div class="note">🔒 Documents are encrypted and used only for verification.</div>
  <div class="row">${S.step?'<button class="btn ghost" type="button" data-act="back">Back</button>':''}<button class="btn" type="submit">${S.step===5?'Submit for verification':'Continue'}</button></div></form>`},
 done:()=>{const l4=v=>'•••• '+String(v||'').slice(-4);return `<div class="ok">✓</div><h1>You’re all set${S.d.name?', '+esc(S.d.name.split(' ')[0]):''}!</h1><p class="sub">We’re reviewing your documents. This usually takes under 24 hours – we’ll email you once you’re verified.</p>
  <ul class="sum"><li>Driving licence<span>${l4(norm(S.d.dl||''))}</span></li><li>Aadhaar<span>${l4(S.d.aadhaar)}</span></li><li>PAN<span>${l4(S.d.pan)}</span></li><li>Vehicle RC<span>${esc(norm(S.d.rc||''))}</span></li><li>Chassis number<span>${l4(S.d.vin)}</span></li><li>Charger<span>${esc(S.d.port||'')} · ${esc(S.d.kw||'')} kW</span></li></ul>
  <div class="note">Demo mode: identity details and files stay in this browser session only.</div><button class="btn" type="button" data-act="market">Continue to ChargeShare</button><button class="btn ghost" type="button" data-act="restart" style="margin-top:10px">Restart demo</button>`}
};
function render(){app.innerHTML=views[S.view]();window.scrollTo(0,0);document.title='ChargeShare – '+({signup:'Sign up',login:'Log in',forgot:'Reset password',onboard:'Verification',done:'Done'})[S.view]}

/* ---------- Events (one delegated listener per type) ---------- */
app.addEventListener('click',e=>{
 const g=e.target.closest('[data-go]'),a=e.target.closest('[data-act]'),y=e.target.closest('[data-eye]');
 if(g){e.preventDefault();S.view=g.dataset.go;S.sent=false;render()}
 if(y){const i=document.getElementById(y.dataset.eye),h=i.type==='password';i.type=h?'text':'password';y.textContent=h?'Hide':'Show'}
 if(a){const k=a.dataset.act;if(k==='back'){S.step--;render()}if(k==='market'){document.querySelector('.auth-shell').style.display='none';document.querySelector('#marketShell').style.display='block';window.scrollTo(0,0)}if(k==='restart'){document.querySelector('.auth-shell').style.display='grid';document.querySelector('#marketShell').style.display='none';S.d={};S.f={};S.step=0;S.view='signup';render()}}
});
app.addEventListener('input',e=>{const el=e.target,id=el.id;if(!id||el.type==='file')return;let v=el.value;
 if(id==='phone')v=v.replace(/\D/g,'').slice(0,10);
 if(id==='pan')v=v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10);
 if(id==='vin')v=v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,17);
 if(id==='dl'||id==='rc')v=v.toUpperCase().replace(/[^A-Z0-9 -]/g,'');
 if(id==='kw')v=v.replace(/[^\d.]/g,'');
 if(id==='aadhaar'){v=v.replace(/\D/g,'').slice(0,12);S.d.aadhaar=v;el.value=aaShow(false);setErr(id,'');return}
 el.value=v;S.d[id]=v;
 if(id==='pw'){$('#meter').innerHTML=meter(v)}
 setErr(id,'');
});
app.addEventListener('change',e=>{const el=e.target;
 if(el.tagName==='SELECT'){S.d[el.id]=el.value;setErr(el.id,'');return}
 if(el.type==='file'){const f=el.files[0];if(!f)return;
  if(!/^(image\/|application\/pdf)/.test(f.type)||f.size>5*1024*1024){S.f[el.id]=null;render();setErr(el.id,'Upload a JPG, PNG or PDF under 5 MB');return}
  S.f[el.id]=f.name;render()}
});
app.addEventListener('focusout',e=>{const el=e.target,id=el.id;if(!id||el.type==='file'||!V[id])return;
 if(id==='cpw'&&!el.value)return;
 const v=id==='aadhaar'?(S.d.aadhaar||''):(S.d[id]||'');if(!v&&!el.value&&id!=='port')return;
 const err=V[id](v);setErr(id,err);if(id==='aadhaar'&&!err)el.value=aaShow(true)});
app.addEventListener('focusin',e=>{if(e.target.id==='aadhaar')e.target.value=aaShow(false)});
['dragover','dragleave','drop'].forEach(t=>app.addEventListener(t,e=>{const z=e.target.closest('.drop');if(!z)return;e.preventDefault();
 z.classList.toggle('over',t==='dragover');
 if(t==='drop'){const i=z.querySelector('input');i.files=e.dataTransfer.files;i.dispatchEvent(new Event('change',{bubbles:true}))}}));

app.addEventListener('submit',e=>{e.preventDefault();const id=e.target.id,d=k=>S.d[k]||'';
 if(id==='signup'&&check(['name','phone','email','pw','cpw'].map(k=>[k,V[k](d(k))]))){S.view='onboard';S.step=0;render()}
 if(id==='login'&&check([['ident',V.ident(d('ident'))],['lpw',V.lpw(d('lpw'))]])){
  // Returning users skip identity onboarding and go straight to the marketplace.
  document.querySelector('.auth-shell').style.display='none';
  document.querySelector('#marketShell').style.display='block';
  window.scrollTo(0,0);
 }
 if(id==='forgot'&&check([['fid',V.fid(d('fid'))]])){S.sent=true;render()}
 if(id==='onboard'){const s=ST[S.step];
  const list=s.f.map(x=>x.file?[x.file,S.f[x.file]?'':'Please upload this document']:[x.k,V[x.k](d(x.k))]);
  if(check(list)){if(S.step<5){S.step++}else S.view='done';render()}}
});
render();

})();
