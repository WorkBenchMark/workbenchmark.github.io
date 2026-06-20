// WorkBenchMark project page — interactions (vanilla JS, no build step)

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- navbar burger (mobile) ---------- */
  document.querySelectorAll('.navbar-burger').forEach(function (burger) {
    burger.addEventListener('click', function () {
      var target = document.getElementById(burger.dataset.target);
      burger.classList.toggle('is-active');
      if (target) target.classList.toggle('is-active');
    });
  });
  // collapse the mobile menu after clicking a link
  document.querySelectorAll('#wbmNav .navbar-item').forEach(function (link) {
    link.addEventListener('click', function () {
      document.querySelector('.navbar-burger').classList.remove('is-active');
      document.getElementById('wbmNav').classList.remove('is-active');
    });
  });

  /* ---------- shared 3D brick builder (hero animation + dataset explorer) ---------- */
  var WBM_FACES = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  function wbmShade(hex, f) { // darken
    var n = parseInt(hex.slice(1), 16);
    var c = function (v) { return Math.min(255, Math.round(v * f)); };
    return 'rgb(' + c(n >> 16) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')';
  }
  function wbmTint(hex, t) { // lighten toward white (works on saturated colours)
    var n = parseInt(hex.slice(1), 16);
    var m = function (v) { return Math.round(v + (255 - v) * t); };
    return 'rgb(' + m(n >> 16) + ',' + m((n >> 8) & 255) + ',' + m(n & 255) + ')';
  }
  // build a cuboid brick (or greyed ghost) element with the given dimensions
  function wbmMakeCuboid(spec, ghost, W, D, H) {
    var w = spec.w || W;
    var el = document.createElement('div');
    el.className = 'wbm3d-brick' + (ghost ? ' wbm3d-ghost' : '');
    el.style.setProperty('--w', w + 'px');
    el.style.setProperty('--h', H + 'px');
    el.style.setProperty('--d', D + 'px');
    el.style.setProperty('--hw', (w / 2) + 'px');
    el.style.setProperty('--hh', (H / 2) + 'px');
    el.style.setProperty('--hd', (D / 2) + 'px');
    if (ghost) {
      el.style.setProperty('--c-top', '#e9edf2');
      el.style.setProperty('--c-front', '#dde2e9');
      el.style.setProperty('--c-side', '#cfd6df');
      el.style.setProperty('--c-stud', '#e9edf2');
    } else {
      el.style.setProperty('--c-top', wbmShade(spec.c, 1.0));
      el.style.setProperty('--c-front', wbmShade(spec.c, 0.82));
      el.style.setProperty('--c-side', wbmShade(spec.c, 0.64));
      el.style.setProperty('--c-stud', wbmTint(spec.c, 0.30));
    }
    var topFace;
    WBM_FACES.forEach(function (f) {
      var face = document.createElement('div');
      face.className = 'wbm3d-face f-' + f;
      el.appendChild(face);
      if (f === 'top') topFace = face;
    });
    if (!ghost) {
      var n = Math.max(2, Math.round(w / 30));
      for (var i = 0; i < n; i++) {
        var s = document.createElement('div');
        s.className = 'wbm3d-stud';
        s.style.left = (w * (i + 0.5) / n - 6.5) + 'px';
        s.style.top = (D / 2 - 6.5) + 'px';
        topFace.appendChild(s);
      }
    }
    return el;
  }

  /* ---------- hero 3D assembly animation ---------- */
  (function () {
    var stage = document.getElementById('wbm-anim');
    var world = stage && stage.querySelector('.wbm3d-world');
    if (!world) return;

    // brick footprint unit (px). Vertical axis is Y; negative Y is up.
    var W = 58, D = 42, H = 26;

    // Target structure: a compact tower with an offset (overhanging) top brick — all
    // standard-size bricks. Each brick: colour, centre (x,y,z), scatter source (sx,sy,sz) + rotation.
    // Order is bottom-to-top so it assembles in a physically sensible sequence.
    var BRICKS = [
      { c: '#0B69C7', x: -29, y: -13, z: 0, sx: -280, sy: 10,   sz: 30,  rx: 18,  ry: 35,  rz: -12 }, // base left
      { c: '#E0000A', x:  29, y: -13, z: 0, sx: -200, sy: -20,  sz: 70,  rx: -16, ry: -26, rz: 18  }, // base right
      { c: '#F5C400', x: -29, y: -39, z: 0, sx: -300, sy: -70,  sz: -20, rx: 26,  ry: 48,  rz: 10  }, // 2nd left
      { c: '#00963A', x:  29, y: -39, z: 0, sx: -190, sy: 55,   sz: 60,  rx: -22, ry: 18,  rz: -26 }, // 2nd right
      { c: '#E0000A', x:   0, y: -65, z: 0, sx: -255, sy: -100, sz: 10,  rx: 14,  ry: -38, rz: 20  }, // bridge (centred)
      { c: '#0B69C7', x: -29, y: -91, z: 0, sx: -215, sy: 85,   sz: -30, rx: -24, ry: 30,  rz: -16 }  // top (offset = overhang)
    ];

    var makeBrick = function (spec, ghost) { return wbmMakeCuboid(spec, ghost, W, D, H); };
    var target = function (b) { return 'translate3d(' + b.x + 'px,' + b.y + 'px,' + b.z + 'px)'; };
    var source = function (b) {
      return 'translate3d(' + b.sx + 'px,' + b.sy + 'px,' + b.sz + 'px) ' +
        'rotateX(' + b.rx + 'deg) rotateY(' + b.ry + 'deg) rotateZ(' + b.rz + 'deg)';
    };

    // ghosts first (greyed-out target hint), then real bricks on top
    var ghosts = BRICKS.map(function (b) {
      var g = makeBrick(b, true);
      g.style.transform = target(b);
      g.style.transition = 'opacity .4s ease';
      world.appendChild(g);
      return g;
    });
    var bricks = BRICKS.map(function (b) {
      var el = makeBrick(b, false);
      el.dataset.target = target(b);
      el.dataset.src = source(b);
      world.appendChild(el);
      return el;
    });

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      bricks.forEach(function (el) { el.style.transform = el.dataset.target; });
      return;
    }

    var STEP = 460, START = 650, HOLD = 1900;
    var timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function loop() {
      clearTimers();
      ghosts.forEach(function (g) { g.style.opacity = '0.9'; }); // show the target hint again
      bricks.forEach(function (el) {
        el.style.transition = 'none';
        el.style.opacity = '0';
        el.style.transform = el.dataset.src;
      });
      void stage.offsetWidth; // force reflow
      bricks.forEach(function (el) {
        el.style.transition = 'opacity .4s ease';
        el.style.opacity = '1';
      });
      bricks.forEach(function (el, i) {
        timers.push(setTimeout(function () {
          el.style.transition = 'transform .7s cubic-bezier(.34,1.12,.5,1)';
          el.style.transform = el.dataset.target;
          if (ghosts[i]) ghosts[i].style.opacity = '0'; // hide hint once the brick lands (no z-fighting)
        }, START + i * STEP));
      });
      timers.push(setTimeout(loop, START + bricks.length * STEP + HOLD));
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) loop(); else clearTimers();
        });
      }, { threshold: 0.2 });
      io.observe(stage);
    } else {
      loop();
    }
  })();

  /* ---------- dataset explorer: live 3D renderings, 5 examples per tier ---------- */
  (function () {
    var spin = document.getElementById('wbm-explorer-spin');
    if (!spin) return;
    var W = 58, D = 42, H = 26;
    var B = '#0B69C7', R = '#E0000A', Y = '#F5C400', G = '#00963A';
    var COLS = [B, R, Y, G];

    // vertical stack of `cols` at column (x,z); `cross` rotates alternate layers 90° (Duplo-style)
    function stk(cols, x, z, cross) {
      return cols.map(function (c, i) {
        return { c: c, x: x || 0, y: -13 - 26 * i, z: z || 0, ry: (cross && i % 2) ? 90 : 0 };
      });
    }
    function cat() { return Array.prototype.concat.apply([], arguments); }

    // 5 representative structures per tier (centred on origin so they rotate in place)
    var TIERS = [
      { caption: 'Tier 1 — two-brick vertical stacking: basic pick-and-place.',
        examples: [
          stk([B, R]), stk([R, Y], 0, 0, true), [{ c: G, x: 0, y: -13, z: 0 }],
          stk([Y, G]), stk([B, G], 0, 0, true)
        ] },
      { caption: 'Tier 2 — multi-brick vertical stacking: sequential, error-accumulating.',
        examples: [
          stk([B, R, Y], 0, 0, true), stk([R, G, B, Y], 0, 0, true),
          stk([Y, B, R, G, B], 0, 0, true), stk([G, Y, R]), stk([B, G, Y, R], 0, 0, true)
        ] },
      { caption: 'Tier 3 — spatial shape assembly: columns, bridges and 3-D layouts.',
        examples: [
          cat(stk([B, Y], -29), stk([R, G], 29), [{ c: R, x: 0, y: -65 }]),                 // bridge
          [{ c: B, x: -29, y: -13 }, { c: R, x: 29, y: -13 }, { c: Y, x: -29, y: -39 }, { c: G, x: -29, y: -65 }], // L
          [{ c: B, x: 0, y: -13, z: 21 }, { c: R, x: 0, y: -13, z: -21 }, { c: Y, x: 0, y: -39, ry: 90 }],          // depth pair + cap
          [{ c: B, x: -29, y: -13 }, { c: Y, x: -29, y: -39 }, { c: R, x: 29, y: -13 }, { c: G, x: 0, y: -65 }],   // staircase
          [{ c: B, x: 0, y: -13 }, { c: R, x: 0, y: -39 }, { c: Y, x: -29, y: -65 }, { c: G, x: 29, y: -65 }]      // T
        ] },
      { caption: 'Tier 4 — complex assembly: interlocking parts, overhangs and stability.',
        examples: [
          cat(stk([B], -29), stk([R], 29), stk([Y], -29, 0), [{ c: G, x: 29, y: -39 }, { c: R, x: 0, y: -65 }, { c: B, x: -29, y: -91 }]), // arch + overhang
          [{ c: B, x: -29, y: -13, z: 21 }, { c: R, x: 29, y: -13, z: 21 }, { c: G, x: -29, y: -13, z: -21 }, { c: Y, x: 29, y: -13, z: -21 }, { c: R, x: 0, y: -39 }, { c: B, x: 0, y: -65 }], // 2x2 base + tower
          [{ c: B, x: 0, y: -13 }, { c: R, x: -20, y: -39 }, { c: Y, x: -40, y: -65 }, { c: G, x: 20, y: -39 }],   // cantilever steps
          [{ c: B, x: 0, y: -13 }, { c: R, x: 0, y: -39 }, { c: Y, x: -29, y: -39, z: 0 }, { c: G, x: 29, y: -39 }, { c: B, x: 0, y: -65, ry: 90 }], // cross
          cat(stk([B, Y], -40), stk([R, G], 40), [{ c: R, x: -20, y: -65 }, { c: B, x: 20, y: -65 }])              // wide corbel bridge
        ] }
    ];

    var spinEl = spin;
    var dotsEl = document.getElementById('explorer-dots');
    var capEl = document.getElementById('explorer-caption');
    var tier = 0, ex = 0, timer = null;

    function draw() {
      var t = TIERS[tier];
      var bricks = t.examples[ex];
      spinEl.innerHTML = '';
      bricks.forEach(function (b) {
        var el = wbmMakeCuboid(b, false, W, D, H);
        el.style.transform = 'translate3d(' + b.x + 'px,' + b.y + 'px,' + (b.z || 0) + 'px)' +
          (b.ry ? ' rotateY(' + b.ry + 'deg)' : '');
        spinEl.appendChild(el);
      });
      if (capEl) capEl.textContent = t.caption + '  (example ' + (ex + 1) + ' / ' + t.examples.length + ')';
      if (dotsEl) {
        Array.prototype.forEach.call(dotsEl.children, function (d, i) {
          d.classList.toggle('is-active', i === ex);
        });
      }
    }

    function buildDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = '';
      TIERS[tier].examples.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = 'wbm-explorer-dot' + (i === ex ? ' is-active' : '');
        d.setAttribute('aria-label', 'Example ' + (i + 1));
        d.addEventListener('click', function () { ex = i; draw(); restart(); });
        dotsEl.appendChild(d);
      });
    }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () {
        ex = (ex + 1) % TIERS[tier].examples.length;
        draw();
      }, 4500);
    }

    function selectTier(i) {
      tier = i; ex = 0;
      buildDots(); draw(); restart();
    }

    document.querySelectorAll('#explorer-tabs li').forEach(function (li) {
      li.addEventListener('click', function () {
        document.querySelectorAll('#explorer-tabs li').forEach(function (x) { x.classList.remove('is-active'); });
        li.classList.add('is-active');
        selectTier(parseInt(li.querySelector('a').dataset.tier, 10));
      });
    });

    // start only when on screen; pause cycling when off screen
    var start = function () { buildDots(); draw(); restart(); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (!timer) restart(); }
          else if (timer) { clearInterval(timer); timer = null; }
        });
      }, { threshold: 0.1 });
      io.observe(document.getElementById('wbm-explorer'));
    }
    start();
  })();

  /* ---------- syntax highlighting (highlight.js) ---------- */
  if (window.hljs) hljs.highlightAll();

  /* ---------- copy BibTeX ---------- */
  var copyBtn = document.getElementById('copy-bibtex');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = document.getElementById('bibtex').innerText;
      navigator.clipboard.writeText(text).then(function () {
        var label = copyBtn.querySelector('span:last-child');
        var original = label.textContent;
        label.textContent = 'Copied!';
        setTimeout(function () { label.textContent = original; }, 1600);
      });
    });
  }

  /* ---------- leaderboard ---------- */

  // ---- metric metadata (single source of truth for guide + table headers) ----
  // Each submission stores per-tier arrays [T1, T2, T3, T4, Overall] under these keys.
  var METRICS = [
    { key: 'success',      label: 'Success Rate',            short: 'Success Rate', unit: '%', higherIsBetter: true,
      def: 'Share of tasks where every required brick ends up correctly assembled and free of the robot.' },
    { key: 'accuracy',     label: 'Execution Accuracy',      short: 'Exec. Acc.',   unit: '%', higherIsBetter: true,
      def: 'Fraction of brick-to-brick connections whose final relative pose matches the target.' },
    { key: 'planning',     label: 'Planning Time',           short: 'Planning',     unit: 's', higherIsBetter: false,
      def: 'Wall-clock time spent on perception, reasoning, and motion planning (excludes physical robot motion).',
      timed: true },
    { key: 'wall',         label: 'Wall Time',               short: 'Wall Time',    unit: 's', higherIsBetter: false,
      def: 'Wall-clock duration of solving one instance, end to end (perception, planning, and robot motion).',
      timed: true },
    { key: 'stability',    label: 'Stability Violation Rate', short: 'Stability',   unit: '%', higherIsBetter: false,
      def: 'Share of bricks in the assembly area that are not connected to the main structure.' }
  ];

  // ---- submissions: one entry per method. Add new methods here as the leaderboard grows. ----
  // Source for the seed entries: paper Table 2 (tab:tier-metrics).
  var SUBMISSIONS = [
    { name: 'Structured Pipeline', tag: 'Ours', isOurs: true, link: 'https://arxiv.org/abs/2606.19358',
      success:   [94.00, 87.00, 67.00, 62.00, 77.50],
      accuracy:  [91.60, 84.90, 62.80, 58.40, 74.43],
      planning:  [6.88, 10.35, 30.70, 32.25, 20.05],
      wall:      [15.92, 23.68, 79.08, 83.87, 50.64],
      stability: [3.00, 5.82, 11.37, 25.71, 11.48] },
    { name: 'Fine-tuned VLA', note: 'π₀.₅ fine-tuned on ABD demos', isOurs: false, link: null,
      success:   [82.00, 63.00, 23.00, 2.00, 42.50],
      accuracy:  [74.50, 57.20, 22.30, 10.20, 41.05],
      planning:  [2.58, 2.72, 3.62, 4.18, 3.28],
      wall:      [13.15, 51.97, 168.64, 187.52, 105.32],
      stability: [8.50, 23.48, 74.19, 87.99, 48.54] },
    { name: 'VLM/VLA Baseline', note: 'Gemini 2.5 Flash → π₀.₅ (zero-shot)', isOurs: false, link: null,
      success:   [70.00, 59.00, 19.00, 5.00, 38.25],
      accuracy:  [62.40, 51.50, 15.70, 12.90, 35.63],
      planning:  [2.24, 2.41, 3.27, 3.78, 2.93],
      wall:      [19.74, 53.71, 171.28, 183.67, 107.10],
      stability: [36.50, 56.75, 83.23, 88.80, 66.32] }
  ];

  var OVERALL = 4; // index of the "Overall" column in each per-tier array
  var fmt = function (v, unit) {
    if (v == null) return '&mdash;';
    return v.toFixed(2) + (unit === '%' ? '%' : ' ' + unit);
  };
  var arrowFor = function (m) {
    return m.higherIsBetter
      ? '<span class="wbm-dir" title="higher is better">&uarr;</span>'
      : '<span class="wbm-dir" title="lower is better">&darr;</span>';
  };

  // ---- real-robot track (same cell format; null = tier not attempted) ----
  var RR_METRICS = [
    { key: 'success', label: 'Success Rate', short: 'Success Rate', unit: '%', higherIsBetter: true,
      def: 'Share of real-robot trials ending in a complete, free-standing assembly.' },
    { key: 'wall', label: 'Wall Time', short: 'Wall Time', unit: 's', higherIsBetter: false, timed: true,
      def: 'Full-pipeline wall-clock time per task on hardware.' }
  ];
  var RR_SUBMISSIONS = [
    { name: 'Structured Pipeline', tag: 'Ours', isOurs: true, link: 'https://arxiv.org/abs/2606.19358',
      success: [90.00, 90.00, 70.00, null, 83.33],
      wall:    [55.77, 167.98, 183.33, null, 135.69] }
  ];

  // ---- generic renderer: rows = methods, columns = metrics, each cell = 4 tiers + overall ----
  function mountTable(metrics, submissions, headEl, bodyEl, opts) {
    if (!headEl || !bodyEl) return;
    opts = opts || {};
    var sortable = opts.sortable !== false;
    var sortKey = opts.defaultSort || metrics[0].key;

    // best value per metric per column, ignoring nulls
    var best = {};
    metrics.forEach(function (m) {
      best[m.key] = [0, 1, 2, 3, 4].map(function (c) {
        var col = submissions.map(function (s) { return s[m.key][c]; })
                             .filter(function (v) { return v != null; });
        if (!col.length) return null;
        return m.higherIsBetter ? Math.max.apply(null, col) : Math.min.apply(null, col);
      });
    });

    function render() {
      var sortMeta = metrics.find(function (m) { return m.key === sortKey; });
      headEl.innerHTML = '<th class="wbm-rank">#</th><th>Method</th>' +
        metrics.map(function (m) {
          var on = sortable && m.key === sortKey ? ' is-sorted' : '';
          return '<th class="has-text-right' + (sortable ? ' wbm-sortable' : '') + on + '"' +
            (sortable ? ' data-key="' + m.key + '"' : '') + ' title="' + m.def + '">' +
            m.short + ' ' + arrowFor(m) + ' <span class="wbm-unit">(' + m.unit + ')</span></th>';
        }).join('');

      var ranked = submissions.slice().sort(function (a, b) {
        var av = a[sortKey][OVERALL], bv = b[sortKey][OVERALL];
        if (av == null) return 1;
        if (bv == null) return -1;
        return sortMeta.higherIsBetter ? bv - av : av - bv;
      });

      bodyEl.innerHTML = ranked.map(function (s, i) {
        var nameHtml = s.link ? '<a href="' + s.link + '">' + s.name + '</a>' : s.name;
        var tag = s.tag ? ' <span class="tag is-link is-light is-rounded">' + s.tag + '</span>' : '';
        var note = s.note ? '<span class="wbm-method-note">' + s.note + '</span>' : '';
        var cells = metrics.map(function (m) {
          var vals = s[m.key];
          var tiers = [0, 1, 2, 3].map(function (c) {
            if (vals[c] == null) return '<span class="wbm-na-cell">&mdash;</span>';
            var b = vals[c] === best[m.key][c] ? 'wbm-best-tier' : '';
            return '<span class="' + b + '">' + vals[c].toFixed(2) + '</span>';
          }).join('<i class="wbm-sep">·</i>');
          var ovBest = (vals[OVERALL] != null && vals[OVERALL] === best[m.key][OVERALL]) ? ' best' : '';
          var td = 'wbm-cell' + (sortable && m.key === sortKey ? ' is-sorted' : '');
          return '<td class="' + td + '">' +
            '<span class="wbm-tiers">' + tiers + '</span>' +
            '<span class="wbm-overall' + ovBest + '">' + fmt(vals[OVERALL], m.unit) + '</span>' +
          '</td>';
        }).join('');
        return '<tr class="' + (s.isOurs ? 'method-ours' : '') + '">' +
          '<td class="wbm-rank">' + (i + 1) + '</td>' +
          '<td class="wbm-method"><span class="wbm-method-name">' + nameHtml + '</span>' + tag +
            (note ? '<br>' + note : '') + '</td>' +
          cells + '</tr>';
      }).join('');

      if (sortable) {
        headEl.querySelectorAll('.wbm-sortable').forEach(function (th) {
          th.addEventListener('click', function () { sortKey = th.dataset.key; render(); });
        });
      }
    }
    render();
  }

  // ---- metric guide cards (explain the simulation metrics) ----
  var guide = document.getElementById('metric-guide');
  if (guide) {
    guide.innerHTML = METRICS.map(function (m) {
      var caveat = m.timed
        ? '<p class="wbm-mc-caveat"><span class="icon"><i class="fas fa-triangle-exclamation"></i></span>' +
          'Hardware- and implementation-dependent &mdash; not directly comparable across submissions.</p>'
        : '';
      return '<div class="column is-one-fifth-desktop is-half-tablet">' +
        '<div class="wbm-metric-card' + (m.timed ? ' wbm-timed' : '') + '">' +
          '<p class="wbm-mc-title">' + m.label + ' ' + arrowFor(m) +
            ' <span class="wbm-mc-unit">(' + m.unit + ')</span></p>' +
          '<p class="wbm-mc-def">' + m.def + '</p>' + caveat +
        '</div></div>';
    }).join('');
  }

  mountTable(METRICS, SUBMISSIONS, document.getElementById('lb-head'), document.getElementById('lb-body'), { defaultSort: 'success' });
  mountTable(RR_METRICS, RR_SUBMISSIONS, document.getElementById('rr-head'), document.getElementById('rr-body'), { sortable: false });
});
