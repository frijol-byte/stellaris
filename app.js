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
      ['weapons','utilities','auxiliaries','ships'].forEach(k=>{
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

  /* ---------- Ship Designer tab ---------- */
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
  // Utilities by size (for utility slots)
  const utilsBySize = {Small:[],Medium:[],Large:[]};
  D.utilities.forEach(u=>{ if(utilsBySize[u.size]) utilsBySize[u.size].push(u); });
  Object.keys(utilsBySize).forEach(k=>utilsBySize[k].sort((a,b)=>(a.name||'').localeCompare(b.name||'')));

  const auxList = D.auxiliaries.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||''));

  const dState = {
    shipClass: 'Corvette',
    sectionChoice: {}, // groupId -> option name
    weaponLoadout: [], // parallel to current slot list: array of {slotCode, weaponIndex|null}
    utilityLoadout: {Small:[], Medium:[], Large:[]}, // arrays of util index|null
    auxLoadout: [],
  };

  const $ship = document.getElementById('d-ship');
  const $sections = document.getElementById('d-sections');
  const $weapons = document.getElementById('d-weapons');
  const $utility = document.getElementById('d-utility');
  const $aux = document.getElementById('d-aux');
  const $summary = document.getElementById('d-summary');

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

  function resetLoadout(){
    const ship = SHIPS[dState.shipClass];
    dState.sectionChoice = {};
    ship.groups.forEach(g=>{ dState.sectionChoice[g.id] = g.options[0].name; });
    dState.weaponLoadout = currentWeaponSlots().map(code=>({code, idx:null}));
    dState.utilityLoadout = {Small:[], Medium:[], Large:[]};
    Object.entries(ship.slots.utility).forEach(([size,n])=>{
      for(let i=0;i<n;i++) dState.utilityLoadout[size].push(null);
    });
    dState.auxLoadout = Array.from({length:ship.slots.aux}, ()=>null);
  }

  function currentWeaponSlots(){
    const ship = SHIPS[dState.shipClass];
    const codes = [];
    ship.groups.forEach(g=>{
      const chosen = g.options.find(o=>o.name===dState.sectionChoice[g.id]) || g.options[0];
      chosen.weapons.forEach(c=>codes.push(c));
    });
    return codes;
  }

  function renderDesigner(){
    const ship = SHIPS[dState.shipClass];

    // Section picker: one chip row per group
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
          dState.weaponLoadout = currentWeaponSlots().map(code=>({code, idx:null}));
          renderDesigner();
        });
        wrap.appendChild(b);
      });
      $sections.appendChild(wrap);
    });

    // Weapon slots
    $weapons.innerHTML = '';
    dState.weaponLoadout.forEach((slot,i)=>{
      const row = buildSlotRow(slot.code, weaponsBySize[SLOT_TO_SIZE[slot.code]]||[], slot.idx, (newIdx)=>{
        slot.idx = newIdx;
        updateSummary();
      });
      $weapons.appendChild(row);
    });

    // Utility slots
    $utility.innerHTML = '';
    ['Small','Medium','Large'].forEach(size=>{
      const arr = dState.utilityLoadout[size];
      arr.forEach((idx,i)=>{
        const code = {Small:'S',Medium:'M',Large:'L'}[size];
        const row = buildSlotRow(code, utilsBySize[size], idx, (newIdx)=>{
          arr[i] = newIdx;
          updateSummary();
        }, 'util');
        $utility.appendChild(row);
      });
    });

    // Aux slots
    $aux.innerHTML = '';
    dState.auxLoadout.forEach((idx,i)=>{
      const row = buildSlotRow('A', auxList, idx, (newIdx)=>{
        dState.auxLoadout[i] = newIdx;
        updateSummary();
      }, 'aux');
      $aux.appendChild(row);
    });

    updateSummary();
  }

  function buildSlotRow(code, items, selectedIdx, onChange, kind){
    const row = document.createElement('div');
    row.className = 'slot-row';
    const tag = document.createElement('div');
    tag.className = 'slot-tag ' + code.toLowerCase();
    tag.textContent = code==='A' ? 'AUX' : code;
    const sel = document.createElement('select');
    const empty = document.createElement('option');
    empty.value=''; empty.textContent='— Empty —';
    sel.appendChild(empty);
    items.forEach((it,i)=>{
      const o = document.createElement('option');
      o.value = i;
      const sz = it.size ? ' ('+({Small:'S',Medium:'M',Large:'L','X-Large':'X',Guided:'G',Hangar:'H',PD:'PD',Titan:'T'})[it.size]+')' : '';
      o.textContent = (it.name||'?')+sz+'  —  '+(it.cost_alloys||0)+'a';
      sel.appendChild(o);
    });
    sel.value = selectedIdx==null ? '' : String(selectedIdx);
    sel.addEventListener('change', ()=>{
      const v = sel.value==='' ? null : Number(sel.value);
      onChange(v);
      // update cost label
      const it = v==null?null:items[v];
      costEl.innerHTML = it ? '<b>'+(it.cost_alloys||0)+'</b>a' : '—';
    });
    const costEl = document.createElement('div');
    costEl.className = 'slot-cost';
    const sel0 = selectedIdx==null?null:items[selectedIdx];
    costEl.innerHTML = sel0 ? '<b>'+(sel0.cost_alloys||0)+'</b>a' : '—';
    row.appendChild(tag);
    row.appendChild(sel);
    row.appendChild(costEl);
    return row;
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
      dState.utilityLoadout[size].forEach(idx=>{
        if(idx==null) return;
        const u = utilsBySize[size][idx]; if(!u) return;
        cost += u.cost_alloys||0;
        // Shield/armor components are negative power, reactors positive
        // Most utils here consume power (shields/armor both require power except armor = 0)
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
    dState.auxLoadout.forEach(idx=>{
      if(idx==null) return;
      const a = auxList[idx]; if(!a) return;
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
