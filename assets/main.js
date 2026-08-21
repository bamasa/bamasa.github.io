/* ============================================================
   Leonid Gremyachikh — site behaviour
   theme toggle · animated accordions · scroll reveal · nav state
   ============================================================ */
(function () {
  'use strict';

  var root   = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- theme ---------- */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      if (!current) {
        // No explicit choice yet — flip away from whatever the system gives us.
        current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ---------- accordions ----------
     <details> keeps the semantics and works without JS; here we animate the
     open/close so the page does not jump, and keep only one row open at a
     time. Every animation gets a timer as well as a transitionend listener,
     because a transition that never starts must not leave a row half-open. */
  var DUR  = 380;
  var EASE = 'height ' + DUR + 'ms cubic-bezier(.22,.61,.36,1)';
  var rows = [];

  document.querySelectorAll('.item').forEach(function (item) {
    var summary = item.querySelector('summary');
    var body    = item.querySelector('.item-body');
    if (!summary || !body) return;

    var timer = null, settle = null;
    body.style.height = item.open ? 'auto' : '0px';

    function finish(opening) {
      if (timer)  { clearTimeout(timer); timer = null; }
      if (settle) { body.removeEventListener('transitionend', settle); settle = null; }
      body.style.transition = '';
      item.open = opening;
      body.style.height = opening ? 'auto' : '0px';
    }

    function run(opening, to) {
      if (timer)  { clearTimeout(timer); timer = null; }
      if (settle) { body.removeEventListener('transitionend', settle); settle = null; }

      var from = body.offsetHeight;
      body.style.transition = '';
      body.style.height = from + 'px';
      void body.offsetHeight;                    // flush the starting height
      body.style.transition = EASE;
      body.style.height = to + 'px';

      settle = function (e) {
        if (e.propertyName !== 'height' || e.target !== body) return;
        finish(opening);
      };
      body.addEventListener('transitionend', settle);
      timer = setTimeout(function () { finish(opening); }, DUR + 120);
    }

    var row = {
      item: item,
      isOpen: function () { return item.open; },
      close: function () {
        if (!item.open) return;
        if (reduce) { finish(false); return; }
        run(false, 0);
      }
    };
    rows.push(row);

    summary.addEventListener('click', function (e) {
      e.preventDefault();

      if (item.open) {
        if (reduce) { finish(false); } else { run(false, 0); }
        return;
      }

      // only one row stays open at a time
      rows.forEach(function (other) { if (other !== row) other.close(); });

      if (reduce) { finish(true); return; }
      item.open = true;
      run(true, body.firstElementChild.offsetHeight);
    });
  });

  /* ---------- reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- current section in the nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var targets  = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (targets.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* ---------- hairline under the sticky bar once scrolled ---------- */
  var topbar = document.getElementById('topbar');
  if (topbar) {
    var onScroll = function () {
      topbar.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
