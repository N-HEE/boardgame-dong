
const Store = (()=>{
  const cfg=()=>window.SITE_CONFIG||{};
  const shared=()=>Boolean(cfg().supabaseUrl && cfg().supabaseAnonKey);
  const headers=()=>({
    'apikey':cfg().supabaseAnonKey,
    'Authorization':'Bearer '+cfg().supabaseAnonKey,
    'Content-Type':'application/json'
  });
  async function sb(path,opts={}){
    const res=await fetch(cfg().supabaseUrl.replace(/\/$/,'')+'/rest/v1/'+path,{...opts,headers:{...headers(),...(opts.headers||{})}});
    if(!res.ok) throw new Error(await res.text());
    const t=await res.text(); return t?JSON.parse(t):null;
  }
  function localGet(k,def=[]){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(def))}catch{return def}}
  function localSet(k,v){localStorage.setItem(k,JSON.stringify(v))}
  async function addScore(user,game,score,meta={}){
    const row={user_id:user.id,user_name:user.name,game,score:Math.round(score),meta,created_at:new Date().toISOString()};
    if(shared()){await sb('scores',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(row)});}
    else{const a=localGet('bgt_scores');a.push(row);localSet('bgt_scores',a)}
    return row;
  }
  async function scores(game=null){
    if(shared()){
      let path='scores?select=*&order=score.desc&limit=200';
      if(game) path='scores?select=*&game=eq.'+encodeURIComponent(game)+'&order=score.desc&limit=100';
      return await sb(path);
    }
    let a=localGet('bgt_scores'); if(game)a=a.filter(x=>x.game===game); return a.sort((a,b)=>b.score-a.score);
  }
  async function addGuest(user,message){
    const row={user_id:user.id,user_name:user.name,message:String(message).slice(0,500),created_at:new Date().toISOString()};
    if(shared()) await sb('guestbook',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(row)});
    else{const a=localGet('bgt_guest');a.push(row);localSet('bgt_guest',a)}
  }
  async function guests(){
    if(shared()) return await sb('guestbook?select=*&order=created_at.desc&limit=100');
    return localGet('bgt_guest').sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  }
  return {shared,addScore,scores,addGuest,guests};
})();
