/* ==========================================================================
   Carl Vincent B. Aquino – Personal Portfolio
   js/main.js

   WHAT'S IN HERE
   0. Configuration (edit this first)
   1. Helpers
   2. Theme toggle (light / dark)
   3. Navigation (sticky style, mobile menu, smooth scroll, scroll-spy)
   4. Scroll-reveal animations
   5. Typing effect
   6. Animated counters
   7. Hero portrait tilt
   8. Contact form validation
   9. Back-to-top & footer year
   10. Init
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     0. CONFIGURATION – change these values to personalise the site
     ------------------------------------------------------------------------ */
  var CONFIG = {
    // The contact form opens the visitor's email app addressed to this email.
    // While it's still the placeholder below, the form shows a demo success message instead.
    contactEmail: 'crlvncntaquino@gmail.com',
    placeholderEmail: 'your.email@example.com',

    typingSpeed: 85,        // ms per typed character
    deletingSpeed: 45,      // ms per deleted character
    pauseAfterWord: 1500    // ms to wait once a word is fully typed
  };

  /* ------------------------------------------------------------------------
     1. HELPERS
     ------------------------------------------------------------------------ */
  var $  = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** localStorage can throw (private mode, blocked cookies) – wrap it. */
  function safeStorage(action, key, value) {
    try {
      if (action === 'get') return localStorage.getItem(key);
      if (action === 'set') localStorage.setItem(key, value);
    } catch (e) { /* ignore */ }
    return null;
  }


  /* ------------------------------------------------------------------------
     2. THEME TOGGLE
     Remembers the visitor's choice; otherwise follows their system setting.
     ------------------------------------------------------------------------ */
  function initTheme() {
    var root = document.documentElement;
    var button = $('#theme-toggle');
    var metaTheme = $('meta[name="theme-color"]');

    function apply(theme) {
      root.setAttribute('data-theme', theme);
      if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#f4f7fd' : '#0a0f1f');
      if (button) button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }

    var saved = safeStorage('get', 'cv-theme');
    var systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    apply(saved || (systemPrefersLight ? 'light' : 'dark'));

    if (button) {
      button.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        apply(next);
        safeStorage('set', 'cv-theme', next);
      });
    }
  }


  /* ------------------------------------------------------------------------
     3. NAVIGATION
     ------------------------------------------------------------------------ */
  function initNavigation() {
    var nav = $('#nav');
    var toggle = $('#nav-toggle');
    var menu = $('#nav-menu');
    var links = $$('.nav__link');

    /* 3a. Add a glass background once the page is scrolled */
    function onScroll() {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* 3b. Mobile menu open / close */
    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      nav.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    document.addEventListener('click', function (e) {   // click outside closes the menu
      if (!nav.contains(e.target)) setMenu(false);
    });

    /* 3c. Smooth scrolling for every in-page link (#about, #contact, …)
           CSS scroll-margin-top handles the fixed-navbar offset. */
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id.length < 2) { e.preventDefault(); return; }   // placeholder links like href="#"
        var target = $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', id);
        setMenu(false);
      });
    });

    /* 3d. Scroll-spy: highlight the link of the section currently in view */
    var sections = links
      .map(function (l) { return $(l.getAttribute('href')); })
      .filter(Boolean);

    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });   // a thin band in the middle of the viewport
      sections.forEach(function (s) { spy.observe(s); });
    }
  }


  /* ------------------------------------------------------------------------
     4. SCROLL REVEAL
     Adds .is-visible (see CSS) the first time an element enters the viewport.
     ------------------------------------------------------------------------ */
  function initReveal() {
    var items = $$('.reveal');

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);          // animate only once
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }


  /* ------------------------------------------------------------------------
     5. TYPING EFFECT (hero)
     Words come from the data-words attribute on #typed in index.html.
     ------------------------------------------------------------------------ */
  function initTyping() {
    var el = $('#typed');
    if (!el) return;

    var words;
    try { words = JSON.parse(el.getAttribute('data-words')); } catch (e) { return; }
    if (!words || !words.length || prefersReducedMotion) return;   // keep static text

    var wordIndex = 0;
    var charIndex = words[0].length;     // start with first word already shown
    var deleting = true;                 // ...and begin by erasing it

    function tick() {
      var word = words[wordIndex];
      charIndex += deleting ? -1 : 1;
      el.textContent = word.slice(0, charIndex);

      var delay = deleting ? CONFIG.deletingSpeed : CONFIG.typingSpeed;

      if (!deleting && charIndex === word.length) {          // finished typing
        deleting = true;
        delay = CONFIG.pauseAfterWord;
      } else if (deleting && charIndex === 0) {              // finished deleting
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 350;
      }
      setTimeout(tick, delay);
    }
    setTimeout(tick, CONFIG.pauseAfterWord);
  }


  /* ------------------------------------------------------------------------
     6. ANIMATED COUNTERS
     <span data-count="21">0</span> counts from 0 to 21 when scrolled into view.
     ------------------------------------------------------------------------ */
  function initCounters() {
    var counters = $$('[data-count]');

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (prefersReducedMotion) { el.textContent = target; return; }

      var duration = 1400;
      var start = null;
      function step(now) {
        if (start === null) start = now;
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);           // ease-out cubic
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { observer.observe(el); });
  }


  /* ------------------------------------------------------------------------
     7. HERO PORTRAIT TILT
     A subtle 3D tilt that follows the mouse (desktop / precise pointers only).
     ------------------------------------------------------------------------ */
  function initTilt() {
    var card = $('#photo-card');
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!card || !canHover || prefersReducedMotion) return;

    var maxTilt = 7;   // degrees

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;    // -0.5 … 0.5
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        'perspective(900px) rotateY(' + (x * maxTilt * 2) + 'deg) rotateX(' + (-y * maxTilt * 2) + 'deg)';
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  }


  /* ------------------------------------------------------------------------
     8. CONTACT FORM
     Front-end validation. There's no server, so a valid form opens the
     visitor's email app (mailto:). To use a real form service later
     (Formspree, EmailJS, …) replace the code inside handleSubmit().
     ------------------------------------------------------------------------ */
  function initContactForm() {
    var form = $('#contact-form');
    if (!form) return;

    var status = $('#form-status');
    var fields = {
      name:    { el: $('#name'),    error: $('#name-error') },
      email:   { el: $('#email'),   error: $('#email-error') },
      message: { el: $('#message'), error: $('#message-error') }
    };
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validateField(key) {
      var field = fields[key];
      var value = field.el.value.trim();
      var message = '';

      if (!value) {
        message = 'This field is required.';
      } else if (key === 'name' && value.length < 2) {
        message = 'Please enter your full name.';
      } else if (key === 'email' && !emailPattern.test(value)) {
        message = 'Please enter a valid email address.';
      } else if (key === 'message' && value.length < 10) {
        message = 'Your message should be at least 10 characters.';
      }

      field.error.textContent = message;
      field.el.parentElement.classList.toggle('has-error', Boolean(message));
      field.el.setAttribute('aria-invalid', message ? 'true' : 'false');
      return !message;
    }

    // Validate when leaving a field; clear the error as the user fixes it
    Object.keys(fields).forEach(function (key) {
      fields[key].el.addEventListener('blur', function () { validateField(key); });
      fields[key].el.addEventListener('input', function () {
        if (fields[key].el.parentElement.classList.contains('has-error')) validateField(key);
      });
    });

    function handleSubmit(e) {
      e.preventDefault();
      status.className = 'form__status';
      status.textContent = '';

      var allValid = Object.keys(fields).map(validateField).every(Boolean);
      if (!allValid) {
        status.classList.add('is-error');
        status.textContent = 'Please fix the highlighted fields.';
        return;
      }

      var name = fields.name.el.value.trim();
      var email = fields.email.el.value.trim();
      var message = fields.message.el.value.trim();

      if (CONFIG.contactEmail === CONFIG.placeholderEmail) {
        // Demo mode: no real email set yet
        status.classList.add('is-success');
        status.textContent = 'Thanks, ' + name.split(' ')[0] + '! (Demo mode – set your email in js/main.js to receive messages.)';
      } else {
        var subject = encodeURIComponent('Portfolio message from ' + name);
        var body = encodeURIComponent(message + '\n\n— ' + name + ' (' + email + ')');
        window.location.href = 'mailto:' + CONFIG.contactEmail + '?subject=' + subject + '&body=' + body;
        status.classList.add('is-success');
        status.textContent = 'Opening your email app… thank you, ' + name.split(' ')[0] + '!';
      }
      form.reset();
    }

    form.addEventListener('submit', handleSubmit);
  }


  /* ------------------------------------------------------------------------
     9. BACK-TO-TOP BUTTON & FOOTER YEAR
     ------------------------------------------------------------------------ */
  function initMisc() {
    var toTop = $('#to-top');
    if (toTop) {
      window.addEventListener('scroll', function () {
        toTop.classList.toggle('is-visible', window.scrollY > 600);
      }, { passive: true });
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    }

    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }


  /* ------------------------------------------------------------------------
     10. INIT – run everything once the DOM is ready
     ------------------------------------------------------------------------ */
  function init() {
    initTheme();
    initNavigation();
    initReveal();
    initTyping();
    initCounters();
    initTilt();
    initContactForm();
    initMisc();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
