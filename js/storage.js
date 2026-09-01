
const Store = (()=>{
  const cfg=()=>window.SITE_CONFIG||{};
  const shared=()=>Boolean(cfg().supabaseUrl && cfg().supabaseAnonKey);
  const headers=()=>({
  'apikey':cfg().supabaseAnonKey,
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
  async function trpgCampaign(id){
    if(!shared())return null;
    const a=await sb('trpg_campaigns?id=eq.'+encodeURIComponent(id)+'&select=*');
    return a?.[0]||null;
  }
  async function trpgCreateCampaign(row){
    const a=await sb('trpg_campaigns',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
    return a?.[0]||null;
  }
  async function trpgPatchCampaign(id,version,patch){
    const body={...patch,version:version+1};
    const a=await sb('trpg_campaigns?id=eq.'+encodeURIComponent(id)+'&version=eq.'+encodeURIComponent(version),{
      method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)
    });
    return a?.[0]||null;
  }
  async function trpgPlayer(campaignId,userId){
    const a=await sb('trpg_players?campaign_id=eq.'+encodeURIComponent(campaignId)+'&user_id=eq.'+encodeURIComponent(userId)+'&select=*');
    return a?.[0]||null;
  }
  async function trpgPlayers(campaignId){
    return await sb('trpg_players?campaign_id=eq.'+encodeURIComponent(campaignId)+'&select=*&order=assigned_number.asc')||[];
  }
  async function trpgCreatePlayer(row){
    const a=await sb('trpg_players',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
    return a?.[0]||null;
  }
  async function trpgPatchPlayer(campaignId,userId,patch){
    const a=await sb('trpg_players?campaign_id=eq.'+encodeURIComponent(campaignId)+'&user_id=eq.'+encodeURIComponent(userId),{
      method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)
    });
    return a?.[0]||null;
  }
  async function trpgLogs(campaignId){
    return await sb('trpg_logs?campaign_id=eq.'+encodeURIComponent(campaignId)+'&select=*&order=created_at.desc&limit=300')||[];
  }
  async function trpgAddLog(row){
    const a=await sb('trpg_logs',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
    return a?.[0]||null;
  }
  async function trpgVotes(campaignId){
    return await sb('trpg_votes?campaign_id=eq.'+encodeURIComponent(campaignId)+'&select=*&order=updated_at.asc')||[];
  }
  async function trpgUpsertVote(row){
    const path='trpg_votes?on_conflict=campaign_id,scene_id,vote_id,user_id';
    const a=await sb(path,{
      method:'POST',
      headers:{Prefer:'resolution=merge-duplicates,return=representation'},
      body:JSON.stringify({...row,updated_at:new Date().toISOString()})
    });
    return a?.[0]||null;
  }
  async function trpgMemo(campaignId){
    const a=await sb('trpg_memo?campaign_id=eq.'+encodeURIComponent(campaignId)+'&select=*');
    return a?.[0]||null;
  }
  async function trpgSaveMemo(campaignId,content,userId,userName,version){
    if(!version){
      try{
        const a=await sb('trpg_memo',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({campaign_id:campaignId,content,updated_by:userId,updated_name:userName,version:1,updated_at:new Date().toISOString()})});
        return a?.[0]||null;
      }catch(e){
        const current=await trpgMemo(campaignId);
        if(!current)return null;
        version=current.version;
      }
    }
    const a=await sb('trpg_memo?campaign_id=eq.'+encodeURIComponent(campaignId)+'&version=eq.'+encodeURIComponent(version),{
      method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({content,updated_by:userId,updated_name:userName,updated_at:new Date().toISOString(),version:version+1})
    });
    return a?.[0]||null;
  }
  return {
    shared,addScore,scores,addGuest,guests,
    trpgCampaign,trpgCreateCampaign,trpgPatchCampaign,
    trpgPlayer,trpgPlayers,trpgCreatePlayer,trpgPatchPlayer,
    trpgLogs,trpgAddLog,trpgVotes,trpgUpsertVote,trpgMemo,trpgSaveMemo
  };
})();
