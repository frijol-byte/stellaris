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
