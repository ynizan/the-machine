// Depth config
let MAX_DEPTH = 9;
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
  if(node.data.id==='root') return 0;
  const c   = cfg(node.depth);
  const usable = c.w - c.pad * 2;
  const cpl = Math.max(6, Math.floor(usable / (c.fs * 0.54)));

  let h = c.pad * 2;

  h += Math.max(8, Math.round(c.efs * 0.65)) * 1.4;

  h += c.efs * 1.8;
  h += c.efs * 0.6;

  if(node.data.type){
    h += c.efs * 1.6;
  }

  // Gate type is now rendered as SVG on the edge, not in the card

  const label = node.data.label || '';
  const lines = Math.ceil(label.length / cpl);
  h += Math.max(1, lines) * c.fs * c.lh;
  h += c.fs * 0.5;

  if(node.data.test){
    const tlines = Math.ceil(node.data.test.length / cpl);
    h += c.efs * 0.5;
    h += Math.max(1, tlines) * c.fs * 0.75 * c.lh;
    h += c.fs * 0.2;
  }

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
  'Segment', 'Need', 'Adoption', 'Growth', 'Feasibility', 'Economics', 'Alternative', 'solution'
];
const TYPE_LABELS = {
  Segment:'Segment', Need:'Need', Adoption:'Adoption', Growth:'Growth',
  Feasibility:'Feasibility', Economics:'Economics', Alternative:'Alternative',
  solution:'Solution'
};
const TYPE_COLORS = {
  Segment:{ text:'#D4A574', bg:'rgba(212,165,116,.12)', border:'rgba(212,165,116,.25)' },
  Need:{ text:'#E07060', bg:'rgba(224,112,96,.12)', border:'rgba(224,112,96,.25)' },
  Adoption:{ text:'#6ABF80', bg:'rgba(106,191,128,.12)', border:'rgba(106,191,128,.25)' },
  Growth:{ text:'#5AAFE0', bg:'rgba(90,175,224,.12)', border:'rgba(90,175,224,.25)' },
  Feasibility:{ text:'#B08AD6', bg:'rgba(176,138,214,.12)', border:'rgba(176,138,214,.25)' },
  Economics:{ text:'#C8A060', bg:'rgba(200,160,96,.12)', border:'rgba(200,160,96,.25)' },
  Alternative:{ text:'#E0A050', bg:'rgba(224,160,80,.12)', border:'rgba(224,160,80,.25)' },
  solution:{ text:'#6ABF80', bg:'rgba(106,191,128,.12)', border:'rgba(106,191,128,.25)' }
};

const EDGE_WIDTHS = { 1:8, 2:4, 3:2, 4:1, 5:0.5 };

// Gate type constants
const GATE_TYPES = ['AND', 'OR'];
const GATE_COLORS = {
  AND: { text:'#E0A050', bg:'rgba(224,160,80,.15)', border:'rgba(224,160,80,.30)' },
  OR:  { text:'#50B0E0', bg:'rgba(80,176,224,.15)', border:'rgba(80,176,224,.30)' }
};
const GATE_VALIDATED_COLOR = '#7FBF95';
const GATE_NOT_VALIDATED_COLOR = '#664430';

// Gate SVG dimensions per depth — proportional to card sizing
function gateSize(depth){
  const c = cfg(depth);
  const h = c.efs * 3.2;
  const w = h * 0.8;
  return { w, h };
}
// Gap between card right edge and gate left edge
function gateGap(depth){ return cfg(depth).efs * 0.8; }
// Total horizontal space a gate occupies (gap + gate width)
function gateTotalW(depth){ return gateGap(depth) + gateSize(depth).w; }

// SVG path for AND gate body (flat left, semicircle right), centered at (0,0)
function andGatePath(w, h){
  const hw = w/2, hh = h/2;
  return `M${-hw},${-hh} L${0},${-hh} A${hh},${hh} 0 0 1 ${0},${hh} L${-hw},${hh} Z`;
}
// SVG path for OR gate body (concave left, convex pointed right), centered at (0,0)
function orGatePath(w, h){
  const hw = w/2, hh = h/2;
  return `M${-hw},${-hh} Q${-hw*0.15},${0} ${-hw},${hh} `
    + `Q${hw*0.3},${hh*0.7} ${hw},${0} `
    + `Q${hw*0.3},${-hh*0.7} ${-hw},${-hh} Z`;
}

// Propagate validation and elimination up the tree based on gate types
// Validated:  AND = all validated,  OR = any validated
// Eliminated: AND = any eliminated, OR = all eliminated
// Leaf nodes (no children or no gateType): keep their own status
function propagateValidation(node){
  if(!node.children || !node.children.length) return;
  node.children.forEach(c => propagateValidation(c));
  if(node.gateType === 'AND'){
    const allValidated = node.children.every(c => c.status === 'validated');
    const anyEliminated = node.children.some(c => c.status === 'eliminated');
    if(anyEliminated) node.status = 'eliminated';
    else if(allValidated) node.status = 'validated';
    else if(node.status === 'validated' || node.status === 'eliminated') node.status = 'active';
  } else if(node.gateType === 'OR'){
    const anyValidated = node.children.some(c => c.status === 'validated');
    const allEliminated = node.children.every(c => c.status === 'eliminated');
    if(allEliminated) node.status = 'eliminated';
    else if(anyValidated) node.status = 'validated';
    else if(node.status === 'validated' || node.status === 'eliminated') node.status = 'active';
  }
}

// Check for missing gateType and show alert
function checkMissingGateTypes(data){
  const missing = [];
  function walk(node){
    if(node.id === 'root'){ if(node.children) node.children.forEach(walk); return; }
    if(node.children && node.children.length > 0 && !node.gateType) missing.push(node.id);
    if(node.children) node.children.forEach(walk);
  }
  walk(data);
  return missing;
}

function showGateTypeAlert(missingIds){
  const existing = document.getElementById('gate-alert');
  if(existing) existing.remove();
  if(!missingIds.length) return;
  const alert = document.createElement('div');
  alert.id = 'gate-alert';
  alert.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:600;background:#2A1508;border:1px solid #D4A574;border-radius:6px;padding:10px 20px;font-family:"IBM Plex Mono",monospace;font-size:11px;color:#D4A574;max-width:600px;text-align:center;cursor:pointer;';
  alert.textContent = `\u26A0 ${missingIds.length} node${missingIds.length>1?'s':''} missing gateType: ${missingIds.slice(0,5).join(', ')}${missingIds.length>5?'...':''}`;
  alert.onclick = () => alert.remove();
  document.body.appendChild(alert);
}

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

  h2 += `<div style="
    font-family:'IBM Plex Mono',monospace;font-size:${Math.max(8, Math.round(c.efs * 0.65))}px;line-height:1.2;
    color:rgba(255,255,255,.25);letter-spacing:.05em;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;
  ">${d.data.id}</div>`;

  h2 += `<div style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
    <div style="
      font-family:'IBM Plex Mono',monospace;font-size:${c.efs}px;line-height:1.2;
      letter-spacing:.1em;text-transform:uppercase;color:${ec};font-weight:500;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    ">${EYE_LABELS[st]||st}</div>
    <div style="display:flex;align-items:center;gap:${Math.max(2,btnSz*0.2)}px;flex-shrink:0;">
      <div data-edit-id="${d.data.id}" onclick="(CL_INDEX>=0 && MODIFIED_IDS.has('${d.data.id}')) ? openOldValuesDialog('${d.data.id}') : openInlineEdit('${d.data.id}', event)" style="
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
    const icon = type === 'Segment' ? '\u25C6' : type === 'Need' ? '\u25CF' :
      type === 'Adoption' ? '\u2713' : type === 'Growth' ? '\u2192' :
      type === 'Feasibility' ? '\u2699' : type === 'Economics' ? '$' :
      type === 'Alternative' ? '\u2194' :
      type === 'solution' ? '\u2713' : '\u25CB';
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

  // Test text inside the card
  if(d.data.test){
    h2 += `<div style="
      font-family:'IBM Plex Mono',monospace;font-size:${c.fs*0.72}px;line-height:${c.lh};
      color:#D4A574;
      border-top:${Math.max(1,c.fs*0.015)}px solid rgba(212,165,116,.15);
      padding-top:${c.fs*0.18}px;
      word-wrap:break-word;overflow-wrap:break-word;flex-shrink:0;
    ">\u2691 ${d.data.test}</div>`;
  }

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

function _collectAllIds(node, ids){
  if(node.id) ids.add(node.id);
  if(node.children) node.children.forEach(c => _collectAllIds(c, ids));
  return ids;
}

function _uniqueId(base){
  const allIds = _collectAllIds(CURRENT_DATA, new Set());
  let candidate = base;
  let i = 1;
  while(allIds.has(candidate)){
    candidate = base + '-' + i;
    i++;
  }
  return candidate;
}

function assignNewIds(node){
  node.id = _uniqueId(node.id + '-dup');
  if(node.children) node.children.forEach(c => assignNewIds(c));
}

// Open to right: create a new child node and open its edit popup
function openNodeRight(nodeId, evt){
  if(evt){ evt.stopPropagation(); evt.preventDefault(); }
  const nodeData = NODE_MAP[nodeId];
  if(!nodeData) return;

  // Create a new child node
  const newId = _uniqueId('new');
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
    // Collapse by depth and auto-collapse branches with no active nodes
    const ACTIVE_STATUSES = new Set(['active', 'review', 'validated']);
    function hasActiveDescendant(node){
      if(!node.children) return false;
      return node.children.some(c => ACTIVE_STATUSES.has(c.data.status) || hasActiveDescendant(c));
    }
    root.descendants().forEach(d => {
      if(d.depth >= MAX_DEPTH){ d._children = d.children; d.children = null; }
      else if(d.children && d.children.length && !ACTIVE_STATUSES.has(d.data.status) && !hasActiveDescendant(d)){
        d._children = d.children; d.children = null;
      }
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
    // Propagate validation status based on gate types
    propagateValidation(DATA);
    treeLayout(root);
    root.descendants().forEach(d => { d.y = depthX(d.depth); });
    g.selectAll('*').remove();

    const nodes = root.descendants().filter(d => d.data.id !== 'root');
    const links = root.links().filter(l => l.source.data.id !== 'root');

    const edgeG = g.append('g');

    links.forEach(l => {
      const st  = l.target.data.status;
      const dash= (st==='pending'||st==='eliminated'||st==='backlog') ? '8,5' : null;
      const srcC = cfg(l.source.depth);

      // If source has a gate, edges start from the gate's right side
      const hasGate = l.source.data.gateType && (l.source.children || l.source._children);
      const gateOff = hasGate ? gateTotalW(l.source.depth) : 0;
      const sx = l.source.y + srcC.w + gateOff;
      const sy = l.source.x;
      const tx = l.target.y;
      const ty = l.target.x;
      const mx = (sx + tx) / 2;

      const edgeDimmed = FILTER_UNCHANGED && !CHANGED_IDS.has(l.target.data.id);
      const baseOpacity = st==='eliminated' ? 0.2 : st==='pending' ? 0.45 : 0.6;

      edgeG.append('path')
        .attr('d', `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`)
        .attr('fill','none')
        .attr('stroke', (st==='pending'||st==='eliminated'||st==='backlog') ? '#D4A574' : '#FFFFFF')
        .attr('stroke-width', EDGE_WIDTHS[l.target.depth] || 0.5)
        .attr('stroke-dasharray', dash)
        .attr('opacity', edgeDimmed ? baseOpacity * 0.15 : baseOpacity);
    });

    // Draw gate symbols on edges (right exit of parent nodes)
    const gateG = g.append('g');
    const drawnGates = new Set();
    nodes.forEach(d => {
      if(!d.data.gateType || !(d.children || d._children)) return;
      if(drawnGates.has(d.data.id)) return;
      drawnGates.add(d.data.id);

      const c = cfg(d.depth);
      const gs = gateSize(d.depth);
      const gap = gateGap(d.depth);

      // Gate center: right of card + gap + half gate width, vertically centered on node
      const cx = d.y + c.w + gap + gs.w / 2;
      const cy = d.x;

      const isDimmed = FILTER_UNCHANGED && !CHANGED_IDS.has(d.data.id);

      // Determine if gate condition is met
      const kids = d.children || d._children || [];
      const kidsData = kids.map(k => k.data || k);
      const gt = d.data.gateType;
      let gateMet = false;
      if(gt === 'AND') gateMet = kidsData.length > 0 && kidsData.every(k => k.status === 'validated');
      else if(gt === 'OR') gateMet = kidsData.some(k => k.status === 'validated');

      const gateColor = gateMet ? GATE_VALIDATED_COLOR : (GATE_COLORS[gt] || GATE_COLORS.AND).text;
      const gateFill = gateMet ? 'rgba(127,191,149,.12)' : (GATE_COLORS[gt] || GATE_COLORS.AND).bg;
      const gateBorder = gateMet ? 'rgba(127,191,149,.4)' : (GATE_COLORS[gt] || GATE_COLORS.AND).border;

      const gg = gateG.append('g')
        .attr('transform', `translate(${cx},${cy})`)
        .attr('opacity', isDimmed ? 0.12 : 1);

      // Gate body — flipped horizontally (multi-leg right, single-leg left)
      const pathD = gt === 'AND' ? andGatePath(gs.w, gs.h) : orGatePath(gs.w, gs.h);
      gg.append('path')
        .attr('d', pathD)
        .attr('transform', 'scale(-1,1)')
        .attr('fill', gateFill)
        .attr('stroke', gateBorder)
        .attr('stroke-width', Math.max(1, c.efs * 0.06));

      // AND flipped: semicircle is now on left, flat on right. Leftmost point at -gs.h/2
      // OR flipped: pointed tip on left, concave on right. Leftmost point at -gs.w/2
      const gateLeftX = gt === 'AND' ? -gs.h/2 : -gs.w/2;
      const gateRightX = gt === 'AND' ? gs.w/2 : gs.w/2;
      const sw = Math.max(1, c.efs * 0.08);

      // Input line (from card right edge to gate left tip)
      gg.append('line')
        .attr('x1', -gs.w/2 - gap).attr('y1', 0)
        .attr('x2', gateLeftX).attr('y2', 0)
        .attr('stroke', gateBorder).attr('stroke-width', sw);

      // Output stub (from gate flat right side outward)
      gg.append('line')
        .attr('x1', gateRightX).attr('y1', 0)
        .attr('x2', gs.w/2 + gap * 0.3).attr('y2', 0)
        .attr('stroke', gateBorder).attr('stroke-width', sw);

      // Gate label (not flipped — stays readable)
      const fontSize = Math.max(6, c.efs * 0.65);
      gg.append('text')
        .attr('x', 0)
        .attr('y', fontSize * 0.35)
        .attr('text-anchor', 'middle')
        .attr('font-family', "'IBM Plex Mono', monospace")
        .attr('font-size', fontSize)
        .attr('font-weight', '700')
        .attr('letter-spacing', '.05em')
        .attr('fill', gateColor)
        .text(gt);

      // Validated checkmark below label
      if(gateMet){
        gg.append('text')
          .attr('x', 0)
          .attr('y', fontSize * 0.35 + fontSize * 0.9)
          .attr('text-anchor', 'middle')
          .attr('font-size', fontSize * 0.8)
          .attr('fill', GATE_VALIDATED_COLOR)
          .text('\u2713');
      }

      // Output pins on right (multi-leg side) — one per child
      const numKids = kidsData.length;
      if(numKids > 1){
        const maxSpread = gs.h * 0.7;
        const pinSpacing = Math.min(maxSpread / (numKids - 1), gs.h * 0.3);
        const totalSpan = pinSpacing * (numKids - 1);
        const startY = -totalSpan / 2;
        const pinLen = gap * 0.25;
        for(let i = 0; i < numKids; i++){
          const py = startY + i * pinSpacing;
          gg.append('line')
            .attr('x1', gateRightX)
            .attr('y1', py)
            .attr('x2', gateRightX + pinLen)
            .attr('y2', py)
            .attr('stroke', gateBorder)
            .attr('stroke-width', Math.max(0.5, c.efs * 0.04))
            .attr('opacity', 0.5);
        }
      }
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
      const isDimmed = FILTER_UNCHANGED && !CHANGED_IDS.has(d.data.id);

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
          // In changelog mode, show old values dialog for modified nodes
          if(CL_INDEX >= 0 && MODIFIED_IDS.has(d.data.id)){
            openOldValuesDialog(d.data.id);
            return;
          }
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
    const nodes = root.descendants().filter(d => d.data.id !== 'root');
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

  const gateTypeOpts = [''].concat(GATE_TYPES).map(gt =>
    `<option value="${gt}" ${(nodeData.gateType||'')===gt?'selected':''}>${gt || '— None —'}</option>`
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
          ${nodeData.gateType ? `<span style="color:#888;font-size:12px;">${nodeData.status} <em>(auto from gate)</em></span><input type="hidden" id="ief-status" value="${nodeData.status}">` : `<select id="ief-status">${statusOpts}</select>`}
        </div>
        <div class="ief-field">
          <label>Type</label>
          <select id="ief-type">${typeOpts}</select>
        </div>
        <div class="ief-field">
          <label>Gate Type</label>
          <select id="ief-gatetype">${gateTypeOpts}</select>
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
    const gateTypeVal = document.getElementById('ief-gatetype').value;
    if(gateTypeVal) nodeData.gateType = gateTypeVal;
    else delete nodeData.gateType;
    nodeData.label  = document.getElementById('ief-label').value;
    nodeData.test   = document.getElementById('ief-test').value || undefined;
    const reasonVal = document.getElementById('ief-reason').value;
    nodeData.reason = reasonVal || undefined;

    // Auto-generate a meaningful ID for placeholder nodes when label is set
    if(nodeData.label && /^new(-\d+)?$/.test(nodeData.id)){
      const slug = nodeData.label.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
        .replace(/-$/, '');
      if(slug){
        const oldId = nodeData.id;
        nodeData.id = _uniqueId(slug);
        delete NODE_MAP[oldId];
        NODE_MAP[nodeData.id] = nodeData;
      }
    }

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
  if(obj.id && obj.id !== 'root' && predicate(obj)) results.push(obj);
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

// --- Changelog bar (inline, non-blocking) ---
let CHANGELOG = [];
let CL_INDEX = -1;             // current changelog entry index (-1 = none)
let CHANGED_IDS = new Set();   // currently highlighted changed node IDs
let ADDED_IDS = new Set();     // IDs of nodes added in current entry
let MODIFIED_IDS = new Set();  // IDs of nodes modified in current entry
let CL_CHANGES = [];           // current entry's changes array (with diffs)
let FILTER_UNCHANGED = false;  // whether to dim unchanged nodes
let FILTER_NEW = false;        // show only new nodes
let FILTER_MODIFIED = false;   // show only modified nodes
let CL_BAR_OPEN = false;

function loadChangelog(){
  return fetch('data/changelog.json')
    .then(r => r.ok ? r.json() : [])
    .then(data => { CHANGELOG = data; })
    .catch(() => { CHANGELOG = []; });
}

function initChangelogBar(){
  if(!CHANGELOG.length){
    document.getElementById('cl-info').textContent = 'No changelog data';
    return;
  }
  document.getElementById('cl-info').innerHTML =
    `<span class="cl-msg" style="color:#555">${CHANGELOG.length} changes tracked</span>`;
}

function toggleChangelogBar(){
  CL_BAR_OPEN = !CL_BAR_OPEN;
  const bar = document.getElementById('changelog-bar');
  const btn = document.getElementById('cl-toggle-btn');
  const canvas = document.getElementById('canvas');
  const editor = document.getElementById('editor-panel');

  bar.classList.toggle('collapsed', !CL_BAR_OPEN);
  btn.classList.toggle('active', CL_BAR_OPEN);
  canvas.classList.toggle('with-changelog', CL_BAR_OPEN);
  if(editor) editor.style.top = CL_BAR_OPEN ? '88px' : '56px';

  if(!CL_BAR_OPEN){
    // Closing: clear filter state
    clearHighlight();
  }
}

function clNav(dir){
  if(!CHANGELOG.length) return;
  if(CL_INDEX === -1) CL_INDEX = dir > 0 ? 0 : 0;
  else CL_INDEX = Math.max(0, Math.min(CL_INDEX + dir, CHANGELOG.length - 1));

  const entry = CHANGELOG[CL_INDEX];
  const info = document.getElementById('cl-info');
  const pos = `${CL_INDEX + 1}/${CHANGELOG.length}`;
  info.innerHTML = `<span class="cl-date">${entry.date}</span><span class="cl-commit">${entry.commit}</span><span class="cl-msg">${entry.message}</span>`;

  // Categorize changed IDs by action
  CHANGED_IDS = new Set(entry.changedIds);
  ADDED_IDS = new Set();
  MODIFIED_IDS = new Set();
  CL_CHANGES = entry.changes || [];
  for(const ch of CL_CHANGES){
    if(ch.action === 'added') ADDED_IDS.add(ch.id);
    else if(ch.action === 'modified') MODIFIED_IDS.add(ch.id);
  }

  const countEl = document.getElementById('cl-node-count');
  countEl.textContent = entry.changedIds.length + ' node' + (entry.changedIds.length !== 1 ? 's' : '') + ` (${pos})`;

  document.getElementById('changelog-bar').classList.add('active');

  // Auto-enable both filter checkboxes on first navigation
  if(!FILTER_NEW && !FILTER_MODIFIED){
    FILTER_NEW = true;
    FILTER_MODIFIED = true;
    FILTER_UNCHANGED = true;
    document.getElementById('cl-filter-new').checked = true;
    document.getElementById('cl-filter-modified').checked = true;
  }
  _recalcFilteredIds();
  applyHighlight();
}

function toggleChangelogFilter(){
  FILTER_NEW = document.getElementById('cl-filter-new').checked;
  FILTER_MODIFIED = document.getElementById('cl-filter-modified').checked;
  FILTER_UNCHANGED = FILTER_NEW || FILTER_MODIFIED;
  _recalcFilteredIds();
  applyHighlight();
}

function _recalcFilteredIds(){
  // Rebuild CHANGED_IDS based on which checkboxes are active
  if(CL_INDEX < 0) return;
  const entry = CHANGELOG[CL_INDEX];
  CHANGED_IDS = new Set();
  if(FILTER_NEW){
    for(const id of ADDED_IDS) CHANGED_IDS.add(id);
  }
  if(FILTER_MODIFIED){
    for(const id of MODIFIED_IDS) CHANGED_IDS.add(id);
  }
  // If neither checkbox is checked, show all (no filtering)
  if(!FILTER_NEW && !FILTER_MODIFIED){
    CHANGED_IDS = new Set(entry.changedIds);
    FILTER_UNCHANGED = false;
  }
}

function clearHighlight(){
  CL_INDEX = -1;
  CHANGED_IDS.clear();
  ADDED_IDS.clear();
  MODIFIED_IDS.clear();
  CL_CHANGES = [];
  FILTER_UNCHANGED = false;
  FILTER_NEW = false;
  FILTER_MODIFIED = false;
  document.getElementById('cl-filter-new').checked = false;
  document.getElementById('cl-filter-modified').checked = false;
  document.getElementById('changelog-bar').classList.remove('active');
  document.getElementById('cl-info').innerHTML =
    `<span class="cl-msg" style="color:#555">${CHANGELOG.length} changes tracked</span>`;
  document.getElementById('cl-node-count').textContent = '';
  applyHighlight();
}

function applyHighlight(){
  if(!CURRENT_DATA || !RENDER_FN) return;
  RENDER_FN(CURRENT_DATA, { skipResetView: true });
}

function openOldValuesDialog(nodeId){
  // Find the change entry for this node in the current changelog entry
  const change = CL_CHANGES.find(ch => ch.id === nodeId && ch.action === 'modified');
  if(!change || !change.diffs || !change.diffs.length) return false;

  const nodeData = NODE_MAP[nodeId];
  const existing = document.querySelector('.inline-edit-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'inline-edit-overlay';
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

  const FIELD_LABELS = {
    label: 'Label', status: 'Status', test: 'Test', reason: 'Data / Results',
    type: 'Type', score: 'Score', gateType: 'Gate Type'
  };

  const diffsHtml = change.diffs.map(diff => {
    const fieldLabel = FIELD_LABELS[diff.field] || diff.field;
    const fromVal = diff.from || '—';
    const toVal = diff.to || '—';
    return `
      <div style="margin-bottom:14px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;
          text-transform:uppercase;color:#666;margin-bottom:6px;">${fieldLabel}</div>
        <div style="display:flex;gap:8px;align-items:stretch;">
          <div style="flex:1;background:#1A0E0E;border:1px solid rgba(180,60,40,.3);
            border-radius:4px;padding:8px 10px;font-family:'IBM Plex Serif',serif;
            font-size:13px;line-height:1.5;color:#C07060;word-wrap:break-word;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:.08em;
              text-transform:uppercase;color:rgba(180,60,40,.5);margin-bottom:4px;">Before</div>
            ${typeof fromVal === 'object' ? JSON.stringify(fromVal) : fromVal}
          </div>
          <div style="flex:1;background:#0E1A10;border:1px solid rgba(90,158,111,.3);
            border-radius:4px;padding:8px 10px;font-family:'IBM Plex Serif',serif;
            font-size:13px;line-height:1.5;color:#7FBF95;word-wrap:break-word;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:.08em;
              text-transform:uppercase;color:rgba(90,158,111,.5);margin-bottom:4px;">After</div>
            ${typeof toVal === 'object' ? JSON.stringify(toVal) : toVal}
          </div>
        </div>
      </div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="inline-edit-form" style="max-width:600px;">
      <div class="ief-header">
        <h3>Changes — ${nodeData ? nodeData.label || nodeId : nodeId}</h3>
        <button class="ief-close" onclick="this.closest('.inline-edit-overlay').remove()">&times;</button>
      </div>
      <div class="ief-body" style="max-height:60vh;overflow-y:auto;">
        ${diffsHtml}
      </div>
      <div class="ief-footer">
        <div style="flex:1"></div>
        <button class="ep-btn" onclick="this.closest('.inline-edit-overlay').remove()">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  return true;
}

// Fetch data and boot
Promise.all([
  fetch('data/tree.json').then(r => r.json()),
  loadChangelog()
]).then(([data]) => {
  CURRENT_DATA = data;
  buildNodeMap(data);
  // Check for missing gateType and alert
  const missingGateTypes = checkMissingGateTypes(data);
  if(missingGateTypes.length) showGateTypeAlert(missingGateTypes);
  // Propagate validation before first render
  propagateValidation(data);
  initTree(data);
  initChangelogBar();
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
