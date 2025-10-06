(function(){
  // ---------- DOM helpers ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // ---------- State ----------
  const state = {
    // Step 2
    mode: 'sober',
    ageVerified: false,

    // Game
    players: [],
    drawPile: [],
    discardPile: [],
    currentCard: null,
    round: 1,
    crowd: 0,
    skipArmedBy: null,
    pendingBellCard: null,
    timers: { roundLeft: 0, tickId: null, nextBellAt: 0 },
    settings: { winPoints: 10, roundSeconds: 90, bellIntervalSeconds: 180, crowdMax: 10, crowdReset: 3 },

    // Options / Theme
    options: { keyboardShortcuts: true, theme: 'system' }, // 'system'|'light'|'dark'

    // Deck prefs
    deckPrefs: { enabledCategories: {}, customCards: [] },
  };

  // ---------- Elements ----------
  const els = {
    year: $('#year'),
    modeNote: $('#modeNote'),
    modeButtons: $$('.seg-btn'),
    startBtn: $('#startBtn'),
    nextBtn: $('#nextBtn'),
    card: $('#card'),
    ageGate: $('#ageGate'),

    timer: $('#timer'),
    roundLabel: $('#roundLabel'),
    crowdBar: $('#crowdBar'),
    crowdVal: $('#crowdVal'),
    crowdPlus: $('#crowdPlus'),
    crowdMinus: $('#crowdMinus'),
    playersWrap: $('#players'),
    addPlayerBtn: $('#addPlayerBtn'),
    newPlayerName: $('#newPlayerName'),
    resetScoresBtn: $('#resetScoresBtn'),
    skipSelect: $('#skipSelect'),
    useSkipBtn: $('#useSkipBtn'),
    skipArmedNote: $('#skipArmedNote'),

    setupDlg: $('#setupDlg'),
    playersInput: $('#playersInput'),
    winPointsInput: $('#winPointsInput'),
    roundSecondsInput: $('#roundSecondsInput'),

    // How-to / Options / Theme / Onboarding / Deck
    howToLink: $('#howToLink'),
    optionsLink: $('#optionsLink'),
    howToDlg: $('#howToDlg'),
    optionsDlg: $('#optionsDlg'),
    optKeyboard: $('#optKeyboard'),
    optBell: $('#optBell'),
    optCrowdMax: $('#optCrowdMax'),
    optCrowdReset: $('#optCrowdReset'),
    themeToggle: $('#themeToggle'),
    onboardDlg: $('#onboardDlg'),

    deckLink: $('#deckLink'),
    deckDlg: $('#deckDlg'),
    catList: $('#catList'),
    deckStatsLabel: $('#deckStatsLabel'),
    addCustomBtn: $('#addCustomBtn'),
    addCustomNote: $('#addCustomNote'),
    cardCat: $('#cardCat'),
    cardTitle: $('#cardTitle'),
    cardText: $('#cardText'),
    cardSober: $('#cardSober'),
    cardParty: $('#cardParty'),
    cardCrowdDelta: $('#cardCrowdDelta'),
    cardToken: $('#cardToken'),
    exportCustomBtn: $('#exportCustomBtn'),
    exportMergedBtn: $('#exportMergedBtn'),
    showImportBtn: $('#showImportBtn'),
    importWrap: $('#importWrap'),
    importText: $('#importText'),
    applyImportBtn: $('#applyImportBtn'),
    cancelImportBtn: $('#cancelImportBtn'),
    resetDeckBtn: $('#resetDeckBtn'),

    // NEW (Step 8)
    installBtn: $('#installBtn'),
  };

  // ---------- Utils ----------
  const rand = (n) => Math.floor(Math.random()*n);
  const shuffle = (arr) => { const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const fmtTime = (s) => { if (s < 0) s = 0; const m = Math.floor(s/60).toString().padStart(1,'0'); const sec = (s%60).toString().padStart(2,'0'); return `${m}:${sec}`; };
  const clampInt = (s,min,max,fallback)=>{ const n=parseInt(s,10); return Number.isFinite(n)?Math.min(max,Math.max(min,n)):(fallback??min); };
  const escapeHtml = (s)=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  const isEditableTarget = (ev)=>{ const t=ev.target; return t && (t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable); };
  function download(filename, text){
    const blob = new Blob([text], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  // ---------- Persistence ----------
  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem('sdsuGameState') || '{}');
      if(saved.mode) state.mode = saved.mode;
      if(saved.ageVerified) state.ageVerified = !!saved.ageVerified;

      const game = JSON.parse(localStorage.getItem('sdsuGameV2') || '{}');
      if(game && game.players){ Object.assign(state, game); }
      if(game && game.options){ state.options = Object.assign(state.options, game.options); }
      if(game && game.deckPrefs){ state.deckPrefs = Object.assign(state.deckPrefs, game.deckPrefs); }
    }catch{/* ignore */}
  }
  function saveState(){
    const snapshot = {
      players: state.players,
      drawPile: state.drawPile,
      discardPile: state.discardPile,
      currentCard: state.currentCard,
      round: state.round,
      crowd: state.crowd,
      skipArmedBy: state.skipArmedBy,
      pendingBellCard: state.pendingBellCard,
      timers: { roundLeft: state.timers.roundLeft, nextBellAt: state.timers.nextBellAt },
      settings: state.settings,
      mode: state.mode,
      ageVerified: state.ageVerified,
      options: state.options,
      deckPrefs: state.deckPrefs,
    };
    localStorage.setItem('sdsuGameV2', JSON.stringify(snapshot));
    localStorage.setItem('sdsuGameState', JSON.stringify({mode: state.mode, ageVerified: state.ageVerified}));
  }

  // ---------- Theme ----------
  function applyTheme(){
    const root = document.documentElement;
    if(state.options.theme === 'light'){ root.setAttribute('data-theme','light'); els.themeToggle&&(els.themeToggle.textContent='Theme: Light'); }
    else if(state.options.theme === 'dark'){ root.setAttribute('data-theme','dark'); els.themeToggle&&(els.themeToggle.textContent='Theme: Dark'); }
    else { root.removeAttribute('data-theme'); els.themeToggle&&(els.themeToggle.textContent='Theme: System'); }
  }
  function cycleTheme(){ const order=['system','light','dark']; const idx=order.indexOf(state.options.theme); state.options.theme=order[(idx+1)%order.length]; applyTheme(); saveState(); }

  // ---------- Deck merging & filtering ----------
  function mergedCards(){
    const base = (window.DECK?.cards || []).slice();
    const custom = (state.deckPrefs.customCards || []).slice();
    const withIds = custom.map((c, i)=>({
      id: c.id || `CUST-${Date.now()}-${i}`,
      category: c.category || 'Custom',
      type: c.type || 'custom',
      title: c.title || 'Untitled',
      text: c.text || '',
      actions: c.actions || {sober:'', party:''},
      crowdDelta: Number.isFinite(c.crowdDelta) ? c.crowdDelta : 0,
      token: c.token || undefined,
      triggersOnCrowdFull: !!c.triggersOnCrowdFull,
      tags: Array.isArray(c.tags) ? c.tags : [],
    }));
    return base.concat(withIds);
  }
  function categoriesWithCounts(cards){
    const map = new Map(); for(const c of cards){ const key=c.category||'Uncategorized'; map.set(key,(map.get(key)||0)+1); } return map;
  }
  function isCategoryEnabled(cat){
    const flags = state.deckPrefs.enabledCategories || {};
    if(Object.keys(flags).length === 0) return true;
    return !!flags[cat];
  }
  function buildPiles(){
    const cards = mergedCards();
    const stormCard = cards.find(c=>c.triggersOnCrowdFull) || (window.DECK.cards||[]).find(c=>c.triggersOnCrowdFull) || null;
    const drawables = cards.filter(c => !c.triggersOnCrowdFull && isCategoryEnabled(c.category || ''));
    state.drawPile = shuffle(drawables);
    state.discardPile = [];
    state.currentCard = null;
    state._stormCard = stormCard;
  }

  // ---------- Mode handling ----------
  function reflectMode(){
    document.documentElement.setAttribute('data-mode', state.mode);
    els.modeButtons.forEach(b=>{
      const active = b.dataset.mode === state.mode;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    els.modeNote.textContent =
      state.mode === 'sober'
        ? 'Sober Mode swaps alcohol actions for points, water sips, or mini-challenges. Please play responsibly.'
        : 'Party Mode is for 21+ players only. Hydrate, know your limits, and never drink and drive.';
    saveState();
  }
  function requestPartyMode(){ if(state.ageVerified){ setMode('party'); return; } els.ageGate?.showModal?.(); }
  function setMode(mode){ state.mode = mode; reflectMode(); }

  // ---------- Setup / Reset ----------
  function openSetup(){
    const cfg = window.DECK?.config || {};
    els.winPointsInput.value = state.settings.winPoints || cfg.winPoints || 10;
    els.roundSecondsInput.value = state.settings.roundSeconds || cfg.roundSeconds || 90;
    els.setupDlg?.showModal?.();
  }
  function beginGame(){
    const names = (els.playersInput.value || '').split(',').map(s=>s.trim()).filter(Boolean);
    const seen = new Set();
    state.players = names.length ? names.map((n,i)=>({id:`${Date.now()}_${i}`, name: seen.has(n)?`${n} ${i+1}`:(seen.add(n),n), points:0, tokens:{skip:false, boost:false}}))
                                 : [{id:'p1', name:'You', points:0, tokens:{skip:false, boost:false}}];

    state.settings.winPoints = clampInt(els.winPointsInput.value, 5, 50, window.DECK.config.winPoints);
    state.settings.roundSeconds = clampInt(els.roundSecondsInput.value, 30, 600, window.DECK.config.roundSeconds);

    state.crowd = 0; state.round = 1; state.skipArmedBy = null; state.pendingBellCard = null;

    buildPiles();
    startRound();
    renderAll();
    drawNext();
    saveState();
  }
  function startRound(){
    state.timers.roundLeft = state.settings.roundSeconds;
    scheduleNextBell();
    if(state.timers.tickId) clearInterval(state.timers.tickId);
    state.timers.tickId = setInterval(tick, 1000);
    els.nextBtn.disabled = false;
  }
  function endRound(){
    if(state.timers.tickId){ clearInterval(state.timers.tickId); state.timers.tickId = null; }
    els.nextBtn.disabled = true;
    renderCardMessage('⏰ Round over','Tap “New Game / Round” to start another round. You can keep scores, or reset them below.');
  }

  // ---------- Draw & interrupts ----------
  function drawNext(){
    if(state.pendingBellCard){
      const bell = state.pendingBellCard; state.pendingBellCard = null;
      renderCard(bell, true); applyCrowd(bell.crowdDelta || 0); saveState(); return;
    }
    if(state.skipArmedBy){
      if(state.drawPile.length){ state.discardPile.push(state.drawPile.shift()); }
      const p = state.players.find(p=>p.id===state.skipArmedBy); if(p) p.tokens.skip=false;
      state.skipArmedBy = null; renderSkipNote();
    }
    if(!state.drawPile.length){ state.drawPile = shuffle(state.discardPile); state.discardPile=[]; }
    const card = state.drawPile.shift();
    state.currentCard = card; state.discardPile.push(card);
    renderCard(card, false);
    applyCrowd(card.crowdDelta || 0);
    saveState();
  }
  function scheduleNextBell(){ state.timers.nextBellAt = Date.now() + (state.settings.bellIntervalSeconds * 1000); }
  function fireBellInterrupt(){
    const bellCards = mergedCards().filter(c=>c.category === 'Hepner Bell');
    if(!bellCards.length) return; state.pendingBellCard = bellCards[rand(bellCards.length)];
    scheduleNextBell();
  }
  function applyCrowd(delta){
    if(!delta){ renderCrowd(); return; }
    state.crowd = Math.max(0, Math.min(state.settings.crowdMax, state.crowd + delta));
    renderCrowd();
    if(state.crowd >= state.settings.crowdMax){
      const storm = state._stormCard || mergedCards().find(c=>c.triggersOnCrowdFull) || null;
      if(storm){ renderCard(storm, true); state.crowd = Math.min(state.settings.crowdReset, state.settings.crowdMax); renderCrowd(); }
    }
  }

  // ---------- Scoring / Tokens ----------
  function addPoints(playerId, delta){
    const p = state.players.find(p=>p.id===playerId); if(!p) return;
    let actual = delta; if(delta>0 && p.tokens.boost){ actual+=2; p.tokens.boost=false; }
    p.points = Math.max(0, p.points + actual); renderPlayers();
    if(p.points >= state.settings.winPoints){
      renderCardMessage('🏆 We have a winner!', `${escapeHtml(p.name)} reached ${state.settings.winPoints} points. Start a new round or reset scores to play again.`);
      els.nextBtn.disabled = true;
    }
    saveState();
  }
  function armSkip(playerId){ const p=state.players.find(p=>p.id===playerId); if(!p||!p.tokens.skip) return; state.skipArmedBy=p.id; renderSkipNote(); saveState(); }
  function renderSkipNote(){ if(!state.skipArmedBy){ els.skipArmedNote.textContent=''; return; } const p=state.players.find(x=>x.id===state.skipArmedBy); els.skipArmedNote.textContent = p ? `(Next card will be skipped by ${p.name})` : ''; }
  function grantToken(playerId, token){ const p=state.players.find(p=>p.id===playerId); if(!p) return; if(token==='skip') p.tokens.skip=true; if(token==='boost') p.tokens.boost=true; renderPlayers(); saveState(); }

  // ---------- Rendering ----------
  function renderAll(){ reflectMode(); renderPlayers(); renderCrowd(); renderTimer(); renderSkipOptions(); applyTheme(); }
  function renderCard(card, isInterrupt){
    const modeText = card.actions?.[state.mode] || '';
    const badge = isInterrupt ? `<span class="badge">Interrupt</span>` : '';
    const tokenUi = card.token ? renderTokenUi(card.token) : '';
    els.card.innerHTML = `
      <div class="card-title">${badge} ${escapeHtml(card.category||'')} • ${escapeHtml(card.title||'')}</div>
      <p class="card-body">${escapeHtml(card.text||'')}</p>
      <p class="tiny"><strong>Action (${state.mode === 'party' ? '21+ Party' : 'Sober'}):</strong> ${escapeHtml(modeText)}</p>
      ${card.crowdDelta ? `<p class="tiny muted">Crowd ${card.crowdDelta>0?'+':''}${card.crowdDelta} auto-applied.</p>` : ''}
      ${tokenUi}
    `;
    const grantBtn = $('#grantTokenBtn', els.card);
    if(grantBtn){
      grantBtn.addEventListener('click', ()=>{
        const sel = $('#grantTokenSelect', els.card);
        const pid = sel?.value; if(pid) grantToken(pid, grantBtn.dataset.token);
      });
    }
  }
  function renderTokenUi(token){
    if(!state.players.length) return '';
    const opts = state.players.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    const label = token === 'skip' ? 'Skip' : token === 'boost' ? 'Boost' : token;
    return `
      <div class="tiny" style="margin-top:8px;">
        <span class="badge">Trolley Token: ${escapeHtml(label)}</span>
        <div class="row" style="margin-top:4px;">
          <select id="grantTokenSelect" class="input">${opts}</select>
          <button id="grantTokenBtn" class="btn" data-token="${escapeHtml(token)}">Grant</button>
        </div>
      </div>
    `;
  }
  function renderCardMessage(title, body){ els.card.innerHTML = `<div class="card-title">${escapeHtml(title)}</div><p class="card-body">${escapeHtml(body)}</p>`; }
  function renderPlayers(){
    if(!els.playersWrap) return;
    els.playersWrap.innerHTML = state.players.map(p=>{
      const badges = [ p.tokens.skip ? `<span class="badge">Skip</span>`:'' , p.tokens.boost ? `<span class="badge">Boost</span>`:'' ].join('');
      return `
        <div class="player" data-id="${p.id}">
          <div class="name" contenteditable="true" spellcheck="false" title="Click to edit name">${escapeHtml(p.name)}</div>
          <div class="badges">${badges}</div>
          <div class="pts">Pts: <strong>${p.points}</strong></div>
          <div class="actions">
            <button class="btn tinybtn" data-delta="1">+1</button>
            <button class="btn tinybtn" data-delta="-1">-1</button>
          </div>
        </div>
      `;
    }).join('');
    $$('.player .name', els.playersWrap).forEach(el=>{
      el.addEventListener('blur', ()=>{ const id=el.closest('.player')?.dataset.id; const p=state.players.find(p=>p.id===id); if(!p) return; p.name = el.textContent.trim() || p.name; saveState(); renderSkipOptions(); });
    });
    $$('.player .actions .btn', els.playersWrap).forEach(btn=>{
      btn.addEventListener('click', ()=>{ const delta=parseInt(btn.dataset.delta,10); const id=btn.closest('.player')?.dataset.id; addPoints(id, delta); renderSkipOptions(); });
    });
    renderSkipOptions();
  }
  function renderSkipOptions(){
    if(!els.skipSelect) return;
    const options = state.players.filter(p=>p.tokens.skip).map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    els.skipSelect.innerHTML = options || `<option value="">(no Skip tokens)</option>`;
  }
  function renderCrowd(){ els.crowdBar.max = state.settings.crowdMax; els.crowdBar.value = state.crowd; els.crowdVal.textContent = `${state.crowd}/${state.settings.crowdMax}`; }
  function renderTimer(){ els.timer.textContent = fmtTime(state.timers.roundLeft); els.roundLabel.textContent = String(state.round); }

  // ---------- Tick ----------
  function tick(){
    state.timers.roundLeft -= 1; renderTimer();
    if(state.timers.roundLeft <= 0){ endRound(); saveState(); return; }
    if(Date.now() >= state.timers.nextBellAt && !state.pendingBellCard){
      fireBellInterrupt();
      if(state.pendingBellCard){ const bell=state.pendingBellCard; state.pendingBellCard=null; renderCard(bell, true); applyCrowd(bell.crowdDelta||0); }
    }
  }

  // ---------- Deck Manager UI ----------
  function openDeckManager(){
    const cards = mergedCards();
    const counts = categoriesWithCounts(cards);
    const total = cards.filter(c=>!c.triggersOnCrowdFull).length;
    const flags = state.deckPrefs.enabledCategories || {};

    const rows = [];
    for(const [cat,count] of counts.entries()){
      const enabled = Object.keys(flags).length === 0 ? true : !!flags[cat];
      rows.push(`
        <div class="cat">
          <label><input type="checkbox" data-cat="${escapeHtml(cat)}" ${enabled?'checked':''}/> ${escapeHtml(cat)}</label>
          <span class="count">${count}</span>
        </div>
      `);
    }
    els.catList.innerHTML = rows.join('') || '<p class="tiny muted">No categories found.</p>';
    els.deckStatsLabel.textContent = `(${total} drawable cards)`;

    $$('#catList input[type="checkbox"]').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        const cat = cb.dataset.cat;
        const map = state.deckPrefs.enabledCategories || (state.deckPrefs.enabledCategories = {});
        map[cat] = cb.checked;
        saveState();
      });
    });

    els.deckDlg?.showModal?.();
  }
  function addCustomCard(){
    const category = (els.cardCat.value||'Custom').trim();
    const title = (els.cardTitle.value||'Untitled').trim();
    const text = (els.cardText.value||'').trim();
    const sober = (els.cardSober.value||'').trim();
    const party = (els.cardParty.value||'').trim();
    const crowd = clampInt(els.cardCrowdDelta.value, -5, 5, 0);
    const token = (els.cardToken.value||'').trim() || undefined;
    const id = `CUST-${Date.now()}-${Math.floor(Math.random()*9999)}`;
    if(!title || !text){ els.addCustomNote.textContent = 'Please fill Title and Prompt.'; return; }
    state.deckPrefs.customCards.push({ id, category, type:'custom', title, text, actions:{sober, party}, crowdDelta:crowd, token, tags:['custom'] });
    saveState();
    els.cardTitle.value=''; els.cardText.value=''; els.cardSober.value=''; els.cardParty.value=''; els.cardCrowdDelta.value='0'; els.cardToken.value='';
    els.addCustomNote.textContent = `Added “${title}” to ${category}. Will appear next round.`;
    openDeckManager();
  }
  function exportCustom(){ const data = { customCards: state.deckPrefs.customCards||[], enabledCategories: state.deckPrefs.enabledCategories||{} }; download('sdsu-deck-custom.json', JSON.stringify(data, null, 2)); }
  function exportMerged(){ const data = { meta:(window.DECK?.meta||{}), config:(window.DECK?.config||{}), cards: mergedCards() }; download('sdsu-deck-merged.json', JSON.stringify(data, null, 2)); }
  function showImportArea(show){ els.importWrap.classList.toggle('hidden', !show); if(show){ els.importText.value=''; } }
  function applyImport(){
    try{
      const obj = JSON.parse(els.importText.value||'{}');
      if(Array.isArray(obj.cards)){ state.deckPrefs.customCards = obj.cards; state.deckPrefs.enabledCategories = state.deckPrefs.enabledCategories || {}; }
      else{
        if(Array.isArray(obj.customCards)) state.deckPrefs.customCards = obj.customCards;
        if(obj.enabledCategories && typeof obj.enabledCategories==='object') state.deckPrefs.enabledCategories = obj.enabledCategories;
      }
      saveState(); showImportArea(false); openDeckManager();
    }catch(e){ alert('Invalid JSON. Please check and try again.'); }
  }
  function resetDeckPrefs(){ state.deckPrefs = { enabledCategories:{}, customCards:[] }; saveState(); openDeckManager(); }

  // ---------- Events ----------
  let deferredInstallPrompt = null;

  function attachEvents(){
    // Modes
    els.modeButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{ const target = btn.dataset.mode; if(target==='party') requestPartyMode(); else setMode('sober'); });
    });
    els.ageGate?.addEventListener('close', ()=>{ if(els.ageGate.returnValue==='yes'){ state.ageVerified=true; saveState(); setMode('party'); } else setMode('sober'); });

    // Game controls
    els.startBtn.addEventListener('click', openSetup);
    els.setupDlg?.addEventListener('close', ()=>{ if(els.setupDlg.returnValue==='begin') beginGame(); });
    els.nextBtn.addEventListener('click', drawNext);
    els.crowdPlus.addEventListener('click', ()=>{ applyCrowd(+1); saveState(); });
    els.crowdMinus.addEventListener('click', ()=>{ applyCrowd(-1); saveState(); });
    els.addPlayerBtn.addEventListener('click', ()=>{
      const name=(els.newPlayerName.value||'').trim(); if(!name) return;
      state.players.push({id:`p${Date.now()}`, name, points:0, tokens:{skip:false, boost:false}});
      els.newPlayerName.value=''; renderPlayers(); saveState();
    });
    els.resetScoresBtn.addEventListener('click', ()=>{ state.players.forEach(p=>p.points=0); renderPlayers(); saveState(); });
    els.useSkipBtn.addEventListener('click', ()=>{ const pid=els.skipSelect.value; if(pid) armSkip(pid); });

    // How-to / Options
    els.howToLink?.addEventListener('click', (e)=>{ e.preventDefault(); els.howToDlg?.showModal?.(); });
    els.optionsLink?.addEventListener('click', (e)=>{
      e.preventDefault();
      els.optKeyboard.checked = !!state.options.keyboardShortcuts;
      els.optBell.value = state.settings.bellIntervalSeconds;
      els.optCrowdMax.value = state.settings.crowdMax;
      els.optCrowdReset.value = state.settings.crowdReset;
      els.optionsDlg?.showModal?.();
    });
    els.optionsDlg?.addEventListener('close', ()=>{
      if(els.optionsDlg.returnValue!=='save') return;
      state.options.keyboardShortcuts = !!els.optKeyboard.checked;
      const bell=clampInt(els.optBell.value,10,600,state.settings.bellIntervalSeconds);
      const cmax=clampInt(els.optCrowdMax.value,5,20,state.settings.crowdMax);
      const creset=clampInt(els.optCrowdReset.value,0,10,state.settings.crowdReset);
      state.settings.bellIntervalSeconds=bell; state.settings.crowdMax=cmax; state.settings.crowdReset=Math.min(creset,cmax);
      renderCrowd(); scheduleNextBell(); saveState();
    });

    // Theme
    els.themeToggle?.addEventListener('click', (e)=>{ e.preventDefault(); cycleTheme(); });

    // Keyboard shortcuts
    document.addEventListener('keydown', (ev)=>{
      if(!state.options.keyboardShortcuts) return;
      if(isEditableTarget(ev)) return;
      if(ev.key==='Escape'){ if(els.howToDlg?.open) els.howToDlg.close(); if(els.optionsDlg?.open) els.optionsDlg.close(); if(els.setupDlg?.open) els.setupDlg.close(); if(els.onboardDlg?.open) els.onboardDlg.close(); if(els.deckDlg?.open) els.deckDlg.close(); return; }
      if(ev.key.toLowerCase()==='n'){ if(!els.nextBtn.disabled) drawNext(); return; }
      if(ev.key.toLowerCase()==='s'){ openSetup(); return; }
      if(ev.key==='['){ applyCrowd(-1); saveState(); return; }
      if(ev.key===']'){ applyCrowd(+1); saveState(); return; }
      if(ev.key>='1' && ev.key<='9'){ const idx=parseInt(ev.key,10)-1; const p=state.players[idx]; if(p){ addPoints(p.id, ev.altKey?-1:+1); } }
    });

    // Onboarding (first run)
    try{
      const seen = localStorage.getItem('sdsuSeenOnboardingV1');
      if(!seen){ els.onboardDlg?.showModal?.(); els.onboardDlg?.addEventListener('close', ()=> localStorage.setItem('sdsuSeenOnboardingV1','1'), { once:true }); }
    }catch{}

    // Deck Manager
    els.deckLink?.addEventListener('click', (e)=>{ e.preventDefault(); openDeckManager(); });
    els.addCustomBtn?.addEventListener('click', (e)=>{ e.preventDefault(); addCustomCard(); });
    els.exportCustomBtn?.addEventListener('click', (e)=>{ e.preventDefault(); exportCustom(); });
    els.exportMergedBtn?.addEventListener('click', (e)=>{ e.preventDefault(); exportMerged(); });
    els.showImportBtn?.addEventListener('click', (e)=>{ e.preventDefault(); showImportArea(true); });
    els.cancelImportBtn?.addEventListener('click', (e)=>{ e.preventDefault(); showImportArea(false); });
    els.applyImportBtn?.addEventListener('click', (e)=>{ e.preventDefault(); applyImport(); });
    els.resetDeckBtn?.addEventListener('click', (e)=>{ e.preventDefault(); resetDeckPrefs(); });

    // --- PWA Install (Step 8) ---
    window.addEventListener('beforeinstallprompt', (e)=>{
      e.preventDefault();
      deferredInstallPrompt = e;
      if(els.installBtn) els.installBtn.style.display = 'inline-block';
    });
    els.installBtn?.addEventListener('click', async (e)=>{
      e.preventDefault();
      if(!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try{ await deferredInstallPrompt.userChoice; }catch{}
      deferredInstallPrompt = null;
      if(els.installBtn) els.installBtn.style.display = 'none';
    });
  }

  // ---------- Service Worker registration ----------
  function registerServiceWorker(){
    if('serviceWorker' in navigator){
      // Use relative path so it works on GitHub Pages subpaths
      navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
    }
  }

  // ---------- Boot ----------
  function boot(){
    els.year && (els.year.textContent = new Date().getFullYear());

    if(window.DECK?.config){
      const cfg = window.DECK.config;
      state.settings.winPoints = cfg.winPoints ?? state.settings.winPoints;
      state.settings.roundSeconds = cfg.roundSeconds ?? state.settings.roundSeconds;
      state.settings.bellIntervalSeconds = cfg.bellIntervalSeconds ?? state.settings.bellIntervalSeconds;
      state.settings.crowdMax = cfg.crowdMax ?? state.settings.crowdMax;
      state.settings.crowdReset = cfg.crowdReset ?? state.settings.crowdReset;
    }

    loadState(); applyTheme(); reflectMode(); attachEvents(); renderAll();
    registerServiceWorker();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();


