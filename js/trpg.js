window.TRPG = (()=>{
  let ui=null;
  let scenario=null;
  let data={campaign:null,player:null,players:[],logs:[],votes:[],memo:null};
  let busy=false;

  const $=(s,r=document)=>r.querySelector(s);
  const esc=s=>ui&&ui.esc?ui.esc(s):String(s).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function kstDate(){
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(new Date());
    const get=t=>parts.find(x=>x.type===t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`
  }

  function defaultState(){
    return {flags:{},clues:[],escapeProgress:0,ending:null}
  }

  function roll5(number){
    const dice=Array.from({length:5},()=>1+Math.floor(Math.random()*6));
    const hits=dice.filter(n=>n===number||n===6).length;
    return {dice,hits}
  }

  function difficultyLabel(n){
    return n===2?'쉬움':n===4?'어려움':'보통'
  }

  function state(){
    return {...defaultState(),...(data.campaign?.state||{})}
  }

  function currentScene(){
    return scenario.scenes[data.campaign?.current_scene]||null
  }

  function hasPartyItem(item){
    return data.players.some(p=>Array.isArray(p.items)&&p.items.includes(item))
  }

  function playerName(id){
    return window.SITE_CONFIG.users.find(x=>x.id===id)?.name||id
  }

  function formatDate(v){
    try{return new Date(v).toLocaleString('ko-KR')}catch{return ''}
  }

  async function ensureCampaign(){
    let c=await Store.trpgCampaign(scenario.campaignId);
    if(c)return c;
    try{
      c=await Store.trpgCreateCampaign({
        id:scenario.campaignId,
        scenario_id:scenario.id,
        title:scenario.title,
        status:'active',
        current_scene:scenario.startScene,
        state:defaultState(),
        version:1
      });
      return c
    }catch(e){
      c=await Store.trpgCampaign(scenario.campaignId);
      if(c)return c;
      throw e
    }
  }

  async function ensurePlayer(){
    let p=await Store.trpgPlayer(scenario.campaignId,ui.user.id);
    const today=kstDate();
    if(!p){
      try{
        p=await Store.trpgCreatePlayer({
          campaign_id:scenario.campaignId,
          user_id:ui.user.id,
          user_name:ui.user.name,
          assigned_number:scenario.assignedNumbers[ui.user.id],
          hp:scenario.maxHp,
          stamina:scenario.maxStamina,
          stamina_date:today,
          items:[]
        });
      }catch(e){
        p=await Store.trpgPlayer(scenario.campaignId,ui.user.id);
        if(!p)throw e
      }
    }else if(p.stamina_date!==today){
      p=await Store.trpgPatchPlayer(scenario.campaignId,ui.user.id,{
        stamina:scenario.maxStamina,
        stamina_date:today
      });
    }
    return p
  }

  async function reconcileFlashlight(){
    const st=state();
    const owner=st.flags?.flashlightOwner;
    if(!owner)return;
    const p=data.players.find(x=>x.user_id===owner);
    if(!p||p.items?.includes('손전등'))return;
    const items=[...(p.items||[])];
    if(items.length<3){
      items.push('손전등');
      await Store.trpgPatchPlayer(scenario.campaignId,owner,{items});
    }
  }

  async function refresh({quiet=false}={}){
    try{
      const campaign=await ensureCampaign();
      const player=await ensurePlayer();
      const [players,logs,votes,memo]=await Promise.all([
        Store.trpgPlayers(scenario.campaignId),
        Store.trpgLogs(scenario.campaignId),
        Store.trpgVotes(scenario.campaignId),
        Store.trpgMemo(scenario.campaignId)
      ]);
      data={campaign,player,players,logs,votes,memo};
      await reconcileFlashlight();
      if(!quiet){
        const freshPlayers=await Store.trpgPlayers(scenario.campaignId);
        data.players=freshPlayers;
        data.player=freshPlayers.find(x=>x.user_id===ui.user.id)||player;
      }
      draw();
    }catch(e){
      console.error(e);
      drawError('여행 기록을 불러오지 못했습니다. TRPG_SETUP.sql을 Supabase에서 먼저 실행했는지 확인해 주세요.')
    }
  }

  function shell(){
    document.querySelector('#app').innerHTML=`
      <main class="route trpg-route">
        <button class="back-btn" id="back">← 테이블</button>
        ${ui.topbar()}
        <div class="trpg-shell" id="trpgRoot">
          <div class="trpg-loading">여행일지를 펼치는 중…</div>
        </div>
      </main>
    `;
    ui.bindTop();
    $('#back').onclick=()=>ui.navigate('home')
  }

  function drawError(message){
    const root=$('#trpgRoot');
    if(!root)return;
    root.innerHTML=`<section class="trpg-error"><b>불러오기 실패</b><p>${esc(message)}</p><button id="trpgRetry">다시 시도</button></section>`;
    $('#trpgRetry').onclick=()=>refresh()
  }

  function playerCard(p){
    const maxHp=scenario.maxHp;
    const mine=p.user_id===ui.user.id;
    const items=Array.isArray(p.items)?p.items:[];
    const shownStamina=p.stamina_date===kstDate()?p.stamina:scenario.maxStamina;
    return `
      <div class="trpg-player ${mine?'mine':''}">
        <div class="trpg-player-head"><b>${esc(p.user_name)}</b><span>담당 ${p.assigned_number}</span></div>
        <div>체력 ${Math.max(0,p.hp)}/${maxHp} · 기력 ${Math.max(0,shownStamina)}/${scenario.maxStamina}</div>
        <div class="trpg-items">${items.length?items.map(x=>`<span>${esc(x)}</span>`).join(''):'<span class="empty">소지품 없음</span>'}</div>
      </div>
    `
  }

  function actionButton(a){
    const st=state();
    const p=data.player;
    const done=a.onceFlag&&st.flags?.[a.onceFlag];
    const dead=p.hp<=0;
    const noStamina=p.stamina<a.cost;
    const disabled=busy||done||dead||noStamina;
    let meta=`기력 ${a.cost}`;
    if(a.difficulty)meta+=` · ${difficultyLabel(a.difficulty)} (${a.difficulty}개)`;
    if(done)meta='완료됨';
    if(dead)meta='체력 0 · 행동 불가';
    if(!dead&&noStamina)meta='기력 부족';
    return `<button class="trpg-action" data-action="${esc(a.id)}" ${disabled?'disabled':''}><b>${esc(a.label)}</b><span>${meta}</span></button>`
  }

  function voteBlock(scene){
    if(!scene.vote)return '';
    const votes=data.votes.filter(v=>v.scene_id===data.campaign.current_scene&&v.vote_id===scene.vote.id);
    const mine=votes.find(v=>v.user_id===ui.user.id)?.choice_id;
    return `
      <section class="trpg-vote">
        <h3>중요한 결정</h3>
        <p>${esc(scene.vote.prompt)}</p>
        ${scene.vote.choices.map(ch=>{
          const count=votes.filter(v=>v.choice_id===ch.id).length;
          const blocked=ch.requireFlag&&!state().flags?.[ch.requireFlag];
          return `<button data-vote="${esc(ch.id)}" ${busy||blocked?'disabled':''} class="${mine===ch.id?'selected':''}">
            <span>${esc(ch.label)}</span><b>${count}/3</b>${blocked?'<small>아직 선택할 수 없음</small>':''}
          </button>`
        }).join('')}
        <div class="trpg-voters">${votes.length?votes.map(v=>`${esc(playerName(v.user_id))}: ${esc(scene.vote.choices.find(c=>c.id===v.choice_id)?.label||v.choice_id)}`).join(' · '):'아직 투표가 없습니다.'}</div>
      </section>
    `
  }

  function memoBlock(){
    return `
      <details class="trpg-memo trpg-fold" open>
        <summary>메모</summary>
        <div class="trpg-fold-body">
          <textarea id="trpgMemo" maxlength="4000" placeholder="다섯 명이 같이 쓰는 메모지">${esc(data.memo?.content||'')}</textarea>
          <button id="saveMemo">메모 저장</button>
          <small>${data.memo?.updated_at?`마지막 저장 ${formatDate(data.memo.updated_at)}`:'아직 저장된 메모가 없습니다.'}</small>
        </div>
      </details>
    `
  }

  function cluesBlock(){
    return `
      <details class="trpg-clues trpg-fold" open>
        <summary>발견한 단서</summary>
        <div class="trpg-fold-body">${cluesHtml()}</div>
      </details>
    `
  }

  function partyBlock(){
    return `
      <details class="trpg-status-card trpg-fold" open>
        <summary>보겜동</summary>
        <div class="trpg-fold-body">
          <div class="trpg-number-rule">모든 판정은 주사위를 5개 굴렸을 때 자신이 담당한 눈의 개수가 목표 이상으로 떠야 함. 6은 모든 눈으로 취급한다.</div>
          ${data.players.sort((a,b)=>a.assigned_number-b.assigned_number).map(playerCard).join('')}
        </div>
      </details>
    `
  }

  function bookBlock(){
    const st=state();
    const ending=st.ending;
    return `
      <div class="trpg-book-end">
        <div class="trpg-book-cover">📕</div>
        <h1>${esc(scenario.bookTitle)}</h1>
        <h2>END · ${esc(ending?.title||'여행 종료')}</h2>
        <p>${esc(ending?.text||'여행이 끝났습니다.')}</p>
        <div class="trpg-book-stats">발견한 단서 ${st.clues?.length||0}개 · 기록 ${data.logs.length}개</div>
        <button id="showArchive">사건일지 펼쳐보기</button>
        <div id="archiveBox" class="hidden">${logsHtml(data.logs)}</div>
      </div>
    `
  }

  function logsHtml(logs){
    if(!logs.length)return '<p>아직 기록이 없습니다.</p>';
    const ordered=[...logs].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    return ordered.map(l=>`
      <div class="trpg-log">
        <div><b>${esc(l.user_name||'여행일지')}</b><span>${formatDate(l.created_at)}</span></div>
        <p>${esc(l.message)}</p>
        ${Array.isArray(l.detail?.dice)?`<div class="trpg-log-dice">🎲 ${l.detail.dice.join(' · ')} · ${l.detail.hits}개</div>`:''}
      </div>
    `).join('')
  }

  function draw(){
    const root=$('#trpgRoot');
    if(!root||!data.campaign)return;
    const st=state();

    if(data.campaign.status==='ended'&&st.ending){
      root.innerHTML=`
        <div class="trpg-layout ended">
          <section class="trpg-main">${bookBlock()}</section>
          <aside class="trpg-side">${partyBlock()}${memoBlock()}${cluesBlock()}</aside>
        </div>
      `;
      bindCommon();
      $('#showArchive').onclick=()=>$('#archiveBox').classList.toggle('hidden');
      return
    }

    const scene=currentScene();
    if(!scene){drawError('현재 장면 데이터를 찾을 수 없습니다.');return}
    const escape=scene.escapeTarget?`<div class="trpg-progress">탈출 진척 ${Math.min(st.escapeProgress||0,scene.escapeTarget)}/${scene.escapeTarget}</div>`:'';

    root.innerHTML=`
      <header class="trpg-header">
        <div><small>보겜동 여행일지</small><h1>${esc(scenario.title)}</h1></div>
        <button id="trpgRefresh">새로고침</button>
      </header>
      <div class="trpg-layout">
        <section class="trpg-main">
          <article class="trpg-scene">
            <div class="trpg-scene-label">현재 장면</div>
            <h2>${esc(scene.title)}</h2>
            <p>${esc(scene.text)}</p>
            ${escape}
          </article>

          <section class="trpg-actions">
            <h3>행동</h3>
            <div class="trpg-action-list">${scene.actions.map(actionButton).join('')}</div>
          </section>

          ${voteBlock(scene)}

          <section class="trpg-journal">
            <h3>최근 사건일지</h3>
            ${logsHtml(data.logs.slice(0,12))}
          </section>
        </section>

        <aside class="trpg-side">
          ${partyBlock()}
          ${memoBlock()}
          ${cluesBlock()}
        </aside>
      </div>
    `;

    bindCommon();
    $('#trpgRefresh').onclick=()=>refresh();
    document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>performAction(b.dataset.action));
    document.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>castVote(b.dataset.vote))
  }

  function cluesHtml(){
    const clues=state().clues||[];
    return clues.length?`<ul>${clues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="muted">아직 확실한 단서가 없습니다.</p>'
  }

  function bindCommon(){
    const save=$('#saveMemo');
    if(save)save.onclick=saveMemo
  }

  async function saveMemo(){
    if(busy)return;
    busy=true;
    const text=$('#trpgMemo').value.slice(0,4000);
    try{
      const m=await Store.trpgSaveMemo(scenario.campaignId,text,ui.user.id,ui.user.name,data.memo?.version||0);
      if(!m){
        ui.toast('다른 사람이 먼저 메모를 수정했습니다. 새 내용을 불러옵니다.');
        await refresh();
      }else{
        data.memo=m;
        ui.toast('메모 저장 완료');
        draw()
      }
    }catch(e){
      console.error(e);ui.toast('메모 저장에 실패했습니다.')
    }finally{busy=false}
  }

  async function spendPlayer({cost,damage=0,item=null}){
    const p=data.player;
    const items=[...(p.items||[])];
    if(item&&!items.includes(item)){
      if(items.length>=3)throw new Error('ITEM_FULL');
      items.push(item)
    }
    const patch={
      stamina:Math.max(0,p.stamina-cost),
      hp:Math.max(0,p.hp-damage),
      items
    };
    const updated=await Store.trpgPatchPlayer(scenario.campaignId,ui.user.id,patch);
    data.player=updated;
    const idx=data.players.findIndex(x=>x.user_id===ui.user.id);
    if(idx>=0)data.players[idx]=updated
  }

  function mergedSuccessState(st,a){
    const next={...st,flags:{...(st.flags||{})},clues:[...(st.clues||[])]};
    const effect=a.success||{};
    if(effect.flag)next.flags[effect.flag]=true;
    if(effect.item){
      next.flags.flashlightOwner=ui.user.id;
    }
    for(const clue of effect.clues||[]){
      if(!next.clues.includes(clue))next.clues.push(clue)
    }
    return next
  }

  async function patchCampaign(patch){
    const updated=await Store.trpgPatchCampaign(data.campaign.id,data.campaign.version,patch);
    if(!updated){
      ui.toast('다른 사람이 먼저 진행했습니다. 최신 상태를 불러왔습니다.');
      await refresh();
      return null
    }
    data.campaign=updated;
    return updated
  }

  async function addLog(message,kind='action',detail={}){
    try{
      const row=await Store.trpgAddLog({
        campaign_id:scenario.campaignId,
        user_id:ui.user.id,
        user_name:ui.user.name,
        kind,
        message,
        detail
      });
      if(row)data.logs.unshift(row)
    }catch(e){console.error('log failed',e)}
  }

  async function performAction(id){
    if(busy||data.campaign.status==='ended')return;
    const scene=currentScene();
    const a=scene?.actions.find(x=>x.id===id);
    if(!a)return;
    const st=state();
    if(a.onceFlag&&st.flags?.[a.onceFlag])return;
    if(data.player.hp<=0){ui.toast('체력이 0이라 행동할 수 없습니다.');return}
    if(data.player.stamina<a.cost){ui.toast('오늘 사용할 기력이 부족합니다.');return}
    busy=true;draw();

    try{
      if(a.type==='move'){
        const updated=await patchCampaign({current_scene:a.next});
        if(!updated)return;
        await spendPlayer({cost:a.cost});
        await addLog(a.logText||`${scene.title}에서 다음 장소로 이동했다.`,'move');
      }

      if(a.type==='roll'){
        const r=roll5(data.player.assigned_number);
        const ok=r.hits>=a.difficulty;
        if(ok){
          let next=mergedSuccessState(st,a);
          const patch={state:next};
          if(a.nextRegardless)patch.current_scene=a.nextRegardless;
          const updated=await patchCampaign(patch);
          if(!updated)return;
          await spendPlayer({cost:a.cost,item:a.success?.item||null});
          await addLog(a.successText,'roll',{dice:r.dice,hits:r.hits,difficulty:a.difficulty,success:true});
        }else{
          await spendPlayer({cost:a.cost});
          if(a.nextRegardless){
            const updated=await patchCampaign({current_scene:a.nextRegardless});
            if(!updated)return;
          }
          await addLog(a.failureText,'roll',{dice:r.dice,hits:r.hits,difficulty:a.difficulty,success:false});
        }
        ui.toast(`🎲 ${r.dice.join(' · ')} — ${r.hits}개, ${ok?'성공!':'실패'}`)
      }

      if(a.type==='escapeRoll'){
        const r=roll5(data.player.assigned_number);
        const ok=r.hits>=a.difficulty;
        if(ok){
          const next={...st,escapeProgress:(st.escapeProgress||0)+1};
          const patch={state:next};
          if(next.escapeProgress>=scene.escapeTarget)patch.current_scene='finale';
          const updated=await patchCampaign(patch);
          if(!updated)return;
          await spendPlayer({cost:a.cost});
          await addLog(a.successText,'roll',{dice:r.dice,hits:r.hits,difficulty:a.difficulty,success:true});
        }else{
          await spendPlayer({cost:a.cost,damage:a.failureDamage||0});
          await addLog(`${a.failureText} 체력 -${a.failureDamage||0}.`,'roll',{dice:r.dice,hits:r.hits,difficulty:a.difficulty,success:false});
        }
        ui.toast(`🎲 ${r.dice.join(' · ')} — ${r.hits}개, ${ok?'성공!':'실패'}`)
      }

      if(a.type==='endingRoll'){
        const r=roll5(data.player.assigned_number);
        const ok=r.hits>=a.difficulty;
        const ending=ok?a.successEnding:a.failureEnding;
        const next={...st,flags:{...(st.flags||{}),finalResolved:true},ending};
        const updated=await patchCampaign({state:next,status:'ended',ended_at:new Date().toISOString()});
        if(!updated)return;
        await spendPlayer({cost:a.cost});
        await addLog(`END 「${ending.title}」 — ${ending.text}`,'ending',{dice:r.dice,hits:r.hits,difficulty:a.difficulty,success:ok});
        ui.toast(`마지막 판정 ${ok?'성공':'실패'} — ${ending.title}`)
      }

      await refresh({quiet:true});
    }catch(e){
      console.error(e);
      if(e.message==='ITEM_FULL')ui.toast('소지품이 가득 찼습니다.');
      else ui.toast('행동 처리 중 오류가 발생했습니다. 다시 불러와 주세요.');
    }finally{busy=false;draw()}
  }

  async function castVote(choiceId){
    if(busy)return;
    const scene=currentScene();
    const vote=scene?.vote;
    const choice=vote?.choices.find(x=>x.id===choiceId);
    if(!vote||!choice)return;
    if(choice.requireFlag&&!state().flags?.[choice.requireFlag])return;
    busy=true;draw();
    try{
      await Store.trpgUpsertVote({
        campaign_id:scenario.campaignId,
        scene_id:data.campaign.current_scene,
        vote_id:vote.id,
        user_id:ui.user.id,
        user_name:ui.user.name,
        choice_id:choice.id
      });
      const votes=await Store.trpgVotes(scenario.campaignId);
      data.votes=votes;
      const relevant=votes.filter(v=>v.scene_id===data.campaign.current_scene&&v.vote_id===vote.id&&v.choice_id===choice.id);
      await addLog(`${choice.label}에 투표했다.`,'vote');
      if(relevant.length>=3){
        await resolveVote(choice)
      }else{
        ui.toast(`${choice.label} — ${relevant.length}/3표`)
      }
      await refresh({quiet:true})
    }catch(e){console.error(e);ui.toast('투표 처리 중 오류가 발생했습니다.')}finally{busy=false;draw()}
  }

  async function resolveVote(choice){
    const st=state();
    if(choice.resolve==='enterHouse'){
      const u=await patchCampaign({current_scene:'ground'});
      if(u)await addLog('3표가 모여 폐가 안으로 들어가기로 했다.','decision')
    }
    if(choice.resolve==='earlyLeave'){
      await finishEnding(scenario.endings.earlyLeave,'3표가 모여 폐가에 들어가지 않고 돌아가기로 했다.')
    }
    if(choice.resolve==='goBasement'){
      if(hasPartyItem('손전등')){
        const u=await patchCampaign({current_scene:'basement'});
        if(u)await addLog('3표가 모여 손전등을 들고 숨겨진 지하실로 내려갔다.','decision')
      }else{
        await finishEnding(scenario.endings.darkness,'손전등 없이 지하로 내려갔다.')
      }
    }
    if(choice.resolve==='jaeyoonPush'){
      if(hasPartyItem('손전등')){
        const u=await patchCampaign({current_scene:'basement'});
        if(u)await addLog('밖으로 나가려는 순간 김재윤이 일행을 지하실 쪽으로 밀어 넣었다. 다행히 손전등은 가지고 있었다.','decision')
      }else{
        await finishEnding(scenario.endings.darkness,'밖으로 나가려는 순간 김재윤에게 떠밀려 손전등도 없이 지하로 떨어졌다.')
      }
    }
  }

  async function finishEnding(ending,logText){
    const st=state();
    const next={...st,ending};
    const u=await patchCampaign({state:next,status:'ended',ended_at:new Date().toISOString()});
    if(u)await addLog(`END 「${ending.title}」 — ${logText}`,'ending')
  }

  async function open(opts){
    ui=opts;
    scenario=window.TRPG_SCENARIOS?.['haunted-house'];
    if(!scenario){
      document.querySelector('#app').innerHTML='<p>TRPG 시나리오 데이터를 찾을 수 없습니다.</p>';
      return
    }
    shell();
    if(!Store.shared()){
      drawError('이 콘텐츠는 다섯 명의 진행상태를 공유해야 해서 Supabase 연결이 필요합니다.');
      return
    }
    await refresh()
  }

  return {open,roll5,kstDate};
})();

