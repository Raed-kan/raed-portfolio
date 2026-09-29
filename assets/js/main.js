/* رائد · بورتفوليو · main.js — سلوك عام: الهيدر، قائمة الجوال، روابط الأقسام */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* الهيدر: خلفية أوضح بعد أول تمرير */
  const header = document.getElementById('siteHeader');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* قائمة الجوال */
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  if (toggle && nav) {
    const setOpen = open => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* روابط داخل الصفحة: تمرير ناعم (أو فوري مع تقليل الحركة) + نقل التركيز للقسم.
     نستخدم getElementById عشان الهاشات مثل #work/photo ما تكسر querySelector. */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    /* لا نمسح الفلتر من الرابط: #work/photo يبقى لو ضغط «الأعمال» والشبكة مفلترة */
    if (!(id === 'work' && /^#work\//.test(location.hash))) history.replaceState(null, '', '#' + id);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();
