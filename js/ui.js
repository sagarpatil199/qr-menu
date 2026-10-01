/*
 * QR Menu: rendering layer.
 * Builds the page from clean data. Everything is inserted with textContent /
 * attributes (never innerHTML) so text in the JSON can never break the page.
 */
(function (window, document) {
  "use strict";

  var QRMenu = (window.QRMenu = window.QRMenu || {});
  var Menu = QRMenu.Menu;

  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var SPICE_LABELS = ["Not spicy", "Mild", "Medium spicy", "Very spicy"];

  /* ---------- Tiny DOM helpers ---------- */

  function $(id) { return document.getElementById(id); }

  /** el("p", { class: "x", text: "hi" }, [children]) */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "text") node.textContent = value;
        else if (key === "class") node.className = value;
        else node.setAttribute(key, value === true ? "" : value);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  function icon(name, cls) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (cls) svg.setAttribute("class", cls);
    var use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    return svg;
  }

  function digitsOnly(text) { return String(text || "").replace(/[^0-9]/g, ""); }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- Links built from restaurant.json ---------- */

  function links(r) {
    var wa = digitsOnly(r.whatsapp);
    return {
      call: r.phone ? "tel:" + String(r.phone).replace(/[^0-9+]/g, "") : "",
      whatsapp: wa
        ? "https://wa.me/" + wa + (r.whatsappMessage ? "?text=" + encodeURIComponent(r.whatsappMessage) : "")
        : "",
      maps: r.googleMapsUrl || (r.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(r.address) : "")
    };
  }

  /* ---------- Header ---------- */

  function renderHeader(r) {
    var logo = $("restaurant-logo");
    if (r.logo) {
      logo.src = r.logo;
      logo.alt = r.name + " logo";
      logo.hidden = false;
      logo.addEventListener("error", function () { logo.hidden = true; });
    }

    $("restaurant-name").textContent = r.name || "Our Menu";

    var tagline = $("restaurant-tagline");
    if (r.tagline) { tagline.textContent = r.tagline; tagline.hidden = false; }

    var l = links(r);
    var actions = $("contact-actions");
    actions.textContent = "";
    [
      { href: l.call, icon: "phone", label: "Call", aria: "Call " + r.name },
      { href: l.whatsapp, icon: "whatsapp", label: "WhatsApp", aria: "Message " + r.name + " on WhatsApp", external: true },
      { href: l.maps, icon: "pin", label: "Location", aria: "Open " + r.name + " in Google Maps", external: true }
    ].forEach(function (a) {
      if (!a.href) return;
      actions.appendChild(el("a", {
        class: "action action--" + a.icon,
        href: a.href,
        "aria-label": a.aria,
        target: a.external ? "_blank" : null,
        rel: a.external ? "noopener" : null
      }, [icon(a.icon), el("span", { text: a.label })]));
    });

    var notice = $("restaurant-notice");
    if (r.notice) { notice.textContent = r.notice; notice.hidden = false; }
  }

  /* ---------- Opening hours ---------- */

  function toMinutes(hhmm) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || "").trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  function formatTime(hhmm) {
    var mins = toMinutes(hhmm);
    if (mins === null) return String(hhmm || "");
    var h = Math.floor(mins / 60) % 24, m = mins % 60;
    var suffix = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 || 12;
    return h12 + ":" + (m < 10 ? "0" : "") + m + " " + suffix;
  }

  /** Group openingHours entries by weekday. Supports several slots per day. */
  function hoursByDay(r) {
    var map = {};
    (Array.isArray(r.openingHours) ? r.openingHours : []).forEach(function (h) {
      if (!h || !h.day) return;
      var day = DAYS.filter(function (d) { return d.toLowerCase() === String(h.day).trim().toLowerCase(); })[0];
      if (!day) return;
      map[day] = map[day] || [];
      if (h.closed === true || String(h.closed).toLowerCase() === "true") return;
      var open = toMinutes(h.open), close = toMinutes(h.close);
      if (open === null || close === null) return;
      map[day].push({ open: open, close: close, openText: h.open, closeText: h.close });
    });
    return map;
  }

  /** Current weekday + minutes, in the restaurant's timezone when given. */
  function nowParts(timezone) {
    var d = new Date();
    if (timezone && window.Intl) {
      try {
        var parts = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone, weekday: "long", hour: "numeric", minute: "numeric", hourCycle: "h23"
        }).formatToParts(d);
        var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
        return { day: get("weekday"), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
      } catch (e) { /* invalid timezone: fall back to the visitor's clock */ }
    }
    return { day: DAYS[d.getDay()], minutes: d.getHours() * 60 + d.getMinutes() };
  }

  function openStatus(map, timezone) {
    var now = nowParts(timezone);
    var today = DAYS.indexOf(now.day);
    var yesterday = DAYS[(today + 6) % 7];

    // Late-night slot from yesterday that runs past midnight (e.g. 18:00 - 01:00)
    var late = (map[yesterday] || []).filter(function (s) { return s.close < s.open && now.minutes < s.close; })[0];
    if (late) return { open: true, text: "Open now · Closes " + formatTime(late.closeText) };

    var slots = map[now.day] || [];
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      var overnight = s.close <= s.open;
      if (now.minutes >= s.open && (overnight || now.minutes < s.close)) {
        return { open: true, text: "Open now · Closes " + formatTime(s.closeText) };
      }
    }
    var next = slots.filter(function (s) { return s.open > now.minutes; }).sort(function (a, b) { return a.open - b.open; })[0];
    if (next) return { open: false, text: "Closed now · Opens " + formatTime(next.openText) };
    for (var k = 1; k <= 7; k++) {
      var day = DAYS[(today + k) % 7];
      var first = (map[day] || []).slice().sort(function (a, b) { return a.open - b.open; })[0];
      if (first) return { open: false, text: "Closed now · Opens " + (k === 1 ? "tomorrow" : day) + " " + formatTime(first.openText) };
    }
    return null;
  }

  function renderHours(r) {
    var map = hoursByDay(r);
    var days = Object.keys(map);
    if (!days.length) return;

    var today = nowParts(r.timezone).day;
    var body = $("hours-body");
    body.textContent = "";
    // Start the week on Monday, as most menus do.
    DAYS.slice(1).concat(DAYS[0]).forEach(function (day) {
      if (!(day in map)) return;
      var slots = map[day];
      var text = slots.length
        ? slots.map(function (s) { return formatTime(s.openText) + " – " + formatTime(s.closeText); }).join(", ")
        : "Closed";
      var isToday = day === today;
      body.appendChild(el("tr", { class: isToday ? "is-today" : null, "aria-current": isToday ? "date" : null }, [
        el("th", { scope: "row", text: day + (isToday ? " (Today)" : "") }),
        el("td", { text: text })
      ]));
    });
    $("info-hours").hidden = false;

    var status = openStatus(map, r.timezone);
    var badge = $("open-status");
    if (status) {
      badge.textContent = "";
      badge.appendChild(el("span", { class: "dot", "aria-hidden": "true" }));
      badge.appendChild(document.createTextNode(status.text));
      badge.classList.toggle("is-open", status.open);
      badge.classList.toggle("is-closed", !status.open);
      badge.hidden = false;
    }
  }

  /* ---------- Footer ---------- */

  function renderFooter(r) {
    var l = links(r);
    var list = $("info-contact-list");
    list.textContent = "";

    function row(iconName, label, value, href, external) {
      if (!value) return;
      var content = href
        ? el("a", { href: href, target: external ? "_blank" : null, rel: external ? "noopener" : null, text: value })
        : el("span", { text: value });
      list.appendChild(el("li", null, [icon(iconName), el("div", null, [el("small", { text: label }), content])]));
    }

    row("pin", "Address", r.address, l.maps, true);
    row("phone", "Phone", r.phone, l.call);
    row("whatsapp", "WhatsApp", r.whatsapp, l.whatsapp, true);
    row("mail", "Email", r.email, r.email ? "mailto:" + r.email : "");
    if (l.maps) row("pin", "Directions", "Open in Google Maps", l.maps, true);

    var social = $("info-social");
    social.textContent = "";
    [
      { url: r.instagram, icon: "instagram", label: "Instagram" },
      { url: r.facebook, icon: "facebook", label: "Facebook" },
      { url: r.website, icon: "globe", label: "Website" }
    ].forEach(function (s) {
      if (!s.url) return;
      social.appendChild(el("a", {
        class: "social", href: s.url, target: "_blank", rel: "noopener",
        "aria-label": r.name + " on " + s.label
      }, [icon(s.icon), el("span", { text: s.label })]));
    });

    $("info-contact").hidden = !list.children.length && !social.children.length;

    var note = $("footer-note");
    if (r.footerNote) { note.textContent = r.footerNote; note.hidden = false; }

    $("footer-copy").textContent = "© " + new Date().getFullYear() + " " + (r.name || "");
    renderHours(r);
  }

  /* ---------- Badges, prices ---------- */

  function dietIcon(item, small) {
    if (item.isVeg === null) return null;
    var veg = item.isVeg;
    return el("span", {
      class: "diet " + (veg ? "diet--veg" : "diet--nonveg") + (small ? " diet--sm" : ""),
      role: "img",
      "aria-label": veg ? "Vegetarian" : "Non-vegetarian",
      title: veg ? "Vegetarian" : "Non-vegetarian"
    });
  }

  function spiceIcons(level) {
    if (!level) return null;
    var wrap = el("span", { class: "spice", role: "img", "aria-label": SPICE_LABELS[level], title: SPICE_LABELS[level] });
    for (var i = 0; i < level; i++) wrap.appendChild(icon("chili"));
    return wrap;
  }

  function badges(item) {
    var list = [];
    if (item.isBestseller) list.push(el("span", { class: "badge badge--best", text: "Bestseller" }));
    if (item.isNew) list.push(el("span", { class: "badge badge--new", text: "New" }));
    if (item.offerPrice !== null) list.push(el("span", { class: "badge badge--offer", text: item.offerLabel || "Offer" }));
    return list;
  }

  function priceBlock(item, currency, cls) {
    var wrap = el("div", { class: cls });
    if (item.variations.length) {
      var ul = el("ul", { class: "variants" });
      item.variations.forEach(function (v) {
        ul.appendChild(el("li", null, [
          el("span", { class: "variants__name", text: v.name }),
          el("span", { class: "variants__price", text: Menu.formatPrice(v.price, currency) })
        ]));
      });
      wrap.appendChild(ul);
      return wrap;
    }
    if (item.offerPrice !== null) {
      wrap.appendChild(el("span", { class: "price price--offer", text: Menu.formatPrice(item.offerPrice, currency) }));
      wrap.appendChild(el("s", { class: "price price--old", "aria-label": "Regular price " + Menu.formatPrice(item.price, currency), text: Menu.formatPrice(item.price, currency) }));
    } else if (item.price !== null) {
      wrap.appendChild(el("span", { class: "price", text: Menu.formatPrice(item.price, currency) }));
    }
    return wrap;
  }

  /** Placeholder shown when an item has no photo or the photo fails to load. */
  function placeholder(item) {
    return el("div", { class: "ph", "aria-hidden": "true" }, [el("span", { text: item.name.charAt(0).toUpperCase() })]);
  }

  function image(item, opts) {
    if (!item.image) return null;
    var img = el("img", {
      src: item.image,
      alt: opts.alt === false ? "" : item.name,
      width: opts.width,
      height: opts.height,
      loading: opts.eager ? "eager" : "lazy",
      decoding: "async"
    });
    img.addEventListener("error", function () {
      if (img.parentNode) img.parentNode.replaceChild(placeholder(item), img);
    });
    return img;
  }

  /* ---------- Menu cards ---------- */

  function card(item, currency) {
    var unavailable = !item.isAvailable;
    var article = el("article", {
      class: "card" + (unavailable ? " is-unavailable" : "") + (item.image ? "" : " card--text"),
      "data-id": item.id
    });

    var body = el("div", { class: "card__body" });
    var top = el("div", { class: "card__top" }, [dietIcon(item, true), spiceIcons(item.spiceLevel)].concat(badges(item)));
    body.appendChild(top);

    var title = el("h3", { class: "card__title" }, [
      el("button", {
        type: "button",
        class: "card__open",
        "data-id": item.id,
        "aria-haspopup": "dialog",
        "aria-label": item.name + (unavailable ? ", currently unavailable" : "") + ". View details"
      }, [item.name])
    ]);
    body.appendChild(title);
    if (item.description) body.appendChild(el("p", { class: "card__desc", text: item.description }));
    body.appendChild(priceBlock(item, currency, "card__price"));
    if (unavailable) body.appendChild(el("p", { class: "card__status", text: "Currently Unavailable" }));
    article.appendChild(body);

    if (item.image) {
      var media = el("div", { class: "card__media" }, [image(item, { width: 480, height: 360, alt: false })]);
      if (unavailable) media.appendChild(el("span", { class: "card__soldout", "aria-hidden": "true", text: "Unavailable" }));
      article.appendChild(media);
    }
    return article;
  }

  function renderMenu(categories, currency) {
    var root = $("menu-sections");
    var frag = document.createDocumentFragment();
    categories.forEach(function (cat) {
      var headingId = "cat-" + cat.id + "-title";
      var section = el("section", { class: "category", id: "cat-" + cat.id, "data-category": cat.id, "aria-labelledby": headingId });
      var head = el("header", { class: "category__head" }, [
        el("h2", { class: "category__title", id: headingId, text: cat.name }),
        el("span", { class: "category__count", "data-count": "", text: cat.items.length + " items" })
      ]);
      section.appendChild(head);
      if (cat.description) section.appendChild(el("p", { class: "category__desc", text: cat.description }));
      var grid = el("div", { class: "grid" });
      cat.items.forEach(function (item) { grid.appendChild(card(item, currency)); });
      section.appendChild(grid);
      frag.appendChild(section);
    });
    root.textContent = "";
    root.appendChild(frag);
  }

  function renderCategoryNav(categories) {
    var list = $("category-nav-list");
    list.textContent = "";
    categories.forEach(function (cat) {
      list.appendChild(el("li", { "data-category": cat.id }, [
        el("a", { class: "catnav__link", href: "#cat-" + cat.id, "data-category": cat.id, text: cat.name })
      ]));
    });
  }

  /** Show/hide cards for the current search + filter. Returns number of visible items. */
  function applyFilter(categories, query, filter) {
    var total = 0;
    categories.forEach(function (cat) {
      var section = $("cat-" + cat.id);
      var navItem = document.querySelector('#category-nav-list li[data-category="' + cat.id + '"]');
      var visible = 0;
      cat.items.forEach(function (item) {
        var show = Menu.matches(item, query, filter);
        var node = section.querySelector('.card[data-id="' + item.id + '"]');
        node.hidden = !show;
        if (show) visible++;
      });
      section.hidden = visible === 0;
      if (navItem) navItem.hidden = visible === 0;
      section.querySelector("[data-count]").textContent = visible + (visible === 1 ? " item" : " items");
      total += visible;
    });

    var empty = $("empty-state");
    empty.hidden = total > 0;
    if (!total) {
      $("empty-text").textContent = query
        ? "We couldn't find anything for “" + query + "”. Try another dish name or clear the filters."
        : "No dishes match this filter right now.";
    }
    $("results-status").textContent = total + (total === 1 ? " dish" : " dishes") + " shown";
    return total;
  }

  /* ---------- Detail modal ---------- */

  function openModal(item, currency) {
    var dialog = $("item-modal");

    var media = $("modal-media");
    media.textContent = "";
    media.className = "modal__media" + (item.image ? "" : " modal__media--empty");
    if (item.image) media.appendChild(image(item, { width: 480, height: 360, eager: true }));

    var meta = $("modal-meta");
    meta.textContent = "";
    [dietIcon(item), item.isVeg === null ? null : el("span", { class: "modal__diet", text: item.isVeg ? "Veg" : "Non-Veg" }), spiceIcons(item.spiceLevel)]
      .concat(badges(item))
      .forEach(function (n) { if (n) meta.appendChild(n); });

    $("modal-title").textContent = item.name;
    $("modal-category").textContent = item.categoryName;
    var desc = $("modal-desc");
    desc.textContent = item.description;
    desc.hidden = !item.description;

    var price = $("modal-price");
    price.textContent = "";
    price.appendChild(priceBlock(item, currency, "modal__pricewrap"));

    var avail = $("modal-availability");
    avail.textContent = item.isAvailable ? "Available today" : "Currently Unavailable";
    avail.className = "modal__availability " + (item.isAvailable ? "is-available" : "is-unavailable");

    dialog.classList.toggle("is-unavailable", !item.isAvailable);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.body.classList.add("modal-open");
    $("modal-close").focus();
  }

  function closeModal() {
    var dialog = $("item-modal");
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  /* ---------- Errors ---------- */

  function showError(message) {
    $("loader").hidden = true;
    $("error-text").textContent = message;
    $("error-state").hidden = false;
    document.body.classList.remove("is-loading");
  }

  QRMenu.UI = {
    $: $,
    el: el,
    links: links,
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    renderMenu: renderMenu,
    renderCategoryNav: renderCategoryNav,
    applyFilter: applyFilter,
    openModal: openModal,
    closeModal: closeModal,
    showError: showError,
    prefersReducedMotion: prefersReducedMotion
  };
})(window, document);
