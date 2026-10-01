/*
 * QR Menu: app start-up.
 * Loads data/restaurant.json + data/menu.json, applies the theme and SEO tags,
 * renders the page and wires up search, filters, navigation and the modal.
 */
(function (window, document) {
  "use strict";

  var QRMenu = window.QRMenu;
  var Menu = QRMenu.Menu;
  var UI = QRMenu.UI;
  var $ = UI.$;

  var DATA = {
    restaurant: "data/restaurant.json",
    menu: "data/menu.json"
  };

  var state = {
    restaurant: null,
    categories: [],
    itemsById: {},
    query: "",
    filter: "all"
  };

  /* ---------- Theme ---------- */

  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return null;
    var h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbToHex(rgb) {
    return "#" + rgb.map(function (c) { return ("0" + Math.round(c).toString(16)).slice(-2); }).join("");
  }

  /** Mix colour a with colour b; amount = share of b (0..1). */
  function mix(a, b, amount) {
    return [0, 1, 2].map(function (i) { return a[i] + (b[i] - a[i]) * amount; });
  }

  function luminance(rgb) {
    var c = rgb.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  var WHITE = [255, 255, 255];
  var BLACK = [0, 0, 0];

  /**
   * Only two colours are required (primary + secondary). Every other shade the
   * design needs is derived here, with text colours chosen for readable contrast.
   */
  function applyTheme(theme) {
    theme = theme || {};
    var root = document.documentElement.style;
    var primary = hexToRgb(theme.primary) || [139, 0, 0];
    var secondary = hexToRgb(theme.secondary) || [245, 230, 200];
    var accent = hexToRgb(theme.accent) || null;

    // Keep the primary dark enough for white text and price colour on light backgrounds.
    var primaryText = luminance(primary) > 0.4 ? mix(primary, BLACK, 0.55) : primary;
    var onPrimary = luminance(primary) > 0.45 ? "#1a1a1a" : "#ffffff";

    // Secondary is used as a soft page tint, so it must be light.
    var tint = luminance(secondary) < 0.5 ? mix(secondary, WHITE, 0.88) : secondary;

    root.setProperty("--primary", rgbToHex(primary));
    root.setProperty("--primary-dark", rgbToHex(mix(primary, BLACK, 0.35)));
    root.setProperty("--primary-ink", rgbToHex(primaryText));
    root.setProperty("--primary-soft", rgbToHex(mix(primary, WHITE, 0.9)));
    root.setProperty("--on-primary", onPrimary);
    root.setProperty("--secondary", rgbToHex(tint));
    root.setProperty("--bg", rgbToHex(mix(tint, WHITE, 0.55)));
    root.setProperty("--line", rgbToHex(mix(tint, BLACK, 0.1)));
    if (accent) root.setProperty("--accent", rgbToHex(accent));

    document.documentElement.classList.toggle("theme-light-primary", onPrimary !== "#ffffff");
    if (theme.headingFont === "sans") document.documentElement.classList.add("font-sans");

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", rgbToHex(primary));
  }

  /* ---------- SEO / sharing ---------- */

  function setMeta(selector, value) {
    var node = document.querySelector(selector);
    if (node && value) node.setAttribute("content", value);
  }

  function absoluteUrl(path) {
    try { return new URL(path, window.location.href).href; } catch (e) { return path; }
  }

  function applySeo(r, categories) {
    var title = r.name + " | Menu" + (r.tagline ? " – " + r.tagline : "");
    var desc = r.description || ("View the menu of " + r.name + (r.address ? ", " + r.address : "") + ". Prices, photos and today's availability.");
    var pageUrl = r.siteUrl || window.location.href.split("#")[0];

    document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:url"]', pageUrl);
    if (r.logo) {
      setMeta('meta[property="og:image"]', absoluteUrl(r.coverImage || r.logo));
      $("favicon").setAttribute("href", r.favicon || r.logo);
    }
    var canonical = $("canonical-link");
    if (canonical) canonical.setAttribute("href", pageUrl);

    // JSON-LD structured data for search engines.
    var l = UI.links(r);
    var schema = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: r.name,
      description: desc,
      url: pageUrl,
      image: r.logo ? absoluteUrl(r.logo) : undefined,
      telephone: r.phone || undefined,
      address: r.address ? { "@type": "PostalAddress", streetAddress: r.address } : undefined,
      hasMap: l.maps || undefined,
      servesCuisine: r.cuisine && r.cuisine.length ? r.cuisine : undefined,
      priceRange: r.priceRange || undefined,
      sameAs: [r.instagram, r.facebook, r.website].filter(Boolean),
      openingHoursSpecification: (r.openingHours || [])
        .filter(function (h) { return h && h.day && h.open && h.close && !h.closed; })
        .map(function (h) {
          return { "@type": "OpeningHoursSpecification", dayOfWeek: h.day, opens: h.open, closes: h.close };
        }),
      hasMenu: {
        "@type": "Menu",
        name: r.name + " Menu",
        hasMenuSection: categories.map(function (c) {
          return {
            "@type": "MenuSection",
            name: c.name,
            hasMenuItem: c.items.map(function (i) {
              var price = Menu.displayPrice(i);
              return {
                "@type": "MenuItem",
                name: i.name,
                description: i.description || undefined,
                suitableForDiet: i.isVeg ? "https://schema.org/VegetarianDiet" : undefined,
                offers: price === null ? undefined : {
                  "@type": "Offer",
                  price: price,
                  priceCurrency: r.currencyCode || (r.currency === "₹" ? "INR" : undefined),
                  availability: i.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
              };
            })
          };
        })
      }
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /* ---------- Search & filters ---------- */

  function update() {
    UI.applyFilter(state.categories, state.query, state.filter);
    $("search-clear").hidden = !state.query;
    measureToolbar();
    activeId = null;
    spy();
  }

  function setFilter(filter) {
    state.filter = filter;
    var chips = document.querySelectorAll("#filters .chip");
    Array.prototype.forEach.call(chips, function (chip) {
      var active = chip.getAttribute("data-filter") === filter;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });
    update();
  }

  function bindSearchAndFilters() {
    var input = $("search-input");
    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.query = input.value.trim();
        update();
      }, 120);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && input.value) { e.preventDefault(); clearSearch(); }
      if (e.key === "Enter") input.blur(); // closes the phone keyboard
    });
    $("search-clear").addEventListener("click", function () { clearSearch(); input.focus(); });

    $("filters").addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (chip) setFilter(chip.getAttribute("data-filter"));
    });

    $("reset-filters").addEventListener("click", function () {
      clearSearch();
      setFilter("all");
      input.focus();
    });

    function clearSearch() {
      input.value = "";
      state.query = "";
      update();
    }
  }

  /* ---------- Category navigation + scroll spy ---------- */

  var activeId = null;
  var navLockUntil = 0;

  function setActiveCategory(id) {
    if (!id || id === activeId) return;
    activeId = id;
    var links = document.querySelectorAll(".catnav__link");
    Array.prototype.forEach.call(links, function (a) {
      var on = a.getAttribute("data-category") === id;
      a.classList.toggle("is-active", on);
      if (on) {
        a.setAttribute("aria-current", "true");
        // Scroll the chip into view horizontally without moving the page.
        var list = $("category-nav-list");
        var target = a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2;
        list.scrollTo({ left: Math.max(0, target), behavior: UI.prefersReducedMotion() ? "auto" : "smooth" });
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  function toolbarOffset() {
    return $("toolbar").getBoundingClientRect().height;
  }

  /** Keep CSS scroll offsets in sync with the real sticky toolbar height. */
  function measureToolbar() {
    document.documentElement.style.setProperty("--toolbar-h", Math.round(toolbarOffset()) + "px");
  }

  /**
   * Scroll spy: the active category is the last visible section whose top has
   * passed the line just below the sticky toolbar. At the very bottom of the
   * page the last section wins, even if it is too short to reach that line.
   */
  function spy() {
    if (Date.now() < navLockUntil) return;
    var sections = document.querySelectorAll(".category:not([hidden])");
    if (!sections.length) return;
    var line = toolbarOffset() + 24;
    var current = sections[0];
    Array.prototype.forEach.call(sections, function (s) {
      if (s.getBoundingClientRect().top <= line) current = s;
    });
    var atBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4;
    if (atBottom && sections[sections.length - 1].getBoundingClientRect().top < window.innerHeight) {
      current = sections[sections.length - 1];
    }
    setActiveCategory(current.getAttribute("data-category"));
  }

  function bindCategoryNav() {
    $("category-nav-list").addEventListener("click", function (e) {
      var link = e.target.closest(".catnav__link");
      if (!link) return;
      e.preventDefault();
      var id = link.getAttribute("data-category");
      var section = $("cat-" + id);
      if (!section) return;
      // Pause the scroll spy while the smooth scroll runs, then re-check once.
      navLockUntil = Date.now() + 900;
      setTimeout(spy, 950);
      setActiveCategory(id);
      var top = section.getBoundingClientRect().top + window.pageYOffset - toolbarOffset() + 1;
      window.scrollTo({ top: top, behavior: UI.prefersReducedMotion() ? "auto" : "smooth" });
      // Move keyboard focus to the section heading for screen readers.
      var heading = section.querySelector(".category__title");
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
      if (window.history && history.replaceState) history.replaceState(null, "", "#cat-" + id);
    });
  }

  function bindScrollUi() {
    var toTop = $("to-top");
    var toolbar = $("toolbar");
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.pageYOffset;
        toTop.hidden = y < 800;
        toolbar.classList.toggle("is-stuck", toolbar.getBoundingClientRect().top <= 0 && y > 0);
        spy();
        ticking = false;
      });
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: UI.prefersReducedMotion() ? "auto" : "smooth" });
      // Keep keyboard focus somewhere sensible once the button hides itself.
      var name = $("restaurant-name");
      name.setAttribute("tabindex", "-1");
      name.focus({ preventScroll: true });
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { measureToolbar(); spy(); }, 200);
    });
  }

  /* ---------- Modal ---------- */

  function bindModal() {
    var dialog = $("item-modal");
    var currency = state.restaurant.currency || "";

    $("menu-sections").addEventListener("click", function (e) {
      var cardNode = e.target.closest(".card");
      if (!cardNode) return;
      var item = state.itemsById[cardNode.getAttribute("data-id")];
      if (item) UI.openModal(item, currency);
    });

    $("modal-close").addEventListener("click", UI.closeModal);
    // Click on the dark backdrop closes the dialog.
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) UI.closeModal();
    });
    dialog.addEventListener("close", function () {
      document.body.classList.remove("modal-open");
    });
  }

  /* ---------- Start ---------- */

  function friendlyLoadError(err) {
    if (window.location.protocol === "file:") {
      return "Your browser blocks loading menu data from a file opened directly from your computer. " +
        "Upload the site to GitHub Pages, or run a small local server in this folder " +
        "(for example: python -m http.server 8000) and open http://localhost:8000.";
    }
    return (err && err.message) || "Please check your internet connection and try again.";
  }

  function start() {
    Promise.all([Menu.loadJSON(DATA.restaurant), Menu.loadJSON(DATA.menu)])
      .then(function (results) {
        var restaurant = results[0] || {};
        restaurant.name = restaurant.name || "Our Menu";
        var menu = Menu.normalizeMenu(results[1]);

        state.restaurant = restaurant;
        state.categories = menu.categories;
        menu.categories.forEach(function (c) {
          c.items.forEach(function (i) { state.itemsById[i.id] = i; });
        });

        applyTheme(restaurant.theme);
        applySeo(restaurant, menu.categories);
        UI.renderHeader(restaurant);
        UI.renderFooter(restaurant);
        UI.renderCategoryNav(menu.categories);
        UI.renderMenu(menu.categories, restaurant.currency || "");

        $("loader").hidden = true;
        document.body.classList.remove("is-loading");

        if (!menu.categories.length) {
          UI.showError("The menu is empty. Add categories and items to data/menu.json.");
          return;
        }

        bindSearchAndFilters();
        bindCategoryNav();
        bindScrollUi();
        bindModal();
        update();

        // Support links like .../#cat-biryani
        var hash = window.location.hash;
        if (hash && hash.indexOf("#cat-") === 0) {
          var link = document.querySelector('.catnav__link[href="' + hash + '"]');
          if (link) link.click();
        }
      })
      .catch(function (err) {
        if (window.console) console.error(err);
        applyTheme({});
        UI.showError(friendlyLoadError(err));
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window, document);
