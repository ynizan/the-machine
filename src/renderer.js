// Depth config
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

  const tags = node.data.tags || [];
  if(tags.length){
    h += c.tfs * 2.4;
    h += c.tfs * 0.5;
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

  if(node.data.score){
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
  observation:'#1A1508', validated:'#0E1710', active:'#0D0D0D',
  pending:'#100E0A', eliminated:'#0C0C0C'
};
const BORDERS = {
  observation:'#D4A574', validated:'#2A2A2A', active:'#1E1E1E',
  pending:'#7A5828', eliminated:'#181818'
};
const EYE_COLORS = {
  observation:'#D4A574', validated:'#7FBF95', active:'#555',
  pending:'#A07840', eliminated:'#383838'
};
const LBL_COLORS = {
  observation:'#FFFFFF', validated:'#E8E8E8', active:'#BBBBBB',
  pending:'#8A7855', eliminated:'#3A3A3A'
};
const TAG_BG = {
  observation:'rgba(212,165,116,.13)', validated:'rgba(127,191,149,.09)',
  active:'rgba(255,255,255,.05)', pending:'rgba(212,165,116,.07)',
  eliminated:'rgba(255,255,255,.03)'
};
const EDGE_COLORS = {
  observation:'#D4A574', validated:'#4A8A60', active:'#383838',
  pending:'#6A4818', eliminated:'#1E1E1E'
};
const EYE_LABELS = {
  observation:'Observation', validated:'\u2713  Validated',
  active:'\u25CF  Active', pending:'\u25CC  Pending', eliminated:'\u2715  Eliminated'
};

const EDGE_WIDTHS = { 1:8, 2:4, 3:2, 4:1, 5:0.5 };

// Card HTML
function cardHTML(d, c, h){
  const { status:st, label, tags, reason, score } = d.data;
  const hasKids = !!(d._children && d._children.length);
  const ec = EYE_COLORS[st] || '#555';
  const lc = LBL_COLORS[st] || '#999';
  const tb = TAG_BG[st] || 'rgba(255,255,255,.04)';
  const strike = st==='eliminated'
    ? 'text-decoration:line-through;text-decoration-color:rgba(160,60,40,.55);' : '';

  // Register text for copy
  const copyId = 'card-' + d.data.id;
  let copyStr = label || '';
  if(reason) copyStr += '\n' + reason;
  if(tags && tags.length) copyStr = tags.join(', ') + '\n' + copyStr;
  COPY_TEXTS[copyId] = copyStr;

  const btnSz = Math.max(14, Math.round(c.efs * 0.7));
  const iconSz = Math.max(10, Math.round(btnSz * 0.65));

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
      <div data-copy-id="${copyId}" data-size="${iconSz}" onclick="copyText('${copyId}', event)" style="
        display:flex;align-items:center;justify-content:center;
        width:${btnSz}px;height:${btnSz}px;border-radius:${Math.max(2,btnSz*0.2)}px;
        color:rgba(255,255,255,.25);cursor:pointer;
        transition:all .15s;font-size:${iconSz}px;
      " onmouseenter="this.style.color='rgba(255,255,255,.7)';this.style.background='rgba(255,255,255,.08)'"
         onmouseleave="this.style.color='rgba(255,255,255,.25)';this.style.background='transparent'"
      >${copySVG(iconSz)}</div>
    </div>
  </div>`;

  if(tags && tags.length){
    h2 += `<div style="display:flex;flex-wrap:wrap;gap:${c.tfs*0.35}px;flex-shrink:0;">`;
    tags.forEach(t => {
      h2 += `<span style="
        font-family:'IBM Plex Mono',monospace;font-size:${c.tfs}px;
        letter-spacing:.06em;text-transform:uppercase;
        background:${tb};color:${ec};
        padding:${c.tfs*0.18}px ${c.tfs*0.5}px;border-radius:3px;white-space:nowrap;
      ">${t}</span>`;
    });
    h2 += `</div>`;
  }

  h2 += `<div style="
    font-family:'IBM Plex Serif',serif;font-size:${c.fs}px;line-height:${c.lh};
    color:${lc};${strike}
    word-wrap:break-word;overflow-wrap:break-word;hyphens:auto;flex-shrink:0;
  ">${label}</div>`;

  if(reason){
    h2 += `<div style="
      font-family:'IBM Plex Serif',serif;font-size:${c.fs*0.82}px;line-height:${c.lh};
      color:#8B2E20;font-style:italic;
      border-top:${Math.max(1,c.fs*0.015)}px solid rgba(139,46,32,.22);
      padding-top:${c.fs*0.22}px;
      word-wrap:break-word;overflow-wrap:break-word;flex-shrink:0;
    ">\u21A9 ${reason}</div>`;
  }

  if(score){
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

// Copy-to-clipboard
const COPY_TEXTS = {};
function copyText(id, evt){
  if(evt){ evt.stopPropagation(); evt.preventDefault(); }
  const text = COPY_TEXTS[id];
  if(!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showCopyToast();
    const btn = document.querySelector(`[data-copy-id="${id}"]`);
    if(btn){ btn.innerHTML = '&#10003;'; setTimeout(()=>{ btn.innerHTML = copySVG(btn.dataset.size||12); }, 1200); }
  });
}
function copySVG(size){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
}
function pencilSVG(size){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
}
function showCopyToast(){
  let t = document.getElementById('copy-toast');
  if(!t){ t = document.createElement('div'); t.id='copy-toast'; document.body.appendChild(t); }
  t.textContent = 'Copied!';
  t.className = 'copy-toast show';
  clearTimeout(t._tid);
  t._tid = setTimeout(()=>{ t.className = 'copy-toast'; }, 1400);
}

// Main init
function initTree(DATA){
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
  root.descendants().forEach(d => {
    if(d.depth >= 4){ d._children = d.children; d.children = null; }
  });

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
      const dash= (st==='pending'||st==='eliminated') ? '8,5' : null;
      const srcC = cfg(l.source.depth);
      const tgtC = cfg(l.target.depth);

      const sx = l.source.y + srcC.w;
      const sy = l.source.x;
      const tx = l.target.y;
      const ty = l.target.x;
      const mx = (sx + tx) / 2;

      edgeG.append('path')
        .attr('d', `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`)
        .attr('fill','none')
        .attr('stroke', (st==='pending'||st==='eliminated') ? '#D4A574' : '#FFFFFF')
        .attr('stroke-width', EDGE_WIDTHS[l.target.depth] || 0.5)
        .attr('stroke-dasharray', dash)
        .attr('opacity', st==='eliminated' ? 0.2 : st==='pending' ? 0.45 : 0.6);

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

      const edgeCopyId = 'edge-' + l.target.data.id;
      COPY_TEXTS[edgeCopyId] = test;

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
        .on('click', () => copyText(edgeCopyId));

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

      // Edit & Copy icons for edge text
      const iconSz = Math.max(10, Math.round(efs * 0.85));
      const iconGap = iconSz * 0.5;
      const iconsX = lx + gapW + bgPad - iconSz * 2 - iconGap;
      const iconsY = ly - bgPad + 2;

      const edgeEditG = edgeG.append('g')
        .attr('transform', `translate(${iconsX},${iconsY})`)
        .style('cursor','pointer')
        .attr('opacity', 0.25)
        .on('mouseenter', function(){ d3.select(this).attr('opacity', 0.8); })
        .on('mouseleave', function(){ d3.select(this).attr('opacity', 0.25); })
        .on('click', (evt) => { evt.stopPropagation(); openInlineEdit(l.target.data.id, evt); });
      edgeEditG.append('svg')
        .attr('width', iconSz).attr('height', iconSz)
        .attr('viewBox', '0 0 24 24')
        .attr('fill', 'none')
        .attr('stroke', '#D4A574')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .html('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>');

      const edgeCopyG = edgeG.append('g')
        .attr('transform', `translate(${iconsX + iconSz + iconGap},${iconsY})`)
        .style('cursor','pointer')
        .attr('opacity', 0.25)
        .on('mouseenter', function(){ d3.select(this).attr('opacity', 0.8); })
        .on('mouseleave', function(){ d3.select(this).attr('opacity', 0.25); })
        .on('click', (evt) => { evt.stopPropagation(); copyText(edgeCopyId, evt); });
      edgeCopyG.append('svg')
        .attr('width', iconSz).attr('height', iconSz)
        .attr('viewBox', '0 0 24 24')
        .attr('fill', 'none')
        .attr('stroke', '#D4A574')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .html('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>');
    });

    const nodeG = g.append('g');

    nodes.forEach(d => {
      const h  = cardHeight(d);
      const c  = cfg(d.depth);
      const st = d.data.status;
      const xp = d.y;
      const yp = d.x - h / 2;
      const rx = Math.max(4, 12 - d.depth * 2);

      const grp = nodeG.append('g')
        .attr('transform', `translate(${xp},${yp})`)
        .style('cursor','pointer')
        .on('click', () => {
          if(d._children){ d.children = d._children; d._children = null; }
          else if(d.children){ d._children = d.children; d.children = null; }
          render();
        });

      if(st==='observation'){
        grp.append('rect')
          .attr('x',-c.fs*0.05).attr('y',-c.fs*0.05)
          .attr('width', c.w + c.fs*0.1).attr('height', h + c.fs*0.1)
          .attr('rx', rx+4)
          .attr('fill','none')
          .attr('stroke','#D4A574')
          .attr('stroke-width', c.fs*0.025)
          .attr('opacity', 0.1);
      }

      const bgRect = grp.append('rect')
        .attr('class','card-bg')
        .attr('width', c.w).attr('height', h)
        .attr('rx', rx)
        .attr('fill', FILLS[st] || '#111')
        .attr('opacity', st==='eliminated' ? 0.55 : 1);

      grp
        .on('mouseenter', function(){ bgRect.attr('fill', brighten(FILLS[st]||'#111')); })
        .on('mouseleave', function(){ bgRect.attr('fill', FILLS[st]||'#111'); });

      if(st==='observation'){
        grp.append('rect')
          .attr('width', c.fs*0.18).attr('height', h)
          .attr('rx', rx)
          .attr('fill','#D4A574').attr('opacity',0.85);
      }

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
        .attr('stroke-dasharray', (st==='pending'||st==='eliminated')
          ? `${c.fs*0.25},${c.fs*0.14}` : null)
        .attr('opacity', st==='eliminated' ? 0.4 : 1);

      const xOff = st==='observation' ? c.fs*0.2 : 0;
      const fo = grp.append('foreignObject')
        .attr('x', xOff)
        .attr('y', 0)
        .attr('width', c.w - xOff)
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
  setTimeout(resetView, 80);
  window.addEventListener('resize', resetView);
}

// --- JSON Editor Panel ---
let CURRENT_DATA = null;
let RENDER_FN = null;
let ORIGINAL_JSON = null;
let _dirty = false;

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

function openInlineEdit(nodeId, evt){
  if(evt){ evt.stopPropagation(); evt.preventDefault(); }
  const nodeData = NODE_MAP[nodeId];
  if(!nodeData) return;

  // Remove any existing overlay
  const existing = document.querySelector('.inline-edit-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'inline-edit-overlay';
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

  const statuses = ['observation','validated','active','pending','eliminated'];
  const statusOpts = statuses.map(s =>
    `<option value="${s}" ${nodeData.status===s?'selected':''}>${s}</option>`
  ).join('');

  const scoreHtml = nodeData.score ? Object.entries(nodeData.score).map(([k,v]) =>
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
          <label>Label</label>
          <textarea id="ief-label" rows="3">${(nodeData.label||'').replace(/"/g,'&quot;')}</textarea>
        </div>
        <div class="ief-field">
          <label>Tags (comma-separated)</label>
          <input id="ief-tags" value="${(nodeData.tags||[]).join(', ')}">
        </div>
        <div class="ief-field">
          <label>Test</label>
          <textarea id="ief-test" rows="2">${(nodeData.test||'').replace(/"/g,'&quot;')}</textarea>
        </div>
        <div class="ief-field">
          <label>Reason</label>
          <textarea id="ief-reason" rows="2">${(nodeData.reason||'').replace(/"/g,'&quot;')}</textarea>
        </div>
        ${scoreHtml ? `<div style="margin-top:2px;"><div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#666;margin-bottom:8px;">Score</div>${scoreHtml}</div>` : ''}
      </div>
      <div class="ief-footer">
        <button class="ep-btn" onclick="downloadJSON()">&#8681; Download JSON</button>
        <div style="flex:1"></div>
        <button class="ep-btn" onclick="this.closest('.inline-edit-overlay').remove()">Cancel</button>
        <button class="ep-btn primary" id="ief-save">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('ief-save').onclick = () => {
    nodeData.status = document.getElementById('ief-status').value;
    nodeData.label  = document.getElementById('ief-label').value;
    const tagsVal   = document.getElementById('ief-tags').value.trim();
    nodeData.tags   = tagsVal ? tagsVal.split(',').map(t=>t.trim()).filter(Boolean) : [];
    nodeData.test   = document.getElementById('ief-test').value || undefined;
    const reasonVal = document.getElementById('ief-reason').value;
    nodeData.reason = reasonVal || undefined;

    if(nodeData.score){
      overlay.querySelectorAll('[data-score-key]').forEach(sel => {
        nodeData.score[sel.dataset.scoreKey] = parseInt(sel.value);
      });
    }

    // Clean up undefined fields
    if(!nodeData.test) delete nodeData.test;
    if(!nodeData.reason) delete nodeData.reason;
    if(!nodeData.tags || !nodeData.tags.length) delete nodeData.tags;

    overlay.remove();
    markDirty();
    RENDER_FN(CURRENT_DATA);
  };
}

// Fetch data and boot
fetch('data/tree.json')
  .then(r => r.json())
  .then(data => {
    CURRENT_DATA = data;
    buildNodeMap(data);
    initTree(data);
    setupEditor(data, (newData) => {
      CURRENT_DATA = newData;
      NODE_MAP = {};
      buildNodeMap(newData);
      document.getElementById('G').innerHTML = '';
      initTree(newData);
    });
  });
