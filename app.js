(function(){
  // ---------- Quick DOM helpers ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // ---------- State ----------
  const state = {
    // Step 2 persistence
    mode: 'sober',
    ageVerified: false,

    // Step 4 game state
    players: [],             // [{id, name, points, tokens:{skip:boolean, boost:boolean}}]
    drawPile: [],            // array of cards (shuffled)
    discardPile: [],
    currentCard: null,
    round: 1,
    crowd: 0,
    skipArmedBy: null,       // playerId who will skip the next card
    pendingBellCard: null,   // holds a Hepner Bell card when interrupt fires
    timers: {
      roundLeft: 0,          // seconds left in current round
      tickId: null,
      nextBellAt: 0,         // epoch ms when next bell should fire
    },
    settings: {              // defaults filled from DECK.config at boot
      winPoints: 10,
      roundSeconds: 90,
      bellIntervalSeconds: 180,
      crowdMax: 10,
      crowdReset: 3,
    },

    // Step 5 options
    options: {
      keyboardShortcuts: true,
    },
  };

  // ---------- Elements ----------
  const els = {
    // From Step 2
    year: $('#year'),
    modeNote: $('#modeNote'),
    modeButtons: $$('.seg-btn'),
    startBtn: $('#startBtn'),
    nextBtn: $('#nextBtn'),
    card: $('#card'),
    ageGate: $('#ageGate'),

    // Step 4
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

    // Step 5
    howToLink: $('#howToLink'),
    optionsLink: $('#optionsLink'),
    howToDlg: $('#howToDlg'),
    optionsDlg: $('#optionsDlg'),
    optKeyboard: $('#optKeyboard'),
    optBell: $('#optBell'),
    optCrowdMax: $('#optCrowdMax'),
    optCrowdReset: $('#optCrowdReset'),
  };

  // ---------- Utilities ----------
  const rand = (n) => Math.floor(Math.random()*n);
  const shuffle = (arr) => {
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  };
  const fmtTime = (s) => {
    if (s < 0) s = 0;
    const m = Math.floor(s/60).toString().padStart(1,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  };
  function clampInt(s, min, max, fallback){
    const n = parseInt(s,10);
    if(Number.isFinite(n)) return Math.min(max, Math.max(min, n));
    return fallback ?? min;
  }
  function escapeHtml(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }
  function isEditableTarget(ev){
    const t = ev.target;
    return t && (
      t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
      t.isContentEditable
    );
  }

  // ---------- Persistence ----------
  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem('sdsuGameState') || '{}');
      if(saved.mode) state.mode = saved.mode;
      if(saved.ageVerified) state.ageVerified = !!saved.ageVerified;

      const game = JSON.parse(localStorage.getItem('sdsuGameV2') || '{}');
      if(game && game.players){
        Object.assign(state, game);
      }
      if(game && game.options){
        state.options = Object.assign(state.options, game.options);
      }
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
      timers: {
        roundLeft: state.timers.roundLeft,
        nextBellAt: state.timers.nextBellAt,
      },
      settings: state.settings,
      mode: state.mode,
      ageVerified: state.ageVerified,
      options: state.options,
    };
    localStorage.setItem('sdsuGameV2', JSON.stringify(snapshot));
    localStorage.setItem('sdsuGameState', JSON.stringify({mode: state.mode, ageVerified: state.ageVerified}));
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
  function requestPartyMode(){
    if(state.ageVerified){ setMode('party'); return; }
    if(typeof els.ageGate?.showModal === 'function'){ els.ageGate.showModal(); }
    else { els.ageGate?.setAttribute('open',''); }
  }
  function setMode(mode){
    state.mode = mode;
    reflectMode();
  }

  // ---------- Setup / Reset ----------
  function openSetup(){
    const cfg = window.DECK?.config || {};
    els.winPointsInput.value = state.settings.winPoints || cfg.winPoints || 10;
    els.roundSecondsInput.value = state.settings.roundSeconds || cfg.roundSeconds || 90;
    if(typeof els.setupDlg?.showModal === 'function') els.setupDlg.showModal();
    else els.setupDlg?.setAttribute('open','');
  }

  function beginGame(){
    const names = (els.playersInput.value || '').split(',')
      .map(s=>s.trim()).filter(Boolean);
    const seen = new Set();
    state.players = names.map((n,i)=>({
      id: `${Date.now()}_${i}`,
      name: seen.has(n) ? `${n} ${i+1}` : (seen.add(n), n),
      points: 0,
      tokens: { skip:false, boost:false },
    }));
    if(state.players.length === 0){
      state.players = [{id:'p1', name:'You', points:0, tokens:{skip:false, boost:false}}];
    }

    state.settings.winPoints = clampInt(els.winPointsInput.value, 5, 50, window.DECK.config.winPoints);
    state.settings.roundSeconds = clampInt(els.roundSecondsInput.value, 30, 600, window.DECK.config.roundSeconds);

    // build deck (exclude auto-trigger card)
    const all = (window.DECK?.cards || []).slice();
    const normal = all.filter(c=>!c.triggersOnCrowdFull);
    state.drawPile = shuffle(normal);
    state.discardPile = [];
    state.currentCard = null;
    state.crowd = 0;
    state.round = 1;
    state.skipArmedBy = null;
    state.pendingBellCard = null;

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
    if(state.timers.tickId){
      clearInterval(state.timers.tickId);
      state.timers.tickId = null;
    }
    els.nextBtn.disabled = true;
    renderCardMessage('⏰ Round over',
      'Tap “New Game / Round” to start another round. You can keep scores, or reset them below.');
  }

  // ---------- Drawing / Interrupts ----------
  function drawNext(){
    if(state.pendingBellCard){
      const bell = state.pendingBellCard;
      state.pendingBellCard = null;
      renderCard(bell, true);
      applyCrowd(bell.crowdDelta || 0);
      saveState();
      return;
    }

    if(state.skipArmedBy){
      if(state.drawPile.length){
        state.discardPile.push(state.drawPile.shift()); // skipped silently
      }
      const p = state.players.find(p=>p.id===state.skipArmedBy);
      if(p){ p.tokens.skip = false; }
      state.skipArmedBy = null;
      renderSkipNote();
    }

    if(!state.drawPile.length){
      state.drawPile = shuffle(state.discardPile);
      state.discardPile = [];
    }
    const card = state.drawPile.shift();
    state.currentCard = card;
    state.discardPile.push(card);

    renderCard(card, false);
    applyCrowd(card.crowdDelta || 0);
    saveState();
  }

  function scheduleNextBell(){
    const now = Date.now();
    state.timers.nextBellAt = now + (state.settings.bellIntervalSeconds * 1000);
  }

  function fireBellInterrupt(){
    const bellCards = (window.DECK.cards || []).filter(c=>c.category === 'Hepner Bell');
    if(!bellCards.length) return;
    state.pendingBellCard = bellCards[rand(bellCards.length)];
    scheduleNextBell();
  }

  function applyCrowd(delta){
    if(!delta) { renderCrowd(); return; }
    state.crowd = Math.max(0, Math.min(state.settings.crowdMax, state.crowd + delta));
    renderCrowd();

    if(state.crowd >= state.settings.crowdMax){
      const storm = (window.DECK.cards || []).find(c=>c.triggersOnCrowdFull);
      if(storm){
        renderCard(storm, true);
        state.crowd = Math.min(state.settings.crowdReset, state.settings.crowdMax);
        renderCrowd();
      }
    }
  }

  // ---------- Scoring / Tokens ----------
  function addPoints(playerId, delta){
    const p = state.players.find(p=>p.id===playerId);
    if(!p) return;

    let actual = delta;
    if(delta > 0 && p.tokens.boost){
      actual += 2;
      p.tokens.boost = false;
    }
    p.points = Math.max(0, p.points + actual);
    renderPlayers();

    if(p.points >= state.settings.winPoints){
      renderCardMessage('🏆 We have a winner!',
        `${escapeHtml(p.name)} reached ${state.settings.winPoints} points. Start a new round or reset scores to play again.`);
      els.nextBtn.disabled = true;
    }
    saveState();
  }

  function armSkip(playerId){
    const p = state.players.find(p=>p.id===playerId);
    if(!p || !p.tokens.skip) return;
    state.skipArmedBy = p.id;
    renderSkipNote();
    saveState();
  }
  function renderSkipNote(){
    if(!state.skipArmedBy) { els.skipArmedNote.textContent = ''; return; }
    const p = state.players.find(x=>x.id===state.skipArmedBy);
    els.skipArmedNote.textContent = p ? `(Next card will be skipped by ${p.name})` : '';
  }

  function grantToken(playerId, token){
    const p = state.players.find(p=>p.id===playerId);
    if(!p) return;
    if(token === 'skip') p.tokens.skip = true;
    if(token === 'boost') p.tokens.boost = true;
    renderPlayers();
    saveState();
  }

  // ---------- Rendering ----------
  function renderAll(){
    reflectMode();
    renderPlayers();
    renderCrowd();
    renderTimer();
    renderSkipOptions();
  }

  function renderCard(card, isInterrupt){
    const modeText = card.actions?.[state.mode] || '';
    const badge = isInterrupt ? `<span class="badge">Interrupt</span>` : '';
    const tokenUi = card.token ? renderTokenUi(card.token) : '';

    els.card.innerHTML = `
      <div class="card-title">${badge} ${escapeHtml(card.category)} • ${escapeHtml(card.title)}</div>
      <p class="card-body">${escapeHtml(card.text)}</p>
      <p class="tiny"><strong>Action (${state.mode === 'party' ? '21+ Party' : 'Sober'}):</strong> ${escapeHtml(modeText)}</p>
      ${card.crowdDelta ? `<p class="tiny muted">Crowd ${card.crowdDelta>0?'+':''}${card.crowdDelta} auto-applied.</p>` : ''}
      ${tokenUi}
    `;

    const grantBtn = $('#grantTokenBtn', els.card);
    if(grantBtn){
      grantBtn.addEventListener('click', ()=>{
        const sel = $('#grantTokenSelect', els.card);
        const pid = sel?.value;
        if(pid) grantToken(pid, grantBtn.dataset.token);
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

  function renderCardMessage(title, body){
    els.card.innerHTML = `
      <div class="card-title">${escapeHtml(title)}</div>
      <p class="card-body">${escapeHtml(body)}</p>
    `;
  }

  function renderPlayers(){
    if(!els.playersWrap) return;
    els.playersWrap.innerHTML = state.players.map(p=>{
      const badges = [
        p.tokens.skip ? `<span class="badge">Skip</span>` : '',
        p.tokens.boost ? `<span class="badge">Boost</span>` : '',
      ].join('');
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
      el.addEventListener('blur', ()=>{
        const card = el.closest('.player'); const id = card?.dataset.id;
        const p = state.players.find(p=>p.id===id); if(!p) return;
        p.name = el.textContent.trim() || p.name;
        saveState(); renderSkipOptions();
      });
    });
    $$('.player .actions .btn', els.playersWrap).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const delta = parseInt(btn.dataset.delta,10);
        const id = btn.closest('.player')?.dataset.id;
        addPoints(id, delta);
        renderSkipOptions();
      });
    });

    renderSkipOptions();
  }

  function renderSkipOptions(){
    if(!els.skipSelect) return;
    const options = state.players
      .filter(p=>p.tokens.skip)
      .map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`)
      .join('');
    els.skipSelect.innerHTML = options || `<option value="">(no Skip tokens)</option>`;
  }

  function renderCrowd(){
    els.crowdBar.max = state.settings.crowdMax;
    els.crowdBar.value = state.crowd;
    els.crowdVal.textContent = `${state.crowd}/${state.settings.crowdMax}`;
  }

  function renderTimer(){
    els.timer.textContent = fmtTime(state.timers.roundLeft);
    els.roundLabel.textContent = String(state.round);
  }

  // ---------- Tick loop ----------
  function tick(){
    state.timers.roundLeft -= 1;
    renderTimer();
    if(state.timers.roundLeft <= 0){
      endRound();
      saveState();
      return;
    }
    if(Date.now() >= state.timers.nextBellAt && !state.pendingBellCard){
      fireBellInterrupt();
      if(state.pendingBellCard){
        const bell = state.pendingBellCard;
        state.pendingBellCard = null;
        renderCard(bell, true);
        applyCrowd(bell.crowdDelta || 0);
      }
    }
  }

  // ---------- Events ----------
  function attachEvents(){
    // Mode
    els.modeButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const target = btn.dataset.mode;
        if(target === 'party') requestPartyMode(); else setMode('sober');
      });
    });
    els.ageGate?.addEventListener('close', ()=>{
      if(els.ageGate.returnValue === 'yes'){
        state.ageVerified = true; saveState(); setMode('party');
      }else setMode('sober');
    });

    // Game controls
    els.startBtn.addEventListener('click', openSetup);
    els.setupDlg?.addEventListener('close', ()=>{
      if(els.setupDlg.returnValue === 'begin') beginGame();
    });
    els.nextBtn.addEventListener('click', drawNext);
    els.crowdPlus.addEventListener('click', ()=>{ applyCrowd(+1); saveState(); });
    els.crowdMinus.addEventListener('click', ()=>{ applyCrowd(-1); saveState(); });
    els.addPlayerBtn.addEventListener('click', ()=>{
      const name = (els.newPlayerName.value || '').trim();
      if(!name) return;
      state.players.push({id:`p${Date.now()}`, name, points:0, tokens:{skip:false, boost:false}});
      els.newPlayerName.value = '';
      renderPlayers(); saveState();
    });
    els.resetScoresBtn.addEventListener('click', ()=>{
      state.players.forEach(p=>p.points=0);
      renderPlayers(); saveState();
    });
    els.useSkipBtn.addEventListener('click', ()=>{
      const pid = els.skipSelect.value;
      if(!pid) return;
      armSkip(pid);
    });

    // How-to & Options (Step 5)
    if(els.howToLink){
      els.howToLink.addEventListener('click', (e)=>{ e.preventDefault(); els.howToDlg?.showModal?.(); });
    }
    if(els.optionsLink){
      els.optionsLink.addEventListener('click', (e)=>{
        e.preventDefault();
        els.optKeyboard.checked = !!state.options.keyboardShortcuts;
        els.optBell.value = state.settings.bellIntervalSeconds;
        els.optCrowdMax.value = state.settings.crowdMax;
        els.optCrowdReset.value = state.settings.crowdReset;
        els.optionsDlg?.showModal?.();
      });
    }
    els.optionsDlg?.addEventListener('close', ()=>{
      if(els.optionsDlg.returnValue !== 'save') return;
      state.options.keyboardShortcuts = !!els.optKeyboard.checked;
      const bell = clampInt(els.optBell.value, 10, 600, state.settings.bellIntervalSeconds);
      const cmax = clampInt(els.optCrowdMax.value, 5, 20, state.settings.crowdMax);
      const creset = clampInt(els.optCrowdReset.value, 0, 10, state.settings.crowdReset);
      state.settings.bellIntervalSeconds = bell;
      state.settings.crowdMax = cmax;
      state.settings.crowdReset = Math.min(creset, cmax);
      renderCrowd();
      scheduleNextBell();
      saveState();
    });

    // Keyboard shortcuts (Step 5)
    document.addEventListener('keydown', (ev)=>{
      if(!state.options.keyboardShortcuts) return;
      if(isEditableTarget(ev)) return;

      if(ev.key === 'Escape'){
        if(els.howToDlg?.open) els.howToDlg.close();
        if(els.optionsDlg?.open) els.optionsDlg.close();
        if(els.setupDlg?.open) els.setupDlg.close();
        return;
      }
      if(ev.key.toLowerCase() === 'n'){
        if(!els.nextBtn.disabled) drawNext();
        return;
      }
      if(ev.key.toLowerCase() === 's'){
        openSetup();
        return;
      }
      if(ev.key === '['){ applyCrowd(-1); saveState(); return; }
      if(ev.key === ']'){ applyCrowd(+1); saveState(); return; }
      if(ev.key >= '1' && ev.key <= '9'){
        const idx = parseInt(ev.key,10) - 1;
        const p = state.players[idx];
        if(p){ addPoints(p.id, ev.altKey ? -1 : +1); }
      }
    });
  }

  // ---------- Boot ----------
  function renderTimer(){ els.timer.textContent = fmtTime(state.timers.roundLeft); els.roundLabel.textContent = String(state.round); }
  function renderCrowd(){ els.crowdBar.max = state.settings.crowdMax; els.crowdBar.value = state.crowd; els.crowdVal.textContent = `${state.crowd}/${state.settings.crowdMax}`; }
  function renderSkipOptions(){ if(!els.skipSelect) return; const options = state.players.filter(p=>p.tokens.skip).map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join(''); els.skipSelect.innerHTML = options || `<option value="">(no Skip tokens)</option>`; }

  function boot(){
    const y = $('#year'); if(y) y.textContent = new Date().getFullYear();

    if(window.DECK?.config){
      const cfg = window.DECK.config;
      state.settings.winPoints = cfg.winPoints ?? state.settings.winPoints;
      state.settings.roundSeconds = cfg.roundSeconds ?? state.settings.roundSeconds;
      state.settings.bellIntervalSeconds = cfg.bellIntervalSeconds ?? state.settings.bellIntervalSeconds;
      state.settings.crowdMax = cfg.crowdMax ?? state.settings.crowdMax;
      state.settings.crowdReset = cfg.crowdReset ?? state.settings.crowdReset;
    }

    loadState();
    reflectMode();
    attachEvents();
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();

