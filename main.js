/* Freecierge Co. — motion system ported from the Resonance structure:
   GSAP + ScrollTrigger + CustomEase("main"), Lenis (lerp .1 / wheel .7), grid-wipe page transitions, split-text reveals,
   char-stagger buttons, 3D hover tilt, directional hover tiles, cursor follower, image trail, Swiper. */
gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('main', '0.62, 0.05, 0.01, 0.99');

const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const $1 = (s, c = document) => c.querySelector(s);
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isHome = !!$1('#hero');

/* ---------- Lenis ---------- */
const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.7, infinite: false, gestureOrientation: 'vertical' });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

/* ---------- Page transition (grid wipe) ---------- */
const gridEl = $1('#loadGrid'), gridItems = $$('.load-grid_item');
let leaving = false;
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const href = a.getAttribute('href');
  if (!href || /^(mailto:|tel:|javascript:)/.test(href) || a.hasAttribute('download')) return;
  let u; try { u = new URL(a.href, location.href); } catch (_) { return; }
  if (u.origin !== location.origin) return;
  const same = u.pathname === location.pathname;
  if (same && u.hash) {                       // in-page anchor -> smooth scroll
    if ($1(u.hash)) { e.preventDefault(); lenis.scrollTo(u.hash, { offset: -20, duration: 1.4 }); }
    return;
  }
  if (same && !u.hash && u.search === location.search) { e.preventDefault(); lenis.scrollTo(0, { duration: 1.4 }); return; }
  e.preventDefault();
  if (leaving) return; leaving = true;
  try { sessionStorage.setItem('fc-nav', '1'); } catch (_) {}
  lenis.stop();
  gsap.set(gridEl, { display: 'flex' });
  gsap.set('.load-center', { opacity: 0, y: 0 });
  gsap.timeline({ onComplete: () => { window.location = u.href; } })
    .fromTo(gridItems, { height: '0%' }, { height: '100%', duration: 0.5, stagger: { amount: 0.25 }, ease: 'power2.inOut' }, 0)
    .to('.load-center', { opacity: 1, duration: 0.3 }, 0.35);
});
window.onpageshow = e => { if (e.persisted) location.reload(); };

/* ---------- Button / link character stagger ---------- */
function initButtonCharacterStagger() {
  $$('[data-button-animate-chars]').forEach(el => {
    const txt = el.textContent.trim();
    const row = cls => `<span class="c-row ${cls}">${[...txt].map((ch, i) => `<span class="c" style="transition-delay:${(i * 0.01).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</span>`;
    el.innerHTML = `<span class="c-wrap" aria-label="${txt}">${row('a')}${row('b')}</span>`;
    el.querySelector('.c-wrap').style.height = '1.15em';
  });
}
$$('.menu-dropdown a').forEach(a => a.setAttribute('data-button-animate-chars', ''));
initButtonCharacterStagger();

/* ---------- Navigation ---------- */
$$('.menu-dropdown_wrapper').forEach(w => {
  const link = $1('.navigation-link', w), dd = $1('.menu-dropdown', w);
  const on = () => { dd.classList.add('is-active'); link.classList.add('is-active'); };
  const off = e => { if (!w.contains(e.relatedTarget)) { dd.classList.remove('is-active'); link.classList.remove('is-active'); } };
  w.addEventListener('mouseover', on); w.addEventListener('mouseout', off);
});
const menuBtn = $1('.menu-button'), menu = $1('#menu');
menuBtn.addEventListener('click', () => {
  $$('.menu-line').forEach(l => l.classList.toggle('is-open'));
  menu.classList.toggle('is-open');
  if (window.innerWidth < 992) $$('.menu-dropdown').forEach(d => d.classList.toggle('is-active', menu.classList.contains('is-open')));
});
// mark current page in nav
$$('.menu a[href]').forEach(a => { try { if (new URL(a.href).pathname === location.pathname && a.classList.contains('navigation-link')) a.classList.add('is-current'); } catch (_) {} });

/* ---------- Text splitting ---------- */
function splitWords(el, cls = 'word') {
  const words = [];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = cls; s.textContent = part; frag.appendChild(s); words.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  return words;
}

/* ---------- Global scroll text/element animations ---------- */
function initGlobalAnimation() {
  $$("[animate-txt='words-scale-in']").forEach(el => {
    const words = splitWords(el);
    gsap.set(el, { visibility: 'visible' });
    gsap.from(words, { rotationX: -90, rotationZ: 3, y: 25, opacity: 0, transformOrigin: '0% 50% -20', transformPerspective: 700,
      duration: 1.3, stagger: 0.04, ease: 'main', scrollTrigger: { trigger: el, start: 'top bottom' } });
  });
  $$("[animate-txt='lines-fade-in']").forEach(el => {
    const words = splitWords(el);
    gsap.set(el, { visibility: 'visible' });
    const lineOf = []; let top = null, li = -1;
    words.forEach(w => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 4) { li++; top = t; } lineOf.push(li); });
    gsap.from(words, { opacity: 0, y: 25, duration: 1, ease: 'main', delay: i => lineOf[i] * 0.2, scrollTrigger: { trigger: el, start: 'top bottom' } });
  });
  $$("[animate-el='unmask']").forEach(el => gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'main', scrollTrigger: { trigger: el, start: 'top bottom' } }));
  $$("[animate-el='scale-in']").forEach(el => gsap.from(el, { clipPath: 'inset(0 0 100% 0)', scale: 0.9, y: 25, duration: 1.5, ease: 'main', scrollTrigger: { trigger: el, start: 'top bottom' } }));
}

/* scroll-scrubbed word colour (gray -> ink) */
$$('.scrub-words').forEach(el => {
  const words = splitWords(el, 'w');
  gsap.to(words, { color: '#0A0A09', stagger: 0.12, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
});

/* ---------- Load / enter animation ---------- */
const count = $1('#count'), counter = { v: 0 };
let visitedViaNav = false;
try { visitedViaNav = sessionStorage.getItem('fc-nav') === '1'; sessionStorage.removeItem('fc-nav'); } catch (_) {}
const fullIntro = isHome && !visitedViaNav;
const afterWipe = () => {
  document.body.classList.remove('is-loading'); lenis.start(); initGlobalAnimation(); ScrollTrigger.refresh();
  if (location.hash && $1(location.hash)) lenis.scrollTo(location.hash, { offset: -20, immediate: true });
};
if (isHome) gsap.set('.hero-art', { scale: 0.7, opacity: 0 });
const intro = gsap.timeline();
intro.from('.load-mark', { scale: 0.6, opacity: 0, duration: 0.7, ease: 'main' }, 0)
     .from('.load-mark .fm-top', { y: -30, x: 20, duration: 0.7, ease: 'main' }, 0)
     .from('.load-mark .fm-bot', { y: 30, x: -14, duration: 0.7, ease: 'main' }, 0.08)
     .from('.load-mark .fm-mid', { x: -80, opacity: 0, duration: 0.7, ease: 'main' }, 0.2);
const wipeAt = fullIntro ? 1.9 : 0.75;
if (fullIntro) intro.to(counter, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => count.textContent = Math.round(counter.v) }, 0);
else $1('.load-count') && gsap.set('.load-count', { display: 'none' });
intro.to('.load-center', { opacity: 0, y: -20, duration: 0.4 }, wipeAt - 0.3)
     .to(gridItems, { height: '0%', duration: 0.5, stagger: { amount: 0.25 }, ease: 'power2.inOut' }, wipeAt)
     .set('#loadGrid', { display: 'none' })
     .add(afterWipe, wipeAt + 0.25);
if (isHome) {
  intro.to('.hero-art', { scale: 1, opacity: 1, duration: 1.8, ease: 'main' }, wipeAt + 0.1)
       .from('.nav-logo, .menu, .menu-button', { y: -30, opacity: 0, duration: 1, stagger: 0.1, ease: 'main' }, wipeAt + 0.3)
       .from('.hero-scroll', { opacity: 0, duration: 1 }, wipeAt + 1);
} else {
  intro.from('.nav-logo, .menu, .menu-button', { y: -30, opacity: 0, duration: 1, stagger: 0.1, ease: 'main' }, wipeAt + 0.3);
}

/* ---------- Hero: pinned scroll (home) ---------- */
if (isHome) {
  const heroTl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true } });
  heroTl.to('.hero-stage', { scale: 1.9, ease: 'none' }, 0)
        .to('.hero-title', { yPercent: -60, opacity: 0, ease: 'none' }, 0.2)
        .to('.hero-scroll', { opacity: 0 }, 0)
        .to('.hero-bg', { opacity: 0.4, ease: 'none' }, 0.5);
  if (!reduce) gsap.to('.hero-art', { y: -14, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/* ---------- 3D perspective hover ---------- */
function init3dPerspectiveHover() {
  if (!fine || reduce) return;
  const targets = $$('[data-3d-hover-target]');
  if (!targets.length) return;
  let mx = innerWidth / 2, my = innerHeight / 2, ticking = false;
  const list = targets.map(el => {
    const mr = parseFloat(el.getAttribute('data-max-rotate'));
    return { el, max: Number.isFinite(mr) ? mr : 20, proxy: { rx: 0, ry: 0 }, rect: el.getBoundingClientRect(),
      setX: gsap.quickSetter(el, 'rotationX', 'deg'), setY: gsap.quickSetter(el, 'rotationY', 'deg') };
  });
  const measure = () => list.forEach(t => t.rect = t.el.getBoundingClientRect());
  const frame = () => {
    ticking = false;
    list.forEach(t => {
      const r = t.rect, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const ry = Math.max(-1, Math.min(1, (mx - cx) / (r.width / 2 || 1))) * t.max;
      const rx = -Math.max(-1, Math.min(1, (my - cy) / (r.height / 2 || 1))) * t.max;
      gsap.to(t.proxy, { rx, ry, duration: 0.5, ease: 'power3.out', overwrite: true, onUpdate: () => { t.setX(t.proxy.rx); t.setY(t.proxy.ry); } });
    });
  };
  document.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(measure), { passive: true });
  addEventListener('scroll', () => requestAnimationFrame(measure), { passive: true });
}
init3dPerspectiveHover();

/* ---------- Sticky sprint cards: stack + parallax (home) ---------- */
const sprints = $$('[data-sprint]');
sprints.forEach((c, i) => {
  if (window.innerWidth > 991) c.style.top = 110 + i * 16 + 'px';
  if (i < sprints.length - 1) gsap.to(c, { scale: 0.94, ease: 'none', scrollTrigger: { trigger: sprints[i + 1], start: 'top 95%', end: 'top 110px', scrub: true } });
  $$('.device, .sel, .knot, .collage, .glyph, .ball, .appicon', c).forEach((el, k) => {
    gsap.fromTo(el, { y: 70 + k * 30 }, { y: -20 * k, ease: 'none', scrollTrigger: { trigger: c, start: 'top 90%', end: 'top 15%', scrub: 0.6 } });
  });
});

/* ---------- Work listing: cursor follower + directional hover ---------- */
function initWorkListing() {
  $$('[data-follower-wrap]').forEach(wrap => {
    const coll = $1('[data-follower-collection]', wrap), its = $$('[data-follower-item]', wrap);
    const cursor = $1('[data-follower-cursor]', wrap), inner = $1('[data-follower-cursor-inner]', wrap);
    let prev = null, first = true; const off = 100, dur = 0.5, ease = 'power2.inOut';
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    const qx = gsap.quickTo(cursor, 'x', { duration: 0.6, ease: 'power3' }), qy = gsap.quickTo(cursor, 'y', { duration: 0.6, ease: 'power3' });
    window.addEventListener('mousemove', e => { qx(e.clientX); qy(e.clientY); });
    its.forEach((it, i) => {
      it.addEventListener('mouseenter', () => {
        cursor.classList.add('on');
        const down = prev === null || i > prev; prev = i;
        $$('[data-follower-visual]', cursor).forEach(v => { gsap.killTweensOf(v); gsap.to(v, { yPercent: down ? -off : off, duration: dur, ease, overwrite: 'auto', onComplete: () => v.remove() }); });
        const vis = $1('[data-follower-visual]', it); if (!vis) return;
        const cl = vis.cloneNode(true); cl.removeAttribute('hidden'); inner.appendChild(cl);
        if (first) first = false; else gsap.fromTo(cl, { yPercent: down ? off : -off }, { yPercent: 0, duration: dur, ease, overwrite: 'auto' });
      });
      it.addEventListener('mouseleave', () => {
        const v = $1('[data-follower-visual]', cursor);
        if (v) { gsap.killTweensOf(v); gsap.to(v, { yPercent: -off, duration: dur, ease, overwrite: 'auto', onComplete: () => v.remove() }); }
      });
    });
    coll.addEventListener('mouseleave', () => {
      cursor.classList.remove('on');
      $$('[data-follower-visual]', cursor).forEach(v => { gsap.killTweensOf(v); gsap.delayedCall(dur, () => v.remove()); });
      first = true; prev = null;
    });
  });
  const dir = { top: 'translateY(-100%)', bottom: 'translateY(100%)', left: 'translateX(-100%)', right: 'translateX(100%)' };
  $$('[data-directional-hover-item]').forEach(item => {
    const tile = $1('[data-directional-hover-tile]', item); if (!tile) return;
    const edge = e => { const r = item.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      return Object.entries({ top: y, right: r.width - x, bottom: r.height - y, left: x }).reduce((a, b) => a[1] < b[1] ? a : b)[0]; };
    item.addEventListener('mouseenter', e => { const d = edge(e); tile.style.transition = 'none'; tile.style.transform = dir[d]; tile.offsetHeight; tile.style.transition = ''; tile.style.transform = 'translate(0%, 0%)'; });
    item.addEventListener('mouseleave', e => { tile.style.transform = dir[edge(e)]; });
  });
}
initWorkListing();

/* ---------- Testimonials slider ---------- */
$$('.tst-slider_component').forEach(c => {
  new Swiper($1('.swiper', c), {
    slidesPerView: 1.12, spaceBetween: 18, speed: 800, allowTouchMove: true, followFinger: true, loop: false, rewind: false,
    keyboard: { enabled: true, onlyInViewport: true },
    navigation: { nextEl: $1('.swiper-next', c), prevEl: $1('.swiper-prev', c), disabledClass: 'is-disabled' },
    scrollbar: { el: $1('.swiper-drag-wrapper', c), draggable: true, dragClass: 'swiper-drag', snapOnRelease: true },
    breakpoints: { 480: { slidesPerView: 1.12, spaceBetween: 26 }, 768: { slidesPerView: 1.6, spaceBetween: 26 }, 992: { slidesPerView: 2.12, spaceBetween: 26 } }
  });
});

/* ---------- Cursor label ---------- */
if (fine) {
  const cur = $1('#cursor'), p = $1('p', cur); let last = '';
  gsap.set(cur, { xPercent: 6, yPercent: 140 });
  const xTo = gsap.quickTo(cur, 'x', { ease: 'power3' }), yTo = gsap.quickTo(cur, 'y', { ease: 'power3' });
  window.addEventListener('mousemove', e => {
    const edgeR = e.clientX > innerWidth - (cur.offsetWidth + 16);
    gsap.to(cur, { xPercent: edgeR ? -100 : 6, yPercent: e.clientY > innerHeight * 0.9 ? -120 : 140, duration: 0.9, ease: 'power3' });
    xTo(e.clientX); yTo(e.clientY);
  });
  $$('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => { const t = el.getAttribute('data-cursor'); if (t !== last) { p.textContent = t; last = t; } cur.classList.add('on'); });
    el.addEventListener('mouseleave', () => cur.classList.remove('on'));
  });
}

/* ---------- Image trail (CTA) ---------- */
function initImageTrail(opts = {}) {
  const o = { minWidth: opts.minWidth ?? 992, moveDistance: opts.moveDistance ?? 15, stopDuration: opts.stopDuration ?? 300, trailLength: opts.trailLength ?? 5 };
  const wrap = $1('[data-trail="wrapper"]');
  if (!wrap || innerWidth < o.minWidth) return;
  const s = { interval: null, idx: 0, last: { x: 0, y: 0 }, stamps: new Map(), imgs: $$('[data-trail="item"]'), active: false };
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const show = (el, x, y) => {
    if (!el) return; el.style.display = 'grid';
    const r = el.getBoundingClientRect();
    Object.assign(el.style, { left: x - r.width / 2 + 'px', top: y - r.height / 2 + 'px', zIndex: s.idx });
    s.stamps.set(el, Date.now());
    gsap.fromTo(el, { autoAlpha: 0, scale: 0.8 }, { scale: 1, autoAlpha: 1, duration: 0.2, overwrite: true });
    s.last = { x, y };
  };
  const hide = el => { if (el) gsap.to(el, { opacity: 0, scale: 0.2, duration: 0.8, ease: 'expo.out', onComplete: () => gsap.set(el, { autoAlpha: 0 }) }); };
  const move = e => {
    if (!s.active) return;
    const r = wrap.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (dist(x, y, s.last.x, s.last.y) > innerWidth / o.moveDistance) {
      show(s.imgs[s.idx % s.imgs.length], x, y); hide(s.imgs[(s.idx - o.trailLength) % s.imgs.length]); s.idx++;
    }
  };
  const tick = () => { const n = Date.now(); for (const [el, t] of s.stamps) if (n - t > o.stopDuration) { hide(el); s.stamps.delete(el); } };
  const start = () => { if (s.active) return; s.active = true; wrap.addEventListener('mousemove', move); s.interval = setInterval(tick, 100); };
  const stop = () => { if (!s.active) return; s.active = false; wrap.removeEventListener('mousemove', move); clearInterval(s.interval); s.imgs.forEach(hide); s.stamps.clear(); };
  ScrollTrigger.create({ trigger: wrap, start: 'top bottom', end: 'bottom top', onEnter: start, onEnterBack: start, onLeave: stop, onLeaveBack: stop });
}
initImageTrail({ minWidth: 992, moveDistance: 15, stopDuration: 350, trailLength: 8 });

/* ---------- Image flip (Brand / Product / AI) ---------- */
$$('.image-flip_block').forEach(b => {
  const txt = $1('.image-flip_text-wrapper', b).children; let n = 0;
  txt[0].classList.add('is-active');
  setInterval(() => { [...txt].forEach(t => t.classList.remove('is-active')); n = (n + 1) % txt.length; txt[n].classList.add('is-active'); }, 3000);
});

/* ---------- CTA bars + footer wordmark ---------- */
if ($1('.cta-bars')) gsap.from('.cta-bars i', { scaleY: 0, duration: 1.4, ease: 'main', stagger: { amount: 0.6 }, scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
gsap.from('.footer-logo span', { yPercent: 100, duration: 1, stagger: { amount: 0.5, from: 'start' }, ease: 'main',
  scrollTrigger: { trigger: '.footer_container', start: 'bottom-=20% bottom', toggleActions: 'play none none reverse' } });

/* =============== INNER-PAGE COMPONENTS =============== */

/* Masonry columns that drift in opposite directions (sprint page hero) */
$$('.mason-col').forEach((col, i) => {
  gsap.fromTo(col, { yPercent: i % 2 ? -8 : 6 }, { yPercent: i % 2 ? 8 : -10, ease: 'none',
    scrollTrigger: { trigger: '.mason', start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
});
if ($1('.mason')) gsap.from('.mason .tile', { y: 80, opacity: 0, duration: 1.4, stagger: 0.08, ease: 'main', delay: 0.9 });

/* "How we work": active step highlight as it crosses mid-screen */
$$('.step').forEach(st => ScrollTrigger.create({ trigger: st, start: 'top 55%', end: 'bottom 55%',
  onToggle: s => st.classList.toggle('is-active', s.isActive) }));

/* FAQ accordion */
$$('.faq-item').forEach(item => {
  const q = $1('.faq-q', item), a = $1('.faq-a', item);
  gsap.set(a, { height: 0 });
  q.addEventListener('click', () => {
    const open = item.classList.toggle('is-open');
    q.setAttribute('aria-expanded', open);
    gsap.to(a, { height: open ? 'auto' : 0, duration: 0.7, ease: 'main', onComplete: () => ScrollTrigger.refresh() });
  });
});

/* Apply page: role toggle, dropzone, submit, left testimonial cards */
$$('.seg').forEach(seg => {
  const btns = $$('button', seg);
  const apply = val => $$('[data-role]').forEach(f => {
    const show = f.dataset.role === 'all' || f.dataset.role === val;
    f.hidden = !show;
    $$('input,textarea,select', f).forEach(c => { c.disabled = !show; });
  });
  apply((btns.find(b => b.classList.contains('is-active')) || btns[0]).dataset.value);
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.toggle('is-active', x === b));
    apply(b.dataset.value);
  }));
});
$$('.drop').forEach(d => {
  const inp = $1('input[type=file]', d), label = $1('.drop-label', d), orig = label.textContent;
  const set = f => { label.textContent = f ? f.name : orig; d.classList.toggle('has-file', !!f); };
  inp.addEventListener('change', () => set(inp.files[0]));
  ['dragenter', 'dragover'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('is-over'); }));
  d.addEventListener('drop', e => { if (e.dataTransfer.files[0]) { inp.files = e.dataTransfer.files; set(inp.files[0]); } });
});
/* ---------- Forms -> Freecierge inbox (via FormSubmit, no server needed) ---------- */
const MAIL_TO = 'freecierge0705@gmail.com';
/* Web3Forms: paste the access key emailed to you after entering your address at https://web3forms.com */
const WEB3FORMS_KEY = '107f487c-507b-4423-8ab3-3b4136630e76';
const FORM_ENDPOINT = 'https://api.web3forms.com/submit';
const pageName = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
const SUBJECTS = { apply: 'New Venture application', contact: 'New Sprint enquiry' };

async function sendToInbox(form, subject, extra = {}) {
  if (!WEB3FORMS_KEY || WEB3FORMS_KEY.startsWith('PASTE')) throw new Error('Web3Forms access key not set');
  const body = { access_key: WEB3FORMS_KEY, subject: `Freecierge — ${subject}`, from_name: 'Freecierge website', botcheck: '', page: location.href };
  $$('input,textarea,select', form).forEach(c => {
    if (!c.name || c.disabled || c.closest('[hidden]') || c.type === 'file' || c.type === 'submit') return;
    if (c.value !== '') body[c.name] = c.value;
  });
  Object.assign(body, extra);
  if (body.email) body.replyto = body.email;
  const res = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
  return data;
}
/* ---------- Confirmation email to the person who submitted (EmailJS, free tier) ----------
   Sends a short thank-you only. It never includes what they typed.
   Fill these three values from your EmailJS dashboard (see the note in the reply). */
const EMAILJS = { publicKey: 'CBtZ_mjX0E4hzeQ7s', serviceId: 'service_lpsadck', templateId: 'template_phba64f' };
const CONFIRM = {
  subscribe: { subject: 'You’re subscribed to Freecierge Co.', heading: 'Thanks for subscribing', message: 'You’re on the list. We’ll share fresh ideas on branding, product and AI from the studio — no spam, and you can unsubscribe at any time.' },
  contact:   { subject: 'We received your message — Freecierge Co.', heading: 'Thanks for getting in touch', message: 'We’ve received your message and a member of the team will reply within one business day.' },
  apply:     { subject: 'We received your application — Freecierge Co.', heading: 'Thanks for applying', message: 'We’ve received your application and will review it carefully. You’ll hear from us with next steps shortly.' }
};
function sendConfirmation(form, kind) {
  if (!EMAILJS.publicKey || !EMAILJS.serviceId || !EMAILJS.templateId) return;   // not configured yet
  const c = CONFIRM[kind]; const emailEl = $1('input[name=email]', form);
  if (!c || !emailEl || !emailEl.value) return;
  const nameEl = $1('input[name=name]', form);
  fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId, template_id: EMAILJS.templateId, user_id: EMAILJS.publicKey,
      template_params: { to_email: emailEl.value, to_name: (nameEl && nameEl.value.trim()) || 'there', subject: c.subject, heading: c.heading, message: c.message, reply_to: MAIL_TO, site_url: location.origin }
    })
  }).catch(() => {});                                                           // never block or break the form
}

const setBtn = (btn, txt) => { const t = $1('.c-wrap', btn); if (t) t.outerHTML = `<span class="btn-label">${txt}</span>`; else { const l = $1('.btn-label', btn); if (l) l.textContent = txt; } };

// Contact + Apply
$$('form[data-form]').forEach(f => f.addEventListener('submit', async e => {
  e.preventDefault();
  if (!f.reportValidity()) return;
  const btn = $1('button[type=submit]', f), done = $1('.form-done', f.parentElement);
  const role = $1('.seg .is-active'); const extra = role ? { role: role.textContent.trim() } : {};
  btn.disabled = true; setBtn(btn, 'Sending…');
  let err = $1('.form-err', f); if (err) err.remove();
  try {
    await sendToInbox(f, SUBJECTS[pageName] || 'New form submission', extra);
    sendConfirmation(f, pageName === 'apply' ? 'apply' : 'contact');
    gsap.to(f, { opacity: 0, y: -20, duration: 0.5, ease: 'main', onComplete: () => { f.hidden = true; done.hidden = false; gsap.from(done, { opacity: 0, y: 20, duration: 0.8, ease: 'main' }); } });
  } catch (_) {
    btn.disabled = false; setBtn(btn, 'Try again');
    err = document.createElement('p'); err.className = 'form-err';
    err.innerHTML = `We couldn&rsquo;t send that just now. Please try again, or email us directly at <a href="mailto:${MAIL_TO}">${MAIL_TO}</a>.`;
    f.appendChild(err);
  }
}));

// Footer subscribe (every page)
$$('form[data-subscribe]').forEach(f => f.addEventListener('submit', async e => {
  e.preventDefault();
  const input = $1('input[name=email]', f), btn = $1('button[type=submit]', f);
  if (!input.value || !input.checkValidity()) { input.reportValidity(); return; }
  btn.disabled = true; setBtn(btn, 'Subscribing…');
  try {
    await sendToInbox(f, 'New subscriber');
    sendConfirmation(f, 'subscribe');
    setBtn(btn, 'Subscribed ✓'); input.value = ''; input.placeholder = 'Thanks — you’re on the list';
  } catch (_) {
    btn.disabled = false; setBtn(btn, 'Try again'); input.placeholder = 'Something went wrong';
  }
}));
const qcards = $$('.qcard');
if (qcards.length) {
  const dots = $$('.qdots i'); let qi = 0;
  const show = n => { qcards.forEach((c, k) => c.classList.toggle('is-active', k === n)); dots.forEach((d, k) => d.classList.toggle('is-active', k === n)); };
  show(0); setInterval(() => { qi = (qi + 1) % qcards.length; show(qi); }, 4200);
  dots.forEach((d, k) => d.addEventListener('click', () => { qi = k; show(k); }));
  gsap.to('.reeds i', { scaleY: () => gsap.utils.random(0.55, 1), duration: 2.2, stagger: { each: 0.08, repeat: -1, yoyo: true }, ease: 'sine.inOut', transformOrigin: 'bottom' });
}

/* ---------- Misc ---------- */
const yr = $1('[data-get-year]'); if (yr) yr.textContent = new Date().getFullYear();
(function initAiSummary() {
  const title = (document.title || 'this website').replace(/\s+/g, ' ').trim();
  const q = encodeURIComponent(`Summarize what ${title} does and its core value proposition. Use ${location.href} as the source.`);
  const map = { chatgpt: `https://chatgpt.com/?q=${q}`, claude: `https://claude.ai/new?q=${q}`, perplexity: `https://www.perplexity.ai/search?q=${q}` };
  $$('.ai-info-button').forEach(b => { const u = map[b.dataset.aiProvider]; if (u) { b.href = u; b.target = '_blank'; b.rel = 'noopener noreferrer'; } });
})();

/* ---------- Looping generative "video" behind the intro card ---------- */
(function initPanelVideo() {
  const cv = $1('.panel-video'); if (!cv) return;
  const ctx = cv.getContext('2d'); let W = 0, H = 0, dpr = 1, raf = 0, t0 = performance.now(), visible = false;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); const r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const N = 44;
  const draw = now => {
    const t = (now - t0) / 1000, bw = W / N;
    ctx.fillStyle = '#F5F4EF'; ctx.fillRect(0, 0, W, H);
    // slow drifting glow
    const gx = W * (0.5 + 0.28 * Math.sin(t * 0.5)), gy = H * (0.45 + 0.2 * Math.cos(t * 0.37));
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.6);
    g.addColorStop(0, 'rgba(255,194,14,.55)'); g.addColorStop(1, 'rgba(255,194,14,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // ribbed bars rising / falling like a looping reel
    for (let i = 0; i < N; i++) {
      const k = i / N;
      const w1 = Math.sin(k * 9 + t * 1.3), w2 = Math.sin(k * 21 - t * 0.9), w3 = Math.sin(k * 4 + t * 0.6);
      const h = H * (0.22 + 0.36 * (0.5 + 0.5 * (0.5 * w1 + 0.3 * w2 + 0.2 * w3)));
      const x = i * bw, y = H - h;
      const grad = ctx.createLinearGradient(0, y, 0, H);
      grad.addColorStop(0, 'rgba(255,224,138,.95)'); grad.addColorStop(1, 'rgba(230,174,11,.95)');
      ctx.fillStyle = grad; ctx.fillRect(x + 1, y, bw - 2, h);
      ctx.fillStyle = 'rgba(10,10,9,.9)'; ctx.fillRect(x + 1, y, bw - 2, 3);
      // glass highlight sweeping across
      const sweep = (Math.sin(t * 0.8 - k * 6) + 1) / 2;
      ctx.fillStyle = `rgba(255,255,255,${0.05 + 0.4 * sweep * sweep})`; ctx.fillRect(x + 1, y, (bw - 2) * 0.45, h);
    }
    raf = visible ? requestAnimationFrame(draw) : 0;
  };
  const start = () => { if (!raf) { visible = true; raf = requestAnimationFrame(draw); } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0.01 }).observe(cv);
  if (reduce) { visible = false; draw(performance.now()); }
})();

/* Budget field: minimum project budget is INR 50,000 */
$$('input[name=budget_inr]').forEach(i => {
  const check = () => i.setCustomValidity(i.value !== '' && Number(i.value) < 50000 ? 'Our minimum project budget is ₹50,000.' : '');
  i.addEventListener('input', check); check();
});
