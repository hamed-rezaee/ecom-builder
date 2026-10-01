/* Runtime for exported stores: hash routing, cart, mock checkout. Plain browser JS, no dependencies. */
(function () {
  'use strict';

  var data = window.__SITE__ || { name: '', currency: 'USD', products: [] };
  var byId = {};
  data.products.forEach(function (p) {
    byId[p.id] = p;
  });

  var rates = { [data.currency]: 1 };
  (data.currencies || []).forEach(function (c) {
    rates[c.code] = c.rate;
  });
  var activeCurrency = data.currency;

  var KEY = 'eb-cart';
  var cart = load();
  var currentRoute = '';
  var aosReady = false;
  var reduced =
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function load() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]');
      return Array.isArray(parsed)
        ? parsed.filter(function (l) {
            return l && byId[l.id] && l.qty > 0;
          })
        : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      // storage unavailable (sandboxed preview): cart stays in memory
    }
  }

  function t(key, vars) {
    var text = (data.ui && data.ui[key]) || key;
    return text.replace(/\{(\w+)\}/g, function (m, k) {
      return vars && Object.prototype.hasOwnProperty.call(vars, k)
        ? String(vars[k])
        : m;
    });
  }

  var translate = t;

  function money(n) {
    var amount = n * rates[activeCurrency];
    try {
      return new Intl.NumberFormat(data.locale || 'en-US', {
        style: 'currency',
        currency: activeCurrency,
      }).format(amount);
    } catch {
      return activeCurrency + ' ' + amount.toFixed(2);
    }
  }

  function setCurrency(code, persist) {
    if (!Object.prototype.hasOwnProperty.call(rates, code)) return;
    activeCurrency = code;
    if (persist) {
      try {
        window.localStorage.setItem('eb-currency', code);
      } catch {
        // storage unavailable (sandboxed preview)
      }
    }
    var prices = document.querySelectorAll('[data-price]');
    for (var i = 0; i < prices.length; i++)
      prices[i].textContent = money(
        Number(prices[i].getAttribute('data-price')),
      );
    var pickers = document.querySelectorAll('[data-currency-switcher]');
    for (var j = 0; j < pickers.length; j++) pickers[j].value = code;
    if (currentRoute === 'cart') renderCart();
    if (currentRoute === 'checkout') renderCheckout();
  }

  function initCurrency() {
    var saved = null;
    try {
      saved = window.localStorage.getItem('eb-currency');
    } catch {
      // storage unavailable (sandboxed preview)
    }
    if (saved) setCurrency(saved, false);
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function count() {
    return cart.reduce(function (n, l) {
      return n + l.qty;
    }, 0);
  }

  function subtotal() {
    return cart.reduce(function (n, l) {
      return n + byId[l.id].price * l.qty;
    }, 0);
  }

  function find(id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  }

  function setQty(id, qty) {
    var line = find(id);
    if (!line) {
      if (qty > 0 && byId[id]) cart.push({ id: id, qty: qty });
    } else if (qty <= 0) {
      cart = cart.filter(function (l) {
        return l.id !== id;
      });
    } else {
      line.qty = Math.min(qty, 99);
    }
    changed();
  }

  function changed() {
    save();
    var badges = document.querySelectorAll('[data-cart-count]');
    for (var i = 0; i < badges.length; i++)
      badges[i].textContent = String(count());
    var marks = document.querySelectorAll('[data-in-cart]');
    for (var m = 0; m < marks.length; m++) {
      var line = find(marks[m].getAttribute('data-in-cart'));
      marks[m].hidden = !line;
      marks[m].textContent = line ? t('inCart', { count: line.qty }) : '';
    }
    if (currentRoute === 'cart') renderCart();
  }

  function renderPager(root) {
    var cards = root.querySelector('.eb-grid').children;
    var per = Number(root.getAttribute('data-per'));
    var page = Number(root.getAttribute('data-page'));
    var pages = Math.ceil(cards.length / per);
    var more = root.getAttribute('data-style') === 'loadmore';
    for (var i = 0; i < cards.length; i++)
      cards[i].hidden = more
        ? i >= page * per
        : Math.floor(i / per) + 1 !== page;
    var buttons = root.querySelectorAll('[data-pager-go]');
    for (var b = 0; b < buttons.length; b++) {
      var go = buttons[b].getAttribute('data-pager-go');
      if (go === 'more') buttons[b].hidden = page >= pages;
      else if (go === 'prev') buttons[b].disabled = page <= 1;
      else if (go === 'next') buttons[b].disabled = page >= pages;
      else if (Number(go) === page)
        buttons[b].setAttribute('aria-current', 'page');
      else buttons[b].removeAttribute('aria-current');
    }
  }

  function goToPage(btn) {
    var root = btn.closest('[data-paged]');
    if (!root) return;
    var go = btn.getAttribute('data-pager-go');
    var page = Number(root.getAttribute('data-page'));
    var next =
      go === 'more' || go === 'next'
        ? page + 1
        : go === 'prev'
          ? page - 1
          : Number(go);
    root.setAttribute('data-page', String(Math.max(1, next)));
    renderPager(root);
    if (go !== 'more') {
      var grid = root.querySelector('.eb-grid');
      if (grid)
        grid.scrollIntoView({
          block: 'start',
          behavior: reduced ? 'auto' : 'smooth',
        });
    }
  }

  function emptyMessage(text) {
    var box = el('div', 'eb-empty');
    box.appendChild(el('p', null, text));
    var link = el('a', 'eb-btn', t('startShopping'));
    link.setAttribute('href', '#/');
    box.appendChild(link);
    return box;
  }

  function renderCart() {
    var view = document.querySelector('[data-cart-view]');
    if (!view) return;
    view.textContent = '';
    if (!cart.length) {
      view.appendChild(emptyMessage(t('cartEmpty')));
      return;
    }
    cart.forEach(function (line) {
      var p = byId[line.id];
      var row = el('div', 'eb-cart-row');
      var img = el('img');
      img.src = p.image;
      img.alt = p.name;
      row.appendChild(img);

      var info = el('div', 'eb-cart-info');
      info.appendChild(el('strong', null, p.name));
      info.appendChild(el('span', 'eb-note', money(p.price)));
      var qty = el('div', 'eb-qty');
      qty.appendChild(actionButton('dec', p.id, '\u2212', t('decreaseQty')));
      qty.appendChild(el('span', null, String(line.qty)));
      qty.appendChild(actionButton('inc', p.id, '+', t('increaseQty')));
      info.appendChild(qty);
      var remove = actionButton(
        'remove',
        p.id,
        t('remove'),
        t('removeItem', { name: p.name }),
      );
      remove.className = 'eb-link-btn';
      info.appendChild(remove);
      row.appendChild(info);

      row.appendChild(el('strong', null, money(p.price * line.qty)));
      view.appendChild(row);
    });
    var summary = el('div', 'eb-summary');
    summary.appendChild(
      el('div', 'eb-total', t('subtotal', { amount: money(subtotal()) })),
    );
    var checkout = el('a', 'eb-btn', t('checkout'));
    checkout.setAttribute('href', '#/checkout');
    summary.appendChild(checkout);
    view.appendChild(summary);
  }

  function actionButton(action, id, label, aria) {
    var b = el('button', null, label);
    b.type = 'button';
    b.setAttribute('data-cart-action', action);
    b.setAttribute('data-id', id);
    b.setAttribute('aria-label', aria);
    return b;
  }

  function field(label, name, type, autocomplete) {
    var wrap = el('label', null, label);
    var input = el('input', 'eb-input');
    input.name = name;
    input.type = type || 'text';
    input.required = true;
    if (autocomplete) input.autocomplete = autocomplete;
    wrap.appendChild(input);
    return wrap;
  }

  function renderCheckout() {
    var view = document.querySelector('[data-checkout-view]');
    if (!view) return;
    view.textContent = '';
    if (!cart.length) {
      view.appendChild(emptyMessage(t('cartEmpty')));
      return;
    }
    var layout = el('div', 'eb-checkout');

    var form = el('form', 'eb-form');
    form.setAttribute('data-checkout-form', '');
    form.appendChild(field(t('fullName'), 'name', 'text', 'name'));
    form.appendChild(field(t('email'), 'email', 'email', 'email'));
    form.appendChild(field(t('address'), 'address', 'text', 'street-address'));
    var two = el('div', 'eb-form-2');
    two.appendChild(field(t('city'), 'city', 'text', 'address-level2'));
    two.appendChild(field(t('postalCode'), 'zip', 'text', 'postal-code'));
    form.appendChild(two);
    var submit = el('button', 'eb-btn', t('placeOrder'));
    submit.type = 'submit';
    form.appendChild(submit);
    form.appendChild(el('p', 'eb-note', t('demoNote')));
    layout.appendChild(form);

    var order = el('div', 'eb-order');
    order.appendChild(el('strong', null, t('orderSummary')));
    cart.forEach(function (line) {
      var p = byId[line.id];
      var row = el('div', 'eb-order-line');
      row.appendChild(el('span', null, p.name + ' \u00d7 ' + line.qty));
      row.appendChild(el('span', null, money(p.price * line.qty)));
      order.appendChild(row);
    });
    var total = el('div', 'eb-order-line eb-order-total');
    total.appendChild(el('span', null, t('total')));
    total.appendChild(el('span', null, money(subtotal())));
    order.appendChild(total);
    layout.appendChild(order);
    view.appendChild(layout);
  }

  function placeOrder(form) {
    var name = form.elements.namedItem('name').value.trim();
    var number = 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    cart = [];
    changed();
    var view = document.querySelector('[data-checkout-view]');
    view.textContent = '';
    var box = el('div', 'eb-success');
    box.appendChild(el('h2', 'eb-heading', t('thanks', { name: name })));
    box.appendChild(el('p', 'eb-sub', t('orderPlaced', { number: number })));
    var back = el('a', 'eb-btn', t('continueShopping'));
    back.setAttribute('href', '#/');
    box.appendChild(back);
    view.appendChild(box);
  }

  function route() {
    var path = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
    var sections = document.querySelectorAll('[data-route]');
    var match = null;
    var notFound = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getAttribute('data-route');
      if (r === path) match = sections[i];
      if (r === '404') notFound = sections[i];
    }
    match = match || notFound;
    currentRoute = match ? match.getAttribute('data-route') : '';
    for (var j = 0; j < sections.length; j++)
      sections[j].hidden = sections[j] !== match;
    var title = match && match.getAttribute('data-title');
    document.title = title ? title + ' \u2013 ' + data.name : data.name;
    if (currentRoute === 'cart') renderCart();
    if (currentRoute === 'checkout') renderCheckout();
    if (
      match &&
      !reduced &&
      (data.pageTransition === 'fade' || data.pageTransition === 'slide')
    ) {
      match.classList.remove('eb-pt-fade', 'eb-pt-slide');
      void match.offsetWidth;
      match.classList.add('eb-pt-' + data.pageTransition);
    }
    // Routes toggle `hidden`, so AOS must re-measure positions.
    if (aosReady) window.AOS.refreshHard();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function initScrollEffects() {
    if (data.smoothScroll && !reduced) {
      document.documentElement.classList.add('eb-smooth');
    }
    if (!data.scrollProgress) return;
    var bar = el('div', 'eb-scroll-progress');
    bar.setAttribute('aria-hidden', 'true');
    (themeRoot() || document.body).appendChild(bar);
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, ratio)) + ')';
    }
    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true },
    );
    window.addEventListener('resize', update);
    update();
  }

  function initAnimations() {
    if (!window.AOS || !data.anim) return;
    window.AOS.init({
      duration: data.anim.duration,
      easing: data.anim.easing,
      once: data.anim.once,
      offset: 60,
      disable: reduced,
    });
    aosReady = true;
  }

  function themeRoot() {
    return document.querySelector('.eb-site');
  }

  function countText(node, value) {
    var parts = value
      .toFixed(Number(node.getAttribute('data-count-decimals')) || 0)
      .split('.');
    if (node.getAttribute('data-count-group'))
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (
      (node.getAttribute('data-count-prefix') || '') +
      parts.join('.') +
      (node.getAttribute('data-count-suffix') || '')
    );
  }

  function runCounter(node) {
    var to = Number(node.getAttribute('data-count-to'));
    var ms = Number(node.getAttribute('data-count-duration')) || 1600;
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var k = Math.min(1, (now - start) / ms);
      node.textContent =
        k >= 1 ? node._final : countText(node, to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  // Hidden routes never intersect, so a count starts when its page is first shown.
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count-to]');
    if (!nodes.length || reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          runCounter(entry.target);
        });
      },
      { threshold: 0.4 },
    );
    for (var i = 0; i < nodes.length; i++) {
      nodes[i]._final = nodes[i].textContent;
      nodes[i].textContent = countText(nodes[i], 0);
      io.observe(nodes[i]);
    }
  }

  function initTheme() {
    var root = themeRoot();
    if (!root || data.darkMode !== 'toggle') return;
    var mode = null;
    try {
      mode = window.localStorage.getItem('eb-theme');
    } catch {
      // storage unavailable (sandboxed preview)
    }
    if (mode !== 'dark' && mode !== 'light') {
      mode =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    }
    root.setAttribute('data-theme', mode);
  }

  function toggleTheme() {
    var root = themeRoot();
    if (!root) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem('eb-theme', next);
    } catch {
      // storage unavailable (sandboxed preview)
    }
  }

  function go(href) {
    if (href === '#') return;
    if (window.location.hash === href) route();
    else window.location.hash = href;
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;

    var anchor = t.closest('a[href^="#"]');
    if (anchor) {
      e.preventDefault();
      go(anchor.getAttribute('href'));
      return;
    }

    if (t.closest('[data-theme-toggle]')) {
      toggleTheme();
      return;
    }

    var thumb = t.closest('[data-gallery-thumb]');
    if (thumb) {
      var gallery = thumb.closest('[data-gallery]');
      var main = gallery && gallery.querySelector('[data-gallery-main]');
      if (main) {
        main.src = thumb.getAttribute('data-gallery-thumb');
        gallery.querySelectorAll('[data-gallery-thumb]').forEach(function (b) {
          b.setAttribute('aria-current', b === thumb ? 'true' : 'false');
        });
      }
      return;
    }

    var pager = t.closest('[data-pager-go]');
    if (pager) {
      goToPage(pager);
      return;
    }

    var add = t.closest('[data-add-to-cart]');
    if (add) {
      var id = add.getAttribute('data-add-to-cart');
      var line = find(id);
      setQty(id, (line ? line.qty : 0) + 1);
      var original = add.getAttribute('data-label') || add.textContent;
      add.setAttribute('data-label', original);
      add.textContent = translate('added');
      clearTimeout(add._reset);
      add._reset = setTimeout(function () {
        add.textContent = original;
      }, 1200);
      return;
    }

    var action = t.closest('[data-cart-action]');
    if (action) {
      var pid = action.getAttribute('data-id');
      var current = find(pid);
      var qty = current ? current.qty : 0;
      var type = action.getAttribute('data-cart-action');
      setQty(pid, type === 'inc' ? qty + 1 : type === 'dec' ? qty - 1 : 0);
    }
  });

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.hasAttribute('data-newsletter')) {
      e.preventDefault();
      var thanks = el('p', 'eb-sub', t('subscribed'));
      form.replaceWith(thanks);
    } else if (form.hasAttribute('data-contact')) {
      e.preventDefault();
      form.replaceWith(el('p', 'eb-sub', t('messageSent')));
    } else if (form.hasAttribute('data-checkout-form')) {
      e.preventDefault();
      placeOrder(form);
    }
  });

  window.addEventListener('hashchange', route);
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t instanceof Element && t.matches('[data-currency-switcher]'))
      setCurrency(t.value, true);
    else if (t instanceof Element && t.matches('[data-lang-switcher]')) {
      // The sandboxed preview cannot navigate; it asks the editor to rebuild instead.
      if (data.inline)
        window.parent.postMessage({ type: 'eb-lang', code: t.value }, '*');
      else window.location.href = t.value + window.location.hash;
    }
  });
  changed();
  initTheme();
  initCurrency();
  route();
  initAnimations();
  initScrollEffects();
  initCounters();
  // Hidden routes have zero size; the wireframe resumes on its own when they show.
  if (window.EBWire) window.EBWire.mountAll();
})();
