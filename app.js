/* Stellaris Damage Calculator - front-end logic */
(function(){
  const D = window.STELLARIS_DATA;

  /* ---------- Starfield ---------- */
  const c = document.getElementById('stars');
  const ctx = c.getContext('2d');
  let stars = [];
  function resize(){
    c.width = innerWidth; c.height = innerHeight;
    const n = Math.floor((c.width*c.height)/9000);
    stars = Array.from({length:n},()=>({
      x:Math.random()*c.width, y:Math.random()*c.height,
      r:Math.random()*1.3+.2, a:Math.random()*.6+.2,
      t:Math.random()*Math.PI*2, s:Math.random()*.012+.003
    }));
  }
  function draw(){
    ctx.clearRect(0,0,c.width,c.height);
    for(const st of stars){
      st.t+=st.s;
      const a = st.a*(0.6+0.4*Math.sin(st.t));
      ctx.fillStyle=`rgba(200,225,255,${a})`;
      ctx.beginPath(); ctx.arc(st.x,st.y,st.r,0,7); ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  addEventListener('resize',resize); resize(); draw();

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const id = t.dataset.tab;
      ['designer','weapons','utilities','auxiliaries','ships'].forEach(k=>{
        document.getElementById('tab-'+k).classList.toggle('hidden', k!==id);
      });
    });
  });

  /* ---------- Helpers ---------- */
  const fmt = (v, d=2) => {
    if(v==null || v==='') return '';
    if(typeof v !== 'number') return v;
    if(Math.abs(v) >= 100) return v.toLocaleString(undefined,{maximumFractionDigits:0});
    if(Math.abs(v) >= 10)  return v.toFixed(1);
    return v.toFixed(d);
  };
  const pct = v => v==null?'':(v*100).toFixed(0)+'%';

  function sizeClass(sz){
    return ({Small:'size-s',Medium:'size-m',Large:'size-l','X-Large':'size-xl'})[sz]||'';
  }
  function sizeLabel(sz){
    return ({Small:'S',Medium:'M',Large:'L','X-Large':'X',Guided:'G',Hangar:'H',PD:'PD',Titan:'T'})[sz]||sz||'';
  }

  function metricKey(metric, target){
    // target: shields|armor|hull ; metric: avg|d1|slot|res
    const t = target;
    if(metric==='avg')  return 'avg_'+t;
    if(metric==='d1')   return 'd1_'+t;
    if(metric==='slot') return 'avg_'+t+'_slot';
    if(metric==='res')  return 'avg_'+t+'_res';
  }
  function metricLabel(metric, target){
    const tl = {shields:'Shields',armor:'Armor',hull:'Hull'}[target];
    const ml = {avg:'Average dmg vs '+tl, d1:'Day-1 dmg vs '+tl,
                slot:'Avg dmg vs '+tl+' / slot unit', res:'Avg dmg vs '+tl+' / alloy'}[metric];
    return ml;
  }

  /* ---------- Generic sortable table ---------- */
  function makeTable({tableId, rows, columns, defaultSort, defaultDir='desc', classifier}){
    const tbody = document.querySelector('#'+tableId+' tbody');
    const thead = document.querySelector('#'+tableId+' thead');
    let sortKey = defaultSort, sortDir = defaultDir;

    function render(data){
      // sort
      const arr = [...data].sort((a,b)=>{
        const av=a[sortKey], bv=b[sortKey];
        if(av==null && bv==null) return 0;
        if(av==null) return 1;
        if(bv==null) return -1;
        if(typeof av==='number' && typeof bv==='number') return sortDir==='asc'?av-bv:bv-av;
        return sortDir==='asc'? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
      // bar-chart scaling for columns flagged as bars
      const barMax = {};
      columns.forEach(col=>{
        if(col.bar){
          barMax[col.key]=Math.max(1,...arr.map(r=>Number(r[col.key])||0));
        }
      });
      tbody.innerHTML = arr.map(r=>{
        const cls = classifier?classifier(r):'';
        return '<tr class="'+cls+'">'+columns.map(col=>{
          const raw = col.key==='size'?sizeLabel(r.size):r[col.key];
          const val = col.fmt?col.fmt(raw,r):fmt(raw);
          let cellCls = col.align==='left'?'l':'num';
          if(col.bar){
            const m = barMax[col.key]||1;
            const pctW = Math.max(0,Math.min(100,(Number(r[col.key])||0)/m*100));
            const bc = col.barClass||'';
            cellCls += ' bar-cell '+bc;
            return '<td class="'+cellCls+'"><div class="bar" style="width:'+pctW.toFixed(1)+'%"></div><span class="v">'+val+'</span></td>';
          }
          return '<td class="'+cellCls+'">'+val+'</td>';
        }).join('')+'</tr>';
      }).join('');
    }

    thead.querySelectorAll('th').forEach(th=>{
      const key = th.dataset.sort; if(!key) return;
      th.addEventListener('click',()=>{
        if(sortKey===key) sortDir = sortDir==='asc'?'desc':'asc';
        else { sortKey=key; sortDir = (key==='name'||key==='type'||key==='add_res')?'asc':'desc'; }
        thead.querySelectorAll('th').forEach(x=>x.classList.remove('sorted','asc'));
        th.classList.add('sorted');
        if(sortDir==='asc') th.classList.add('asc');
        render(currentData);
      });
    });

    let currentData = rows;
    function update(data){ currentData = data; render(data); }
    function setSort(key){
      sortKey=key; sortDir='desc';
      thead.querySelectorAll('th').forEach(x=>x.classList.remove('sorted','asc'));
      const th = thead.querySelector('th[data-sort="'+key+'"]');
      if(th) th.classList.add('sorted');
    }
    update(rows);
    return {update, setSort, get sortKey(){return sortKey}};
  }

  /* ---------- Weapons tab ---------- */
  const weapons = D.weapons.map(w=>({...w}));
  let wState = {size:'all', target:'shields', metric:'avg', search:''};

  function applyMetric(){
    const key = metricKey(wState.metric, wState.target);
    weapons.forEach(w=>{ w.metric = w[key] ?? null; });
  }

  const wColumns = [
    {key:'name', align:'left', fmt:(v,r)=>'<span class="wname">'+(v||'')+'</span>'},
    {key:'size'},
    {key:'cost_alloys'},
    {key:'power'},
    {key:'dpd'},
    {key:'cooldown'},
    {key:'max_range', fmt:(v,r)=>r.range||fmt(v)},
    {key:'accuracy', fmt:pct},
    {key:'tracking', fmt:pct},
    {key:'vs_shields', fmt:pct},
    {key:'vs_armor', fmt:pct},
    {key:'vs_hull', fmt:pct},
    {key:'metric', bar:true, barClass:'shields', fmt:v=>fmt(v,3)},
  ];

  const wTable = makeTable({
    tableId:'w-table',
    rows:weapons, columns:wColumns,
    defaultSort:'metric',
    classifier:r=>sizeClass(r.size),
  });

  function filterWeapons(){
    const q = wState.search.trim().toLowerCase();
    return weapons.filter(w=>{
      if(wState.size!=='all' && w.size!==wState.size) return false;
      if(q && !(w.name||'').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function refreshWeapons(){
    applyMetric();
    // update bar class on metric column
    const metricTh = document.querySelector('#w-table thead th[data-sort="metric"]');
    // update color class on cells via setting col.barClass
    wColumns[wColumns.length-1].barClass = wState.target; // shields|armor|hull
    const data = filterWeapons();
    document.getElementById('w-count').textContent = data.length;
    document.getElementById('w-metric-label').textContent = metricLabel(wState.metric,wState.target);
    wTable.update(data);
  }

  // wire chips
  function wireChips(containerId, stateKey, onChange){
    const el = document.getElementById(containerId);
    el.querySelectorAll('.chip').forEach(c=>{
      c.addEventListener('click',()=>{
        el.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
        c.classList.add('active');
        wState[stateKey] = c.dataset.v;
        onChange();
      });
    });
  }
  wireChips('w-size','size',refreshWeapons);
  wireChips('w-target','target',refreshWeapons);
  wireChips('w-metric','metric',refreshWeapons);
  document.getElementById('w-search').addEventListener('input',e=>{
    wState.search=e.target.value; refreshWeapons();
  });
  refreshWeapons();

  /* ---------- Utilities tab ---------- */
  const utils = D.utilities.map(u=>({...u}));
  let uState = {size:'all', search:''};

  const uColumns = [
    {key:'name', align:'left', fmt:v=>'<span class="wname">'+(v||'')+'</span>'},
    {key:'size'},
    {key:'cost_alloys'},
    {key:'power'},
    {key:'shields', bar:true, barClass:'shields'},
    {key:'regen'},
    {key:'shield_hardening', fmt:pct},
    {key:'armor', bar:true, barClass:'armor'},
    {key:'armor_hardening', fmt:pct},
    {key:'hull'},
  ];
  const uTable = makeTable({
    tableId:'u-table', rows:utils, columns:uColumns,
    defaultSort:'shields',
    classifier:r=>sizeClass(r.size),
  });
  function refreshUtils(){
    const q = uState.search.trim().toLowerCase();
    const data = utils.filter(u=>{
      if(uState.size!=='all' && u.size!==uState.size) return false;
      if(q && !(u.name||'').toLowerCase().includes(q)) return false;
      return true;
    });
    document.getElementById('u-count').textContent = data.length;
    uTable.update(data);
  }
  wireChips('u-size','size',refreshUtils);
  document.getElementById('u-search').addEventListener('input',e=>{ uState.search=e.target.value; refreshUtils(); });
  refreshUtils();

  /* ---------- Auxiliaries tab ---------- */
  makeTable({
    tableId:'a-table',
    rows: D.auxiliaries.map(a=>({...a})),
    columns:[
      {key:'name', align:'left', fmt:v=>'<span class="wname">'+(v||'')+'</span>'},
      {key:'cost_alloys'},
      {key:'add_cost'},
      {key:'add_res', align:'left'},
      {key:'power'},
      {key:'evasion', fmt:pct},
      {key:'armor_hardening', fmt:pct},
      {key:'shield_hardening', fmt:pct},
      {key:'chance_hit', fmt:pct},
      {key:'tracking', fmt:pct},
      {key:'armor_hp'},
    ],
    defaultSort:'name', defaultDir:'asc',
  });

  /* ---------- Ship Designer tab (drag-and-drop) ---------- */
  const SHIPS = window.SHIP_SECTIONS;
  const SLOT_TO_SIZE = window.SLOT_TO_SIZE;
  const SLOT_LABEL = window.SLOT_LABEL;

  // Group weapons by their size for quick lookup
  const weaponsBySize = {};
  D.weapons.forEach(w=>{
    (weaponsBySize[w.size] = weaponsBySize[w.size] || []).push(w);
  });
  Object.keys(weaponsBySize).forEach(k=>{
    weaponsBySize[k].sort((a,b)=>(a.name||'').localeCompare(b.name||'') || (a.cost_alloys||0)-(b.cost_alloys||0));
  });
  const utilsBySize = {Small:[],Medium:[],Large:[]};
  D.utilities.forEach(u=>{ if(utilsBySize[u.size]) utilsBySize[u.size].push(u); });
  Object.keys(utilsBySize).forEach(k=>utilsBySize[k].sort((a,b)=>(a.name||'').localeCompare(b.name||'')));

  const auxList = D.auxiliaries.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||''));

  const dState = {
    shipClass: 'Corvette',
    sectionChoice: {},           // groupId -> option name
    weaponLoadout: [],           // [{code, idx, groupId}]
    utilityLoadout: {Small:[], Medium:[], Large:[]}, // [{idx, groupId}]
    auxLoadout: [],              // [{idx, groupId}]
    palette: 'weapons',          // 'weapons' | 'utility' | 'aux'
    paletteSize: 'all',
    paletteSearch: '',
    picked: null,                // click-to-place: {type, size, idx}
  };

  const $ship = document.getElementById('d-ship');
  const $sections = document.getElementById('d-sections');
  const $weapons = document.getElementById('d-weapons');
  const $utility = document.getElementById('d-utility');
  const $aux = document.getElementById('d-aux');
  const $summary = document.getElementById('d-summary');
  const $palette = document.getElementById('d-palette');
  const $palSize = document.getElementById('pal-size');
  const $palSearch = document.getElementById('pal-search');
  const $palHint = document.getElementById('pal-hint');

  // Populate ship class dropdown
  Object.keys(SHIPS).forEach(name=>{
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    $ship.appendChild(opt);
  });
  $ship.addEventListener('change', ()=>{
    dState.shipClass = $ship.value;
    resetLoadout();
    renderDesigner();
  });
  document.getElementById('d-reset').addEventListener('click', ()=>{
    resetLoadout(); renderDesigner();
  });

  // Palette tab switching
  document.querySelectorAll('.pal-tab').forEach(t=>{
    t.addEventListener('click', ()=>{
      document.querySelectorAll('.pal-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      dState.palette = t.dataset.pal;
      dState.paletteSize = 'all';
      dState.picked = null;
      renderPaletteSizes();
      renderPalette();
      refreshPickedUI();
    });
  });
  $palSearch.addEventListener('input', ()=>{
    dState.paletteSearch = $palSearch.value;
    renderPalette();
  });

  function sizeCode(size){
    return {Small:'S',Medium:'M',Large:'L','X-Large':'X',Guided:'G',Hangar:'H',PD:'PD',Titan:'T'}[size] || '';
  }
  function sizeCodeClass(size){ return (sizeCode(size)||'').toLowerCase(); }

  function chosenOptions(){
    const ship = SHIPS[dState.shipClass];
    return ship.groups.map(g=>({
      group: g,
      option: g.options.find(o=>o.name===dState.sectionChoice[g.id]) || g.options[0],
    }));
  }

  function resetLoadout(){
    const ship = SHIPS[dState.shipClass];
    dState.sectionChoice = {};
    ship.groups.forEach(g=>{ dState.sectionChoice[g.id] = g.options[0].name; });
    dState.picked = null;
    rebuildSlotsFromSections();
  }

  function rebuildSlotsFromSections(){
    dState.weaponLoadout = [];
    dState.utilityLoadout = {Small:[], Medium:[], Large:[]};
    dState.auxLoadout = [];
    chosenOptions().forEach(({group, option})=>{
      option.weapons.forEach(code=>{
        dState.weaponLoadout.push({ code, idx: null, groupId: group.id });
      });
      Object.entries(option.utility||{}).forEach(([sizeCode, n])=>{
        const size = SLOT_TO_SIZE[sizeCode] || sizeCode; // 'S' -> 'Small'
        if(!dState.utilityLoadout[size]) return;
        for(let i=0;i<n;i++) dState.utilityLoadout[size].push({ idx: null, groupId: group.id });
      });
      for(let i=0;i<(option.aux||0);i++){
        dState.auxLoadout.push({ idx: null, groupId: group.id });
      }
    });
  }

  /* ---- Palette rendering ---- */
  function renderPaletteSizes(){
    $palSize.innerHTML = '';
    let sizes;
    if(dState.palette==='weapons'){
      sizes = [['all','All'],['Small','S'],['Medium','M'],['Large','L'],['X-Large','X'],
               ['Guided','G'],['Hangar','H'],['PD','PD'],['Titan','T']];
    } else if(dState.palette==='utility'){
      sizes = [['all','All'],['Small','S'],['Medium','M'],['Large','L']];
    } else {
      return; // aux: no size filter
    }
    sizes.forEach(([v,l])=>{
      const b = document.createElement('button');
      b.className = 'chip' + (dState.paletteSize===v?' active':'');
      b.dataset.v = v; b.textContent = l;
      b.addEventListener('click', ()=>{
        dState.paletteSize = v;
        $palSize.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        renderPalette();
      });
      $palSize.appendChild(b);
    });
  }

  function paletteItems(){
    const q = (dState.paletteSearch||'').trim().toLowerCase();
    const nameOk = n => !q || (n||'').toLowerCase().includes(q);
    const out = [];
    if(dState.palette==='weapons'){
      Object.entries(weaponsBySize).forEach(([sz, arr])=>{
        if(dState.paletteSize!=='all' && dState.paletteSize!==sz) return;
        arr.forEach((it,i)=>{ if(nameOk(it.name)) out.push({type:'weapon', size:sz, idx:i, item:it}); });
      });
    } else if(dState.palette==='utility'){
      Object.entries(utilsBySize).forEach(([sz, arr])=>{
        if(dState.paletteSize!=='all' && dState.paletteSize!==sz) return;
        arr.forEach((it,i)=>{ if(nameOk(it.name)) out.push({type:'utility', size:sz, idx:i, item:it}); });
      });
    } else {
      auxList.forEach((it,i)=>{ if(nameOk(it.name)) out.push({type:'aux', size:null, idx:i, item:it}); });
    }
    return out;
  }

  function renderPalette(){
    $palette.innerHTML = '';
    const items = paletteItems();
    if(items.length===0){
      $palette.innerHTML = '<div class="pal-empty">No components match.</div>';
      return;
    }
    items.forEach(rec=>{
      const el = document.createElement('div');
      el.className = 'pal-card';
      el.draggable = true;
      el.dataset.type = rec.type;
      if(rec.size) el.dataset.size = rec.size;
      el.dataset.idx = rec.idx;
      if(isPicked(rec)) el.classList.add('picked');

      const it = rec.item;
      const szTag = rec.size
        ? `<span class="slot-tag ${sizeCodeClass(rec.size)}">${sizeCode(rec.size)}</span>`
        : '<span class="slot-tag a">AUX</span>';
      let stats;
      if(rec.type==='weapon'){
        stats = `${it.cost_alloys||0}a · ${it.power||0}⚡ · DPD ${fmt(it.dpd||0,2)}`;
      } else if(rec.type==='utility'){
        const bits = [];
        if(it.shields) bits.push('S '+it.shields);
        if(it.armor)   bits.push('A '+it.armor);
        if(it.hull)    bits.push('H '+it.hull);
        if(it.regen)   bits.push('r '+it.regen);
        stats = `${it.cost_alloys||0}a · ${it.power||0}⚡${bits.length?' · '+bits.join(' / '):''}`;
      } else {
        const bits = [];
        if(it.evasion)   bits.push('+'+(it.evasion*100).toFixed(0)+'% ev');
        if(it.armor_hp)  bits.push('Arm '+it.armor_hp);
        if(it.tracking)  bits.push('+'+(it.tracking*100).toFixed(0)+'% trk');
        if(it.chance_hit)bits.push('+'+(it.chance_hit*100).toFixed(0)+'% hit');
        stats = `${it.cost_alloys||0}a · ${it.power||0}⚡${bits.length?' · '+bits.join(' / '):''}`;
      }
      el.innerHTML = `
        <div class="pc-head">${szTag}<span class="pc-name">${it.name||'?'}</span></div>
        <div class="pc-stats">${stats}</div>
      `;

      el.addEventListener('dragstart', (e)=>{
        const payload = {type:rec.type, size:rec.size||null, idx:rec.idx};
        e.dataTransfer.setData('text/plain', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
        el.classList.add('dragging');
        document.body.classList.add('drag-active');
        highlightAcceptingSlots(payload, true);
      });
      el.addEventListener('dragend', ()=>{
        el.classList.remove('dragging');
        document.body.classList.remove('drag-active');
        highlightAcceptingSlots(null, false);
      });
      el.addEventListener('click', ()=>{
        if(isPicked(rec)) dState.picked = null;
        else dState.picked = {type:rec.type, size:rec.size||null, idx:rec.idx};
        refreshPickedUI();
      });

      $palette.appendChild(el);
    });
  }

  function isPicked(rec){
    const p = dState.picked;
    return !!(p && p.type===rec.type && p.idx===rec.idx && (p.size||null)===(rec.size||null));
  }

  function lookupItem(payload){
    if(!payload) return null;
    if(payload.type==='weapon')  return (weaponsBySize[payload.size]||[])[payload.idx];
    if(payload.type==='utility') return (utilsBySize[payload.size]||[])[payload.idx];
    if(payload.type==='aux')     return auxList[payload.idx];
    return null;
  }

  function highlightAcceptingSlots(payload, on){
    document.querySelectorAll('.slot-row').forEach(s=>{
      s.classList.remove('accepts');
      if(on && slotAcceptsPayload(s.dataset, payload)) s.classList.add('accepts');
    });
  }

  function refreshPickedUI(){
    $palette.querySelectorAll('.pal-card').forEach(card=>{
      const rec = {
        type: card.dataset.type,
        size: card.dataset.size || null,
        idx: Number(card.dataset.idx),
      };
      card.classList.toggle('picked', isPicked(rec));
    });
    const p = dState.picked;
    if(p){
      const it = lookupItem(p);
      $palHint.classList.add('on');
      $palHint.textContent = it
        ? `Holding ${it.name} — tap a matching slot to place (tap again to drop).`
        : 'Tap a matching slot to place.';
    } else {
      $palHint.classList.remove('on');
      $palHint.textContent = 'Drag a component onto a slot — or tap to pick up and then tap a slot.';
    }
    highlightAcceptingSlots(p, !!p);
  }

  /* ---- Slot rendering ---- */
  function slotAcceptsPayload(ds, payload){
    if(!ds || !payload) return false;
    if(ds.slotKind==='weapon'){
      if(payload.type!=='weapon') return false;
      return payload.size===SLOT_TO_SIZE[ds.slotCode];
    }
    if(ds.slotKind==='utility'){
      if(payload.type!=='utility') return false;
      return payload.size===ds.slotSize;
    }
    if(ds.slotKind==='aux'){
      return payload.type==='aux';
    }
    return false;
  }

  function resolveSlotRef(slotEl){
    const kind = slotEl.dataset.slotKind;
    if(kind==='weapon') return dState.weaponLoadout[Number(slotEl.dataset.slotIndex)];
    if(kind==='utility') return dState.utilityLoadout[slotEl.dataset.slotSize][Number(slotEl.dataset.slotSubIndex)];
    if(kind==='aux') return dState.auxLoadout[Number(slotEl.dataset.slotIndex)];
    return null;
  }

  function applyPayload(slotEl, payload){
    if(!slotAcceptsPayload(slotEl.dataset, payload)) return false;
    const ref = resolveSlotRef(slotEl);
    if(!ref) return false;
    ref.idx = payload.idx;
    renderSlotsOnly();
    updateSummary();
    return true;
  }

  function clearSlot(slotEl){
    const ref = resolveSlotRef(slotEl);
    if(!ref) return;
    ref.idx = null;
    renderSlotsOnly();
    updateSummary();
  }

  function buildSlot(kind, code, size, listItems, slotRef, groupId, indexInList, subIndex){
    const row = document.createElement('div');
    row.className = 'slot-row';
    row.dataset.slotKind = kind;
    if(code) row.dataset.slotCode = code;
    if(size) row.dataset.slotSize = size;
    if(indexInList!=null) row.dataset.slotIndex = String(indexInList);
    if(subIndex!=null)    row.dataset.slotSubIndex = String(subIndex);

    const tagCode = kind==='aux' ? 'A' : code;
    const tag = document.createElement('div');
    tag.className = 'slot-tag ' + (tagCode||'').toLowerCase();
    tag.textContent = kind==='aux' ? 'AUX' : tagCode;
    if(groupId) tag.title = groupId;

    const body = document.createElement('div');
    body.className = 'slot-body';
    const hasItem = slotRef.idx!=null && listItems[slotRef.idx];
    if(!hasItem){
      body.classList.add('empty');
      const placeholder = listItems.length
        ? (kind==='aux' ? 'Drop auxiliary here'
           : kind==='utility' ? 'Drop '+size+' utility here'
           : 'Drop '+(SLOT_TO_SIZE[code]||code)+' weapon here')
        : '— No modules of this type —';
      body.innerHTML = `<span class="slot-placeholder">${placeholder}</span>`;
    } else {
      const it = listItems[slotRef.idx];
      body.innerHTML = `
        <span class="sf-name">${it.name||'?'}</span>
        <span class="sf-stats">${(it.cost_alloys||0)}a · ${(it.power||0)}⚡</span>
      `;
    }

    const clear = document.createElement('button');
    clear.className = 'slot-clear';
    clear.textContent = '×';
    clear.title = 'Clear slot';
    if(!hasItem) clear.style.visibility = 'hidden';
    clear.addEventListener('click', (e)=>{ e.stopPropagation(); clearSlot(row); });

    row.appendChild(tag);
    row.appendChild(body);
    row.appendChild(clear);

    row.addEventListener('dragover', (e)=>{
      e.preventDefault();
      row.classList.add('hot');
    });
    row.addEventListener('dragleave', ()=>{ row.classList.remove('hot'); });
    row.addEventListener('drop', (e)=>{
      e.preventDefault();
      row.classList.remove('hot');
      try{
        const payload = JSON.parse(e.dataTransfer.getData('text/plain'));
        if(!applyPayload(row, payload)){
          row.classList.add('reject');
          setTimeout(()=>row.classList.remove('reject'), 400);
        }
      }catch(err){}
    });

    row.addEventListener('click', ()=>{
      if(dState.picked){
        if(!applyPayload(row, dState.picked)){
          row.classList.add('reject');
          setTimeout(()=>row.classList.remove('reject'), 400);
        }
      } else if(hasItem){
        clearSlot(row);
      }
    });

    return row;
  }

  function renderSections(){
    const ship = SHIPS[dState.shipClass];
    $sections.innerHTML = '';
    ship.groups.forEach(g=>{
      const wrap = document.createElement('div');
      wrap.className = 'chips';
      wrap.style.marginBottom = '6px';
      const lbl = document.createElement('span');
      lbl.textContent = g.label;
      lbl.style.cssText = "font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-dim);align-self:center;margin-right:6px";
      wrap.appendChild(lbl);
      g.options.forEach(o=>{
        const b = document.createElement('button');
        b.className = 'chip' + (dState.sectionChoice[g.id]===o.name?' active':'');
        b.textContent = o.name;
        b.addEventListener('click', ()=>{
          dState.sectionChoice[g.id] = o.name;
          rebuildSlotsFromSections();
          renderDesigner();
        });
        wrap.appendChild(b);
      });
      $sections.appendChild(wrap);
    });
  }

  function renderSlotsOnly(){
    $weapons.innerHTML = '';
    if(dState.weaponLoadout.length===0){
      $weapons.innerHTML = '<div class="slot-empty-note">No weapon slots.</div>';
    } else {
      dState.weaponLoadout.forEach((slot, i)=>{
        const list = weaponsBySize[SLOT_TO_SIZE[slot.code]] || [];
        $weapons.appendChild(buildSlot('weapon', slot.code, null, list, slot, slot.groupId, i, null));
      });
    }

    $utility.innerHTML = '';
    let hasUtil = false;
    ['Small','Medium','Large'].forEach(size=>{
      dState.utilityLoadout[size].forEach((slot, subI)=>{
        hasUtil = true;
        const code = {Small:'S',Medium:'M',Large:'L'}[size];
        $utility.appendChild(buildSlot('utility', code, size, utilsBySize[size], slot, slot.groupId, null, subI));
      });
    });
    if(!hasUtil) $utility.innerHTML = '<div class="slot-empty-note">No utility slots.</div>';

    $aux.innerHTML = '';
    if(dState.auxLoadout.length===0){
      $aux.innerHTML = '<div class="slot-empty-note">No auxiliary slots.</div>';
    } else {
      dState.auxLoadout.forEach((slot, i)=>{
        $aux.appendChild(buildSlot('aux', null, null, auxList, slot, slot.groupId, i, null));
      });
    }

    // Re-apply accept highlights if something is picked
    if(dState.picked) highlightAcceptingSlots(dState.picked, true);
  }

  function renderDesigner(){
    renderSections();
    renderSlotsOnly();
    updateSummary();
    renderPaletteSizes();
    renderPalette();
    refreshPickedUI();
  }

  function updateSummary(){
    const ship = SHIPS[dState.shipClass];
    const base = ship.base;

    // Aggregate from weapons
    let cost = base.cost;
    let power = 0;
    let d1s=0, d1a=0, d1h=0, avgS=0, avgA=0, avgH=0;
    let shields=0, shieldRegen=0, shieldHard=0, armor=0, armorHard=0, hullBonus=0, evasionBonus=0;

    dState.weaponLoadout.forEach(slot=>{
      if(slot.idx==null) return;
      const list = weaponsBySize[SLOT_TO_SIZE[slot.code]]||[];
      const w = list[slot.idx]; if(!w) return;
      cost += w.cost_alloys||0;
      power -= w.power||0; // weapons consume power
      d1s += w.d1_shields||0; d1a += w.d1_armor||0; d1h += w.d1_hull||0;
      avgS += w.avg_shields||0; avgA += w.avg_armor||0; avgH += w.avg_hull||0;
    });

    // Utility aggregation
    ['Small','Medium','Large'].forEach(size=>{
      dState.utilityLoadout[size].forEach(slot=>{
        if(slot.idx==null) return;
        const u = utilsBySize[size][slot.idx]; if(!u) return;
        cost += u.cost_alloys||0;
        power -= u.power||0;
        shields += u.shields||0;
        shieldRegen += u.regen||0;
        shieldHard = Math.max(shieldHard, u.shield_hardening||0);
        armor += u.armor||0;
        armorHard = Math.max(armorHard, u.armor_hardening||0);
        hullBonus += u.hull||0;
        evasionBonus += u.evasion||0;
      });
    });

    // Aux aggregation
    dState.auxLoadout.forEach(slot=>{
      if(slot.idx==null) return;
      const a = auxList[slot.idx]; if(!a) return;
      cost += a.cost_alloys||0;
      power -= a.power||0;
      evasionBonus += a.evasion||0;
      shieldHard = Math.max(shieldHard, a.shield_hardening||0);
      armorHard = Math.max(armorHard, a.armor_hardening||0);
      armor += a.armor_hp||0;
    });

    const totalHull = base.hull + hullBonus;
    const totalEvasion = Math.min(0.9, base.evasion + evasionBonus);

    const maxDmg = Math.max(avgS, avgA, avgH, 1);

    $summary.innerHTML = `
      <div class="ship-title">${dState.shipClass}</div>
      <div class="ship-sub">${ship.groups.map(g=>dState.sectionChoice[g.id]).join(' · ')}</div>

      <div class="sum-block">
        <div class="sum-title">Cost &amp; Power</div>
        <div class="stat-row"><span class="k">Alloy cost</span><span class="v warn">${fmt(cost)}</span></div>
        <div class="stat-row"><span class="k">Power balance</span><span class="v ${power<0?'neg':'good'}">${power>0?'+':''}${fmt(power)}</span></div>
      </div>

      <div class="sum-block">
        <div class="sum-title">Offense · Average Damage / day</div>
        <div class="stat-row"><span class="k">vs Shields</span><span class="v shields">${fmt(avgS,2)}</span></div>
        <div class="dmgbar s"><span style="width:${(avgS/maxDmg*100).toFixed(1)}%"></span></div>
        <div class="stat-row"><span class="k">vs Armor</span><span class="v armor">${fmt(avgA,2)}</span></div>
        <div class="dmgbar a"><span style="width:${(avgA/maxDmg*100).toFixed(1)}%"></span></div>
        <div class="stat-row"><span class="k">vs Hull</span><span class="v hull">${fmt(avgH,2)}</span></div>
        <div class="dmgbar h"><span style="width:${(avgH/maxDmg*100).toFixed(1)}%"></span></div>
      </div>

      <div class="sum-block">
        <div class="sum-title">Day-1 Alpha Strike</div>
        <div class="stat-row"><span class="k">vs Shields</span><span class="v shields">${fmt(d1s)}</span></div>
        <div class="stat-row"><span class="k">vs Armor</span><span class="v armor">${fmt(d1a)}</span></div>
        <div class="stat-row"><span class="k">vs Hull</span><span class="v hull">${fmt(d1h)}</span></div>
      </div>

      <div class="sum-block">
        <div class="sum-title">Defense</div>
        <div class="stat-row"><span class="k">Shields</span><span class="v shields">${fmt(shields)}</span></div>
        <div class="stat-row"><span class="k">Shield regen</span><span class="v">${fmt(shieldRegen,1)}</span></div>
        <div class="stat-row"><span class="k">Shield hardening</span><span class="v">${(shieldHard*100).toFixed(0)}%</span></div>
        <div class="stat-row"><span class="k">Armor</span><span class="v armor">${fmt(armor)}</span></div>
        <div class="stat-row"><span class="k">Armor hardening</span><span class="v">${(armorHard*100).toFixed(0)}%</span></div>
        <div class="stat-row"><span class="k">Hull</span><span class="v hull">${fmt(totalHull)}</span></div>
        <div class="stat-row"><span class="k">Evasion</span><span class="v">${(totalEvasion*100).toFixed(0)}%</span></div>
      </div>

      <div class="sum-block">
        <div class="sum-title">Damage per Alloy</div>
        <div class="stat-row"><span class="k">vs Shields</span><span class="v shields">${cost>0?fmt(avgS/cost,3):'—'}</span></div>
        <div class="stat-row"><span class="k">vs Armor</span><span class="v armor">${cost>0?fmt(avgA/cost,3):'—'}</span></div>
        <div class="stat-row"><span class="k">vs Hull</span><span class="v hull">${cost>0?fmt(avgH/cost,3):'—'}</span></div>
      </div>
    `;
  }

  // init designer
  $ship.value = dState.shipClass;
  resetLoadout();
  renderDesigner();

  /* ---------- Ships tab ---------- */
  // normalize ships fields (some are datetime from spreadsheet bug)
  const ships = D.ships.map(s=>{
    const clean = {...s};
    ['slots_u','slots_a'].forEach(k=>{
      if(typeof clean[k]==='string' && clean[k].includes('T')) clean[k]=null;
    });
    return clean;
  });
  makeTable({
    tableId:'s-table', rows:ships,
    columns:[
      {key:'type', align:'left', fmt:v=>'<span class="wname">'+(v||'')+'</span>'},
      {key:'sections'},
      {key:'command_points'},
      {key:'base_cost'},
      {key:'build_time'},
      {key:'slots_w'},
      {key:'base_hull', bar:true, barClass:'hull'},
      {key:'base_evasion', fmt:pct},
      {key:'base_speed'},
      {key:'disengage'},
    ],
    defaultSort:'base_cost', defaultDir:'asc',
  });
})();
