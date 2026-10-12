/* Lightweight client-side cart: no backend or database required. */
(function (window, document) {
  "use strict";
  var cart = {};
  var restaurant = {};
  var currency = "₹";
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return currency + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 }); };
  var stamp = function () { return new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }); };
  var orderRef = function () { return "QR-" + Date.now().toString().slice(-8); };

  function itemFromId(id) {
    var card = document.querySelector('.card[data-id="' + CSS.escape(id) + '"]');
    return card && window.QRMenu && window.QRMenu.Menu ? null : null;
  }
  function getItem(id) {
    var data = window.QRMenuCartItems && window.QRMenuCartItems[id];
    return data || null;
  }
  function priceFor(item) { return item.offerPrice !== null && item.offerPrice !== undefined ? item.offerPrice : item.price; }
  function totalQty() { return Object.keys(cart).reduce(function (n, k) { return n + cart[k].qty; }, 0); }
  function total() { return Object.keys(cart).reduce(function (n, k) { return n + cart[k].qty * cart[k].price; }, 0); }
  function safeText(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]; }); }

  function addItem(id) {
    var item = getItem(id);
    if (!item || !item.isAvailable) return;
    var variation = null;
    if (item.variations && item.variations.length) {
      var options = item.variations.map(function (v, i) { return (i + 1) + ". " + v.name + " — " + money(v.price); }).join("\n");
      var answer = window.prompt("Choose an option for " + item.name + ":\n" + options + "\nEnter option number:", "1");
      if (answer === null) return;
      var index = parseInt(answer, 10) - 1;
      if (index < 0 || index >= item.variations.length || String(index + 1) !== String(answer).trim()) { window.alert("Please enter a valid option number."); return; }
      variation = item.variations[index];
    }
    var key = id + (variation ? "::" + variation.name : "");
    if (!cart[key]) cart[key] = { key: key, id: id, name: item.name, variation: variation ? variation.name : "", price: variation ? variation.price : priceFor(item), qty: 0 };
    cart[key].qty += 1;
    render();
  }

  function render() {
    var count = totalQty();
    $("cart-dock").hidden = count === 0;
    $("cart-count").textContent = count + (count === 1 ? " item" : " items");
    $("cart-total").textContent = money(total());
    $("cart-grand-total").textContent = money(total());
    var host = $("cart-items"); host.textContent = "";
    Object.keys(cart).forEach(function (key) {
      var line = cart[key];
      var row = document.createElement("div"); row.className = "cart-line";
      var details = document.createElement("div"); details.className = "cart-line__details";
      var name = document.createElement("strong"); name.textContent = line.name + (line.variation ? " (" + line.variation + ")" : "");
      var price = document.createElement("span"); price.textContent = money(line.price) + " each";
      details.appendChild(name); details.appendChild(price);
      var controls = document.createElement("div"); controls.className = "cart-line__controls";
      [["−", "decrease", "Decrease quantity"], [String(line.qty), "quantity", "Quantity"], ["+", "increase", "Increase quantity"], ["Remove", "remove", "Remove item"]].forEach(function (x) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = x[0]; b.dataset.cartAction = x[1]; b.dataset.cartKey = key; b.setAttribute("aria-label", x[2]);
        if (x[1] === "quantity") b.disabled = true;
        controls.appendChild(b);
      });
      var subtotal = document.createElement("strong"); subtotal.className = "cart-line__subtotal"; subtotal.textContent = money(line.price * line.qty);
      row.appendChild(details); row.appendChild(controls); row.appendChild(subtotal); host.appendChild(row);
    });
  }

  function orderText() {
    var ref = orderRef();
    var lines = ["*New QR Menu Order*", restaurant.name || "Restaurant", "Order reference: " + ref, "Date/time: " + stamp(), ""];
    var name = $("customer-name").value.trim(); var table = $("customer-table").value.trim(); var notes = $("customer-notes").value.trim();
    if (name) lines.push("Customer: " + name);
    if (table) lines.push("Table: " + table);
    lines.push("", "*Items*");
    Object.keys(cart).forEach(function (key, i) { var x = cart[key]; lines.push((i + 1) + ". " + x.name + (x.variation ? " (" + x.variation + ")" : "") + " × " + x.qty + " — " + money(x.price * x.qty)); });
    lines.push("", "*Total: " + money(total()) + "*");
    if (notes) lines.push("Instructions: " + notes);
    lines.push("", "Please confirm this order.");
    return { ref: ref, text: lines.join("\n"), name: name, table: table, notes: notes };
  }

  function showStaffOrder() {
    if (!totalQty()) return;
    var order = orderText(); var host = $("staff-order-content"); host.textContent = "";
    var meta = document.createElement("p"); meta.className = "staff-order-meta"; meta.textContent = order.ref + " · " + stamp(); host.appendChild(meta);
    if (order.name) { var n = document.createElement("p"); n.textContent = "Name: " + order.name; host.appendChild(n); }
    if (order.table) { var t = document.createElement("p"); t.textContent = "Table: " + order.table; host.appendChild(t); }
    var list = document.createElement("ul"); list.className = "staff-order-list";
    Object.keys(cart).forEach(function (key) { var x = cart[key]; var li = document.createElement("li"); li.textContent = x.name + (x.variation ? " (" + x.variation + ")" : "") + " × " + x.qty + " — " + money(x.price * x.qty); list.appendChild(li); });
    host.appendChild(list);
    var totalLine = document.createElement("h3"); totalLine.textContent = "Total: " + money(total()); host.appendChild(totalLine);
    if (order.notes) { var note = document.createElement("p"); note.textContent = "Instructions: " + order.notes; host.appendChild(note); }
    $("order-dialog").close(); $("staff-dialog").showModal();
  }

  function sendWhatsApp() {
    if (!totalQty()) return;
    var order = orderText();
    var number = String(restaurant.whatsapp || "").replace(/\D/g, "");
    if (!number) { window.alert("Please configure the restaurant WhatsApp number in data/restaurant.json."); return; }
    var url = "https://wa.me/" + number + "?text=" + encodeURIComponent(order.text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function init() {
    fetch("data/restaurant.json").then(function (r) { return r.json(); }).then(function (r) { restaurant = r || {}; currency = restaurant.currency || "₹"; });
    // Read the same normalized menu data source; prices are display-only until sent.
    fetch("data/menu.json").then(function (r) { return r.json(); }).then(function (data) {
      var items = {};
      (data.categories || []).forEach(function (cat) { (cat.items || []).forEach(function (raw) {
        var item = Object.assign({ price: null, offerPrice: null, variations: [], isAvailable: true }, raw);
        items[String(item.id || item.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")] = item;
        items[item.id] = item;
      }); });
      window.QRMenuCartItems = items;
    }).catch(function () { window.alert("Menu data could not be loaded. Please refresh and try again."); });

    document.getElementById("menu-sections").addEventListener("click", function (e) { var b = e.target.closest("[data-add-to-cart]"); if (b) { e.preventDefault(); e.stopPropagation(); addItem(b.getAttribute("data-add-to-cart")); } });
    $("open-cart").addEventListener("click", function () { render(); $("order-dialog").showModal(); });
    $("order-close").addEventListener("click", function () { $("order-dialog").close(); });
    $("staff-close").addEventListener("click", function () { $("staff-dialog").close(); });
    $("staff-done").addEventListener("click", function () { $("staff-dialog").close(); });
    $("show-staff-order").addEventListener("click", showStaffOrder);
    $("send-whatsapp-order").addEventListener("click", sendWhatsApp);
    $("cart-items").addEventListener("click", function (e) {
      var b = e.target.closest("[data-cart-action]"); if (!b) return;
      var key = b.dataset.cartKey; if (!cart[key]) return;
      if (b.dataset.cartAction === "increase") cart[key].qty += 1;
      if (b.dataset.cartAction === "decrease") cart[key].qty -= 1;
      if (b.dataset.cartAction === "remove" || cart[key].qty <= 0) delete cart[key];
      render();
    });
    ["order-dialog", "staff-dialog"].forEach(function (id) { $(id).addEventListener("click", function (e) { if (e.target === $(id)) $(id).close(); }); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
