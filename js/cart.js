
/* QR Menu Cart: Staff checkout + WhatsApp checkout */
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
    return Object.keys(cart).reduce(function (n, key) {
      return n + cart[key].qty;
    }, 0);
  }

  function total() {
    return Object.keys(cart).reduce(function (n, key) {
      return n + cart[key].qty * cart[key].price;
    }, 0);
  }

  function clearCart() {
    cart = {};
    render();

    var orderDialog = $("order-dialog");
    var staffDialog = $("staff-dialog");

    if (orderDialog && orderDialog.open) orderDialog.close();
    if (staffDialog && staffDialog.open) staffDialog.close();

    var fields = $("whatsapp-fields");
    if (fields) fields.hidden = true;

    var message = $("cart-message");
    if (message) message.textContent = "";
  }

  function getCustomerDetails() {
    var nameInput = $("customer-name");
    var phoneInput = $("customer-phone");
    var tableInput = $("customer-table");
    var notesInput = $("customer-notes");

    var name = nameInput ? nameInput.value.trim() : "";
    var phone = phoneInput ? phoneInput.value.replace(/\D/g, "") : "";
    var table = tableInput ? tableInput.value.trim() : "";
    var notes = notesInput ? notesInput.value.trim() : "";

    if (!name) {
      window.alert("Please enter your name for the WhatsApp order.");
      if (nameInput) nameInput.focus();
      return null;
    }

    if (phone.length === 12 && phone.indexOf("91") === 0) {
      phone = phone.slice(2);
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      window.alert("Please enter a valid 10-digit Indian mobile number.");
      if (phoneInput) phoneInput.focus();
      return null;
    }

    if (!table) {
      window.alert("Please enter your table number.");
      if (tableInput) tableInput.focus();
      return null;
    }

    return {
      name: name,
      phone: "+91" + phone,
      table: table,
      notes: notes
    };
  }

  function getStaffDetails() {
    var tableInput = $("customer-table");
    var notesInput = $("customer-notes");

    return {
      table: tableInput ? tableInput.value.trim() : "",
      notes: notesInput ? notesInput.value.trim() : ""
    };
  }

  function addItem(id) {
    var item = getItem(id);

    if (!item || item.isAvailable === false) {
      window.alert("This item is currently unavailable.");
      return;
    }

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
        price: Number(variation ? variation.price : priceFor(item)) || 0,
        qty: 0
      };
    }

    cart[key].qty += 1;
    render();

    if (
      window.QRMenu &&
      window.QRMenu.UI &&
      typeof window.QRMenu.UI.closeModal === "function"
    ) {
      window.QRMenu.UI.closeModal();
    }

    var message = $("cart-message");
    if (message) message.textContent = item.name + " added to cart.";
  }

  function render() {
    var count = totalQty();
    var dock = $("cart-dock");
    var countNode = $("cart-count");
    var totalNode = $("cart-total");
    var grandTotal = $("cart-grand-total");
    var host = $("cart-items");

    if (dock) dock.hidden = count === 0;

    if (countNode) {
      countNode.textContent = count + (count === 1 ? " item" : " items");
    }

    if (totalNode) totalNode.textContent = money(total());
    if (grandTotal) grandTotal.textContent = money(total());

    if (!host) return;
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
      ].forEach(function (entry) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = entry[0];
        button.dataset.cartAction = entry[1];
        button.dataset.cartKey = key;
        button.setAttribute("aria-label", entry[2]);

        if (entry[1] === "quantity") button.disabled = true;
        controls.appendChild(button);
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

  function makeOrder(details, includeCustomer) {
    var ref = orderRef();

    var lines = [
      "*QR MENU ORDER*",
      restaurant.name || "Restaurant",
      "Order reference: " + ref,
      "Date/time: " + stamp(),
      ""
    ];

    if (includeCustomer) {
      lines.push(
        "Customer: " + details.name,
        "Mobile: " + details.phone
      );
    }

    lines.push("Table: " + (details.table || "Please tell the staff"));
    lines.push("", "*Items*");

    Object.keys(cart).forEach(function (key, index) {
      var item = cart[key];

      lines.push(
        (index + 1) + ". " + item.name +
        (item.variation ? " (" + item.variation + ")" : "") +
        " × " + item.qty + " — " +
        money(item.price * item.qty)
      );
    });

    lines.push("", "*Total: " + money(total()) + "*");

    if (details.notes) {
      lines.push("Instructions: " + details.notes);
    }

    return { ref: ref, lines: lines };
  }

  function showStaffOrder() {
    if (!totalQty()) {
      window.alert("Please add items to your cart first.");
      return;
    }

    var details = getStaffDetails();
    var order = makeOrder(details, false);
    var host = $("staff-order-content");

    if (!host) return;
    host.textContent = "";

    function addLine(text, tag) {
      var node = document.createElement(tag || "p");
      node.textContent = text;
      host.appendChild(node);
    }

    addLine(order.lines[2]);
    addLine(order.lines[3]);
    addLine("Table: " + (details.table || "Please tell the staff"));

    var list = document.createElement("ul");
    list.className = "staff-order-list";

    Object.keys(cart).forEach(function (key) {
      var item = cart[key];
      var li = document.createElement("li");

      li.textContent =
        item.name +
        (item.variation ? " (" + item.variation + ")" : "") +
        " × " + item.qty + " — " +
        money(item.price * item.qty);

      list.appendChild(li);
    });

    host.appendChild(list);

    var totalLine = document.createElement("h3");
    totalLine.textContent = "Total: " + money(total());
    host.appendChild(totalLine);

    if (details.notes) {
      addLine("Instructions: " + details.notes);
    }

    var orderDialog = $("order-dialog");
    var staffDialog = $("staff-dialog");

    if (orderDialog && orderDialog.open) orderDialog.close();
    if (staffDialog) staffDialog.showModal();
  }

  function sendWhatsApp() {
    if (!totalQty()) {
      window.alert("Please add items to your cart first.");
      return;
    }

    var details = getCustomerDetails();
    if (!details) return;

    var number = String(restaurant.whatsapp || "").replace(/\D/g, "");

    if (!number) {
      window.alert("Configure the restaurant WhatsApp number in data/restaurant.json.");
      return;
    }

    var order = makeOrder(details, true);
    var url = "https://wa.me/" + number +
      "?text=" + encodeURIComponent(order.lines.join("\n"));

    var waWindow = window.open(url, "_blank");

    if (waWindow) {
      waWindow.opener = null;
      clearCart();
    } else {
      window.alert("WhatsApp could not open. Allow pop-ups and try again.");
    }
  }

  function init() {
    // Keep the WhatsApp form hidden when the page first loads.
    var fields = $("whatsapp-fields");
    if (fields) fields.hidden = true;

    Promise.all([
      fetch("data/restaurant.json").then(function (response) {
        if (!response.ok) throw new Error("Restaurant data could not load.");
        return response.json();
      }),
      fetch("data/menu.json").then(function (response) {
        if (!response.ok) throw new Error("Menu data could not load.");
        return response.json();
      })
    ]).then(function (results) {
      restaurant = results[0] || {};
      currency = restaurant.currency || "₹";

      var data = results[1] || {};
      var categories = Array.isArray(data) ? data : data.categories || [];
      var items = {};

      categories.forEach(function (category) {
        (category.items || []).forEach(function (raw) {
          var item = Object.assign({
            price: null,
            offerPrice: null,
            variations: [],
            isAvailable: true
          }, raw);

          items[item.id] = item;

          var slug = String(item.id || item.name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

          items[slug] = item;
        });
      });

      window.QRMenuCartItems = items;
      render();
    }).catch(function (error) {
      console.error("Cart initialization failed:", error);
      window.alert("Menu or restaurant data could not load. Please refresh.");
    });

    var menuSections = $("menu-sections");

    if (menuSections) {
      menuSections.addEventListener("click", function (event) {
        var button = event.target.closest("[data-add-to-cart]");
        if (!button) return;

        event.preventDefault();
        event.stopPropagation();
        addItem(button.getAttribute("data-add-to-cart"));
      });
    }

    var openCart = $("open-cart");
    if (openCart) {
      openCart.addEventListener("click", function () {
        render();
        var dialog = $("order-dialog");
        if (dialog && !dialog.open) dialog.showModal();
      });
    }

    var orderClose = $("order-close");
    if (orderClose) {
      orderClose.addEventListener("click", function () {
        var dialog = $("order-dialog");
        if (dialog && dialog.open) dialog.close();
      });
    }

    var staffClose = $("staff-close");
    if (staffClose) {
      staffClose.addEventListener("click", function () {
        var dialog = $("staff-dialog");
        if (dialog && dialog.open) dialog.close();
      });
    }

    var staffDone = $("staff-done");
    if (staffDone) staffDone.addEventListener("click", clearCart);

    var staffButton = $("show-staff-order");
    if (staffButton) staffButton.addEventListener("click", showStaffOrder);

    // First button reveals the form; it does not open WhatsApp.
    var whatsappButton = $("send-whatsapp-order");
    if (whatsappButton) {
      whatsappButton.addEventListener("click", function () {
        var dialog = $("order-dialog");
        var fields = $("whatsapp-fields");

        if (!totalQty()) {
          window.alert("Please add items to your cart first.");
          return;
        }

        if (!fields) {
          window.alert("WhatsApp form is missing. Check index.html.");
          return;
        }

        fields.hidden = false;
        fields.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      });
    }

    // Second button validates the form and opens WhatsApp.
    var confirmButton = $("confirm-whatsapp-order");
    if (confirmButton) {
      confirmButton.addEventListener("click", sendWhatsApp);
    }

    var cartItems = $("cart-items");
    if (cartItems) {
      cartItems.addEventListener("click", function (event) {
        var button = event.target.closest("[data-cart-action]");
        if (!button) return;

        var key = button.dataset.cartKey;
        var action = button.dataset.cartAction;

        if (!cart[key]) return;

        if (action === "increase") cart[key].qty += 1;

        if (action === "decrease") {
          cart[key].qty -= 1;
          if (cart[key].qty <= 0) delete cart[key];
        }

        if (action === "remove") delete cart[key];

        render();
      });
    }

    ["order-dialog", "staff-dialog"].forEach(function (id) {
      var dialog = $(id);
      if (!dialog) return;

      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
