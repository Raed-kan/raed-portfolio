/* رائد · بورتفوليو · gallery.js — صفحة «جلسات التصوير والفيديو»
   ١) تبويبات (عطور · مطاعم · منتجات · فيديو) + روابط مباشرة: #perfume #food #product #video #<slug>
   ٢) بطاقة لكل جلسة من window.SHOOTS، تنفتح في مكانها (وحدة بس في كل مرة)
   ٣) عارض صور كامل (RTL، سحب باللمس، Esc، حبس التركيز، قفل التمرير)
   ٤) مقارنة فيديو قبل/بعد من window.VIDEOS — تتحمّل وتشتغل بس لما تبان */
(() => {
  'use strict';

  /* ---------- البيانات ---------- */
  /* كل جلسة مقسومة لمجموعات حسب شكل الصورة (بنرات عريضة، مشاهد عريضة، أفقية، مربعة، طولية).
     كل مجموعة تنعرض بشبكة موحّدة بنسبتها — ما نخلط الطولي مع العريض في نفس الشبكة.
     أعمدة كل مجموعة: [جوال، ≥768px، ≥1100px] — لازم تطابق gallery.css */
  const COLS = {
    ultra: [1, 2, 2],
    wide: [1, 2, 3],
    land: [2, 3, 4],
    square: [2, 3, 4],
    portrait: [2, 4, 5],
    mixed: [2, 3, 4]
  };
  const okImg = i => i && i.f != null && i.w > 0 && i.h > 0;

  function normalizeShoot(s) {
    if (!s || !s.slug || !s.cat) return null;
    let groups = (Array.isArray(s.groups) ? s.groups : [])
      .filter(g => g && Array.isArray(g.images))
      .map(g => ({
        key: COLS[g.key] ? g.key : 'mixed',
        label: typeof g.label === 'string' ? g.label.trim() : '',
        ratio: Number(g.ratio) > 0 ? Number(g.ratio) : 0,
        images: g.images.filter(okImg)
      }))
      .filter(g => g.images.length);
    // احتياط: جلسة بدون مجموعات → مجموعة وحدة من قائمة الصور
    if (!groups.length && Array.isArray(s.images)) {
      const imgs = s.images.filter(okImg);
      if (imgs.length) groups = [{ key: 'mixed', label: '', ratio: 0, images: imgs }];
    }
    if (!groups.length) return null;
    groups.forEach(g => { if (!g.ratio) g.ratio = g.images[0].w / g.images[0].h; });
    const brand = String(s.brand || '').trim();
    const title = String(s.title || '').trim();
    return {
      slug: String(s.slug),
      cat: s.cat,
      brand: brand,
      // لو العنوان نفس اسم البراند ما نكرره
      title: title && title !== brand ? title : '',
      desc: String(s.desc || '').trim(),
      cover: s.cover != null ? String(s.cover) : '',
      groups: groups,
      // ترتيب العرض (مجموعة ورا مجموعة) — العارض يمشي عليه
      order: [].concat.apply([], groups.map(g => g.images))
    };
  }

  const SHOOTS = (Array.isArray(window.SHOOTS) ? window.SHOOTS : []).map(normalizeShoot).filter(Boolean);
  const VIDEOS = (Array.isArray(window.VIDEOS) ? window.VIDEOS : [])
    .filter(v => v && v.slug && v.before && v.after && (v.type === 'slider' || v.type === 'side'));

  const CATS = ['perfume', 'food', 'product'];
  const TAB_KEYS = CATS.concat('video');
  const PROJECT_PAGES = { reef: 'reef', osma: 'osma', flatty: 'flatty', bp: 'bp', bandreita: 'tecno' };
  const FIRST_BATCH = 8;
  const IMG_BASE = 'assets/images/shoots/';
  const mqMid = window.matchMedia('(min-width: 768px)');
  const mqWide = window.matchMedia('(min-width: 1100px)');
  const colsNow = key => { const c = COLS[key] || COLS.mixed; return mqWide.matches ? c[2] : (mqMid.matches ? c[1] : c[0]); };

  const bySlug = {};
  SHOOTS.forEach(s => { bySlug[s.slug] = s; });
  const videoBySlug = {};
  VIDEOS.forEach(v => { videoBySlug[v.slug] = v; });

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  // styles.css يخلي html { scroll-behavior: smooth } — فـ'auto' تطلع ناعمة؛ نحتاج 'instant' صريحة
  function scrollToY(y, smooth) {
    const behavior = smooth && !mqReduce.matches ? 'smooth' : 'instant';
    try { window.scrollTo({ top: y, behavior: behavior }); }
    catch (e) { window.scrollTo(0, y); }
  }

  /* ---------- أدوات ---------- */
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const ar = n => String(n).replace(/\d/g, d => AR[d]);
  function countLabel(n) {
    if (n === 1) return 'صورة وحدة';
    if (n === 2) return 'صورتين';
    if (n <= 10) return ar(n) + ' صور';
    return ar(n) + ' صورة';
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(markup, size) {
    const s = size || 16;
    const wrap = document.createElement('span');
    wrap.innerHTML = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" aria-hidden="true" focusable="false">' + markup + '</svg>';
    return wrap.firstChild;
  }
  const ICON_CHEV = '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  const ICON_X = '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  const ICON_PLAY = '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>';
  const ICON_PAUSE = '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/>';
  const ICON_ARROWS = '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

  const thumbSrc = (s, img) => IMG_BASE + s.slug + '/' + img.f + '-t.jpg';
  const fullSrc = (s, img) => IMG_BASE + s.slug + '/' + img.f + '.jpg';
  const imgAlt = (s, i) => s.brand + ' — ' + (s.title || 'جلسة تصوير') + '، صورة ' + ar(i + 1) + ' من ' + ar(s.order.length);

  function setHash(key) {
    try { history.replaceState(null, '', key ? '#' + key : location.pathname + location.search); } catch (e) { /* file:// */ }
  }
  function stickyOffset() {
    const g = document.body;
    const nav = parseFloat(getComputedStyle(g).getPropertyValue('--g-nav-h')) || 56;
    const tabs = parseFloat(getComputedStyle(g).getPropertyValue('--g-tabs-h')) || 56;
    return nav + tabs;
  }

  /* ---------- ١) التبويبات ---------- */
  const tabs = {};
  const panels = {};
  TAB_KEYS.forEach(k => {
    tabs[k] = document.getElementById('tab-' + k);
    panels[k] = document.getElementById('panel-' + k);
  });
  const ctaPhoto = document.getElementById('ctaPhoto');
  const tabsAnchor = document.getElementById('gTabsAnchor');
  let currentTab = null;

  // إخفاء التبويبات الفاضية
  CATS.forEach(k => {
    const has = SHOOTS.some(s => s.cat === k);
    if (tabs[k]) tabs[k].hidden = !has;
  });
  if (tabs.video) tabs.video.hidden = VIDEOS.length === 0;
  // العنوان «كل ذا طلع من مكتبي» يصلح بفيديو وبدونه — نشيل بس الأجزاء الخاصة بالفيديو
  if (!VIDEOS.length) {
    document.querySelectorAll('[data-video-only]').forEach(n => n.remove());
  }
  const visibleTabs = () => TAB_KEYS.filter(k => tabs[k] && !tabs[k].hidden);

  function activateTab(key, opts) {
    opts = opts || {};
    const list = visibleTabs();
    if (!list.length) return;
    if (list.indexOf(key) === -1) key = list[0];
    if (currentTab !== key) {
      if (openSlug && bySlug[openSlug].cat !== key) closeShoot({ hash: false });
      TAB_KEYS.forEach(k => {
        if (!tabs[k]) return;
        const on = k === key;
        tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[k].tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (ctaPhoto) ctaPhoto.hidden = key === 'video';
      currentTab = key;
      if (key === 'video') ensureVideos();
    }
    if (opts.focus) tabs[key].focus();
    if (opts.hash) setHash(key);
    if (opts.pin) pinTabs();
  }

  // لو المستخدم نازل تحت، نرجّعه لبداية اللوحة الجديدة عشان ما يبدأ من نصها
  function pinTabs() {
    const top = tabsAnchor.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(document.body).getPropertyValue('--g-nav-h')) || 56);
    if (window.scrollY > top + 1) scrollToY(top, false);
  }

  const tablist = document.getElementById('gTabs');
  tablist.addEventListener('click', e => {
    const t = e.target.closest('[role="tab"]');
    if (!t) return;
    activateTab(t.dataset.tab, { hash: t.dataset.tab !== currentTab, pin: true });
  });
  tablist.addEventListener('keydown', e => {
    const list = visibleTabs();
    let i = list.indexOf(currentTab);
    // RTL: السهم الأيسر = التبويب اللي بعده
    if (e.key === 'ArrowLeft') i = (i + 1) % list.length;
    else if (e.key === 'ArrowRight') i = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = list.length - 1;
    else return;
    e.preventDefault();
    activateTab(list[i], { focus: true, hash: true, pin: true });
  });

  /* ---------- ٢) بطاقات الجلسات ---------- */
  const panel = el('section', 'shoot-panel');
  panel.id = 'shootPanel';
  panel.tabIndex = -1;
  panel.setAttribute('aria-labelledby', 'spTitle');
  let openSlug = null;

  function renderCards(initialTab) {
    CATS.forEach(cat => {
      const grid = document.querySelector('.shoot-grid[data-cat="' + cat + '"]');
      if (!grid) return;
      SHOOTS.filter(s => s.cat === cat).forEach((s, i) => {
        const art = el('article', 'shoot');
        art.dataset.slug = s.slug;

        const btn = el('button', 'shoot-btn');
        btn.type = 'button';
        btn.id = 'shoot-' + s.slug;
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'shootPanel');

        const cover = el('span', 'shoot-cover');
        const covers = coverImages(s);
        if (covers.length > 1) cover.classList.add('is-duo');
        covers.forEach((im, k) => {
          const img = new Image(im.tw || im.w, im.th || im.h);
          img.alt = k ? '' : s.brand + ' — غلاف جلسة «' + (s.title || 'تصوير منتجات') + '»';
          img.decoding = 'async';
          if (!(cat === initialTab && i < 3)) img.loading = 'lazy';
          img.src = thumbSrc(s, im);
          cover.append(img);
        });

        const body = el('span', 'shoot-body');
        const brand = el('span', 'shoot-brand', s.brand);
        brand.id = 'sb-' + s.slug;
        body.append(brand);
        const labelIds = ['sb-' + s.slug];
        if (s.title) {
          const title = el('span', 'shoot-title', s.title);
          title.id = 'st-' + s.slug;
          body.append(title);
          labelIds.push(title.id);
        }
        if (s.desc) {
          const desc = el('span', 'shoot-desc', s.desc);
          desc.id = 'sd-' + s.slug;
          body.append(desc);
          btn.setAttribute('aria-describedby', desc.id);
        }
        const meta = el('span', 'shoot-meta');
        const count = el('span', 'shoot-count', countLabel(s.order.length));
        count.id = 'sc-' + s.slug;
        labelIds.push(count.id);
        btn.setAttribute('aria-labelledby', labelIds.join(' '));
        const act = el('span', 'shoot-act');
        act.setAttribute('aria-hidden', 'true');
        act.append(el('span', 'shoot-act-t', 'افتح الجلسة'), svg(ICON_CHEV, 16));
        meta.append(count, act);
        body.append(meta);
        btn.append(cover, body);
        art.append(btn);
        grid.append(art);

        btn.addEventListener('click', () => {
          if (openSlug === s.slug) closeShoot({ hash: true });
          else openShoot(s.slug, { scroll: true });
        });
      });
    });
  }

  /* غلاف البطاقة: الصورة المسمّاة في shoot.cover. لو طولية أو مربعة نحط جنبها صورة ثانية
     من نفس المجموعة عشان الإطار العريض ما يقص نصها */
  function coverImages(s) {
    const main = s.order.find(im => String(im.f) === s.cover) || s.order[0];
    if (main.w / main.h >= 1.15) return [main];
    const g = s.groups.find(gr => gr.images.indexOf(main) !== -1);
    const mate = (g && g.images.find(im => im !== main)) ||
      s.order.find(im => im !== main && im.w / im.h < 1.15);
    return mate ? [main, mate] : [main];
  }

  /* أول دفعة: تقريباً FIRST_BATCH صورة موزّعة على المجموعات بالدور، صف كامل لكل مجموعة
     (حسب عدد أعمدتها على الشاشة الحالية) عشان ما يطلع صف ناقص وسط الشبكة */
  function firstBatch(s) {
    const sizes = s.groups.map(g => g.images.length);
    const total = sizes.reduce((a, b) => a + b, 0);
    if (total <= FIRST_BATCH + 2) return sizes.slice();
    const shown = sizes.map(() => 0);
    let n = 0;
    while (n < FIRST_BATCH) {
      let moved = false;
      for (let gi = 0; gi < sizes.length && n < FIRST_BATCH; gi++) {
        const take = Math.min(colsNow(s.groups[gi].key), sizes[gi] - shown[gi]);
        if (take > 0) { shown[gi] += take; n += take; moved = true; }
      }
      if (!moved) break;
    }
    return shown;
  }

  function cardOf(slug) { return document.querySelector('.shoot[data-slug="' + CSS.escape(slug) + '"]'); }

  function fillPanel(s) {
    panel.textContent = '';
    const head = el('div', 'sp-head');
    const text = el('div', 'sp-text');
    const h = el('h3', 'sp-title');
    h.id = 'spTitle';
    h.append(el('span', 'sp-brand', s.brand));
    if (s.title) h.append(el('span', 'sp-sub', ' — ' + s.title));
    text.append(h);
    if (s.desc) text.append(el('p', 'sp-desc', s.desc));
    const meta = el('p', 'sp-meta');
    meta.append(el('span', null, countLabel(s.order.length) + (s.order.length > 1 ? ' · اضغط أي صورة تنفتح كاملة' : ' · اضغطها تنفتح كاملة')));
    const page = PROJECT_PAGES[s.slug];
    if (page) {
      const a = el('a', null, 'صفحة المشروع ←');
      a.href = 'projects/' + page + '.html';
      meta.append(a);
    }
    text.append(meta);

    const close = el('button', 'sp-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'إغلاق جلسة ' + s.brand);
    close.append(svg(ICON_X, 14), el('span', null, 'إغلاق'));
    close.addEventListener('click', () => closeShoot({ hash: true, focus: true }));
    head.append(text, close);

    // كل مجموعة = قسم صغير بعنوانه وشبكة موحّدة بنسبتها
    const wrap = el('div', 'sp-groups');
    let offset = 0;
    const parts = s.groups.map((g, gi) => {
      const sec = el('div', 'sp-group');
      sec.dataset.key = g.key;
      sec.setAttribute('role', 'group');
      const label = el('p', 'sp-glabel');
      label.id = 'spg-' + s.slug + '-' + gi;
      if (g.label) label.append(el('span', 'sp-gname', g.label));
      label.append(el('span', 'sp-gcount', countLabel(g.images.length)));
      sec.setAttribute('aria-labelledby', label.id);
      const grid = el('div', 'sp-grid sp-grid--' + g.key);
      grid.style.setProperty('--r', String(Math.round(g.ratio * 10000) / 10000));
      sec.append(label, grid);
      wrap.append(sec);
      const part = { g: g, sec: sec, grid: grid, start: offset, n: 0 };
      offset += g.images.length;
      return part;
    });

    const addTiles = (part, upto) => {
      let first = null;
      for (let k = part.n; k < upto; k++) {
        const im = part.g.images[k];
        const idx = part.start + k;
        const b = el('button', 'sp-thumb');
        b.type = 'button';
        const img = new Image(im.tw || im.w, im.th || im.h);
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = imgAlt(s, idx);
        img.src = thumbSrc(s, im);
        b.append(img);
        b.addEventListener('click', () => openLightbox(s, idx, b));
        part.grid.append(b);
        if (!first) first = b;
      }
      part.n = Math.max(part.n, upto);
      part.sec.hidden = part.n === 0;
      return first;
    };

    const shown = firstBatch(s);
    parts.forEach((p, gi) => addTiles(p, shown[gi]));
    panel.append(head, wrap);

    const total = s.order.length;
    const firstN = shown.reduce((a, b) => a + b, 0);
    if (firstN < total) {
      const rest = total - firstN;
      const more = el('button', 'sp-more', '+' + countLabel(rest));
      more.type = 'button';
      more.setAttribute('aria-label', 'اعرض باقي الصور (' + countLabel(rest) + ')');
      more.addEventListener('click', () => {
        let first = null;
        parts.forEach(p => {
          const f = addTiles(p, p.g.images.length);
          if (!first && f) first = f;
        });
        more.remove();
        if (first) first.focus();
      });
      panel.append(more);
    }
  }

  // اللوحة تنحط بعد آخر بطاقة في نفس صف البطاقة المفتوحة
  function placePanel() {
    if (!openSlug) return;
    const art = cardOf(openSlug);
    if (!art) return;
    if (panel.parentNode) panel.remove();
    const top = art.offsetTop;
    let last = art;
    let n = art.nextElementSibling;
    while (n && n.classList.contains('shoot') && Math.abs(n.offsetTop - top) < 2) { last = n; n = n.nextElementSibling; }
    last.after(panel);
  }

  function scrollToPanel(instant) {
    const r = panel.getBoundingClientRect();
    const off = stickyOffset();
    if (r.top < off || r.top > window.innerHeight * 0.55) {
      scrollToY(r.top + window.scrollY - off - 12, !instant);
    }
  }

  function openShoot(slug, opts) {
    opts = opts || {};
    const s = bySlug[slug];
    if (!s) return;
    activateTab(s.cat);
    if (openSlug !== slug) {
      closeShoot({ hash: false });
      fillPanel(s);
      openSlug = slug;
      const art = cardOf(slug);
      art.classList.add('is-open');
      art.querySelector('.shoot-btn').setAttribute('aria-expanded', 'true');
      art.querySelector('.shoot-act-t').textContent = 'إخفاء';
      placePanel();
    }
    setHash(slug);
    if (opts.scroll) scrollToPanel(opts.instant);
  }

  function closeShoot(opts) {
    opts = opts || {};
    if (!openSlug) return;
    const art = cardOf(openSlug);
    openSlug = null;
    if (panel.parentNode) panel.remove();
    if (art) {
      art.classList.remove('is-open');
      const btn = art.querySelector('.shoot-btn');
      btn.setAttribute('aria-expanded', 'false');
      art.querySelector('.shoot-act-t').textContent = 'افتح الجلسة';
      if (opts.focus) btn.focus();
    }
    if (opts.hash) setHash(currentTab);
  }

  // Esc داخل الجلسة المفتوحة يقفلها (لو العارض مو مفتوح)
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lbState.open) { e.stopPropagation(); closeShoot({ hash: true, focus: true }); }
  });

  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(placePanel, 150);
  });

  /* ---------- ٣) عارض الصور ---------- */
  const lb = document.getElementById('lb');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const lbCount = document.getElementById('lbCount');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');
  const lbClose = document.getElementById('lbClose');
  const lbStage = document.getElementById('lbStage');
  const page = document.getElementById('gPage');
  const lbState = { open: false, shoot: null, i: 0, opener: null };

  function lbShow(i) {
    const s = lbState.shoot;
    const n = s.order.length;
    lbState.i = (i + n) % n;
    const img = s.order[lbState.i];
    lbImg.classList.add('is-loading');
    lbImg.width = img.w;
    lbImg.height = img.h;
    lbImg.alt = imgAlt(s, lbState.i);
    lbImg.src = fullSrc(s, img);
    lbCount.textContent = ar(lbState.i + 1) + ' / ' + ar(n);
    // تحميل الجيران مسبقاً
    [lbState.i + 1, lbState.i - 1].forEach(j => {
      const k = (j + n) % n;
      if (k !== lbState.i) { const p = new Image(); p.decoding = 'async'; p.src = fullSrc(s, s.order[k]); }
    });
  }
  lbImg.addEventListener('load', () => lbImg.classList.remove('is-loading'));
  lbImg.addEventListener('error', () => lbImg.classList.remove('is-loading'));

  function openLightbox(s, i, opener) {
    lbState.shoot = s;
    lbState.opener = opener || document.activeElement;
    lbCap.textContent = '';
    const b = el('b', null, s.brand);
    lbCap.append(b, document.createTextNode(s.title ? ' — ' + s.title : ''));
    const single = s.order.length < 2;
    lbPrev.hidden = single;
    lbNext.hidden = single;
    lbShow(i);
    lb.hidden = false;
    lbState.open = true;
    document.body.classList.add('is-locked');
    if ('inert' in page) page.inert = true;
    else page.setAttribute('aria-hidden', 'true');
    lbClose.focus();
    document.addEventListener('keydown', lbKeys, true);
  }

  function closeLightbox() {
    if (!lbState.open) return;
    lbState.open = false;
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.classList.remove('is-locked');
    if ('inert' in page) page.inert = false;
    else page.removeAttribute('aria-hidden');
    document.removeEventListener('keydown', lbKeys, true);
    if (lbState.opener && document.contains(lbState.opener)) lbState.opener.focus();
  }

  const lbNextImg = () => lbShow(lbState.i + 1);
  const lbPrevImg = () => lbShow(lbState.i - 1);

  function lbKeys(e) {
    if (!lbState.open) return;
    const multi = lbState.shoot.order.length > 1;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeLightbox(); return; }
    // RTL: التالي على اليسار
    if (e.key === 'ArrowLeft' && multi) { e.preventDefault(); lbNextImg(); return; }
    if (e.key === 'ArrowRight' && multi) { e.preventDefault(); lbPrevImg(); return; }
    if (e.key === 'Home' && multi) { e.preventDefault(); lbShow(0); return; }
    if (e.key === 'End' && multi) { e.preventDefault(); lbShow(lbState.shoot.order.length - 1); return; }
    if (e.key === 'Tab') {
      const f = [lbClose, lbPrev, lbNext].filter(b => !b.hidden);
      const idx = f.indexOf(document.activeElement);
      e.preventDefault();
      const next = e.shiftKey ? (idx <= 0 ? f.length - 1 : idx - 1) : (idx === -1 || idx === f.length - 1 ? 0 : idx + 1);
      f[next].focus();
    }
  }

  lbClose.addEventListener('click', closeLightbox);
  lbNext.addEventListener('click', lbNextImg);
  lbPrev.addEventListener('click', lbPrevImg);
  lb.addEventListener('click', e => { if (e.target === lb || e.target === lbStage) closeLightbox(); });

  // سحب باللمس — RTL: سحب الإصبع يمين = التالي
  let tStart = null;
  lbStage.addEventListener('touchstart', e => {
    tStart = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, multi: false } : null;
  }, { passive: true });
  lbStage.addEventListener('touchmove', e => { if (tStart && e.touches.length > 1) tStart.multi = true; }, { passive: true });
  lbStage.addEventListener('touchend', e => {
    if (!tStart || tStart.multi || !e.changedTouches.length) { tStart = null; return; }
    if (window.visualViewport && window.visualViewport.scale > 1.05) { tStart = null; return; } // المستخدم مكبّر الصورة
    const dx = e.changedTouches[0].clientX - tStart.x;
    const dy = e.changedTouches[0].clientY - tStart.y;
    tStart = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    if (lbState.shoot.order.length < 2) return;
    if (dx > 0) lbNextImg(); else lbPrevImg();
  });

  /* ---------- ٤) الفيديو: قبل / بعد ---------- */
  let videosBuilt = false;
  const players = [];
  let loadIO = null;
  let playIO = null;
  const autoplayOK = () => !mqReduce.matches && !saveData;

  function mkVideo(cls, src, poster, v) {
    const vd = document.createElement('video');
    vd.className = cls;
    vd.muted = true;
    vd.defaultMuted = true;
    vd.loop = true;
    vd.playsInline = true;
    ['muted', 'loop', 'playsinline', 'disablepictureinpicture', 'disableremoteplayback'].forEach(a => vd.setAttribute(a, ''));
    vd.preload = 'none';
    vd.setAttribute('aria-hidden', 'true');
    vd.tabIndex = -1;
    if (v.w && v.h) { vd.width = v.w; vd.height = v.h; }
    vd.dataset.src = src;
    if (poster) vd.dataset.poster = poster;
    return vd;
  }

  function mkToggle(title) {
    const b = el('button', 'cmp-toggle');
    b.type = 'button';
    b.append(svg(ICON_PAUSE, 16), svg(ICON_PLAY, 16));
    b.firstChild.classList.add('i-pause');
    b.lastChild.classList.add('i-play');
    b.dataset.title = title;
    return b;
  }

  function mkCaption(v) {
    const cap = el('figcaption', 'vid-cap');
    const t = el('p', 'vid-title');
    t.append(el('strong', null, v.title || 'قبل وبعد'));
    if (v.brand) t.append(el('span', 'vid-brand', v.brand));
    cap.append(t);
    if (v.desc) cap.append(el('p', 'vid-desc', v.desc));
    if (v.project && PROJECT_PAGES[v.project]) {
      const a = el('a', 'vid-link', 'عن المشروع ←');
      a.href = 'projects/' + PROJECT_PAGES[v.project] + '.html';
      cap.append(a);
    }
    return cap;
  }

  /* يشغّل/يوقف المقطعين مع بعض ويصحح الفرق بينهم */
  function Player(root, master, follower, toggle, sync) {
    const vids = [master, follower];
    const st = { loaded: false, visible: false, userPaused: !autoplayOK() };
    const want = () => st.loaded && st.visible && !st.userPaused && !document.hidden;

    function load() {
      if (st.loaded) return;
      st.loaded = true;
      vids.forEach(v => {
        if (v.dataset.poster) v.poster = v.dataset.poster;
        v.preload = 'metadata';
        v.src = v.dataset.src;
      });
    }
    function loadPosters() {
      vids.forEach(v => { if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster; });
    }
    function paint() {
      root.classList.toggle('is-paused', st.userPaused);
      toggle.setAttribute('aria-label', (st.userPaused ? 'شغّل المقطع: ' : 'أوقف المقطع: ') + toggle.dataset.title);
    }
    function update() {
      if (want()) {
        vids.forEach(v => {
          if (!v.paused) return;
          const p = v.play();
          // المتصفح منع التشغيل التلقائي (وضع توفير الطاقة مثلاً) → نعرض زر التشغيل. AbortError عادي ونتجاهله.
          if (p && p.catch) p.catch(err => {
            if (err && err.name === 'NotAllowedError') { st.userPaused = true; vids.forEach(o => o.pause()); paint(); }
          });
        });
      } else {
        vids.forEach(v => { if (!v.paused) v.pause(); });
      }
      paint();
    }

    if (sync) {
      master.addEventListener('timeupdate', () => {
        if (follower.seeking || follower.readyState < 2) return;
        const d = Math.abs(follower.currentTime - master.currentTime);
        const dur = master.duration || 0;
        // تجاهل لحظة رجوع اللوب — كل مقطع يرجع بنفسه
        if (d > 0.12 && (!dur || d < dur - 0.3)) follower.currentTime = master.currentTime;
      });
      master.addEventListener('seeked', () => {
        if (Math.abs(follower.currentTime - master.currentTime) > 0.05) follower.currentTime = master.currentTime;
      });
    }
    // لو واحد وقف يحمّل، نوقف الثاني لين يلحقه
    vids.forEach(v => {
      v.addEventListener('waiting', () => { if (want()) vids.forEach(o => { if (o !== v && !o.paused) o.pause(); }); });
      v.addEventListener('playing', () => {
        if (!want()) return;
        vids.forEach(o => { if (o !== v && o.paused) { const p = o.play(); if (p && p.catch) p.catch(() => {}); } });
      });
      v.addEventListener('error', () => { root.classList.add('has-error'); });
    });

    toggle.addEventListener('click', e => {
      e.stopPropagation();
      st.userPaused = !st.userPaused;
      if (!st.userPaused) { load(); st.visible = true; }
      update();
    });
    paint();

    return { root, st, load, loadPosters, update };
  }

  function buildCompare(v) {
    const fig = el('figure', 'vid vid--slider ' + ((v.h || 9) > (v.w || 16) ? 'vid--port' : 'vid--land'));
    fig.id = 'video-' + v.slug;
    const cmp = el('div', 'cmp');
    cmp.setAttribute('role', 'group');
    cmp.setAttribute('aria-label', 'مقارنة قبل وبعد: ' + (v.title || ''));
    if (v.w && v.h) cmp.style.setProperty('--ar', v.w + ' / ' + v.h);

    const after = mkVideo('cmp-after', v.after, v.poster, v);
    const before = mkVideo('cmp-before', v.before, v.poster_before || v.poster, v);
    const tagB = el('span', 'cmp-tag cmp-tag--before', 'قبل');
    const tagA = el('span', 'cmp-tag cmp-tag--after', 'بعد');
    tagB.setAttribute('aria-hidden', 'true');
    tagA.setAttribute('aria-hidden', 'true');

    const handle = el('div', 'cmp-handle');
    handle.tabIndex = 0;
    handle.setAttribute('role', 'slider');
    handle.setAttribute('aria-label', 'حرّك الخط بين قبل وبعد — ' + (v.title || ''));
    handle.setAttribute('aria-orientation', 'horizontal');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    const knob = el('span', 'cmp-knob');
    knob.append(svg(ICON_ARROWS, 20));
    handle.append(el('span', 'cmp-line'), knob);

    const toggle = mkToggle(v.title || '');
    cmp.append(after, before, tagB, tagA, handle, toggle);
    fig.append(cmp, mkCaption(v));

    // pos = نسبة «قبل» الظاهرة من يمين الإطار
    let pos = 50;
    function setPos(p) {
      pos = Math.max(0, Math.min(100, p));
      cmp.style.setProperty('--pos', pos + '%');
      const r = Math.round(pos);
      handle.setAttribute('aria-valuenow', String(r));
      handle.setAttribute('aria-valuetext', 'قبل ' + ar(r) + '٪، بعد ' + ar(100 - r) + '٪');
      tagB.classList.toggle('is-off', pos < 14);
      tagA.classList.toggle('is-off', pos > 86);
      // الدائرة تبقى داخل الإطار حتى لو الخط على الحافة
      const w = cmp.clientWidth;
      if (w) {
        const x = pos / 100 * w, m = 24;
        const kx = x < m ? x - m : (x > w - m ? x - (w - m) : 0);
        knob.style.setProperty('--kx', (-kx) + 'px');
      }
    }
    setPos(50);

    const fromX = x => {
      const r = cmp.getBoundingClientRect();
      return ((r.right - x) / r.width) * 100;
    };
    let drag = null; // {id, x, y, active}
    cmp.addEventListener('pointerdown', e => {
      if (e.target.closest('.cmp-toggle')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, active: e.pointerType === 'mouse' };
      if (drag.active) {
        e.preventDefault();
        try { cmp.setPointerCapture(e.pointerId); } catch (err) { /* */ }
        cmp.classList.add('is-dragging');
        setPos(fromX(e.clientX));
      }
    });
    cmp.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.active) {
        const dx = Math.abs(e.clientX - drag.x);
        const dy = Math.abs(e.clientY - drag.y);
        if (dx > 6 && dx > dy) {
          drag.active = true;
          try { cmp.setPointerCapture(e.pointerId); } catch (err) { /* */ }
          cmp.classList.add('is-dragging');
        } else if (dy > 10) { drag = null; return; }
      }
      if (drag && drag.active) setPos(fromX(e.clientX));
    });
    const endDrag = e => {
      if (!drag || e.pointerId !== drag.id) return;
      // لمسة سريعة بدون سحب = انقل الخط لمكانها
      if (!drag.active && e.type === 'pointerup') setPos(fromX(e.clientX));
      drag = null;
      cmp.classList.remove('is-dragging');
    };
    cmp.addEventListener('pointerup', endDrag);
    cmp.addEventListener('pointercancel', endDrag);
    cmp.addEventListener('lostpointercapture', () => { drag = null; cmp.classList.remove('is-dragging'); });

    handle.addEventListener('keydown', e => {
      const step = e.shiftKey ? 10 : 2;
      let p = pos;
      // RTL: السهم الأيسر يوسّع «قبل» (الخط يتحرك يسار)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') p += step;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') p -= step;
      else if (e.key === 'PageUp') p += 10;
      else if (e.key === 'PageDown') p -= 10;
      else if (e.key === 'Home') p = 0;
      else if (e.key === 'End') p = 100;
      else return;
      e.preventDefault();
      setPos(p);
    });

    const pl = Player(fig, after, before, toggle, true);
    players.push(pl);
    return fig;
  }

  function buildSide(v) {
    const fig = el('figure', 'vid vid--side');
    fig.id = 'video-' + v.slug;
    const pair = el('div', 'side-pair');
    pair.setAttribute('role', 'group');
    pair.setAttribute('aria-label', 'قبل وبعد جنب بعض: ' + (v.title || ''));
    const ar_ = (v.w && v.h) ? v.w + ' / ' + v.h : null;

    const itemB = el('div', 'side-item');
    const itemA = el('div', 'side-item');
    if (ar_) { itemB.style.setProperty('--ar', ar_); itemA.style.setProperty('--ar', ar_); }
    const before = mkVideo('side-before', v.before, v.poster_before || v.poster, v);
    const after = mkVideo('side-after', v.after, v.poster, v);
    const tB = el('span', 'cmp-tag cmp-tag--before', 'قبل');
    const tA = el('span', 'cmp-tag cmp-tag--after', 'بعد');
    tB.setAttribute('aria-hidden', 'true');
    tA.setAttribute('aria-hidden', 'true');
    const toggle = mkToggle(v.title || '');
    itemB.append(before, tB);
    itemA.append(after, tA, toggle);
    pair.append(itemB, itemA); // RTL: «قبل» يمين، «بعد» يسار
    fig.append(pair, mkCaption(v));

    const pl = Player(fig, after, before, toggle, false);
    players.push(pl);
    return fig;
  }

  function ensureVideos() {
    if (videosBuilt || !VIDEOS.length) return;
    videosBuilt = true;
    const grid = document.getElementById('vidGrid');
    VIDEOS.forEach(v => grid.append(v.type === 'slider' ? buildCompare(v) : buildSide(v)));

    const find = t => players.find(p => p.root === t);
    if ('IntersectionObserver' in window) {
      loadIO = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const p = find(en.target);
          if (!p) return;
          p.loadPosters();
          if (!p.st.userPaused) p.load();
          loadIO.unobserve(en.target);
        });
      }, { rootMargin: '400px 0px' });
      playIO = new IntersectionObserver(entries => {
        entries.forEach(en => {
          const p = find(en.target);
          if (!p) return;
          p.st.visible = en.isIntersecting && en.intersectionRatio >= 0.35;
          if (p.st.visible && !p.st.userPaused) p.load();
          p.update();
        });
      }, { threshold: [0, 0.35, 0.6] });
      players.forEach(p => { loadIO.observe(p.root); playIO.observe(p.root); });
    } else {
      players.forEach(p => { p.loadPosters(); p.st.visible = true; if (!p.st.userPaused) p.load(); p.update(); });
    }
  }

  document.addEventListener('visibilitychange', () => players.forEach(p => p.update()));
  const onMotionChange = () => {
    if (mqReduce.matches) players.forEach(p => { p.st.userPaused = true; p.update(); });
  };
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onMotionChange);

  /* ---------- الروابط المباشرة ---------- */
  function readHash() {
    let h = '';
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { h = location.hash.slice(1); }
    return h.trim();
  }

  function route(initial) {
    const h = readHash();
    if (!h) { if (initial) activateTab(visibleTabs()[0]); return; }
    if (TAB_KEYS.indexOf(h) !== -1) {
      activateTab(h, { pin: !initial });
      return;
    }
    if (bySlug[h]) {
      openShoot(h, { scroll: true, instant: initial });
      return;
    }
    const vslug = h.replace(/^video-/, '');
    if (videoBySlug[vslug] && tabs.video && !tabs.video.hidden) {
      activateTab('video');
      const fig = document.getElementById('video-' + vslug);
      if (fig) {
        const off = stickyOffset();
        scrollToY(fig.getBoundingClientRect().top + window.scrollY - off - 12, !initial);
      }
      return;
    }
    if (initial) activateTab(visibleTabs()[0]);
  }

  /* ---------- تشغيل ---------- */
  const firstHash = readHash();
  const initialTab = bySlug[firstHash] ? bySlug[firstHash].cat
    : (TAB_KEYS.indexOf(firstHash) !== -1 ? firstHash : visibleTabs()[0]);
  renderCards(initialTab);
  if ('scrollRestoration' in history && firstHash) history.scrollRestoration = 'manual';
  route(true);
  window.addEventListener('hashchange', () => route(false));
})();
