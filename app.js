(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  const state = {
    mode: 'sober',          // 'sober' | 'party'
    ageVerified: false,     // set true if user confirms 21+
  };

  const els = {
    year: $('#year'),
    modeNote: $('#modeNote'),
    modeButtons: $$('.seg-btn'),
    startBtn: $('#startBtn'),
    nextBtn: $('#nextBtn'),
    card: $('#card'),
    ageGate: $('#ageGate'),
  };

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem('sdsuGameState') || '{}');
      if(saved.mode) state.mode = saved.mode;
      if(saved.ageVerified) state.ageVerified = !!saved.ageVerified;
    }catch{ /* ignore */ }
  }
  function saveState(){
    localStorage.setItem('sdsuGameState', JSON.stringify(state));
  }

  function reflectMode(){
    document.documentElement.setAttribute('data-mode', state.mode);
    els.modeButtons.forEach(b=>{
      const active = b.dataset.mode === state.mode;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    if(state.mode === 'sober'){
      els.modeNote.textContent = 'Sober Mode swaps alcohol actions for points, water sips, or mini-challenges. Please play responsibly.';
    }else{
      els.modeNote.textContent = 'Party Mode is for 21+ players only. Hydrate, know your limits, and never drink and drive.';
    }
  }

  function requestPartyMode(){
    if(state.ageVerified){
      setMode('party');
      return;
    }
    // Open age gate
    if(typeof els.ageGate.showModal === 'function'){
      els.ageGate.showModal();
    }else{
      // Fallback: emulate modal
      els.ageGate.setAttribute('open','');
    }
  }

  function setMode(mode){
    state.mode = mode;
    saveState();
    reflectMode();
  }

  function attachEvents(){
    els.modeButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const targetMode = btn.dataset.mode;
        if(targetMode === 'party'){
          requestPartyMode();
        }else{
          setMode('sober');
        }
      });
    });

    els.ageGate?.addEventListener('close', ()=>{
      if(els.ageGate.returnValue === 'yes'){
        state.ageVerified = true;
        saveState();
        setMode('party');
      }else{
        setMode('sober');
      }
    });

    els.startBtn.addEventListener('click', ()=>{
      // Placeholder: real game init comes in Step 3–4
      els.card.innerHTML = `
        <div class="card-title">Game initialized</div>
        <p class="card-body">Great! In the next step we’ll add the SDSU deck, timers, and scoring. For now, “Next” is disabled.</p>
      `;
      els.nextBtn.disabled = true; // will enable when logic exists
    });

    els.nextBtn.addEventListener('click', ()=>{
      // Placeholder for Step 4 draw action
      // no-op
    });
  }

  function boot(){
    els.year.textContent = new Date().getFullYear();
    loadState();
    reflectMode();
    attachEvents();
  }

  /* ==== Future Step Stubs (to be filled in next steps) ==== */
  // function initGame(){ /* build deck, shuffle, timers, etc. */ }
  // function drawCard(){ /* pop next prompt and render */ }
  // function startRoundTimer(ms){ /* Hepner Bell timed rounds */ }

  document.addEventListener('DOMContentLoaded', boot);
})();
