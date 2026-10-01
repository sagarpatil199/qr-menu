# QR Menu

A premium, mobile-first **digital restaurant menu** that runs as a plain static website on **GitHub Pages**.
Customers scan a QR code on the table and see the full menu with photos, prices, veg/non-veg marks and
today's availability.

This repository is a **reusable master template**: every restaurant gets its own copy, and only the data,
images and colours change. No build step, no server, no database, no monthly hosting cost.

**Live demo data:** *Hotel Shivneri*, 8 categories, 56 dishes.

---

## Features

**For diners (mobile-first)**
- Branded header with logo, name, tagline and a live **Open now / Closed now** label
- One-tap **Call**, **WhatsApp** (with a pre-filled message) and **Location** buttons
- Sticky **search** across dish name, description and category, with a friendly empty state
- **Filters**: All · Veg · Non-Veg · Available · Bestsellers · New (combine with search)
- Horizontally scrolling **category tabs** with smooth scroll and automatic active highlighting
- Food cards with photo, veg/non-veg mark, Bestseller / New / Offer badges, spice level (🌶) and price
- **Offer prices** (new price with the old one crossed out) and **variations** (Half/Full, Small/Large)
- **Unavailable dishes stay listed**, greyed out and marked *Currently Unavailable*
- Dish **detail view** (bottom sheet on phones, dialog on desktop)
- Footer with address, phone, WhatsApp, maps, social links and an opening-hours table (today highlighted)

**For the restaurant / you**
- 100% data-driven: `data/restaurant.json` + `data/menu.json` + `assets/`
- Only two theme colours needed; all other shades and readable text colours are derived automatically
- Forgiving data model: optional fields have defaults; bad JSON shows a clear error naming the file
- Menu changes appear within minutes; the **QR code never changes**

**Quality**
- Plain HTML5, CSS3, vanilla JavaScript. No frameworks, no libraries, no external requests (system fonts,
  inline SVG icons)
- Lazy-loaded images with fixed dimensions (no layout jumps), broken images fall back to a placeholder
- Accessible: semantic landmarks and headings, skip link, keyboard navigation, visible focus, native
  `<dialog>` modal with focus handling, `aria-pressed` filters, live result count, reduced-motion support
- SEO: dynamic title/description, Open Graph tags, canonical URL, favicon, theme-color and
  **schema.org Restaurant + Menu JSON-LD** (with prices and availability)
- Works at any GitHub Pages address: all paths are relative; self-contained `404.html`

---

## Folder structure

```
qr-menu/
├── index.html              Page structure only. Same for every restaurant.
├── 404.html                Self-contained "page not found" page.
├── README.md               This file (for you, the template owner).
├── .nojekyll               Tells GitHub Pages to serve files as-is (faster deploys).
├── .gitignore
│
├── css/
│   └── style.css           All styling. Brand colours come from restaurant.json.
│
├── js/
│   ├── menu.js             Data layer: load JSON, apply defaults, sort, search & filter logic.
│   ├── ui.js               Rendering: header, cards, category tabs, modal, footer, hours.
│   └── app.js              Start-up: theme, SEO/JSON-LD, events, scroll spy.
│
├── data/
│   ├── restaurant.json     ← customer-specific: name, contact, hours, colours
│   └── menu.json           ← customer-specific: categories and dishes
│
├── assets/
│   ├── logo/               ← customer logo
│   ├── menu/               ← food photos (demo: illustrated SVG placeholders)
│   └── icons/              favicon fallback
│
└── docs/
    └── CUSTOMER_SETUP.md   Step-by-step guide for restaurant owners (non-programmers).
```

**Rule:** for a new restaurant, change only `data/`, `assets/logo/` and `assets/menu/`.
`index.html`, `css/` and `js/` stay identical across all customers, so improvements can be copied into
every customer repo without touching their data.

---

## Run it locally

Browsers block JavaScript from reading JSON files when you double-click `index.html` (a `file://` page).
The page detects this and shows instructions. Start any tiny static server in the project folder instead:

```bash
# Python (already installed on most computers)
python -m http.server 8000
# then open http://localhost:8000

# or Node.js
npx serve .
```

In VS Code, the *Live Server* extension also works.

---

## Customize the restaurant

Edit `data/restaurant.json`:

```json
{
  "name": "Hotel Shivneri",
  "tagline": "Authentic Taste Since 1995",
  "logo": "assets/logo/logo.svg",
  "phone": "+919876543210",
  "whatsapp": "+919876543210",
  "whatsappMessage": "Hello! I saw your menu and would like to know more.",
  "address": "Shivneri Complex, College Road, Belagavi, Karnataka 590001",
  "googleMapsUrl": "https://maps.google.com/?q=Belagavi+Karnataka",
  "instagram": "",
  "facebook": "",
  "website": "",
  "currency": "₹",
  "timezone": "Asia/Kolkata",
  "openingHours": [
    { "day": "Monday", "open": "07:00", "close": "22:30" }
  ],
  "siteUrl": "https://sagarpatil199.github.io/hotel-shivneri-menu/",
  "theme": { "primary": "#8B0000", "secondary": "#F5E6C8" }
}
```

Empty values (`""`) hide the matching button or line. The full field list, with examples for every
change a restaurant owner typically asks for, is in [`docs/CUSTOMER_SETUP.md`](docs/CUSTOMER_SETUP.md).

## Customize the menu

Edit `data/menu.json`. Each category has `items`; each item looks like:

```json
{
  "id": "chicken-biryani",
  "name": "Chicken Biryani",
  "description": "Special aromatic chicken biryani cooked on dum with saffron.",
  "price": 180,
  "image": "assets/menu/chicken-biryani.jpg",
  "isVeg": false,
  "isAvailable": true,
  "isBestseller": true,
  "isNew": false,
  "spiceLevel": 2,
  "displayOrder": 1
}
```

Optional extras: `"offerPrice": 160, "offerLabel": "Today's Special"`,
`"variations": [{ "name": "Half", "price": 120 }, { "name": "Full", "price": 180 }]`,
and `"isVisible": false` to hide an item or category without deleting it.

Set `"isAvailable": false` to show a dish as **Currently Unavailable** instead of removing it.

## Replace images

- Put photos in `assets/menu/` and reference them from `menu.json` (`"image": "assets/menu/name.jpg"`).
- Recommended: **4:3 landscape, ~800×600 px, JPG/WebP, under 150 KB** (compress with <https://squoosh.app>).
- Use lowercase file names with dashes; GitHub Pages is case-sensitive.
- `"image": ""` gives a clean text-only card (the demo *Beverages* category shows this).
- Replace the logo in `assets/logo/` and update `"logo"` in `restaurant.json` (square, ≥300 px).

The demo images are original illustrated SVG placeholders created for this template. They contain no
third-party or copyrighted photos. Replace them with each restaurant's own photos.

---

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. Open the repository → **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose branch **`main`** and
   folder **`/ (root)`**, then **Save**.
4. After 1–2 minutes the site is live at `https://USERNAME.github.io/REPOSITORY/`
   (the **Actions** tab shows progress).
5. Put that address into `"siteUrl"` in `data/restaurant.json` (used for the canonical link, link
   previews and Google).

Every later commit to `main` republishes the site automatically.

> Repositories must be **public** for GitHub Pages on a free GitHub account.

### Custom domain (optional)

To serve a menu at e.g. `menu.hotelshivneri.com`: Settings → Pages → *Custom domain*, then add the DNS
record GitHub shows. Everything keeps working because all paths are relative.

---

## Create the QR code

The website does **not** generate QR codes. Create one separately for the restaurant's GitHub Pages URL:

```
https://sagarpatil199.github.io/hotel-shivneri-menu/
```

1. Open the site on your phone first and confirm it works.
2. Generate a QR code for that exact URL with any free generator, for example:
   - Google Chrome: open the site → **Share** → **QR code** → *Download*
   - <https://www.qrcode-monkey.com> or <https://goqr.me> (download **SVG** or high-resolution PNG)
3. Use a **static** QR code (the URL is encoded directly). Avoid "dynamic QR" services: they redirect
   through someone else's server and can stop working if a subscription ends.
4. Test-scan the printed QR with both an Android phone and an iPhone before printing in bulk.
5. Print tips: at least **3 × 3 cm** on table tents (bigger for wall posters), dark code on a light
   background, keep the quiet margin around it, and add a short line like *"Scan for menu"*.

Because the URL never changes, **the QR code never needs to be reprinted**, even when prices, dishes or
availability change.

---

## Create a new restaurant from this template

### Option A: GitHub template (recommended)

1. One time: in this repository open **Settings** → tick **Template repository**.
2. Click **Use this template** → **Create a new repository**.
3. Name it after the customer, e.g. `cafe-sunrise-menu`, make it **Public**, create it.
4. In the new repository edit:
   - `data/restaurant.json`: name, tagline, phone, WhatsApp, address, maps link, hours, `siteUrl`, colours
   - `data/menu.json`: their categories and dishes
   - `assets/logo/`: their logo
   - `assets/menu/`: their food photos (delete the demo SVGs you no longer use)
5. Enable GitHub Pages (see above) → open `https://USERNAME.github.io/cafe-sunrise-menu/`.
6. Generate and print the QR code for that URL.
7. Optional: give the owner write access (Settings → Collaborators) and send them
   [`docs/CUSTOMER_SETUP.md`](docs/CUSTOMER_SETUP.md).

### Option B: command line

```bash
git clone https://github.com/sagarpatil199/qr-menu.git cafe-sunrise-menu
cd cafe-sunrise-menu
rm -rf .git && git init -b main
# edit data/ and assets/, then:
git add . && git commit -m "Cafe Sunrise menu"
git remote add origin https://github.com/sagarpatil199/cafe-sunrise-menu.git
git push -u origin main
```

### New-customer checklist

- [ ] `restaurant.json`: name, tagline, description, phone, WhatsApp + message, address, Google Maps link
- [ ] Opening hours, timezone, social links, `siteUrl`
- [ ] Theme colours (check the header and buttons look good)
- [ ] Logo uploaded, path correct
- [ ] Menu categories and dishes entered, prices checked with the owner
- [ ] Photos compressed (< 150 KB each) and paths correct (no letter placeholders showing)
- [ ] Site tested on a phone: Call, WhatsApp, Location buttons, search, filters, a dish detail
- [ ] QR code generated, test-scanned on Android + iPhone, then printed

### Updating the template code for existing customers

Because customer data is isolated, a design or bug-fix improvement only touches `index.html`, `css/`,
`js/` and `404.html`. Copy those into each customer repository; their `data/` and `assets/` stay as they are.

---

## Technical notes

- **Cache behaviour:** JSON is fetched with `cache: "no-cache"`, so diners always get the latest prices and
  availability once GitHub Pages has published them (usually 1–2 minutes).
- **No service worker / offline mode** on purpose: an offline cache could show yesterday's availability or
  prices, which is worse than no menu for a restaurant. It can be added in a later phase if needed.
- **Link previews:** WhatsApp/Facebook previews read the HTML before JavaScript runs, so they show the
  generic title in `index.html` ("Digital Menu"). Google runs JavaScript and indexes the real restaurant
  name, menu and JSON-LD. If a customer wants a branded WhatsApp preview, edit the `<title>` and `og:` tags
  in their copy of `index.html` (the only optional HTML edit).
- **Security:** all JSON text is inserted with `textContent`, never `innerHTML`, so a typo or symbol in
  the menu can never break or inject into the page.
- **Browser support:** current Chrome, Safari (iOS 15.4+), Firefox, Samsung Internet and Edge.

## Phase 1 scope

Included: the static digital menu described above.

Not included (possible later phases): ordering, payments, table ordering, admin dashboard, logins,
database/backend, inventory, WhatsApp API, SaaS billing.

## License

All rights reserved by the repository owner. Add a `LICENSE` file if you want to set specific terms for customers.
