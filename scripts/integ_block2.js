/* ============================================================
   ICONS · VIEW RENDERERS · LOADERS · CHARTS · INTERACTIONS
   Every view is driven by the DATA cache populated by LOAD funcs.
   ============================================================ */
const I = {
  video:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  arrowUp:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  arrowDown:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  yt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.2-4.7a2.5 2.5 0 0 0-1.8-1.8C19.5 5.3 12 5.3 12 5.3s-7.5 0-9 .2A2.5 2.5 0 0 0 1.2 7.3C1 8.8 1 12 1 12s0 3.2.2 4.7a2.5 2.5 0 0 0 1.8 1.8c1.5.2 9 .2 9 .2s7.5 0 9-.2a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12zM9.7 15.3V8.7l6.3 3.3-6.3 3.3z"/></svg>',
  fb:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  film:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
};
const NICHES  = [{k:'tech',n:'Technology',s:'AI · Gadgets'},{k:'finance',n:'Finance',s:'Money · Crypto'},{k:'health',n:'Health',s:'Fitness · Diet'},{k:'edu',n:'Education',s:'How-to · Explain'},{k:'ent',n:'Entertainment',s:'Pop · Culture'},{k:'biz',n:'Business',s:'Startups · Growth'}];
const FORMATS = [{k:'16-9',n:'Long-form',s:'16:9 · YouTube',w:'2.1'},{k:'9-16',n:'Short / Reel',s:'9:16 · Shorts',w:'1.2'},{k:'1-1',n:'Square',s:'1:1 · Feed',w:'1.5'}];
const VOICES  = [{k:'en-us-female',n:'Aria',s:'Female · US English'},{k:'en-us-male',n:'Ethan',s:'Male · US English'},{k:'en-uk-female',n:'Ivy',s:'Female · UK English'},{k:'bn-female',n:'Tara',s:'Female · Bengali'},{k:'es-male',n:'Mateo',s:'Male · Spanish'}];
const STYLES  = [{k:'minimal',n:'Minimal'},{k:'bold',n:'Bold'},{k:'cinematic',n:'Cinematic'},{k:'karaoke',n:'Karaoke'}];
const STAGES  = ['script','voice','storyboard','render','review','publish'];

/* ============================================================
   VIEW RENDERERS — each returns an HTML string from DATA
   ============================================================ */
const RENDER = {

  /* ---------- DASHBOARD ---------- */
  dashboard() {
    const P = DATA.projects, Q = DATA.queue;
    const published  = P.filter(p => p.status === 'published').length;
    const generating = P.filter(p => p.status === 'generating').length;
    const pending    = P.filter(p => p.status === 'pending_review').length;
    const approved   = P.filter(p => p.status === 'approved').length;
    return `
    <div class="grid cols-4">
      ${statCard(I.video,'#7c3aed','Videos in library',P.length+'',approved+' approved','none')}
      ${statCard(I.check,'#22c55e','Pending approvals',pending+'',pending?'Awaiting your review':'All clear','none',pending>0)}
      ${statCard(I.refresh,'#2563eb','In pipeline',Q.length+'',generating+' generating','none')}
      ${statCard(I.spark,'#06b6d4','Published',published+'',published?'Live on platforms':'—','none')}
    </div>
    <div class="grid cols-2-1" style="margin-top:18px">
      <div class="card">
        <div class="card-head"><div><h3>Recent videos</h3><div class="sub">Latest from the pipeline</div></div>
        <button class="btn btn-ghost btn-sm" onclick="nav('approvals')">View all →</button></div>
        <table class="tbl">
          <thead><tr><th>Video</th><th>Niche</th><th>Format</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
          ${P.length ? P.slice(0,5).map(v => `
            <tr>
              <td><div style="display:flex;align-items:center;gap:11px">
                <div class="vthumb">${I.film}<span class="dur">${fmtFormat(v.format)}</span></div>
                <div><div class="cell-main">${esc(v.title)}</div><div class="cell-sub">${esc(v.topic)}</div></div>
              </div></td>
              <td><span class="pill gray">${esc(v.niche)}</span></td>
              <td>${fmtFormat(v.format)}</td>
              <td>${statusPill(v.status)}</td>
              <td><b>${fmtDate(v.created_at)}</b></td>
            </tr>`).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:30px">No projects yet — create your first video.</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Status split</h3><div class="sub">All projects by status</div></div></div>
        <div id="donutDash" class="chart-box"><svg class="chart" viewBox="0 0 200 200"></svg></div>
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
          ${miniRow('Published',published+'','#22c55e',pct(published,P.length))}
          ${miniRow('In pipeline',generating+'','#7c3aed',pct(generating,P.length))}
          ${miniRow('Pending review',pending+'','#f59e0b',pct(pending,P.length))}
          ${miniRow('Approved',approved+'','#2563eb',pct(approved,P.length))}
        </div>
      </div>
    </div>
    <div class="grid cols-2" style="margin-top:18px">
      <div class="card">
        <div class="card-head"><div><h3>Projects over time</h3><div class="sub">Created per day · last 14 days</div></div></div>
        <div id="lineDash" class="chart-box"><svg class="chart" viewBox="0 0 600 220" preserveAspectRatio="none"></svg></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Live pipeline queue</h3><div class="sub">${Q.length} video${Q.length===1?'':'s'} running</div></div>
        <button class="btn btn-ghost btn-sm" onclick="nav('queue')">Open queue →</button></div>
        <div style="display:flex;flex-direction:column;gap:14px">
        ${Q.length ? Q.slice(0,4).map(q => `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span style="font-size:13px;font-weight:600">${esc(projectTitle(q.project_id))}</span>
              <span class="cell-sub">${cap(q.stage)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="progress" style="flex:1"><span style="width:${q.progress}%"></span></div>
              <span class="pill purple">${cap(q.stage)} · ${q.progress}%</span>
            </div>
          </div>`).join('') : `<div style="color:var(--text-3);padding:18px;text-align:center">Queue is empty.</div>`}
        </div>
      </div>
    </div>`;
  },

  /* ---------- CREATE VIDEO ---------- */
  create() {
    return `
    <div class="steps">
      <div class="step active"><span class="num">1</span>Topic &amp; Niche</div>
      <div class="step"><span class="num">2</span>Format &amp; Voice</div>
      <div class="step"><span class="num">3</span>Script</div>
      <div class="step"><span class="num">4</span>Review</div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="card-head"><div><h3>Step 1 — Topic &amp; niche</h3><div class="sub">Tell the AI what the video is about</div></div>
        <button class="btn btn-ghost btn-sm" onclick="aiSuggest()">${I.spark} AI suggest topic</button></div>
      <div class="form-grid">
        <div class="form-field full">
          <label>Video topic <span class="req">*</span></label>
          <input id="topicInput" placeholder="e.g. 5 AI tools that replace a marketing team" value="How transformers power modern AI assistants" />
          <div class="help">Be specific — the AI uses this as the project title and to seed the script.</div>
        </div>
        <div class="form-field">
          <label>Niche / category <span class="req">*</span></label>
          <div class="opt-grid">
            ${NICHES.map(n => `<div class="opt ${STATE.selectedNiche===n.k?'sel':''}" onclick="pickOpt(this,'niche','${n.k}')"><div class="o-ico">${I.spark}</div><div class="o-name">${n.n}</div><div class="o-sub">${n.s}</div></div>`).join('')}
          </div>
        </div>
        <div class="form-field">
          <label>Tone</label>
          <select id="toneSel"><option>Educational</option><option>Entertaining</option><option>Professional</option><option>Casual</option><option>Inspirational</option></select>
          <div class="help">Sets the script's writing voice.</div>
        </div>
        <div class="form-field">
          <label>Target length</label>
          <select id="lenSel"><option>Auto</option><option>Under 60s — Short</option><option>1–3 min</option><option>5–10 min</option><option>10+ min</option></select>
        </div>
        <div class="form-field">
          <label>Keywords / hashtags</label>
          <input id="kwInput" placeholder="ai, automation, productivity" value="#ai #n8n #automation" />
          <div class="help">Used for SEO, description &amp; tags on publish.</div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="card-head"><div><h3>Step 2 — Format, language &amp; voice</h3><div class="sub">Output dimensions, narration language &amp; voice profile</div></div></div>
      <div class="form-grid">
        <div class="form-field full">
          <label>Video format <span class="req">*</span></label>
          <div class="opt-grid" style="grid-template-columns:repeat(3,1fr)">
            ${FORMATS.map(f => `<div class="opt ${STATE.selectedFormat===f.k?'sel':''}" onclick="pickOpt(this,'format','${f.k}')"><div class="o-ico">${I.film}</div><div class="o-name">${f.n}</div><div class="o-sub">${f.s}</div></div>`).join('')}
          </div>
        </div>
        <div class="form-field">
          <label>Content language <span class="req">*</span></label>
          <select id="langSel" onchange="STATE.selectedLang=this.value">
            <option value="en-US">English (United States)</option>
            <option value="en-UK">English (United Kingdom)</option>
            <option value="bn-BD">Bengali (বাংলা)</option>
            <option value="es-ES">Spanish (Español)</option>
            <option value="hi-IN">Hindi (हिन्दी)</option>
            <option value="ar-SA">Arabic (العربية)</option>
          </select>
        </div>
        <div class="form-field">
          <label>Narration voice <span class="req">*</span></label>
          <select id="voiceSel" onchange="STATE.selectedVoice=this.value">
            ${VOICES.map(v => `<option value="${v.k}" ${STATE.selectedVoice===v.k?'selected':''}>${v.n} — ${v.s}</option>`).join('')}
          </select>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="toast('Preview voice sample playing… (demo)','ok')">${I.mic} Preview voice</button>
        </div>
        <div class="form-field">
          <label>Narration speed</label>
          <div class="slider-row">
            <input type="range" id="speed" min="0.5" max="2" step="0.1" value="${STATE.narrationSpeed}" oninput="document.getElementById('speedVal').textContent=this.value+'×';STATE.narrationSpeed=parseFloat(this.value)" />
            <span class="slider-val" id="speedVal">${STATE.narrationSpeed.toFixed(1)}×</span>
          </div>
          <div class="help">0.5× slow narration · 1.0× natural · 2.0× fast.</div>
        </div>
        <div class="form-field">
          <label>Subtitle style</label>
          <div class="opt-grid" style="grid-template-columns:repeat(4,1fr)">
            ${STYLES.map(s => `<div class="opt ${STATE.selectedStyle===s.k?'sel':''}" onclick="pickOpt(this,'style','${s.k}')"><div class="o-name" style="font-size:11.5px">${s.n}</div></div>`).join('')}
          </div>
        </div>
        <div class="form-field">
          <label>Music bed</label>
          <select id="musicSel"><option>Auto-match</option><option>Upbeat corporate</option><option>Cinematic ambient</option><option>Lo-fi chill</option><option>None</option></select>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="card-head"><div><h3>Step 3 — Publishing targets</h3><div class="sub">Where should the video go after approval?</div></div></div>
      <div class="grid cols-3">
        <div class="card" style="padding:16px;background:var(--panel-2)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="width:30px;height:30px;border-radius:8px;background:#ef444422;display:flex;align-items:center;justify-content:center;color:#ef4444">${I.yt}</span><b style="font-size:13px">YouTube</b><label class="toggle" style="margin-left:auto"><input type="checkbox" id="ytToggle" checked><span class="track"></span></label></div>
          <select style="width:100%"><option>Main channel</option><option>Shorts channel</option><option>Clip channel</option></select>
        </div>
        <div class="card" style="padding:16px;background:var(--panel-2)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="width:30px;height:30px;border-radius:8px;background:#1877f222;display:flex;align-items:center;justify-content:center;color:#1877f2">${I.fb}</span><b style="font-size:13px">Facebook</b><label class="toggle" style="margin-left:auto"><input type="checkbox" id="fbToggle" checked><span class="track"></span></label></div>
          <select style="width:100%"><option>Page — AI Video Hub</option><option>Reels</option><option>Group</option></select>
        </div>
        <div class="card" style="padding:16px;background:var(--panel-2)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="width:30px;height:30px;border-radius:8px;background:#7c3aed22;display:flex;align-items:center;justify-content:center;color:#a78bfa">${I.refresh}</span><b style="font-size:13px">Approval policy</b></div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label class="toggle"><input type="radio" name="policy" value="manual" checked><span class="track" style="border-radius:8px;width:auto;padding:6px 12px">Manual review</span></label>
            <label class="toggle"><input type="radio" name="policy" value="auto"><span class="track" style="border-radius:8px;width:auto;padding:6px 12px">Auto-publish</span></label>
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-grad" onclick="generateVideo()">${I.spark} Generate video</button>
    </div>`;
  },

  /* ---------- SCRIPT EDITOR ---------- */
  editor() {
    const P = DATA.projects;
    const sc = DATA.script;
    const runs = DATA.runs || [];
    const cur = P.find(p => p.id === STATE.currentProjectId);
    const dur = sc ? sc.estimated_duration_sec : 0;
    const mm = Math.floor(dur / 60), ss = String(dur % 60).padStart(2, '0');
    const projSelect = P.length
      ? `<select id="projSelect" onchange="selectProject(this.value)" style="width:100%;padding:11px 13px;background:#0e1119;border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px">${P.map(p => `<option value="${p.id}" ${p.id===STATE.currentProjectId?'selected':''}>${esc(p.title)}</option>`).join('')}</select>`
      : `<input value="No projects yet — create one first" disabled style="width:100%" />`;
    return `
    <div class="card" style="margin-bottom:16px">
      <div class="form-grid" style="gap:12px">
        <div class="form-field"><label>Project</label>${projSelect}</div>
        <div class="form-field" style="display:flex;gap:8px;align-items:flex-end">
          <button class="btn btn-ghost btn-sm" onclick="aiAssist()">${I.spark} AI expand</button>
          <button class="btn btn-ghost btn-sm" onclick="insertBlock('HOOK')">+ Hook</button>
          <button class="btn btn-ghost btn-sm" onclick="insertBlock('BODY')">+ Body</button>
          <button class="btn btn-ghost btn-sm" onclick="insertBlock('CTA')">+ CTA</button>
        </div>
      </div>
    </div>
    <div class="editor-shell">
      <div class="editor-pane">
        <div class="editor-bar">
          <span class="tag">SCRIPT.md</span>
          <span class="tag" id="wc">${sc ? sc.word_count : 0} words</span>
          <span class="tag" id="dur">~ ${mm}:${ss}</span>
          <span class="spacer"></span>
          <span style="color:var(--text-3)">v${sc ? sc.version : 1}</span>
        </div>
        <textarea id="scriptText" oninput="updatePreview()" spellcheck="false">${esc(sc ? sc.content : '')}</textarea>
      </div>
      <div class="editor-pane">
        <div class="editor-bar"><span class="tag">LIVE PREVIEW</span><span class="spacer"></span><span style="color:var(--text-3)">Auto-updates as you type</span></div>
        <div class="preview-pane" id="preview"></div>
      </div>
    </div>
    <div class="card" style="margin-top:18px">
      <div class="card-head"><div><h3>Pipeline status</h3><div class="sub">${cur ? esc(cur.title) : 'No project selected'} · ${cur ? cur.status : ''}</div></div>
        ${cur ? statusPill(cur.status) : ''}</div>
      <div class="pipeline" style="margin-bottom:14px">${pipelineFromRuns(runs)}</div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="saveScript()">Save version</button>
        <button class="btn btn-grad" onclick="lockScript()">${I.spark} Lock script &amp; generate</button>
      </div>
    </div>`;
  },

  /* ---------- PIPELINE QUEUE ---------- */
  queue() {
    const Q = DATA.queue;
    const P = DATA.projects;
    return `
    <div class="grid cols-4" style="margin-bottom:18px">
      ${statCard(I.refresh,'#7c3aed','Running now',Q.length+'','Active stages','none')}
      ${statCard(I.video,'#2563eb','Generating',P.filter(p=>p.status==='generating').length+'','Projects in pipeline','none')}
      ${statCard(I.check,'#22c55e','Published',P.filter(p=>p.status==='published').length+'','Live','none')}
      ${statCard(I.clock,'#f59e0b','Pending review',P.filter(p=>p.status==='pending_review').length+'','Awaiting approval','none')}
    </div>
    <div class="card">
      <div class="card-head"><div><h3>Live execution queue</h3><div class="sub">Workflow runs currently running</div></div>
        <button class="btn btn-ghost btn-sm" onclick="refreshQueueView()">${I.refresh} Refresh</button></div>
      <table class="tbl">
        <thead><tr><th>Project</th><th style="width:300px">Stage &amp; progress</th><th>Status</th><th>Pipeline</th><th></th></tr></thead>
        <tbody>
        ${Q.length ? Q.map(q => `
          <tr>
            <td><div class="cell-main">${esc(projectTitle(q.project_id))}</div><div class="cell-sub">#${q.id} · started ${fmtTime(q.started_at)}</div></td>
            <td>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
                <span class="pill purple">${cap(q.stage)}</span><span class="cell-sub">${q.progress}%</span>
              </div>
              <div class="progress"><span style="width:${q.progress}%"></span></div>
            </td>
            <td><span class="pill ${q.status==='running'?'purple':'green'}">${cap(q.status)}</span></td>
            <td><div class="pipeline" style="gap:3px">${miniPipelineFromStage(q.stage)}</div></td>
            <td><button class="btn btn-ghost btn-sm" onclick="advanceWorkflow(${q.project_id})">Advance →</button></td>
          </tr>`).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--text-3);padding:30px">Nothing running right now. Generate a video to start the pipeline.</td></tr>`}
        </tbody>
      </table>
    </div>`;
  },

  /* ---------- APPROVALS & PUBLISHING ---------- */
  approvals() {
    const P = DATA.projects;
    const review = P.filter(p => p.status === 'pending_review');
    const pubReady = P.filter(p => p.status === 'approved' || p.status === 'published');
    return `
    <div class="grid cols-3" style="margin-bottom:18px">
      ${statCard(I.clock,'#f59e0b','Awaiting review',review.length+'','Pending review','none',review.length>0)}
      ${statCard(I.check,'#22c55e','Approved',P.filter(p=>p.status==='approved').length+'','Ready to publish','none')}
      ${statCard(I.refresh,'#7c3aed','Published',P.filter(p=>p.status==='published').length+'','Live','none')}
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="card-head"><div><h3>Review queue</h3><div class="sub">Approve or reject each render before it goes live</div></div></div>
    </div>
    <div class="grid cols-3">
    ${review.length ? review.map(v => `
      <div class="video-card">
        <div class="vc-thumb">
          <div class="play">${I.play}</div>
          <span class="pill amber" style="position:absolute;top:10px;left:10px">Pending</span>
          <span class="pill gray" style="position:absolute;top:10px;right:10px">${fmtFormat(v.format)}</span>
        </div>
        <div class="vc-body">
          <div class="vc-title">${esc(v.title)}</div>
          <div class="vc-meta"><span>${esc(v.niche)}</span>·<span>${esc(v.voice)}</span></div>
          <div class="vc-tags"><span class="pill gray">${fmtFormat(v.format)}</span><span class="pill blue">${esc(v.platforms||'—')}</span></div>
        </div>
        <div class="vc-actions">
          <button class="btn btn-green btn-sm" style="flex:1" onclick="approveProject(${v.id})">${I.check} Approve</button>
          <button class="btn btn-red btn-sm" onclick="rejectProject(${v.id})">Reject</button>
        </div>
      </div>`).join('') : `<div style="grid-column:1/-1;color:var(--text-3);text-align:center;padding:30px">Nothing awaiting review.</div>`}
    </div>
    <div class="card" style="margin-top:18px">
      <div class="card-head"><div><h3>Publishing console</h3><div class="sub">Approved videos — publish to platforms</div></div></div>
      <table class="tbl">
        <thead><tr><th>Video</th><th>Platforms</th><th>Status</th><th></th></tr></thead>
        <tbody>
        ${pubReady.length ? pubReady.map(v => `
          <tr>
            <td><div class="cell-main">${esc(v.title)}</div><div class="cell-sub">${esc(v.niche)} · ${fmtFormat(v.format)}</div></td>
            <td>${esc(v.platforms||'—')}</td>
            <td>${statusPill(v.status)}</td>
            <td>${v.status==='approved' ? `<button class="btn btn-grad btn-sm" onclick="publishProject(${v.id})">${I.refresh} Publish</button>` : '—'}</td>
          </tr>`).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:24px">No approved videos to publish.</td></tr>`}
        </tbody>
      </table>
    </div>`;
  },

  /* ---------- ANALYTICS ---------- */
  analytics() {
    const P = DATA.projects;
    const fmtCnt = {};
    P.forEach(p => { fmtCnt[p.format] = (fmtCnt[p.format] || 0) + 1; });
    const topPublished = P.filter(p => p.status === 'published').sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return `
    <div class="grid cols-4" style="margin-bottom:18px">
      ${statCard(I.video,'#7c3aed','Total videos',P.length+'','In library','none')}
      ${statCard(I.check,'#22c55e','Published',P.filter(p=>p.status==='published').length+'','Live on platforms','none')}
      ${statCard(I.refresh,'#2563eb','In pipeline',P.filter(p=>p.status==='generating').length+'','Generating','none')}
      ${statCard(I.clock,'#f59e0b','Pending review',P.filter(p=>p.status==='pending_review').length+'','Awaiting approval','none')}
    </div>
    <div class="grid cols-2-1" style="margin-bottom:18px">
      <div class="card">
        <div class="card-head"><div><h3>Projects over time</h3><div class="sub">Created per day · last 30 days</div></div></div>
        <div id="lineAna" class="chart-box"><svg class="chart" viewBox="0 0 600 240" preserveAspectRatio="none"></svg></div>
        <div class="legend"><span><i style="background:#2563eb"></i>All projects</span></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>By niche</h3><div class="sub">Share of projects</div></div></div>
        <div id="donutAna" class="chart-box"><svg class="chart" viewBox="0 0 200 200"></svg></div>
      </div>
    </div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card">
        <div class="card-head"><div><h3>By platform</h3><div class="sub">Projects targeting each</div></div></div>
        <div id="barAna" class="chart-box"><svg class="chart" viewBox="0 0 500 220" preserveAspectRatio="none"></svg></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Recently published</h3><div class="sub">Newest live videos</div></div></div>
        <table class="tbl">
          <thead><tr><th>Title</th><th>Platforms</th><th>Created</th></tr></thead>
          <tbody>
          ${topPublished.length ? topPublished.slice(0,6).map(v => `
            <tr><td><div class="cell-main" style="font-size:12.5px">${esc(v.title)}</div><div class="cell-sub">${esc(v.niche)}</div></td>
            <td>${esc(v.platforms||'—')}</td><td>${fmtDate(v.created_at)}</td></tr>`).join('') : `<tr><td colspan="3" style="text-align:center;color:var(--text-3);padding:24px">Nothing published yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><div><h3>By format</h3><div class="sub">Distribution across aspect ratios</div></div></div>
      <div class="grid cols-4">
      ${Object.keys(fmtCnt).length ? Object.entries(fmtCnt).map(([f,c]) => `
        <div class="card" style="padding:14px;background:var(--panel-2)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><i style="width:10px;height:10px;border-radius:3px;background:#7c3aed"></i><span style="font-size:12px;color:var(--text-2)">${fmtFormat(f)}</span></div>
          <div style="font-size:20px;font-weight:800">${c}</div>
        </div>`).join('') : `<div style="grid-column:1/-1;color:var(--text-3);padding:18px;text-align:center">No data.</div>`}
      </div>
    </div>`;
  },

  /* ---------- SETTINGS ---------- */
  settings() {
    const u = STATE.user || {};
    return `
    <div class="grid cols-2-1">
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="card">
          <div class="card-head"><div><h3>Account</h3><div class="sub">Signed-in user · from /auth/me</div></div></div>
          ${infoRow('Name', esc(u.name||'—'))}
          ${infoRow('Email', esc(u.email||'—'))}
          ${infoRow('Role', cap(u.role||'—'))}
          ${infoRow('Default language', esc(u.default_language||'en-US'))}
          ${infoRow('User ID', '#'+(u.id||'—'))}
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Default content settings</h3><div class="sub">Applied to every new video unless overridden</div></div></div>
          <div class="form-grid">
            <div class="form-field"><label>Default language</label><select disabled><option>${esc(u.default_language||'English (US)')}</option></select></div>
            <div class="form-field"><label>Default voice</label><select>${VOICES.map(v => `<option>${v.n} — ${v.s}</option>`).join('')}</select></div>
            <div class="form-field"><label>Default format</label><select><option>16:9 Long-form</option><option>9:16 Short / Reel</option><option>1:1 Square</option></select></div>
            <div class="form-field"><label>Default narration speed</label><input type="number" step="0.1" value="1.0" /></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Platform connections</h3><div class="sub">OAuth accounts for publishing</div></div></div>
          ${platRow('YouTube','@AIVideoHub · 24.1K subs','ok')}
          ${platRow('Facebook','AI Video Hub page · 8.7K followers','ok')}
          ${platRow('Instagram','Not connected','off')}
          ${platRow('TikTok','Not connected','off')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="card">
          <div class="card-head"><div><h3>Backend connection</h3><div class="sub">API base URL</div></div></div>
          <div class="form-field"><label>API base</label><input id="apiBaseInput" value="${esc(API_BASE)}" style="font-family:var(--mono);font-size:12px" />
          <div class="help">Same origin when served by the platform; http://localhost:8000 for local dev. Change if your backend runs elsewhere.</div></div>
          <button class="btn btn-grad btn-sm" onclick="setApiBase()">${I.refresh} Save &amp; reconnect</button>
        </div>
        <div class="card">
          <div class="card-head"><div><h3>n8n workflow</h3><div class="sub">Automation pipeline endpoint</div></div></div>
          <div class="form-field"><label>Webhook URL</label><input value="https://n8n.company.io/webhook/video-pipeline" readonly style="font-family:var(--mono);font-size:12px" /></div>
          <div class="form-field"><label>Status</label><div class="pill green" style="margin-top:4px"><span class="dot-status green"></span> Online</div></div>
        </div>
        <div class="card">
          <div class="card-head"><div><h3>Plan &amp; usage</h3><div class="sub">Pro plan</div></div></div>
          <div style="font-size:12px;color:var(--text-2);margin-bottom:8px">Projects created</div>
          <div class="progress" style="height:10px"><span style="width:${Math.min(100,DATA.projects.length*5)}%"></span></div>
          <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-3);margin-top:6px"><span>${DATA.projects.length} total</span><span>Pro plan</span></div>
        </div>
      </div>
    </div>`;
  },
};

/* ============================================================
   POST-RENDER HOOKS (charts)
   ============================================================ */
const AFTER = {
  dashboard() {
    const P = DATA.projects;
    const cnt = {};
    P.forEach(p => { cnt[p.status] = (cnt[p.status] || 0) + 1; });
    const parts = [
      [cnt.published || 0, '#22c55e'],
      [cnt.generating || 0, '#7c3aed'],
      [cnt.pending_review || 0, '#f59e0b'],
      [cnt.approved || 0, '#2563eb'],
      [cnt.rejected || 0, '#ef4444'],
      [cnt.draft || 0, '#6b7493'],
    ].filter(p => p[0] > 0);
    const dd = document.querySelector('#donutDash svg');
    if (parts.length) drawDonut('#donutDash svg', parts); else if (dd) dd.innerHTML = '';
    drawLine('#lineDash svg', daySeries(P, 14), '#2563eb');
  },
  create() {},
  editor() { updatePreview(); },
  queue() {},
  approvals() {},
  analytics() {
    const P = DATA.projects;
    drawLine('#lineAna svg', daySeries(P, 30), '#2563eb');
    const nicheCnt = {};
    P.forEach(p => { nicheCnt[p.niche] = (nicheCnt[p.niche] || 0) + 1; });
    const pal = ['#7c3aed','#2563eb','#22c55e','#f59e0b','#ec4899','#06b6d4','#a78bfa','#6b7493'];
    const parts = Object.entries(nicheCnt).map(([n,c],i) => [c, pal[i % pal.length]]).filter(p => p[0] > 0);
    const da = document.querySelector('#donutAna svg');
    if (parts.length) drawDonut('#donutAna svg', parts); else if (da) da.innerHTML = '';
    let yt = 0, fb = 0;
    P.forEach(p => { const pl = (p.platforms || '').split(','); if (pl.includes('youtube')) yt++; if (pl.includes('facebook')) fb++; });
    drawBars('#barAna svg', [['YouTube', yt], ['Facebook', fb]]);
  },
  settings() {},
};

/* ============================================================
   ASYNC DATA LOADERS — one per view
   ============================================================ */
const LOAD = {
  dashboard: async () => { await Promise.all([refreshProjects(), refreshQueue()]); },
  create:    async () => {},
  editor: async () => {
    if (!DATA.projects.length) await refreshProjects();
    if (!STATE.currentProjectId && DATA.projects.length) STATE.currentProjectId = DATA.projects[0].id;
    if (STATE.currentProjectId) {
      DATA.script = await api('/projects/' + STATE.currentProjectId + '/script');
      DATA.runs = await api('/projects/' + STATE.currentProjectId + '/workflow').catch(() => []);
    }
  },
  queue: async () => { await refreshQueue(); if (!DATA.projects.length) await refreshProjects(); },
  approvals: async () => { await refreshProjects(); },
  analytics: async () => { await refreshProjects(); },
  settings:  async () => { STATE.user = await api('/auth/me').catch(() => STATE.user); },
};

/* ============================================================
   CHART DRAWING (inline SVG)
   ============================================================ */
function daySeries(P, n) {
  const out = [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    out.push(P.filter(p => { const c = new Date(p.created_at); return c >= d && c < next; }).length);
  }
  return out;
}
function drawLine(sel, seriesArr, colors) {
  const svg = document.querySelector(sel); if (!svg) return;
  const W = svg.viewBox.baseVal.width || 600, H = svg.viewBox.baseVal.height || 220;
  const pad = 20, padB = 24, padL = 28;
  const plotW = W - pad - padL, plotH = H - pad - padB;
  const all = Array.isArray(seriesArr[0]) ? seriesArr : [seriesArr];
  const cols = Array.isArray(colors) ? colors : [colors];
  const max = (Math.max(...all.flat()) || 1) * 1.1;
  let out = '';
  for (let g = 0; g <= 4; g++) { const y = pad + plotH * g / 4; out += `<line x1="${padL}" y1="${y}" x2="${W-pad}" y2="${y}" stroke="#1f2533" stroke-width="1"/>`; }
  all.forEach((data, si) => {
    const pts = data.map((v, i) => {
      const x = padL + plotW * i / Math.max(1, data.length - 1);
      const y = pad + plotH * (1 - v / max);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    const col = cols[si] || '#2563eb';
    out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    const areaPts = padL + ',' + (pad + plotH) + ' ' + pts.join(' ') + ' ' + (padL + plotW) + ',' + (pad + plotH);
    out += `<polygon points="${areaPts}" fill="${col}" opacity="0.08"/>`;
    const last = data[data.length - 1];
    const lx = padL + plotW, lxY = pad + plotH * (1 - last / max);
    out += `<circle cx="${lx}" cy="${lxY}" r="3.5" fill="${col}"/>`;
  });
  svg.innerHTML = out;
}
function drawDonut(sel, parts) {
  const svg = document.querySelector(sel); if (!svg) return;
  const cx = 100, cy = 100, r = 70, ri = 46;
  const total = parts.reduce((s, p) => s + p[0], 0) || 1;
  let a = -Math.PI / 2, out = '';
  out += `<circle cx="${cx}" cy="${cy}" r="${(r+ri)/2}" fill="none" stroke="#161a27" stroke-width="${r-ri}"/>`;
  parts.forEach(p => {
    const ang = p[0] / total * 2 * Math.PI;
    const a0 = a, a1 = a + ang;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi1 = cx + ri * Math.cos(a1), yi1 = cy + ri * Math.sin(a1);
    const xi0 = cx + ri * Math.cos(a0), yi0 = cy + ri * Math.sin(a0);
    const large = ang > Math.PI ? 1 : 0;
    out += `<path d="M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${ri} ${ri} 0 ${large} 0 ${xi0} ${yi0} Z" fill="${p[1]}"/>`;
    a = a1;
  });
  out += `<text x="${cx}" y="${cy-4}" text-anchor="middle" fill="#e7eaf3" font-size="22" font-weight="800">${total}</text>`;
  out += `<text x="${cx}" y="${cy+14}" text-anchor="middle" fill="#6b7493" font-size="10">projects</text>`;
  svg.innerHTML = out;
}
function drawBars(sel, data) {
  const svg = document.querySelector(sel); if (!svg) return;
  const W = svg.viewBox.baseVal.width || 500, H = svg.viewBox.baseVal.height || 220;
  const pad = 20, padB = 30, padL = 40;
  const plotW = W - pad - padL, plotH = H - pad - padB;
  const max = (Math.max(...data.map(d => d[1])) || 1) * 1.15;
  const bw = plotW / data.length * 0.5;
  const gap = plotW / data.length;
  let out = '';
  for (let g = 0; g <= 4; g++) {
    const y = pad + plotH * g / 4;
    out += `<line x1="${padL}" y1="${y}" x2="${W-pad}" y2="${y}" stroke="#1f2533"/>`;
    out += `<text x="${padL-6}" y="${y+3}" text-anchor="end" fill="#6b7493" font-size="9">${Math.round(max*(1-g/4))}</text>`;
  }
  data.forEach((d, i) => {
    const x = padL + gap * i + gap / 2 - bw / 2;
    const h = plotH * d[1] / max;
    const y = pad + plotH - h;
    const col = ['#ef4444','#1877f2','#f59e0b','#22c55e'][i % 4];
    out += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="4" fill="${col}"/>`;
    out += `<text x="${x+bw/2}" y="${H-pad+14}" text-anchor="middle" fill="#9aa3bd" font-size="10">${d[0]}</text>`;
  });
  svg.innerHTML = out;
}

/* ============================================================
   SMALL HELPERS
   ============================================================ */
function statCard(icon, color, label, value, delta, deltaType, highlight) {
  return `<div class="card stat" ${highlight ? 'style="border-color:#f59e0b55"' : ''}>
    <div class="ico" style="background:${color}22;color:${color}">${icon}</div>
    <div class="label">${label}</div>
    <div class="value">${value}</div>
    ${deltaType === 'none'
      ? `<div class="delta" style="color:var(--text-3)">${delta}</div>`
      : `<div class="delta ${deltaType}">${deltaType === 'up' ? I.arrowUp : I.arrowDown} ${delta}</div>`}
  </div>`;
}
function statusPill(s) {
  const m = {
    published:      ['green', 'Published'],
    pending_review: ['amber', 'Pending review'],
    pending:        ['amber', 'Pending'],
    approved:       ['blue', 'Approved'],
    generating:     ['purple', 'Generating'],
    rejected:       ['red', 'Rejected'],
    draft:          ['gray', 'Draft'],
  };
  const [c, t] = m[s] || ['gray', s];
  return `<span class="pill ${c}">${cap(t)}</span>`;
}
function miniRow(label, val, color, w) {
  return `<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span style="color:var(--text-2)">${label}</span><b>${val}</b></div><div class="progress"><span style="width:${w}%;background:${color}"></span></div></div>`;
}
function pipeNode(name, state, mini) {
  return `<div class="pl-node ${state}"><div class="pl-ico">${mini ? '<span style="font-size:9px;font-weight:700">' + name + '</span>' : I.film}</div><div class="pl-name">${mini ? '' : name}</div></div>`;
}
function pipeArrow(mini) { return `<span class="pl-arrow">${mini ? '›' : '→'}</span>`; }
function pipelineFromRuns(runs) {
  return STAGES.map((s, i) => {
    const r = runs.find(x => x.stage === s);
    const state = r ? (r.status === 'done' ? 'done' : r.status === 'running' ? 'active' : '') : '';
    return pipeNode(cap(s), state) + (i < STAGES.length - 1 ? pipeArrow() : '');
  }).join('');
}
function miniPipelineFromStage(stage) {
  const idx = STAGES.indexOf(stage);
  return STAGES.map((s, i) => {
    const state = i < idx ? 'done' : i === idx ? 'active' : '';
    return pipeNode(s.slice(0, 2).toUpperCase(), state, true) + (i < STAGES.length - 1 ? pipeArrow(true) : '');
  }).join('');
}
function setRow(t, d, st) {
  return `<div class="set-row"><div class="set-info"><div class="t">${t}</div><div class="d">${d}</div></div>
    <span class="pill ${st==='ok'?'green':'gray'}">${st==='ok'?'Connected':'Inactive'}</span>
    <button class="btn btn-ghost btn-sm">Configure</button></div>`;
}
function infoRow(t, d) {
  return `<div class="set-row"><div class="set-info"><div class="t">${t}</div><div class="d" style="font-family:var(--mono);font-size:12px">${d}</div></div></div>`;
}
function platRow(t, d, st) {
  const ic = t === 'YouTube' ? `<span style="color:#ef4444">${I.yt}</span>`
           : t === 'Facebook' ? `<span style="color:#1877f2">${I.fb}</span>`
           : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7493" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
  return `<div class="set-row"><div style="width:34px;display:flex;justify-content:center">${ic}</div><div class="set-info"><div class="t">${t}</div><div class="d">${d}</div></div>
    <button class="btn ${st==='ok'?'btn-red':'btn-grad'} btn-sm">${st==='ok'?'Disconnect':'Connect'}</button></div>`;
}
function fmt(n) { if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return '' + n; }
function fmtFormat(f) { return { '16-9': '16:9', '9-16': '9:16', '1-1': '1:1' }[f] || f; }
function fmtDate(iso) { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtTime(iso) { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
function pct(n, total) { return total ? Math.round(n * 100 / total) : 0; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function projectTitle(id) { const p = DATA.projects.find(x => x.id === id); return p ? p.title : ('#' + id); }

/* ============================================================
   INTERACTIONS (wired to the API)
   ============================================================ */
function pickOpt(el, group, key) {
  el.parentElement.querySelectorAll('.opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  if (group === 'niche')  STATE.selectedNiche  = key;
  if (group === 'format') STATE.selectedFormat = key;
  if (group === 'style')  STATE.selectedStyle  = key;
}
function aiSuggest() {
  const ideas = ['5 AI tools that replace a marketing team','The real reason your phone battery dies fast','Why everyone is talking about agentic AI','3 morning habits of top performers','Compound interest explained in 90 seconds'];
  const t = ideas[Math.floor(Math.random() * ideas.length)];
  const el = document.getElementById('topicInput'); if (el) el.value = t;
  toast('AI suggested: "' + t + '"', 'ok');
}
function aiAssist() { toast('AI expanded the selected paragraph with 2 supporting examples.', 'ok'); }
function insertBlock(tag) {
  const ta = document.getElementById('scriptText');
  if (!ta) return;
  const pos = ta.selectionStart || ta.value.length;
  ta.value = ta.value.slice(0, pos) + '\n[' + tag + ']\n' + ta.value.slice(pos);
  updatePreview();
}
function updatePreview() {
  const ta = document.getElementById('scriptText');
  if (!ta) return;
  const v = ta.value || '';
  const wc = (v.replace(/\[[^\]]+\]/g, '').trim().match(/\S+/g) || []).length;
  const dur = Math.round(wc / 150 * 60);
  const mm = Math.floor(dur / 60), ss = String(dur % 60).padStart(2, '0');
  const wcEl = document.getElementById('wc'), durEl = document.getElementById('dur');
  if (wcEl) wcEl.textContent = wc + ' words';
  if (durEl) durEl.textContent = '~ ' + mm + ':' + ss;
  const prev = document.getElementById('preview');
  if (!prev) return;
  const blocks = v.split(/\n(?=\[)/).filter(Boolean);
  prev.innerHTML = blocks.map(b => {
    const m = b.match(/^\[([^\]]+)\]/);
    const tag = m ? m[1] : 'INTRO';
    const txt = b.replace(/^\[[^\]]+\]\n?/, '').trim();
    return `<div class="sc-block"><div class="sc-label">${tag}</div><p>${txt.replace(/\n/g, '</p><p>')}</p></div>`;
  }).join('') || '<p style="color:var(--text-3)">Start typing to see the preview…</p>';
}

function selVal(id, d) { const e = document.getElementById(id); return e ? e.value : d; }
function val(id) { const e = document.getElementById(id); return e ? e.value.trim() : ''; }

async function generateVideo() {
  const topic = val('topicInput');
  if (!topic) { toast('Enter a video topic first.', 'warn'); return; }
  const nm = NICHES.find(n => n.k === STATE.selectedNiche);
  const platforms = [
    document.getElementById('ytToggle') && document.getElementById('ytToggle').checked ? 'youtube' : '',
    document.getElementById('fbToggle') && document.getElementById('fbToggle').checked ? 'facebook' : '',
  ].filter(Boolean).join(',') || 'youtube';
  const policy = document.querySelector('input[name=policy]:checked');
  const payload = {
    title: topic.length > 80 ? topic.slice(0, 80) : topic,
    topic,
    niche: nm ? nm.n : STATE.selectedNiche,
    format: STATE.selectedFormat,
    language: STATE.selectedLang,
    voice: STATE.selectedVoice,
    narration_speed: parseFloat(document.getElementById('speed').value) || 1.0,
    subtitle_style: STATE.selectedStyle,
    tone: selVal('toneSel', 'Educational'),
    target_length: selVal('lenSel', 'Auto'),
    keywords: val('kwInput'),
    music_bed: selVal('musicSel', 'Auto-match'),
    platforms,
    approval_policy: (policy && policy.value === 'auto') ? 'auto' : 'manual',
  };
  toast('Creating project & queueing pipeline…', 'ok');
  try {
    const proj = await api('/projects', { method: 'POST', body: payload });
    STATE.currentProjectId = proj.id;
    await api('/projects/' + proj.id + '/generate', { method: 'POST' })
      .catch(e => toast('Project created; generate failed: ' + e.message, 'warn'));
    toast('"' + proj.title + '" queued. Pipeline is generating.', 'ok');
    setTimeout(() => nav('editor'), 700);
  } catch (err) { toast(err.message || 'Create failed', 'err'); }
}

async function selectProject(id) {
  STATE.currentProjectId = parseInt(id, 10);
  try {
    DATA.script = await api('/projects/' + id + '/script');
    DATA.runs = await api('/projects/' + id + '/workflow').catch(() => []);
    paintView('editor');
  } catch (e) { toast(e.message, 'err'); }
}

async function saveScript() {
  if (!STATE.currentProjectId) { toast('Select a project first.', 'warn'); return; }
  const ta = document.getElementById('scriptText');
  if (!ta) return;
  try {
    const sc = await api('/projects/' + STATE.currentProjectId + '/script', { method: 'PUT', body: { content: ta.value } });
    DATA.script = sc;
    const wcEl = document.getElementById('wc'), durEl = document.getElementById('dur');
    if (wcEl) wcEl.textContent = sc.word_count + ' words';
    const m = Math.floor(sc.estimated_duration_sec / 60), s = String(sc.estimated_duration_sec % 60).padStart(2, '0');
    if (durEl) durEl.textContent = '~ ' + m + ':' + s;
    toast('Saved · v' + sc.version + ' · ' + sc.word_count + ' words · ~' + m + ':' + s, 'ok');
  } catch (e) { toast(e.message, 'err'); }
}

async function lockScript() {
  if (!STATE.currentProjectId) { toast('Select a project first.', 'warn'); return; }
  const ta = document.getElementById('scriptText');
  if (!ta || !ta.value.trim()) { toast('Cannot lock an empty script.', 'warn'); return; }
  try {
    await api('/projects/' + STATE.currentProjectId + '/script', { method: 'PUT', body: { content: ta.value } });
    await api('/projects/' + STATE.currentProjectId + '/script/lock', { method: 'POST' });
    toast('Script locked. Voice synthesis started.', 'ok');
    DATA.runs = await api('/projects/' + STATE.currentProjectId + '/workflow').catch(() => []);
    await refreshProjects();
    paintView('editor');
    setTimeout(() => nav('queue'), 800);
  } catch (e) { toast(e.message, 'err'); }
}

async function refreshQueueView() {
  try { await Promise.all([refreshQueue(), refreshProjects()]); paintView('queue'); toast('Queue refreshed.', 'ok'); }
  catch (e) { toast(e.message, 'err'); }
}

async function advanceWorkflow(projectId) {
  try {
    const r = await api('/projects/' + projectId + '/workflow/advance', { method: 'POST' });
    toast('Advanced to "' + cap(r.stage) + '" (' + r.status + ').', 'ok');
    await refreshQueue();
    await refreshProjects();
    if (STATE.view === 'queue') paintView('queue');
  } catch (e) { toast(e.message, 'err'); }
}

async function approveProject(id) {
  try {
    const m = await api('/projects/' + id + '/approve', { method: 'POST' });
    toast(m.message || 'Approved', 'ok');
    await refreshProjects();
    if (STATE.view === 'approvals') paintView('approvals');
  } catch (e) { toast(e.message, 'err'); }
}
async function rejectProject(id) {
  try {
    await api('/projects/' + id, { method: 'PATCH', body: { status: 'rejected' } });
    toast('Sent back for re-generation.', 'warn');
    await refreshProjects();
    if (STATE.view === 'approvals') paintView('approvals');
  } catch (e) { toast(e.message, 'err'); }
}
async function publishProject(id) {
  try {
    const m = await api('/projects/' + id + '/publish', { method: 'POST' });
    toast(m.message || 'Published', 'ok');
    await refreshProjects();
    if (STATE.view === 'approvals') paintView('approvals');
  } catch (e) { toast(e.message, 'err'); }
}

function setApiBase() {
  const v = (document.getElementById('apiBaseInput').value || '').trim().replace(/\/$/, '');
  if (!v) { toast('Enter a URL.', 'warn'); return; }
  localStorage.setItem(API_KEY, v);
  toast('API base saved. Reloading…', 'ok');
  setTimeout(() => location.reload(), 700);
}

/* ============================================================
   BOOT: restore session if a valid token is present
   ============================================================ */
(async function boot() {
  const note = document.getElementById('apiBaseLine');
  if (note) note.textContent = API_BASE;
  if (getToken()) {
    try {
      STATE.user = await api('/auth/me');
      document.getElementById('authScreen').style.display = 'none';
      document.getElementById('app').classList.add('active');
      paintUser();
      await nav('dashboard');
    } catch (e) { clearAuth(); showAuth(); }
  }
})();
