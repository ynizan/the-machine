// Depth config
let MAX_DEPTH = 5;
const CFG = {
  1: { fs:160, efs:52,  tfs:38,  w:2000, pad:64,  gap:2200, lh:1.35, dSz:22 },
  2: { fs:80,  efs:26,  tfs:19,  w:1100, pad:36,  gap:1100, lh:1.4,  dSz:13 },
  3: { fs:40,  efs:14,  tfs:11,  w:580,  pad:22,  gap:560,  lh:1.45, dSz:8  },
  4: { fs:20,  efs:7.5, tfs:6.5, w:300,  pad:13,  gap:280,  lh:1.5,  dSz:5  },
  5: { fs:10,  efs:5,   tfs:5,   w:155,  pad:7,   gap:140,  lh:1.5,  dSz:3  },
};

function edgeFontSize(srcDepth, tgtDepth){
  return Math.min(cfg(srcDepth).fs, cfg(tgtDepth).fs);
}
function cfg(d){ return CFG[Math.min(d,5)] || CFG[5]; }

function setMaxDepth(n){
  MAX_DEPTH = Math.max(1, Math.min(n, 99));
  const el = document.getElementById('depth-val');
  if(el) el.textContent = MAX_DEPTH;
  CURRENT_ROOT = null; // Reset so depth-based collapsing re-applies
  if(CURRENT_DATA && RENDER_FN) RENDER_FN(CURRENT_DATA);
}

function depthX(depth){
  let x = 80;
  for(let d=1;d<depth;d++) x += cfg(d).w + cfg(d).gap;
  return x;
}

function cardHeight(node){
  if(node.data.id==='__root__') return 0;
  const c   = cfg(node.depth);
  const usable = c.w - c.pad * 2;
  const cpl = Math.max(6, Math.floor(usable / (c.fs * 0.54)));

  let h = c.pad * 2;

  h += c.efs * 1.8;
  h += c.efs * 0.6;

  if(node.data.type){
    h += c.efs * 1.6;
  }

  const label = node.data.label || '';
  const lines = Math.ceil(label.length / cpl);
  h += Math.max(1, lines) * c.fs * c.lh;
  h += c.fs * 0.5;

  if(node.data.reason){
    const rlines = Math.ceil(node.data.reason.length / cpl);
    h += c.efs * 0.5;
    h += Math.max(1, rlines) * c.fs * 0.85 * c.lh;
    h += c.fs * 0.3;
  }

  if(node.data.score && node.data.status === 'validated'){
    h += c.efs * 0.6;
    h += c.dSz * 1.6;
    h += c.efs * 1.4;
    h += c.dSz * 0.4;
  }

  const hasKids = !!(node._children && node._children.length);
  if(hasKids){
    h += c.efs * 1.8;
  }

  return Math.ceil(h * 1.08);
}

// Status helpers
const FILLS = {
  validated:'#0E1710', active:'#0D0D0D',
  pending:'#100E0A', eliminated:'#0C0C0C', review:'#0E1418',
  backlog:'#0F0E10'
};
const BORDERS = {
  validated:'#2A2A2A', active:'#1E1E1E',
  pending:'#7A5828', eliminated:'#181818', review:'#28607A',
  backlog:'#3A2E4A'
};
const EYE_COLORS = {
  validated:'#7FBF95', active:'#555',
  pending:'#A07840', eliminated:'#383838', review:'#6AB0D2',
  backlog:'#9A8AB8'
};
const LBL_COLORS = {
  validated:'#E8E8E8', active:'#BBBBBB',
  pending:'#8A7855', eliminated:'#3A3A3A', review:'#9AC8E0',
  backlog:'#8878A0'
};
const EDGE_COLORS = {
  validated:'#4A8A60', active:'#383838',
  pending:'#6A4818', eliminated:'#1E1E1E', review:'#3A7A9A',
  backlog:'#4A3A60'
};
const EYE_LABELS = {
  validated:'\u2713  Validated',
  active:'\u25CF  Active', pending:'\u25CC  Pending', eliminated:'\u2715  Eliminated',
  review:'\u25C9  Review', backlog:'\u25CB  Backlog'
};

const HYPOTHESIS_TYPES = [
  'problem', 'problem_space', 'solution', 'hypothesis', 'viral_sending', 'viral_receiving', 'revenue', 'unit_economics', 'market'
];
const TYPE_LABELS = {
  problem:'Problem', problem_space:'Problem Space', solution:'Solution', hypothesis:'Hypothesis',
  viral_sending:'Viral Sending', viral_receiving:'Viral Receiving', revenue:'Revenue',
  unit_economics:'Unit Economics', market:'Market'
};
const TYPE_COLORS = {
  problem:{ text:'#E07060', bg:'rgba(224,112,96,.12)', border:'rgba(224,112,96,.25)' },
  problem_space:{ text:'#C85A4A', bg:'rgba(200,90,74,.10)', border:'rgba(200,90,74,.20)' },
  solution:{ text:'#6ABF80', bg:'rgba(106,191,128,.12)', border:'rgba(106,191,128,.25)' },
  hypothesis:{ text:'#B08AD6', bg:'rgba(176,138,214,.12)', border:'rgba(176,138,214,.25)' },
  viral_sending:{ text:'#5AAFE0', bg:'rgba(90,175,224,.12)', border:'rgba(90,175,224,.25)' },
  viral_receiving:{ text:'#4A9ACE', bg:'rgba(74,154,206,.10)', border:'rgba(74,154,206,.20)' },
  revenue:{ text:'#D4A574', bg:'rgba(212,165,116,.12)', border:'rgba(212,165,116,.25)' },
  unit_economics:{ text:'#C8A060', bg:'rgba(200,160,96,.12)', border:'rgba(200,160,96,.25)' },
  market:{ text:'#D4A574', bg:'rgba(212,165,116,.12)', border:'rgba(212,165,116,.25)' }
};

const EDGE_WIDTHS = { 1:8, 2:4, 3:2, 4:1, 5:0.5 };

// Card HTML
function cardHTML(d, c, h){
  const { status:st, label, reason, score, type } = d.data;
  const hasKids = !!(d._children && d._children.length);
  const ec = EYE_COLORS[st] || '#555';
  const lc = LBL_COLORS[st] || '#999';
  const strike = st==='eliminated'
    ? 'text-decoration:line-through;text-decoration-color:rgba(160,60,40,.55);' : '';

  const btnSz = Math.max(14, Math.round(c.efs * 1.0));
  const iconSz = Math.max(10, Math.round(btnSz * 0.75));

  let h2 = '';

  h2 += `<div style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
    <div style="
      font-family:'IBM Plex Mono',monospace;font-size:${c.efs}px;line-height:1.2;
      letter-spacing:.1em;text-transform:uppercase;color:${ec};font-weight:500;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    ">${EYE_LABELS[st]||st}</div>
    <div style="display:flex;align-items:center;gap:${Math.max(2,btnSz*0.2)}px;flex-shrink:0;">
      <div data-edit-id="${d.data.id}" onclick="openInlineEdit('${d.data.id}', event)" style="
        display:flex;align-items:center;justify-content:center;
        width:${btnSz}px;height:${btnSz}px;border-radius:${Math.max(2,btnSz*0.2)}px;
        color:rgba(255,255,255,.25);cursor:pointer;
        transition:all .15s;font-size:${iconSz}px;
      " onmouseenter="this.style.color='rgba(255,255,255,.7)';this.style.background='rgba(255,255,255,.08)'"
         onmouseleave="this.style.color='rgba(255,255,255,.25)';this.style.background='transparent'"
      >${pencilSVG(iconSz)}</div>
      <div onclick="deleteNode('${d.data.id}', event)" style="
        display:flex;align-items:center;justify-content:center;
        width:${btnSz}px;height:${btnSz}px;border-radius:${Math.max(2,btnSz*0.2)}px;
        color:rgba(255,255,255,.25);cursor:pointer;
        transition:all .15s;font-size:${iconSz}px;
      " onmouseenter="this.style.color='rgba(230,100,80,.8)';this.style.background='rgba(180,60,40,.15)'"
         onmouseleave="this.style.color='rgba(255,255,255,.25)';this.style.background='transparent'"
        title="Delete"
      >${trashSVG(iconSz)}</div>
      <div onclick="duplicateNode('${d.data.id}', event)" style="
        display:flex;align-items:center;justify-content:center;
        width:${btnSz}px;height:${btnSz}px;border-radius:${Math.max(2,btnSz*0.2)}px;
        color:rgba(255,255,255,.25);cursor:pointer;
        transition:all .15s;font-size:${iconSz}px;
      " onmouseenter="this.style.color='rgba(255,255,255,.7)';this.style.background='rgba(255,255,255,.08)'"
         onmouseleave="this.style.color='rgba(255,255,255,.25)';this.style.background='transparent'"
        title="Duplicate"
      >${duplicateSVG(iconSz)}</div>
      <div onclick="openNodeRight('${d.data.id}', event)" style="
        display:flex;align-items:center;justify-content:center;
        width:${btnSz}px;height:${btnSz}px;border-radius:${Math.max(2,btnSz*0.2)}px;
        color:rgba(255,255,255,.25);cursor:pointer;
        transition:all .15s;font-size:${iconSz}px;
      " onmouseenter="this.style.color='rgba(255,255,255,.7)';this.style.background='rgba(255,255,255,.08)'"
         onmouseleave="this.style.color='rgba(255,255,255,.25)';this.style.background='transparent'"
        title="Open to right"
      >${openRightSVG(iconSz)}</div>
    </div>
  </div>`;

  if(type){
    const tc = TYPE_COLORS[type] || { text:'#999', bg:'rgba(255,255,255,.06)', border:'rgba(255,255,255,.12)' };
    const icon = type === 'market' ? '\u25C6' : type === 'problem' || type === 'problem_space' ? '\u25CF' :
      type === 'solution' ? '\u2713' : type === 'hypothesis' ? '?' :
      type.startsWith('viral') ? '\u2192' : '\u25CB';
    h2 += `<div style="
      display:inline-flex;align-items:center;gap:${c.efs*0.25}px;
      font-family:'IBM Plex Mono',monospace;font-size:${c.efs*0.72}px;
      letter-spacing:.08em;text-transform:uppercase;
      color:${tc.text};background:${tc.bg};
      border:1px solid ${tc.border};
      padding:${c.efs*0.15}px ${c.efs*0.4}px;border-radius:3px;
      align-self:flex-start;flex-shrink:0;
    ">${icon} ${TYPE_LABELS[type] || type}</div>`;
  }

  h2 += `<div style="
    font-family:'IBM Plex Serif',serif;font-size:${c.fs}px;line-height:${c.lh};
    color:${lc};${strike}
    word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;flex-shrink:0;
  ">${label}</div>`;

  if(reason){
    const reasonColor = st==='validated' ? '#5A9E6F' : st==='eliminated' ? '#8B2E20' : '#777';
    const reasonBorder = st==='validated' ? 'rgba(90,158,111,.22)' : st==='eliminated' ? 'rgba(139,46,32,.22)' : 'rgba(255,255,255,.08)';
    h2 += `<div style="
      font-family:'IBM Plex Serif',serif;font-size:${c.fs*0.82}px;line-height:${c.lh};
      color:${reasonColor};font-style:italic;
      border-top:${Math.max(1,c.fs*0.015)}px solid ${reasonBorder};
      padding-top:${c.fs*0.22}px;
      word-wrap:break-word;overflow-wrap:break-word;flex-shrink:0;
    ">\u21A9 ${reason}</div>`;
  }

  if(score && st === 'validated'){
    const ds = c.dSz;
    h2 += `<div style="
      display:flex;gap:${ds*2}px;
      border-top:${Math.max(1,c.fs*0.015)}px solid #1E1E1E;
      padding-top:${ds*1.1}px;flex-shrink:0;
    ">`;
    for(const [k,v] of Object.entries(score)){
      h2 += `<div style="display:flex;flex-direction:column;align-items:center;gap:${ds*0.35}px;">
        <div style="display:flex;gap:${ds*0.38}px;">
          ${[1,2,3].map(i=>`<div style="
            width:${ds}px;height:${ds}px;border-radius:50%;
            background:${i<=v?'#D4A574':'#1C1C1C'};
          "></div>`).join('')}
        </div>
        <div style="
          font-family:'IBM Plex Mono',monospace;font-size:${Math.max(5,c.efs*0.6)}px;
          letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.22);
          white-space:nowrap;
        ">${k}</div>
      </div>`;
    }
    h2 += `</div>`;
  }

  if(hasKids){
    const n = d._children.length;
    h2 += `<div style="
      display:inline-flex;align-items:center;gap:${c.efs*0.28}px;
      font-family:'IBM Plex Mono',monospace;font-size:${c.efs*0.72}px;
      letter-spacing:.07em;text-transform:uppercase;
      color:rgba(255,255,255,.28);background:rgba(255,255,255,.05);
      padding:${c.efs*0.18}px ${c.efs*0.42}px;border-radius:3px;
      align-self:flex-start;flex-shrink:0;
    ">\u25B6 ${n} branch${n===1?'':'es'}</div>`;
  }

  return h2;
}

function brighten(hex){
  const r = parseInt(hex.slice(1,3),16);
  const g2= parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const f = 1.14;
  return `rgb(${Math.min(255,Math.round(r*f))},${Math.min(255,Math.round(g2*f))},${Math.min(255,Math.round(b*f))})`;
}

// Duplicate node
function duplicateNode(nodeId, evt){
  if(evt){ evt.stopPropagation(); evt.preventDefault(); }
  const parent = findParent(CURRENT_DATA, nodeId);
  if(!parent || !parent.children) return;
  const idx = parent.children.findIndex(c => c.id === nodeId);
  if(idx === -1) return;
  const clone = JSON.parse(JSON.stringify(parent.children[idx]));
  assignNewIds(clone);
  parent.children.splice(idx + 1, 0, clone);
  markDirty();
  NODE_MAP = {};
  buildNodeMap(CURRENT_DATA);
  RENDER_FN(CURRENT_DATA, {skipResetView: true});
  showToast('Duplicated!');
}

function deleteNode(nodeId, evt){
  if(evt){ evt.stopPropagation(); evt.preventDefault(); }
  const nodeData = NODE_MAP[nodeId];
  if(!nodeData) return;

  // Remove any existing overlay first
  const existingOverlay = document.querySelector('.inline-edit-overlay');
  if(existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.className = 'inline-edit-overlay';
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

  const childCount = nodeData.children ? nodeData.children.length : 0;
  const childWarning = childCount > 0
    ? `<p style="color:#c47a5a;margin-top:8px;">This node has ${childCount} child${childCount===1?'':'ren'} that will also be removed.</p>`
    : '';

  overlay.innerHTML = `
    <div class="inline-edit-form" style="max-width:400px;">
      <div class="ief-header">
        <h3>Delete Node</h3>
        <button class="ief-close" onclick="this.closest('.inline-edit-overlay').remove()">&times;</button>
      </div>
      <div class="ief-body">
        <p style="color:#ccc;margin:0;">Are you sure you want to delete <strong style="color:#fff;">${nodeData.label || nodeId}</strong>?</p>
        ${childWarning}
      </div>
      <div class="ief-footer">
        <div style="flex:1"></div>
        <button class="ep-btn" onclick="this.closest('.inline-edit-overlay').remove()">Cancel</button>
        <button class="ep-btn" id="ief-confirm-delete" style="background:rgba(180,60,40,.35);color:#e88;border-color:rgba(180,60,40,.5);">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('ief-confirm-delete').onclick = () => {
    const parent = findParent(CURRENT_DATA, nodeId);
    if(!parent || !parent.children) { overlay.remove(); return; }
    const idx = parent.children.findIndex(c => c.id === nodeId);
    if(idx === -1) { overlay.remove(); return; }
    parent.children.splice(idx, 1);
    if(!parent.children.length) delete parent.children;
    overlay.remove();
    markDirty();
    NODE_MAP = {};
    buildNodeMap(CURRENT_DATA);
    RENDER_FN(CURRENT_DATA, {skipResetView: true});
    showToast('Deleted!');
  };
}

function findParent(obj, targetId){
  if(!obj || !obj.children) return null;
  for(const child of obj.children){
    if(child.id === targetId) return obj;
    const found = findParent(child, targetId);
    if(found) return found;
  }
  return null;
}

let _dupCounter = 0;
function assignNewIds(node){
  _dupCounter++;
  node.id = node.id + '-dup-' + _dupCounter;
  if(node.children) node.children.forEach(c => assignNewIds(c));
}

// Open to right: create a new child node and open its edit popup
function openNodeRight(nodeId, evt){
  if(evt){ evt.stopPropagation(); evt.preventDefault(); }
  const nodeData = NODE_MAP[nodeId];
  if(!nodeData) return;

  // Create a new child node
  _dupCounter++;
  const newId = 'new-' + _dupCounter;
  const newNode = {
    id: newId,
    status: 'active',
    label: ''
  };

  if(!nodeData.children) nodeData.children = [];
  nodeData.children.push(newNode);

  NODE_MAP[newId] = newNode;
  markDirty();
  RENDER_FN(CURRENT_DATA, {skipResetView: true});

  // Open the edit popup for the new node after re-render
  setTimeout(() => { openInlineEdit(newId); }, 60);
}

function duplicateSVG(size){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`;
}
function openRightSVG(size){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><polyline points="16 10 19 12 16 14"/></svg>`;
}
function pencilSVG(size){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
}
function trashSVG(size){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
}
function showToast(msg){
  let t = document.getElementById('copy-toast');
  if(!t){ t = document.createElement('div'); t.id='copy-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'copy-toast show';
  clearTimeout(t._tid);
  t._tid = setTimeout(()=>{ t.className = 'copy-toast'; }, 1400);
}

// Main init
function initTree(DATA, opts){
  const svgEl = document.getElementById('tree');
  const gEl   = document.getElementById('G');
  const svg   = d3.select(svgEl);
  const g     = d3.select(gEl);

  const zoom = d3.zoom().scaleExtent([0.008, 3])
    .on('zoom', e => g.attr('transform', e.transform));
  svg.call(zoom);

  document.getElementById('zi').onclick = () => svg.transition().call(zoom.scaleBy, 1.35);
  document.getElementById('zo').onclick = () => svg.transition().call(zoom.scaleBy, 0.74);
  document.getElementById('zr').onclick = resetView;

  const root = d3.hierarchy(DATA);
  CURRENT_ROOT = root;
  if(opts && opts.collapsedIds !== undefined){
    root.descendants().forEach(d => {
      if(opts.collapsedIds.has(d.data.id)){ d._children = d.children; d.children = null; }
    });
  } else {
    root.descendants().forEach(d => {
      if(d.depth >= MAX_DEPTH){ d._children = d.children; d.children = null; }
    });
  }

  const treeLayout = d3.tree()
    .nodeSize([10, 10])
    .separation((a, b) => {
      const ah = cardHeight(a);
      const bh = cardHeight(b);
      const vgap = Math.max(cfg(a.depth).fs * 0.6, 30);
      return (ah + bh) / 2 / 10 + vgap / 10;
    });

  function render(){
    treeLayout(root);
    root.descendants().forEach(d => { d.y = depthX(d.depth); });
    g.selectAll('*').remove();

    const nodes = root.descendants().filter(d => d.data.id !== '__root__');
    const links = root.links().filter(l => l.source.data.id !== '__root__');

    const edgeG = g.append('g');

    links.forEach(l => {
      const st  = l.target.data.status;
      const dash= (st==='pending'||st==='eliminated'||st==='backlog') ? '8,5' : null;
      const srcC = cfg(l.source.depth);
      const tgtC = cfg(l.target.depth);

      const sx = l.source.y + srcC.w;
      const sy = l.source.x;
      const tx = l.target.y;
      const ty = l.target.x;
      const mx = (sx + tx) / 2;

      const edgeDimmed = FILTER_UNCHANGED && CHANGED_IDS.size > 0 && !CHANGED_IDS.has(l.target.data.id);
      const baseOpacity = st==='eliminated' ? 0.2 : st==='pending' ? 0.45 : 0.6;

      edgeG.append('path')
        .attr('d', `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`)
        .attr('fill','none')
        .attr('stroke', (st==='pending'||st==='eliminated'||st==='backlog') ? '#D4A574' : '#FFFFFF')
        .attr('stroke-width', EDGE_WIDTHS[l.target.depth] || 0.5)
        .attr('stroke-dasharray', dash)
        .attr('opacity', edgeDimmed ? baseOpacity * 0.15 : baseOpacity);

      const test = l.target.data.test;
      if(!test) return;

      const efs  = edgeFontSize(l.source.depth, l.target.depth);
      const gapW = cfg(l.source.depth).gap * 0.80;
      const lx   = sx + (tx - sx) / 2 - gapW / 2;
      const lh   = efs * 1.55;
      const estLines = Math.ceil(test.length / Math.max(6, Math.floor(gapW / (efs * 0.56))));
      const labelH = Math.max(1, estLines) * lh + efs * 0.5;
      const ly   = ty - labelH / 2;

      const bgPad = efs * 0.45;
      edgeG.append('rect')
        .attr('x', lx - bgPad).attr('y', ly - bgPad)
        .attr('width', gapW + bgPad*2).attr('height', labelH + bgPad*2)
        .attr('rx', efs * 0.28)
        .attr('fill', '#060606').attr('opacity', 0.88);

      // Use SVG <text> instead of foreignObject for iPad/iOS compatibility
      const cpl = Math.max(6, Math.floor(gapW / (efs * 0.56)));
      const words = test.split(/\s+/);
      const textLines = [];
      let curLine = '';
      for(const word of words){
        const tryLine = curLine ? curLine + ' ' + word : word;
        if(tryLine.length <= cpl){ curLine = tryLine; }
        else { if(curLine) textLines.push(curLine); curLine = word; }
      }
      if(curLine) textLines.push(curLine);

      const centerX = sx + (tx - sx) / 2;
      const totalH = textLines.length * lh;
      const startY = ty - totalH / 2 + efs * 0.38;

      const edgeTextG = edgeG.append('g')
        .style('cursor','pointer')
        .on('click', () => { openInlineEdit(l.target.data.id, null, 'test'); });

      textLines.forEach((line, i) => {
        edgeTextG.append('text')
          .attr('x', centerX)
          .attr('y', startY + i * lh)
          .attr('text-anchor', 'middle')
          .attr('fill', '#D4A574')
          .attr('opacity', 0.92)
          .attr('font-family', "'IBM Plex Mono', monospace")
          .attr('font-size', efs + 'px')
          .text(line);
      });

      // Edit icon for edge text
      const iconSz = Math.max(10, Math.round(efs * 0.85));
      const iconsX = lx + gapW + bgPad - iconSz;
      const iconsY = ly - bgPad - iconSz - efs * 0.3;

      const edgeEditG = edgeG.append('g')
        .attr('transform', `translate(${iconsX},${iconsY})`)
        .style('cursor','pointer')
        .attr('opacity', 0.25)
        .on('mouseenter', function(){ d3.select(this).attr('opacity', 0.8); })
        .on('mouseleave', function(){ d3.select(this).attr('opacity', 0.25); })
        .on('click', (evt) => { evt.stopPropagation(); openInlineEdit(l.target.data.id, evt, 'test'); });
      edgeEditG.append('svg')
        .attr('width', iconSz).attr('height', iconSz)
        .attr('viewBox', '0 0 24 24')
        .attr('fill', 'none')
        .attr('stroke', '#D4A574')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .html('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>');
    });

    const nodeG = g.append('g');

    nodes.forEach(d => {
      const h  = cardHeight(d);
      const c  = cfg(d.depth);
      const st = d.data.status;
      const xp = d.y;
      const yp = d.x - h / 2;
      const rx = Math.max(4, 12 - d.depth * 2);

      // Dim unchanged nodes when filter is active
      const isDimmed = FILTER_UNCHANGED && CHANGED_IDS.size > 0 && !CHANGED_IDS.has(d.data.id);

      let _clickTimer = null;
      const grp = nodeG.append('g')
        .attr('transform', `translate(${xp},${yp})`)
        .attr('opacity', isDimmed ? 0.12 : 1)
        .style('cursor','pointer')
        .on('click', () => {
          if(_clickTimer) clearTimeout(_clickTimer);
          _clickTimer = setTimeout(() => {
            _clickTimer = null;
            if(d._children){ d.children = d._children; d._children = null; }
            else if(d.children){ d._children = d.children; d.children = null; }
            render();
          }, 250);
        })
        .on('dblclick', (evt) => {
          if(_clickTimer){ clearTimeout(_clickTimer); _clickTimer = null; }
          evt.stopPropagation();
          openInlineEdit(d.data.id, evt);
        });

      const bgRect = grp.append('rect')
        .attr('class','card-bg')
        .attr('width', c.w).attr('height', h)
        .attr('rx', rx)
        .attr('fill', FILLS[st] || '#111')
        .attr('opacity', st==='eliminated' ? 0.55 : 1);

      grp
        .on('mouseenter', function(){ bgRect.attr('fill', brighten(FILLS[st]||'#111')); })
        .on('mouseleave', function(){ bgRect.attr('fill', FILLS[st]||'#111'); });

      if(st==='validated'){
        grp.append('rect')
          .attr('width', c.w).attr('height', c.fs*0.1)
          .attr('rx', rx)
          .attr('fill','#D4A574').attr('opacity',0.6);
      }

      grp.append('rect')
        .attr('width', c.w).attr('height', h)
        .attr('rx', rx)
        .attr('fill','none')
        .attr('stroke', BORDERS[st]||'#222')
        .attr('stroke-width', Math.max(1, c.fs*0.012))
        .attr('stroke-dasharray', (st==='pending'||st==='eliminated'||st==='backlog')
          ? `${c.fs*0.25},${c.fs*0.14}` : null)
        .attr('opacity', st==='eliminated' ? 0.4 : 1);

      const fo = grp.append('foreignObject')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', c.w)
        .attr('height', h);

      fo.append('xhtml:div')
        .attr('xmlns','http://www.w3.org/1999/xhtml')
        .style('width','100%')
        .style('height', h+'px')
        .style('padding', `${c.pad}px`)
        .style('display','flex')
        .style('flex-direction','column')
        .style('gap', `${c.efs*0.35}px`)
        .style('box-sizing','border-box')
        .style('overflow','visible')
        .html(cardHTML(d, c, h));
    });
  }

  function resetView(){
    treeLayout(root);
    root.descendants().forEach(d => { d.y = depthX(d.depth); });
    const nodes = root.descendants().filter(d => d.data.id !== '__root__');
    if(!nodes.length) return;
    const W = document.getElementById('canvas').clientWidth;
    const H = document.getElementById('canvas').clientHeight;
    const minX = Math.min(...nodes.map(d => d.y)) - 60;
    const maxX = Math.max(...nodes.map(d => d.y + cfg(d.depth).w)) + 60;
    const minY = Math.min(...nodes.map(d => d.x - cardHeight(d)/2)) - 80;
    const maxY = Math.max(...nodes.map(d => d.x + cardHeight(d)/2)) + 80;
    const tw = maxX-minX, th = maxY-minY;
    const scale = Math.min(0.92, Math.min((W-80)/tw, (H-80)/th));
    const tx = (W - tw*scale)/2 - minX*scale;
    const ty = (H - th*scale)/2 - minY*scale;
    svg.transition().duration(800)
      .call(zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(scale));
  }
  render();
  if(!opts || !opts.skipResetView){
    setTimeout(resetView, 80);
  }
  window.addEventListener('resize', resetView);
}

// --- JSON Editor Panel ---
let CURRENT_DATA = null;
let RENDER_FN = null;
let ORIGINAL_JSON = null;
let _dirty = false;
let CURRENT_ROOT = null;

function getCollapsedIds(root){
  const ids = new Set();
  if(!root) return ids;
  root.descendants().forEach(d => {
    if(d._children && d._children.length) ids.add(d.data.id);
  });
  return ids;
}

function markDirty(){
  if(!_dirty){
    _dirty = true;
    window.addEventListener('beforeunload', _beforeUnload);
  }
}
function clearDirty(){
  _dirty = false;
  window.removeEventListener('beforeunload', _beforeUnload);
}
function _beforeUnload(e){
  e.preventDefault();
  e.returnValue = '';
}

function downloadJSON(){
  const json = JSON.stringify(CURRENT_DATA, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'tree.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  clearDirty();
}

function setupEditor(data, renderFn){
  CURRENT_DATA = data;
  RENDER_FN = renderFn;
  ORIGINAL_JSON = JSON.stringify(data);

  const panel = document.getElementById('editor-panel');
  const ta    = document.getElementById('ep-textarea');
  const errEl = document.getElementById('ep-error');

  ta.value = JSON.stringify(data, null, 2);

  document.getElementById('et').onclick = () => {
    panel.classList.toggle('open');
    if(panel.classList.contains('open')){
      ta.value = JSON.stringify(CURRENT_DATA, null, 2);
    }
  };

  document.getElementById('ep-close').onclick = () => {
    panel.classList.remove('open');
  };

  document.getElementById('ep-fmt').onclick = () => {
    try{
      const parsed = JSON.parse(ta.value);
      ta.value = JSON.stringify(parsed, null, 2);
      errEl.classList.remove('show');
    }catch(e){
      errEl.textContent = 'JSON Error: ' + e.message;
      errEl.classList.add('show');
    }
  };

  document.getElementById('ep-apply').onclick = () => {
    try{
      const parsed = JSON.parse(ta.value);
      errEl.classList.remove('show');
      CURRENT_DATA = parsed;
      if(JSON.stringify(parsed) !== ORIGINAL_JSON) markDirty();
      RENDER_FN(parsed);
    }catch(e){
      errEl.textContent = 'JSON Error: ' + e.message;
      errEl.classList.add('show');
    }
  };

  document.getElementById('ep-dl').onclick = downloadJSON;

  // Tab key inserts spaces in textarea
  ta.addEventListener('keydown', e => {
    if(e.key === 'Tab'){
      e.preventDefault();
      const s = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.substring(0,s) + '  ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = s + 2;
    }
  });
}

// --- Inline Card Edit ---
let NODE_MAP = {};

function buildNodeMap(obj){
  if(!obj) return;
  if(obj.id) NODE_MAP[obj.id] = obj;
  if(obj.children) obj.children.forEach(c => buildNodeMap(c));
}

function openInlineEdit(nodeId, evt, focusField){
  if(evt){ evt.stopPropagation(); evt.preventDefault(); }
  const nodeData = NODE_MAP[nodeId];
  if(!nodeData) return;

  // Remove any existing overlay
  const existing = document.querySelector('.inline-edit-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'inline-edit-overlay';
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

  if(focusField === 'test'){
    // Simplified edge-text-only editor
    overlay.innerHTML = `
      <div class="inline-edit-form">
        <div class="ief-header">
          <h3>Edit Edge Text — ${nodeData.id}</h3>
          <button class="ief-close" onclick="this.closest('.inline-edit-overlay').remove()">&times;</button>
        </div>
        <div class="ief-body">
          <div class="ief-field">
            <label>Test</label>
            <textarea id="ief-test" rows="4">${(nodeData.test||'').replace(/"/g,'&quot;')}</textarea>
          </div>
        </div>
        <div class="ief-footer">
          <button class="ep-btn" onclick="downloadJSON()">&#8681; Download JSON</button>
          <button class="ep-btn" onclick="deleteNode('${nodeData.id}', event)" style="color:#e88;border-color:rgba(180,60,40,.5);">Delete</button>
          <div style="flex:1"></div>
          <button class="ep-btn" onclick="this.closest('.inline-edit-overlay').remove()">Cancel</button>
          <button class="ep-btn primary" id="ief-save">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const testEl = document.getElementById('ief-test');
    testEl.focus();

    document.getElementById('ief-save').onclick = () => {
      nodeData.test = testEl.value || undefined;
      if(!nodeData.test) delete nodeData.test;
      overlay.remove();
      markDirty();
      RENDER_FN(CURRENT_DATA, {skipResetView: true});
    };
    return;
  }

  const statuses = ['validated','review','active','pending','eliminated','backlog'];
  const statusOpts = statuses.map(s =>
    `<option value="${s}" ${nodeData.status===s?'selected':''}>${s}</option>`
  ).join('');

  const typeOpts = [''].concat(HYPOTHESIS_TYPES).map(t =>
    `<option value="${t}" ${(nodeData.type||'')===t?'selected':''}>${t ? TYPE_LABELS[t] : '— None —'}</option>`
  ).join('');

  const showScore = nodeData.status === 'validated';
  const scoreObj = nodeData.score || { Freq: 0, Intensity: 0, Fit: 0 };
  const scoreHtml = showScore ? Object.entries(scoreObj).map(([k,v]) =>
    `<div class="ief-field" style="display:inline-block;width:calc(50% - 6px);margin-right:4px;">
      <label>${k}</label>
      <select data-score-key="${k}">
        <option value="0" ${v===0?'selected':''}>0</option>
        <option value="1" ${v===1?'selected':''}>1</option>
        <option value="2" ${v===2?'selected':''}>2</option>
        <option value="3" ${v===3?'selected':''}>3</option>
      </select>
    </div>`
  ).join('') : '';

  overlay.innerHTML = `
    <div class="inline-edit-form">
      <div class="ief-header">
        <h3>Edit Node — ${nodeData.id}</h3>
        <button class="ief-close" onclick="this.closest('.inline-edit-overlay').remove()">&times;</button>
      </div>
      <div class="ief-body">
        <div class="ief-field">
          <label>Status</label>
          <select id="ief-status">${statusOpts}</select>
        </div>
        <div class="ief-field">
          <label>Type</label>
          <select id="ief-type">${typeOpts}</select>
        </div>
        <div class="ief-field">
          <label>Label</label>
          <textarea id="ief-label" rows="3">${(nodeData.label||'').replace(/"/g,'&quot;')}</textarea>
        </div>
        <div class="ief-field">
          <label>Test</label>
          <textarea id="ief-test" rows="2">${(nodeData.test||'').replace(/"/g,'&quot;')}</textarea>
        </div>
        <div class="ief-field">
          <label>Data / Results</label>
          <textarea id="ief-reason" rows="2">${(nodeData.reason||'').replace(/"/g,'&quot;')}</textarea>
        </div>
        <div id="ief-score-section" style="margin-top:2px;${showScore ? '' : 'display:none;'}"><div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#666;margin-bottom:8px;">Score</div>${showScore ? scoreHtml : Object.entries(scoreObj).map(([k,v]) =>
          `<div class="ief-field" style="display:inline-block;width:calc(50% - 6px);margin-right:4px;">
            <label>${k}</label>
            <select data-score-key="${k}">
              <option value="0" ${v===0?'selected':''}>0</option>
              <option value="1" ${v===1?'selected':''}>1</option>
              <option value="2" ${v===2?'selected':''}>2</option>
              <option value="3" ${v===3?'selected':''}>3</option>
            </select>
          </div>`
        ).join('')}</div>
      </div>
      <div class="ief-footer">
        <button class="ep-btn" onclick="downloadJSON()">&#8681; Download JSON</button>
        <button class="ep-btn" onclick="deleteNode('${nodeData.id}', event)" style="color:#e88;border-color:rgba(180,60,40,.5);">Delete</button>
        <div style="flex:1"></div>
        <button class="ep-btn" onclick="this.closest('.inline-edit-overlay').remove()">Cancel</button>
        <button class="ep-btn primary" id="ief-save">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('ief-status').addEventListener('change', function(){
    const scoreSection = document.getElementById('ief-score-section');
    if(this.value === 'validated'){
      scoreSection.style.display = '';
    } else {
      scoreSection.style.display = 'none';
    }
  });

  document.getElementById('ief-save').onclick = () => {
    const newStatus = document.getElementById('ief-status').value;
    nodeData.status = newStatus;
    const typeVal   = document.getElementById('ief-type').value;
    nodeData.type   = typeVal || undefined;
    if(!nodeData.type) delete nodeData.type;
    nodeData.label  = document.getElementById('ief-label').value;
    nodeData.test   = document.getElementById('ief-test').value || undefined;
    const reasonVal = document.getElementById('ief-reason').value;
    nodeData.reason = reasonVal || undefined;

    if(newStatus === 'validated'){
      // Ensure score exists; update from form if score fields were shown
      if(!nodeData.score) nodeData.score = { Freq: 0, Intensity: 0, Fit: 0 };
      overlay.querySelectorAll('[data-score-key]').forEach(sel => {
        nodeData.score[sel.dataset.scoreKey] = parseInt(sel.value);
      });
    } else {
      // Remove score for non-validated nodes
      delete nodeData.score;
    }

    // Clean up undefined fields
    if(!nodeData.test) delete nodeData.test;
    if(!nodeData.reason) delete nodeData.reason;

    overlay.remove();
    markDirty();
    RENDER_FN(CURRENT_DATA, {skipResetView: true});
  };
}

// Periodically reset visual viewport if the page got accidentally zoomed
// Remove + re-insert the viewport meta to force iOS Safari to recalculate
function resetPageZoom(){
  const vv = window.visualViewport;
  if(!vv || Math.abs(vv.scale - 1) <= 0.05) return;
  window.scrollTo(0, 0);
  const old = document.querySelector('meta[name="viewport"]');
  if(old){
    old.parentNode.removeChild(old);
    const fresh = document.createElement('meta');
    fresh.name = 'viewport';
    fresh.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no';
    document.head.appendChild(fresh);
  }
}
setInterval(resetPageZoom, 5000);
// Also reset immediately when visualViewport fires resize
if(window.visualViewport){
  window.visualViewport.addEventListener('resize', resetPageZoom);
}

// --- Navigation: Moms, Mockups, Review ---
function collectNodes(obj, predicate, results){
  if(!obj) return results;
  if(obj.id && obj.id !== '__root__' && predicate(obj)) results.push(obj);
  if(obj.children) obj.children.forEach(c => collectNodes(c, predicate, results));
  return results;
}

function openNavList(title, items){
  const existing = document.querySelector('.nav-list-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'nav-list-overlay';
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

  const listItems = items.map((item, i) => {
    const label = item.label || '';
    const test = item.test || '';
    const displayText = title === 'Review' ? label : test;
    const secondary = title === 'Review' ? (test ? `Test: ${test}` : '') : (label ? label : '');
    return `<div class="nav-list-item" data-index="${i}">
      <div class="nav-list-item-content">
        <div class="nav-list-item-primary">${displayText}</div>
        ${secondary ? `<div class="nav-list-item-secondary">${secondary}</div>` : ''}
      </div>
      <button class="nav-list-copy-btn" onclick="copyNavItem(this, event)" title="Copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
    </div>`;
  }).join('');

  const allText = items.map(item => {
    if(title === 'Review'){
      return item.label + (item.test ? '\n  Test: ' + item.test : '');
    }
    return item.test + (item.label ? '\n  (' + item.label + ')' : '');
  }).join('\n\n');

  overlay.innerHTML = `
    <div class="nav-list-panel">
      <div class="nav-list-header">
        <h3>${title} <span class="nav-list-count">${items.length}</span></h3>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="ep-btn" onclick="copyAllNavItems(this, event)" title="Copy all">Copy All</button>
          <button class="ief-close" onclick="this.closest('.nav-list-overlay').remove()">&times;</button>
        </div>
      </div>
      <div class="nav-list-body">
        ${items.length ? listItems : '<div style="color:#555;padding:20px;text-align:center;font-family:\'IBM Plex Mono\',monospace;font-size:12px;">No items found</div>'}
      </div>
    </div>
  `;

  overlay.dataset.allText = allText;
  document.body.appendChild(overlay);
}

function copyNavItem(btn, evt){
  evt.stopPropagation();
  const item = btn.closest('.nav-list-item');
  const primary = item.querySelector('.nav-list-item-primary').textContent;
  const secondary = item.querySelector('.nav-list-item-secondary');
  const text = primary + (secondary ? '\n' + secondary.textContent : '');
  navigator.clipboard.writeText(text).then(() => {
    btn.style.color = '#6ABF80';
    setTimeout(() => { btn.style.color = ''; }, 800);
    showToast('Copied!');
  });
}

function copyAllNavItems(btn, evt){
  evt.stopPropagation();
  const overlay = btn.closest('.nav-list-overlay');
  const text = overlay.dataset.allText || '';
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.style.color = '#6ABF80';
    setTimeout(() => { btn.textContent = 'Copy All'; btn.style.color = ''; }, 1200);
    showToast('All copied!');
  });
}

function openMoms(){
  const items = collectNodes(CURRENT_DATA, n => n.status === 'active' && n.test && /mom/i.test(n.test), []);
  openNavList('Mom Tests', items);
}

function openMockups(){
  const items = collectNodes(CURRENT_DATA, n => n.status === 'active' && n.test && /mockup/i.test(n.test), []);
  openNavList('Mockup Tests', items);
}

function openReview(){
  const items = collectNodes(CURRENT_DATA, n => n.status === 'review', []);
  openNavList('Review', items);
}

// --- Changelog & Hide-Unchanged ---
let CHANGELOG = [];
let CHANGED_IDS = new Set();   // currently highlighted changed node IDs
let FILTER_UNCHANGED = false;  // whether to dim unchanged nodes

function loadChangelog(){
  return fetch('data/changelog.json')
    .then(r => r.ok ? r.json() : [])
    .then(data => { CHANGELOG = data; })
    .catch(() => { CHANGELOG = []; });
}

function openChangelog(){
  const existing = document.querySelector('.nav-list-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'nav-list-overlay';
  overlay.onclick = (e) => { if(e.target === overlay){ overlay.remove(); clearHighlight(); }};

  const entries = CHANGELOG.slice(0, 30);

  const filterBar = `
    <div class="changelog-filter-bar">
      <label class="changelog-toggle">
        <input type="checkbox" id="cl-hide-unchanged" ${FILTER_UNCHANGED ? 'checked' : ''}>
        Hide unchanged
      </label>
      <span class="changelog-range" id="cl-range-label">${CHANGED_IDS.size ? CHANGED_IDS.size + ' nodes highlighted' : 'Click an entry to highlight'}</span>
    </div>
  `;

  const entryHtml = entries.map((e, i) => {
    const chips = e.changedIds.slice(0, 8).map(id =>
      `<span class="changelog-id-chip">${id}</span>`
    ).join('') + (e.changedIds.length > 8 ? `<span class="changelog-id-chip">+${e.changedIds.length - 8}</span>` : '');

    return `<div class="changelog-entry" data-index="${i}" onclick="selectChangelogEntry(${i})">
      <div>
        <span class="changelog-date">${e.date}</span>
        <span class="changelog-commit">${e.commit}</span>
      </div>
      <div class="changelog-msg">${e.message}</div>
      <div class="changelog-ids">${chips}</div>
    </div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="nav-list-panel" style="width:680px;">
      <div class="nav-list-header">
        <h3>Changelog <span class="nav-list-count">${CHANGELOG.length}</span></h3>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="ep-btn" id="cl-select-recent" onclick="selectRecentChanges(event)">Last 3 days</button>
          <button class="ep-btn" onclick="clearHighlight();this.closest('.nav-list-overlay').remove()">&times;</button>
        </div>
      </div>
      ${filterBar}
      <div class="nav-list-body">
        ${entries.length ? entryHtml : '<div style="color:#555;padding:20px;text-align:center;font-family:\'IBM Plex Mono\',monospace;font-size:12px;">No changelog entries. Run scripts/gen-changelog.js to generate.</div>'}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('cl-hide-unchanged').addEventListener('change', function(){
    FILTER_UNCHANGED = this.checked;
    applyHighlight();
  });
}

function selectChangelogEntry(index){
  const entry = CHANGELOG[index];
  if(!entry) return;

  // Toggle: if already selected, deselect
  const el = document.querySelectorAll('.changelog-entry')[index];
  if(el.classList.contains('selected')){
    el.classList.remove('selected');
    // Remove these IDs
    entry.changedIds.forEach(id => CHANGED_IDS.delete(id));
  } else {
    el.classList.add('selected');
    entry.changedIds.forEach(id => CHANGED_IDS.add(id));
  }

  updateRangeLabel();
  applyHighlight();
}

function selectRecentChanges(evt){
  if(evt) evt.stopPropagation();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = threeDaysAgo.toISOString().split('T')[0];

  CHANGED_IDS.clear();
  document.querySelectorAll('.changelog-entry').forEach((el, i) => {
    const entry = CHANGELOG[i];
    if(entry && entry.date >= cutoff){
      el.classList.add('selected');
      entry.changedIds.forEach(id => CHANGED_IDS.add(id));
    } else {
      el.classList.remove('selected');
    }
  });

  // Auto-enable hide unchanged
  FILTER_UNCHANGED = true;
  const cb = document.getElementById('cl-hide-unchanged');
  if(cb) cb.checked = true;

  updateRangeLabel();
  applyHighlight();
}

function updateRangeLabel(){
  const label = document.getElementById('cl-range-label');
  if(label) label.textContent = CHANGED_IDS.size ? CHANGED_IDS.size + ' nodes highlighted' : 'Click an entry to highlight';
}

function clearHighlight(){
  CHANGED_IDS.clear();
  FILTER_UNCHANGED = false;
  applyHighlight();
}

function applyHighlight(){
  if(!CURRENT_DATA || !RENDER_FN) return;
  RENDER_FN(CURRENT_DATA, { skipResetView: true });
}

// Fetch data and boot
Promise.all([
  fetch('data/tree.json').then(r => r.json()),
  loadChangelog()
]).then(([data]) => {
  CURRENT_DATA = data;
  buildNodeMap(data);
  initTree(data);
  setupEditor(data, (newData, opts) => {
    CURRENT_DATA = newData;
    NODE_MAP = {};
    buildNodeMap(newData);
    // Save collapse state before re-render
    const collapsedIds = CURRENT_ROOT ? getCollapsedIds(CURRENT_ROOT) : undefined;
    document.getElementById('G').innerHTML = '';
    initTree(newData, { ...opts, collapsedIds });
  });
});
