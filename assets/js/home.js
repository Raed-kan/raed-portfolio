/* رائد · بورتفوليو · home.js — خاص بالرئيسية:
   ١) شبكة «التصوير والفيديو» من window.SHOOTS (+ بطاقة قبل/بعد من window.VIDEOS إن وُجد)
   ٢) فلاتر «الأعمال»: إخفاء/إظهار + تبديل الغلاف والرابط حسب الخدمة
   (زر واتساب صار رابط ثابت في index.html — قسم التواصل) */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const SERVICES = {
    identity: 'هويات وبراندات',
    photo: 'تصوير منتجات',
    video: 'مقاطع فيديو',
    social: 'سوشال وحملات'
  };

  /* ---------- ١) التصوير والفيديو ---------- */

  /* لقطات مختارة يدوياً (أول ٤ تظهر على الجوال) — كلها من مجموعات wide/land/square
     عشان تنقص زين في المربع الموحّد 4:3، وما تتكرر مع صور الهيرو.
     لو لقطة انحذفت من SHOOTS تنعوّض تلقائياً. */
  const PICKS = [
    { slug: 'bp',     f: '02', alt: 'بندر بطاطا — علبة بطاطس تعاون VOX وكوبان في صالة سينما' },
    { slug: 'reef',   f: '16', alt: 'عطور ريف — علبة هدية شتوية وزجاجتان على خلفية زرقاء' },
    { slug: 'flatty', f: '03', alt: 'فلاتي باتي — أيادٍ تمسك برجر حول بعضها على خلفية بنفسجية' },
    { slug: 'osma',   f: '06', alt: 'أوسما — زجاجتا عطر وردية وذهبية بين ورد بنفسجي وأصفر' },
    { slug: 'bp',     f: '24', alt: 'بندر بطاطا — بطاطس متعرّجة على لوح بشكل ملعب «سوبر فرايز» بخلفية داكنة' },
    { slug: 'reef',   f: '05', alt: 'عطور ريف — عارضة ببلوزة حرير جالسة على كنبة تمسك زجاجة عطر أمام ستارة زرقاء' },
    { slug: 'flatty', f: '15', alt: 'فلاتي باتي — برجر بالجبن في غلافه البنفسجي على طاولة بلاط بنفسجي' },
    { slug: 'osma',   f: '04', alt: 'أوسما — يدين تمسك زجاجة عطر وردية قدّام فستان أبيض وورد' }
  ];
  const SHOTS_MAX = 8;
  const MOBILE_SHOTS = 4;
  /* المربع في الشريط 4:3 — البنرات العريضة جداً والطولية تنقص وايد، فالتعويض ياخذ من ذي أول */
  const STRIP_GROUPS = ['wide', 'land', 'square'];

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function thumb(src, alt, eager, w, h) {
    const img = new Image(w || 720, h || 540);
    img.src = src;
    img.alt = alt;
    img.decoding = 'async';
    if (!eager) img.loading = 'lazy';
    return img;
  }

  function pickShots() {
    const shoots = Array.isArray(window.SHOOTS) ? window.SHOOTS.filter(s => s && s.slug && Array.isArray(s.groups)) : [];
    const bySlug = {};
    shoots.forEach(s => { bySlug[s.slug] = s; });
    /* صور كل جلسة: المناسبة للمربع 4:3 أول، والباقي آخر شي */
    const fits = s => {
      const ok = [], rest = [];
      s.groups.forEach(g => {
        if (!g || !Array.isArray(g.images)) return;
        (STRIP_GROUPS.indexOf(g.key) !== -1 ? ok : rest).push(...g.images.filter(i => i && i.f != null));
      });
      return { ok, rest };
    };
    const pool = {};
    shoots.forEach(s => { pool[s.slug] = fits(s); });

    const chosen = [];
    const used = new Set();
    const add = (s, img, alt) => {
      const key = s.slug + '/' + img.f;
      if (used.has(key) || chosen.length >= SHOTS_MAX) return;
      used.add(key);
      chosen.push({ s, img, alt });
    };
    PICKS.forEach(p => {
      const s = bySlug[p.slug];
      const img = s && pool[s.slug].ok.concat(pool[s.slug].rest).find(i => String(i.f) === p.f);
      if (img) add(s, img, p.alt);
    });
    /* تعويض: نلف على الجلسات بالترتيب (المناسبة أول) لين نكمّل العدد */
    ['ok', 'rest'].forEach(kind => {
      for (let round = 0; chosen.length < SHOTS_MAX; round++) {
        let any = false;
        shoots.forEach(s => {
          const img = pool[s.slug][kind][round];
          if (img) { any = true; add(s, img); }
        });
        if (!any) break;
      }
    });
    return chosen;
  }

  function buildShots() {
    const grid = document.getElementById('shotsGrid');
    if (!grid) return;
    const frag = document.createDocumentFragment();

    pickShots().forEach(({ s, img, alt }, i) => {
      const a = el('a', 'shot' + (i >= MOBILE_SHOTS ? ' is-extra' : ''));
      a.href = 'ai-gallery.html#' + encodeURIComponent(s.slug);
      /* على الصورة اسم البراند فقط؛ عنوان الجلسة (إن وُجد) يروح للنص البديل */
      const fallbackAlt = s.brand + ' — ' + (s.title || 'صورة منتج من جلسة التصوير');
      a.append(
        thumb('assets/images/shoots/' + s.slug + '/' + img.f + '-t.jpg', alt || fallbackAlt, false, img.tw, img.th),
        el('span', 'shot-cap', s.brand)
      );
      frag.appendChild(a);
    });

    const video = buildVideoTile();
    if (video) {
      grid.classList.add('has-video');
      frag.insertBefore(video, frag.firstChild);
    }
    grid.appendChild(frag);
  }

  /* فيديو الرئيسية من window.VIDEOS: أول مقطع بدون consent_note (ما ينتظر موافقة)، وإلا أول مقطع.
     نقرأ الحقول بمرونة لأن ملف الفيديو يُبنى بشكل منفصل */
  function firstVideo() {
    const list = Array.isArray(window.VIDEOS) ? window.VIDEOS.filter(x => x && typeof x === 'object') : [];
    const pending = x => typeof x.consent_note === 'string' && x.consent_note.trim() !== '';
    const v = list.find(x => !pending(x)) || list[0];
    if (!v) return null;
    const pick = x => (typeof x === 'string' && x.trim()) ? x.trim() : '';
    const after = pick(v.poster) || pick(v.posterAfter) || pick(v.after && v.after.poster);
    if (!after) return null;
    return {
      after,
      /* السحب فوق بعض يصلح فقط للمقاطع المتطابقة (type: 'slider') */
      before: v.type === 'side' ? '' : (pick(v.poster_before) || pick(v.posterBefore) || pick(v.beforePoster) || pick(v.before && v.before.poster)),
      brand: pick(v.brand),
      title: pick(v.title),
      alt: pick(v.alt),
      altBefore: pick(v.alt_before)
    };
  }

  function buildVideoTile() {
    const v = firstVideo();
    if (!v) return null;
    const a = el('a', 'shot shot-video');
    a.href = 'ai-gallery.html#video';
    const who = v.brand ? v.brand + ' — ' : '';

    if (v.before) {
      /* قبل (يمين) ← بعد (يسار) — معاينة ثابتة، والسحب الفعلي في صفحة الجلسات */
      const after = thumb(v.after, who + (v.alt || 'اللقطة بعد التعديل'));
      const before = thumb(v.before, who + (v.altBefore ? 'قبل: ' + v.altBefore : 'اللقطة الخام قبل التعديل'));
      before.classList.add('ba-before');
      a.append(after, before, el('span', 'ba-line'), el('span', 'ba-label is-before', 'قبل'), el('span', 'ba-label is-after', 'بعد'));
    } else {
      a.append(thumb(v.after, who + (v.alt || 'لقطة من المقطع بعد التعديل')), el('span', 'ba-badge', 'قبل ← بعد'));
    }

    const cap = el('span', 'shot-video-cap');
    cap.append(el('strong', '', v.title || 'من مقطع خام إلى مشهد إعلاني'), el('span', '', (v.brand ? v.brand + ' · ' : '') + 'شاهد قبل وبعد'));
    a.append(cap);
    a.setAttribute('aria-label', 'فيديو قبل وبعد' + (v.brand ? ' — ' + v.brand : '') + ': ' + (v.title || 'من مقطع خام إلى مشهد إعلاني'));
    return a;
  }

  /* ---------- ٢) فلاتر الأعمال ---------- */

  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);

  function countLabel(n) {
    if (n === 1) return 'مشروع واحد';
    if (n === 2) return 'مشروعين';
    if (n >= 3 && n <= 10) return n + ' مشاريع';
    return n + ' مشروع';
  }

  /* صورة مع سلسلة بدائل: لو الغلاف الخاص ما وُجد (مثل ملصق فيديو انحذف) نرجع للغلاف الافتراضي */
  function setSrc(img, src, fallbacks) {
    const chain = fallbacks.filter(x => x && x !== src);
    img.onerror = () => {
      const next = chain.shift();
      if (next) img.src = next;
      else img.onerror = null;
    };
    img.src = src;
  }

  function initFilters() {
    const bar = document.getElementById('filters');
    const grid = document.getElementById('grid');
    if (!bar || !grid) return;
    const chips = Array.from(bar.querySelectorAll('[data-filter]'));
    const cards = Array.from(grid.querySelectorAll('.wcard'));
    const status = document.getElementById('workStatus');
    const header = document.getElementById('siteHeader');
    const video = firstVideo();

    cards.forEach(card => {
      const img = card.querySelector('.wcard-media img');
      card._def = { href: card.getAttribute('href'), src: img ? img.getAttribute('src') : '', alt: img ? img.alt : '' };
    });

    let current = 'all';
    let timer = 0;

    function apply(f) {
      let shown = 0;
      cards.forEach(card => {
        const svcs = (card.dataset.services || '').split(/\s+/);
        const show = f === 'all' || svcs.includes(f);
        card.hidden = !show;
        if (!show) return;
        shown++;
        const d = card._def;
        const key = f === 'all' ? '' : cap1(f);
        const src = (key && card.dataset['cover' + key]) || d.src;
        card.setAttribute('href', (key && card.dataset['href' + key]) || d.href);
        const img = card.querySelector('.wcard-media img');
        if (img) {
          if (img.getAttribute('src') !== src) {
            setSrc(img, src, [f === 'video' && video ? video.after : '', d.src]);
          }
          img.alt = (key && card.dataset['alt' + key]) || d.alt;
        }
        card.querySelectorAll('.wcard-tags [data-s]').forEach(t => t.classList.toggle('is-on', t.dataset.s === f));
      });
      if (status) status.textContent = 'يعرض ' + countLabel(shown) + (f === 'all' ? '' : ' — ' + SERVICES[f]);
    }

    /* لو شريط الفلاتر لاصق (جوال) والشبكة صارت أقصر، نرجّع أول الشبكة للعين */
    function keepGridInView() {
      const headerH = header ? header.offsetHeight : 0;
      if (bar.getBoundingClientRect().top > headerH + 2) return;
      const top = grid.getBoundingClientRect().top + window.scrollY - headerH - bar.offsetHeight - 12;
      if (top < window.scrollY) window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }

    function select(f, opts) {
      opts = opts || {};
      if (f !== 'all' && !SERVICES[f]) f = 'all';
      chips.forEach(c => c.setAttribute('aria-pressed', c.dataset.filter === f ? 'true' : 'false'));
      if (opts.updateHash !== false) {
        history.replaceState(null, '', f === 'all' ? '#work' : '#work/' + f);
      }
      if (f === current && !opts.force) return;
      current = f;

      clearTimeout(timer);
      if (reduceMotion.matches || opts.instant) {
        apply(f);
        grid.classList.remove('is-switching');
        if (!opts.instant) keepGridInView();
        return;
      }
      grid.classList.add('is-switching');
      timer = setTimeout(() => {
        apply(f);
        void grid.offsetWidth; /* نثبّت الحالة المخفية قبل ما نرجّع الظهور عشان تشتغل الحركة */
        grid.classList.remove('is-switching');
        keepGridInView();
      }, 200);
    }

    bar.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (btn) select(btn.dataset.filter);
    });

    /* الرابط المباشر مثل index.html#work/photo يفتح على الفلتر */
    const fromHash = () => {
      const m = /^#work\/(identity|photo|video|social)$/.exec(location.hash);
      return m ? m[1] : null;
    };
    const initial = fromHash();
    if (initial) {
      select(initial, { instant: true, updateHash: false, force: true });
      const work = document.getElementById('work');
      if (work) {
        const jump = () => work.scrollIntoView({ block: 'start', behavior: 'instant' });
        jump();
        /* مرة ثانية بعد تحميل الخطوط/الصور، إلا إذا الزائر بدأ يمرر بنفسه */
        const y0 = window.scrollY;
        window.addEventListener('load', () => { if (Math.abs(window.scrollY - y0) < 4) jump(); }, { once: true });
      }
    }
    window.addEventListener('hashchange', () => {
      const f = fromHash();
      if (f) select(f, { updateHash: false });
    });
  }

  buildShots();
  initFilters();
})();
