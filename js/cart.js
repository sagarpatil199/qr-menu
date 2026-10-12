
/* QR Menu Cart: staff checkout + WhatsApp checkout */
(function (window, document) {
  "use strict";

  var cart = {};
  var restaurant = {};
  var currency = "₹";

  var $ = function (id) {
    return document.getElementById(id);
  };

  var money = function (n) {
    return currency + Number(n || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });
  };

  var stamp = function () {
    return new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata"
    });
  };

  var orderRef = function () {
    return "QR-" + Date.now().toString().slice(-8);
  };

  function getItem(id) {
    return window.QRMenuCartItems &&
      window.QRMenuCartItems[id] || null;
  }

  function priceFor(item) {
    return item.offerPrice !== null &&
      item.offerPrice !== undefined
      ? item.offerPrice
      : item.price;
  }

  function totalQty() {
    return Object.keys(cart).reduce(function (n, k) {
      return n + cart[k].qty;
    }, 0);
  }

  function total() {
    return Object.keys(cart).reduce(function (n, k) {
      return n + cart[k].qty * cart[k].price;
    }, 0);
  }

  function clearCart() {
    cart = {};
    render();

    if ($("order-dialog").open) {
      $("order-dialog").close();
    }

    if ($("staff-dialog").open) {
      $("staff-dialog").close();
    }
  }

  function customerDetails() {
    var name = $("customer-name").value.trim();
    var phone = $("customer-phone").value.replace(/\D/g, "");
    var table = $("customer-table").value.trim();
    var notes = $("customer-notes").value.trim();

    // Accept a 10-digit Indian mobile number.
    // Also accept numbers entered with India's 91 country code.
    if (phone.length === 12 && phone.indexOf("91") === 0) {
      phone = phone.slice(2);
    }

    if (!name) {
      window.alert("Please enter your name.");
      $("customer-name").focus();
      return null;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      window.alert("Please enter a valid 10-digit Indian mobile number.");
      $("customer-phone").focus();
      return null;
    }

    if (!table) {
      window.alert("Please enter your table number.");
      $("customer-table").focus();
      return null;
    }

    return {
      name: name,
      phone: "+91" + phone,
      table: table,
      notes: notes
    };
  }

  function addItem(id) {
    var item = getItem(id);

    if (!item || !item.isAvailable) return;

    var variation = null;

    if (item.variations && item.variations.length) {
      var options = item.variations.map(function (v, i) {
        return (i + 1) + ". " + v.name + " — " + money(v.price);
      }).join("\n");

      var answer = window.prompt(
        "Choose an option for " + item.name + ":\n" +
        options + "\nEnter option number:",
        "1"
      );

      if (answer === null) return;

      var index = parseInt(answer, 10) - 1;

      if (
        index < 0 ||
        index >= item.variations.length ||
        String(index + 1) !== String(answer).trim()
      ) {
        window.alert("Please enter a valid option number.");
        return;
      }

      variation = item.variations[index];
    }

    var key = id + (variation ? "::" + variation.name : "");

    if (!cart[key]) {
      cart[key] = {
        key: key,
        id: id,
        name: item.name,
        variation: variation ? variation.name : "",
        price: variation ? variation.price : priceFor(item),
        qty: 0
      };
    }

    cart[key].qty += 1;
    render();

    // Close the item details popup after adding successfully.
    if (
      window.QRMenu &&
      window.QRMenu.UI &&
      window.QRMenu.UI.closeModal
    ) {
      window.QRMenu.UI.closeModal();
    }
  }

  function render() {
    var count = totalQty();

    $("cart-dock").hidden = count === 0;
    $("cart-count").textContent =
      count + (count === 1 ? " item" : " items");

    $("cart-total").textContent = money(total());
    $("cart-grand-total").textContent = money(total());

    var host = $("cart-items");
    host.textContent = "";

    Object.keys(cart).forEach(function (key) {
      var line = cart[key];

      var row = document.createElement("div");
      row.className = "cart-line";

      var details = document.createElement("div");
      details.className = "cart-line__details";

      var name = document.createElement("strong");
      name.textContent =
        line.name + (line.variation ? " (" + line.variation + ")" : "");

      var price = document.createElement("span");
      price.textContent = money(line.price) + " each";

      details.appendChild(name);
      details.appendChild(price);

      var controls = document.createElement("div");
      controls.className = "cart-line__controls";

      [
        ["−", "decrease", "Decrease quantity"],
        [String(line.qty), "quantity", "Quantity"],
        ["+", "increase", "Increase quantity"],
        ["Remove", "remove", "Remove item"]
      ].forEach(function (x) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = x[0];
        b.dataset.cartAction = x[1];
        b.dataset.cartKey = key;
        b.setAttribute("aria-label", x[2]);

        if (x[1] === "quantity") b.disabled = true;

        controls.appendChild(b);
      });

      var subtotal = document.createElement("strong");
      subtotal.className = "cart-line__subtotal";
      subtotal.textContent = money(line.price * line.qty);

      row.appendChild(details);
      row.appendChild(controls);
      row.appendChild(subtotal);
      host.appendChild(row);
    });
  }

  function orderText(details) {
    var ref = orderRef();

    var lines = [
      "*New QR Menu Order*",
      restaurant.name || "Restaurant",
      "Order reference: " + ref,
      "Date/time: " + stamp(),
      "",
      "Customer: " + details.name,
      "Mobile: " + details.phone,
      "Table: " + details.table,
      "",
      "*Items*"
    ];

    Object.keys(cart).forEach(function (key, i) {
      var x = cart[key];

      lines.push(
        (i + 1) + ". " +
        x.name +
        (x.variation ? " (" + x.variation + ")" : "") +
        " × " + x.qty +
        " — " + money(x.price * x.qty)
      );
    });

    lines.push("", "*Total: " + money(total()) + "*");

    if (details.notes) {
      lines.push("Instructions: " + details.notes);
    }

    lines.push("", "Please confirm this order.");

    return {
      ref: ref,
      text: lines.join("\n"),
      details: details
    };
  }

  function showStaffOrder() {
    if (!totalQty()) {
      window.alert("Please add items to your cart first.");
      return;
    }

    var details = customerDetails();
    if (!details) return;

    var order = orderText(details);
    var host = $("staff-order-content");
    host.textContent = "";

    var meta = document.createElement("p");
    meta.className = "staff-order-meta";
    meta.textContent = order.ref + " · " + stamp();
    host.appendChild(meta);

    [
      ["Name", details.name],
      ["Mobile", details.phone],
      ["Table", details.table]
    ].forEach(function (pair) {
      var p = document.createElement("p");
      p.textContent = pair[0] + ": " + pair[1];
      host.appendChild(p);
    });

    var list = document.createElement("ul");
    list.className = "staff-order-list";

    Object.keys(cart).forEach(function (key) {
      var x = cart[key];
      var li = document.createElement("li");

      li.textContent =
        x.name +
        (x.variation ? " (" + x.variation + ")" : "") +
        " × " + x.qty +
        " — " + money(x.price * x.qty);

      list.appendChild(li);
    });

    host.appendChild(list);

    var totalLine = document.createElement("h3");
    totalLine.textContent = "Total: " + money(total());
    host.appendChild(totalLine);

    if (details.notes) {
      var note = document.createElement("p");
      note.textContent = "Instructions: " + details.notes;
      host.appendChild(note);
    }

    $("order-dialog").close();
    $("staff-dialog").showModal();
  }

  function sendWhatsApp() {
    if (!totalQty()) {
      window.alert("Please add items to your cart first.");
      return;
    }

    var details = customerDetails();
    if (!details) return;

    var order = orderText(details);
    var number = String(restaurant.whatsapp || "").replace(/\D/g, "");

    if (!number) {
      window.alert(
        "Please configure the restaurant WhatsApp number in data/restaurant.json."
      );
      return;
    }

    var url =
      "https://wa.me/" + number +
      "?text=" + encodeURIComponent(order.text);

    // Open WhatsApp first. Clear the cart only if the browser
    // successfully opens the WhatsApp window.
    var waWindow = window.open(url, "_blank");

    if (waWindow) {
      waWindow.opener = null;
      clearCart();
    } else {
      window.alert(
        "WhatsApp could not open. Allow pop-ups and try again."
      );
    }
  }

  function init() {
    fetch("data/restaurant.json")
      .then(function (r) { return r.json(); })
      .then(function (r) {
        restaurant = r || {};
        currency = restaurant.currency || "₹";
      })
      .catch(function () {
        window.alert("Restaurant settings could not be loaded.");
      });

    fetch("data/menu.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = {};

        (data.categories || []).forEach(function (cat) {
          (cat.items || []).forEach(function (raw) {
            var item = Object.assign({
              price: null,
              offerPrice: null,
              variations: [],
              isAvailable: true
            }, raw);

            var slug = String(item.id || item.name)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");

            items[slug] = item;
            items[item.id] = item;
          });
        });

        window.QRMenuCartItems = items;
      })
      .catch(function () {
        window.alert("Menu data could not be loaded. Please refresh.");
      });

    $("menu-sections").addEventListener("click", function (e) {
      var b = e.target.closest("[data-add-to-cart]");

      if (b) {
        e.preventDefault();
        e.stopPropagation();
        addItem(b.getAttribute("data-add-to-cart"));
      }
    });

    $("open-cart").addEventListener("click", function () {
      render();
      $("order-dialog").showModal();
    });

    $("order-close").addEventListener("click", function () {
      $("order-dialog").close();
    });

    $("staff-close").addEventListener("click", function () {
      $("staff-dialog").close();
    });

    // Staff confirms they have finished with this order:
    // clear cart and return to the menu.
    $("staff-done").addEventListener("click", clearCart);

    $("show-staff-order").addEventListener("click", showStaffOrder);
    $("send-whatsapp-order").addEventListener("click", sendWhatsApp);

    $("cart-items").addEventListener("click", function (e) {
      var b = e.target.closest("[data-cart-action]");
      if (!b) return;

      var key = b.dataset.cartKey;
      if (!cart[key]) return;

      if (b.dataset.cartAction === "increase") {
        cart[key].qty += 1;
      }

      if (b.dataset.cartAction === "decrease") {
        cart[key].qty -= 1;
      }

      if (
        b.dataset.cartAction === "remove" ||
        cart[key].qty <= 0
      ) {
        delete cart[key];
      }

      render();
    });

    ["order-dialog", "staff-dialog"].forEach(function (id) {
      $(id).addEventListener("click", function (e) {
        if (e.target === $(id)) $(id).close();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
