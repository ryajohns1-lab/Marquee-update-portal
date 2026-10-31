(()=>{const cfg=window.UPDATE_CONFIG||{},$=id=>document.getElementById(id),base=cfg.accessApi||'';
$('app-name').textContent=cfg.appName||'Ovrelixa';
const input=$('access-code'),button=$('download'),error=$('error');
button.addEventListener('click',async()=>{
  const code=input.value.trim();
  if(!code){error.textContent='Enter your access code first.';input.focus();return;}
  button.disabled=true;button.textContent='Verifying access…';error.textContent='Checking access and preparing a secure download…';
  try{
    const r=await fetch(base+'/v1/site/ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code}),cache:'no-store'});
    if(!r.ok){if(r.status===429)throw new Error('Too many attempts. Try again in 15 minutes.');if(r.status===403||r.status===400)throw new Error('That access code was not accepted.');throw new Error('Private download service is not ready. Try again later.');}
    const v=await r.json();
    if(typeof v.url!=='string'||!v.url.startsWith(base+'/v1/site/download/'))throw new Error('Invalid download link returned.');
    $('version').textContent=v.versionName||'Latest';$('build-status').textContent='Verified · Ready';
    $('release-date').textContent='Private channel';$('notes').textContent=v.notes||'Security enhancements and reliability improvements.';
    error.textContent='Verified. Your download is starting…';
    window.location.assign(v.url);
  }catch(e){error.textContent=e.message||'Could not start download';$('build-status').textContent='Verification required';}
  finally{button.disabled=false;button.textContent='↓ Download APK';}
});
input.addEventListener('keydown',e=>{if(e.key==='Enter')button.click();});
})();