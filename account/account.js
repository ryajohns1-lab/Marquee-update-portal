'use strict';
// Account tokens live only in the URL fragment, never in an HTTP request URL.
// Clear the fragment before any API call so screenshots/referrers/history omit it.
(() => {
  const api='https://ovrelixa-cloud-api.ryajohns1.workers.dev';
  const params=new URLSearchParams(location.hash.startsWith('#')?location.hash.slice(1):'');
  const verifyToken=params.get('verify'),resetToken=params.get('reset');
  history.replaceState(null,document.title,location.pathname);
  const $=id=>document.getElementById(id);
  const title=$('page-title'),status=$('status'),forgot=$('forgot-form'),reset=$('reset-form');
  async function post(path,body){
    const response=await fetch(api+path,{method:'POST',mode:'cors',credentials:'omit',
      headers:{'content-type':'application/json'},referrerPolicy:'no-referrer',
      body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error==='rate_limited'?'Too many requests. Please try again later.':
      data.error==='invalid_or_expired_link'?'This link is expired or already used. Request another link.':
      data.error==='weak_password'?'Use a password of at least 12 characters.':
      'We could not complete the request. Please try again.');
    return data;
  }
  const show=(message)=>{status.textContent=message;};
  if(verifyToken){
    title.textContent='Confirm your email';
    if(!/^[a-f0-9]{64}$/.test(verifyToken)){show('This confirmation link is invalid.');return;}
    post('/v1/account/verify',{token:verifyToken})
      .then(()=>show('Your email is confirmed! Open Ovrelixa to sign in.'))
      .catch(e=>show(e.message));
    return;
  }
  if(resetToken){
    title.textContent='Choose a new password';
    if(!/^[a-f0-9]{64}$/.test(resetToken)){show('This reset link is invalid.');return;}
    show('Your new password must have at least 12 characters.');
    reset.hidden=false;
    reset.addEventListener('submit',async e=>{
      e.preventDefault();
      const first=$('new-password').value,second=$('confirm-password').value;
      if(first!==second){show('Passwords do not match.');return;}
      const button=$('reset-button');button.disabled=true;
      try{
        await post('/v1/account/reset',{token:resetToken,password:first});
        reset.hidden=true;$('new-password').value='';$('confirm-password').value='';
        show('Password changed. Previous sessions have been signed out. Open Ovrelixa to sign in again.');
      }catch(error){show(error.message);}finally{button.disabled=false;}
    });
    return;
  }
  title.textContent='Recover your account';
  show('Enter your verified email address to request a secure password-reset link.');
  forgot.hidden=false;
  forgot.addEventListener('submit',async e=>{
    e.preventDefault();
    const button=$('forgot-button');button.disabled=true;
    try{
      await post('/v1/account/request-reset',{email:$('email').value.trim()});
      forgot.hidden=true;show('If a verified account exists for that address, a password-reset email will arrive shortly.');
    }catch(error){show(error.message);}finally{button.disabled=false;}
  });
})();
