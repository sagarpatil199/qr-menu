/*
 * QR Menu: data layer.
 * Loads the JSON files, cleans the data (fills in defaults, sorts) and
 * answers search/filter questions. No DOM code lives here.
 */
(function (window) {
  "use strict";

  var QRMenu = (window.QRMenu = window.QRMenu || {});

  /* ---------- Loading ---------- */

  function loadJSON(path) {
    // "no-cache" = always ask the server whether the file changed, so a
    // price or availability change shows up as soon as GitHub Pages publishes it.
    return fetch(path, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) {
        throw new Error("Could not load " + path + " (HTTP " + res.status + ").");
      }
      return res.text().then(function (text) {
        try {
          return JSON.parse(text);
        } catch (err) {
          throw new Error(
            "There is a mistake in " + path + ": " + err.message +
            ". Check for a missing comma, quote or bracket."
          );
        }
      });
    });
  }

  /* ---------- Helpers ---------- */

  function toBool(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "string") return value.toLowerCase() === "true" || value.toLowerCase() === "yes";
    return Boolean(value);
  }

  function toNumber(value) {
    if (value === undefined || value === null || value === "") return null;
    var n = Number(String(value).replace(/[^0-9.\-]/g, ""));
    return isFinite(n) ? n : null;
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item";
  }

  function searchText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "");
  }

  function byOrder(a, b) {
    // Items without displayOrder keep their position in the file.
    return a._order - b._order || a._index - b._index;
  }

  /** Format a price like "₹180" or "₹1,250" (Indian digit grouping for ₹). */
  function formatPrice(amount, currency) {
    if (amount === null || amount === undefined) return "";
    var locale = currency === "₹" ? "en-IN" : undefined;
    var hasDecimals = Math.round(amount) !== amount;
    var text = Number(amount).toLocaleString(locale, {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2
    });
    return (currency || "") + text;
  }

  /* ---------- Normalising ---------- */

  function normalizeItem(raw, index, category, usedIds) {
    var name = String(raw.name || "").trim() || "Untitled item";
    var id = slugify(raw.id || name);
    while (usedIds[id]) id += "-" + index;
    usedIds[id] = true;

    var price = toNumber(raw.price);
    var offerPrice = toNumber(raw.offerPrice);
    if (offerPrice !== null && price !== null && offerPrice >= price) offerPrice = null;

    var variations = Array.isArray(raw.variations)
      ? raw.variations
          .map(function (v) {
            return { name: String((v && v.name) || "").trim(), price: toNumber(v && v.price) };
          })
          .filter(function (v) { return v.name; })
      : [];

    var spice = Math.max(0, Math.min(3, Math.round(toNumber(raw.spiceLevel) || 0)));

    var item = {
      id: id,
      name: name,
      description: String(raw.description || "").trim(),
      price: price,
      offerPrice: offerPrice,
      offerLabel: String(raw.offerLabel || "").trim(),
      image: String(raw.image || "").trim(),
      isVeg: toBool(raw.isVeg, null), // null = not specified, no indicator shown
      isAvailable: toBool(raw.isAvailable, true),
      isBestseller: toBool(raw.isBestseller, false),
      isNew: toBool(raw.isNew, false),
      spiceLevel: spice,
      variations: variations,
      categoryId: category.id,
      categoryName: category.name,
      _order: toNumber(raw.displayOrder) === null ? Infinity : toNumber(raw.displayOrder),
      _index: index
    };

    item._search = searchText([item.name, item.description, category.name, item.offerLabel]
      .concat(variations.map(function (v) { return v.name; }))
      .join(" "));

    return item;
  }

  /**
   * Turn raw menu.json into clean, sorted data the UI can trust.
   * Missing optional fields get sensible defaults so a restaurant owner
   * only has to type what they need.
   */
  function normalizeMenu(data) {
    var rawCategories = (data && Array.isArray(data.categories)) ? data.categories : [];
    var usedCatIds = {};
    var usedItemIds = {};

    var categories = rawCategories
      .filter(function (c) { return c && toBool(c.isVisible, true); })
      .map(function (raw, index) {
        var name = String(raw.name || "").trim() || "Menu";
        var id = slugify(raw.id || name);
        while (usedCatIds[id]) id += "-" + index;
        usedCatIds[id] = true;

        var category = {
          id: id,
          name: name,
          description: String(raw.description || "").trim(),
          _order: toNumber(raw.displayOrder) === null ? Infinity : toNumber(raw.displayOrder),
          _index: index
        };

        category.items = (Array.isArray(raw.items) ? raw.items : [])
          .filter(function (it) { return it && toBool(it.isVisible, true); })
          .map(function (it, i) { return normalizeItem(it, i, category, usedItemIds); })
          .sort(byOrder);

        return category;
      })
      .filter(function (c) { return c.items.length > 0; })
      .sort(byOrder);

    return { categories: categories };
  }

  /* ---------- Search & filter ---------- */

  var FILTERS = {
    all: function () { return true; },
    veg: function (item) { return item.isVeg === true; },
    nonveg: function (item) { return item.isVeg === false; },
    available: function (item) { return item.isAvailable; },
    bestseller: function (item) { return item.isBestseller; },
    "new": function (item) { return item.isNew; }
  };

  /** True when the item matches the search words AND the active filter. */
  function matches(item, query, filter) {
    var test = FILTERS[filter] || FILTERS.all;
    if (!test(item)) return false;
    var words = searchText(query).split(/\s+/).filter(Boolean);
    return words.every(function (w) { return item._search.indexOf(w) !== -1; });
  }

  /** Lowest price a customer can pay for this item (used in schema / sorting). */
  function displayPrice(item) {
    if (item.offerPrice !== null) return item.offerPrice;
    if (item.price !== null) return item.price;
    var prices = item.variations.map(function (v) { return v.price; }).filter(function (p) { return p !== null; });
    return prices.length ? Math.min.apply(null, prices) : null;
  }

  QRMenu.Menu = {
    loadJSON: loadJSON,
    normalizeMenu: normalizeMenu,
    matches: matches,
    formatPrice: formatPrice,
    displayPrice: displayPrice,
    slugify: slugify
  };
})(window);
