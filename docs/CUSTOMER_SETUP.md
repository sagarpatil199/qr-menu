# Customer Setup Guide

This guide explains how to update your digital menu. **You do not need to know programming.**
You will only ever edit two text files and one folder of photos:

| What you want to change | Where |
| --- | --- |
| Restaurant name, phone, WhatsApp, address, map, social links, hours, colours | `data/restaurant.json` |
| Categories, dishes, prices, availability, badges | `data/menu.json` |
| Food photos | `assets/menu/` folder |
| Logo | `assets/logo/` folder |

Never edit `index.html`, the `css/` folder or the `js/` folder. They are the same for every restaurant.

Your QR code **never changes**. Whatever you save here appears at the same web address,
usually within 1–2 minutes.

---

## Contents

- [The 4-step routine](#the-4-step-routine)
- [How to edit a file on GitHub](#how-to-edit-a-file-on-github)
- [JSON rules (read this once)](#json-rules-read-this-once)
- **Menu changes** (`data/menu.json`)
  1. [Add a new category](#1-add-a-new-category)
  2. [Add a new food item](#2-add-a-new-food-item)
  3. [Change a price](#3-change-a-price)
  4. [Mark food unavailable](#4-mark-food-unavailable)
  5. [Make food available again](#5-make-food-available-again)
  6. [Delete an item](#6-delete-an-item)
- **Restaurant changes** (`data/restaurant.json`)
  7. [Change restaurant name](#7-change-restaurant-name)
  8. [Change logo](#8-change-logo)
  9. [Change phone](#9-change-phone)
  10. [Change WhatsApp](#10-change-whatsapp)
  11. [Change address](#11-change-address)
  12. [Change Google Maps link](#12-change-google-maps-link)
  13. [Change colours](#13-change-colours)
  14. [Replace food images](#14-replace-food-images)
- [Extra options](#extra-options) (offers, Half/Full prices, spice level, opening hours, hiding things)
- [Every field explained](#every-field-explained)
- [Something went wrong?](#something-went-wrong)

---

## The 4-step routine

1. **CUSTOMIZE RESTAURANT** → edit `data/restaurant.json`
2. **CUSTOMIZE MENU** → edit `data/menu.json`
3. **CHANGE PHOTOS** → put your photos in `assets/menu/`
4. **PUBLISH** → click **Commit changes** on GitHub. GitHub Pages updates the website automatically.

Then open your menu link (or scan the QR code) and check the change. If you don't see it, wait a minute
and refresh the page.

---

## How to edit a file on GitHub

You can do everything from a web browser, even on a phone.

1. Open your repository on github.com (for example `github.com/sagarpatil199/hotel-shivneri-menu`).
2. Click the `data` folder, then click `menu.json` (or `restaurant.json`).
3. Click the **pencil icon ✏️** (Edit this file) at the top right of the file.
4. Make your change.
5. Click the green **Commit changes…** button, write a short note such as
   `Mark biryani unavailable`, and click **Commit changes** again.
6. Wait 1–2 minutes, then refresh your menu page.

**To upload a photo:** open the `assets/menu` folder → **Add file** → **Upload files** → drag your photo in →
**Commit changes**.

---

## JSON rules (read this once)

The menu files use a format called JSON. It is strict about punctuation, so follow these rules:

- Text goes inside **straight double quotes**: `"Masala Dosa"`. Not single quotes, not curly “smart” quotes.
- Numbers have **no quotes and no ₹ sign**: `"price": 180`, not `"price": "₹180"`.
- `true` and `false` are written in lowercase **without quotes**.
- Every line inside `{ }` ends with a **comma**, **except the last one** before the `}`.
- Every item `{ ... }` in a list is separated by a comma, **except the last one** before the `]`.

```json
{
  "name": "Masala Dosa",
  "price": 80,
  "isVeg": true
}
```

The commas are after `"Masala Dosa"` and `80`; there is **no comma** after `true`, because it is the last line.

> **Tip:** Before committing a big change, paste the whole file into a free JSON checker such as
> <https://jsonlint.com> and click *Validate*. It points to the exact line with a missing comma or quote.
> If you make a mistake anyway, the menu page shows a message naming the file with the problem, and your
> previous version is always available in GitHub's **History**.

---

## Menu changes

`data/menu.json` looks like this: a list of **categories**, each with a list of **items**.

```json
{
  "categories": [
    {
      "id": "breakfast",
      "name": "Breakfast",
      "description": "Fresh South Indian breakfast",
      "displayOrder": 1,
      "items": [
        { ...item... },
        { ...item... }
      ]
    },
    { ...next category... }
  ]
}
```

### 1. Add a new category

Find the `]` near the very end of the file that closes the list of categories. Put a comma after the `}`
of the last category, then paste the new category before that `]`:

```json
    {
      "id": "thali",
      "name": "Thali",
      "description": "Complete meals, served 12 PM to 3:30 PM",
      "displayOrder": 9,
      "items": [
        {
          "id": "veg-thali",
          "name": "Veg Thali",
          "description": "2 sabzi, dal, rice, 3 chapati, salad, papad and sweet.",
          "price": 150,
          "image": "assets/menu/veg-thali.jpg",
          "isVeg": true,
          "isAvailable": true,
          "isBestseller": false,
          "isNew": true,
          "spiceLevel": 1,
          "displayOrder": 1
        }
      ]
    }
```

- `id` must be unique, lowercase, with dashes instead of spaces (`main-course`, `south-indian`).
- `displayOrder` decides the order of categories (1 shows first). The category tabs on the menu are created
  automatically.
- A category with no items is not shown.

### 2. Add a new food item

Example: **Chicken Biryani, ₹180, Non-veg, Available, with a photo and description.**

Open `data/menu.json`, find the category (for example `"name": "Biryani"`), and find its `"items": [`.
Paste the new item after the `[`, and make sure there is a comma after its closing `}`:

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
        },
```

Then upload the photo `chicken-biryani.jpg` into `assets/menu/` (see [step 14](#14-replace-food-images)).

What each part means:

| Field | Write | Meaning |
| --- | --- | --- |
| `id` | `"chicken-biryani"` | Unique short name, lowercase-with-dashes. Never reuse one. |
| `name` | `"Chicken Biryani"` | Shown on the menu. |
| `description` | `"..."` | One or two short sentences. Use `""` for none. |
| `price` | `180` | Number only, no ₹. |
| `image` | `"assets/menu/chicken-biryani.jpg"` | Photo path. Use `""` for no photo; the card then shows text only. |
| `isVeg` | `true` / `false` | `true` = green veg mark, `false` = red non-veg mark. |
| `isAvailable` | `true` / `false` | `false` = shown as **Currently Unavailable**. |
| `isBestseller` | `true` / `false` | Shows the ★ Bestseller badge. |
| `isNew` | `true` / `false` | Shows the New badge. |
| `spiceLevel` | `0` to `3` | Number of chillies shown. `0` = none. |
| `displayOrder` | `1`, `2`, `3`… | Order inside the category (1 shows first). |

**Only `name` is truly required.** If you leave out a field, a sensible default is used
(available = yes, bestseller/new = no, spice = 0).

### 3. Change a price

Find the dish and change only the number:

```json
"price": 180,
```
becomes
```json
"price": 200,
```

### 4. Mark food unavailable

Sold out today? Find the dish and change `true` to `false`:

```json
"isAvailable": false,
```

The dish **stays on the menu** but is greyed out with **CURRENTLY UNAVAILABLE**, so customers know you
normally serve it. No new QR code is needed.

### 5. Make food available again

Change it back:

```json
"isAvailable": true,
```

### 6. Delete an item

Select the item from its opening `{` to its closing `},` and delete it.

```json
        {
          "id": "egg-biryani",
          "name": "Egg Biryani",
          ...
          "displayOrder": 3
        },          <-- delete everything from { to here, including the comma
```

**Careful with commas:** if you delete the *last* item in a category, also remove the comma after the
item that is now last.

> If the dish might come back later, mark it unavailable (step 4) or hide it with `"isVisible": false`
> instead of deleting it.

---

## Restaurant changes

All of these are in `data/restaurant.json`.

### 7. Change restaurant name

```json
"name": "Hotel Shivneri",
"tagline": "Authentic Taste Since 1995",
```

The name updates the header, the browser tab title, the footer and Google search information automatically.

### 8. Change logo

1. Upload your logo into `assets/logo/` (for example `logo.png`). A **square** image, at least 300×300
   pixels, works best. PNG with a transparent background, SVG or JPG are all fine.
2. Update the path:

```json
"logo": "assets/logo/logo.png",
```

The logo is also used as the browser tab icon. To hide the logo, use `"logo": ""`.

### 9. Change phone

Write the number with the country code, no spaces:

```json
"phone": "+919876543210",
```

This powers the **Call** button. Use `""` to hide it.

### 10. Change WhatsApp

```json
"whatsapp": "+919876543210",
"whatsappMessage": "Hello! I saw your menu and would like to know more.",
```

The **WhatsApp** button opens a chat with this number and pre-fills the message. Use `""` for the number to
hide the button, or `""` for the message to open an empty chat.

### 11. Change address

```json
"address": "Shivneri Complex, College Road, Belagavi, Karnataka 590001",
```

### 12. Change Google Maps link

1. Open Google Maps and search for your restaurant.
2. Tap **Share** → **Copy link**.
3. Paste it:

```json
"googleMapsUrl": "https://maps.app.goo.gl/AbCdEf123",
```

This powers the **Location** button. If you leave it as `""`, the button searches Google Maps for your
address instead.

### 13. Change colours

```json
"theme": {
  "primary": "#8B0000",
  "secondary": "#F5E6C8"
}
```

- `primary`: your brand colour, used for the header, buttons and highlights. Darker colours look best.
- `secondary`: a **light** colour used as the soft background tint.

Colours are written as hex codes. Search "color picker" on Google to find the code for any colour.
Some combinations that work well:

| Style | primary | secondary |
| --- | --- | --- |
| Royal maroon (default) | `#8B0000` | `#F5E6C8` |
| Forest green | `#1F5132` | `#EAF2E3` |
| Midnight blue | `#1B2A49` | `#E8ECF5` |
| Spice orange | `#B4410E` | `#FBEBDD` |
| Coffee | `#4B2E2B` | `#F3E9DF` |
| Charcoal + gold | `#2B2B2B` | `#F4ECD8` |

The website automatically picks readable text colours for whatever you choose.
Optional: add `"headingFont": "sans"` inside `theme` for a modern look instead of the classic serif headings.

### 14. Replace food images

1. Take or choose a photo. **Landscape (4:3), around 800×600 pixels, JPG, under 150 KB** is ideal.
   Large phone photos (3–5 MB) make the menu slow, so shrink them first with a free tool such as
   <https://squoosh.app> (choose *MozJPEG*, quality 70–75, width 800).
2. Name it in lowercase with dashes, e.g. `paneer-tikka.jpg`. No spaces.
3. Upload it to `assets/menu/` (**Add file → Upload files**).
4. In `data/menu.json`, point the dish to it:

```json
"image": "assets/menu/paneer-tikka.jpg",
```

**To replace a photo without editing JSON:** upload the new photo with **exactly the same file name**
as the old one. GitHub replaces it.

> The demo menu uses illustrated placeholder images (`.svg` files). Replace them with real photos of your
> own food. Only use photos you own or have permission to use.
> File names are case-sensitive online: `Paneer.JPG` and `paneer.jpg` are different files.

---

## Extra options

### Special offer price

```json
"price": 260,
"offerPrice": 230,
"offerLabel": "Weekend Offer",
```

Shows ₹230 with ~~₹260~~ crossed out and an offer badge. Remove both lines to end the offer.

### Half / Full (or Small / Large) prices

```json
"price": 180,
"variations": [
  { "name": "Half", "price": 120 },
  { "name": "Full", "price": 180 }
],
```

When `variations` is present, the menu shows each option and its price instead of the single price.

### Hide a dish or category without deleting it

Add `"isVisible": false` to the item or category. Change to `true` (or remove the line) to show it again.

### Opening hours

```json
"timezone": "Asia/Kolkata",
"openingHours": [
  { "day": "Monday", "open": "07:00", "close": "22:30" },
  { "day": "Tuesday", "closed": true },
  { "day": "Sunday", "open": "12:00", "close": "15:30" },
  { "day": "Sunday", "open": "19:00", "close": "23:30" }
]
```

- Times use the 24-hour clock: `07:00` = 7 AM, `22:30` = 10:30 PM.
- `"closed": true` marks a weekly holiday.
- Repeat a day for split timings (lunch and dinner).
- A closing time after midnight is fine, e.g. `"open": "18:00", "close": "01:00"`.
- The header shows **Open now** or **Closed now** automatically, using the `timezone`.

### Notice line and footer note

```json
"notice": "Prices are inclusive of all taxes.",
"footerNote": "Menu prices and availability may change without notice.",
```

Use `""` to hide either one.

### Social links

```json
"instagram": "https://instagram.com/yourpage",
"facebook": "https://facebook.com/yourpage",
"website": "https://yourwebsite.com",
"email": "hello@yourrestaurant.com",
```

Any link left as `""` is hidden.

---

## Every field explained

### `data/restaurant.json`

| Field | Example | Notes |
| --- | --- | --- |
| `name` | `"Hotel Shivneri"` | Required. |
| `tagline` | `"Authentic Taste Since 1995"` | Short line under the name. |
| `description` | `"Family restaurant in Belagavi…"` | Used by Google and link previews. |
| `logo` | `"assets/logo/logo.svg"` | Square image. |
| `coverImage` | `""` | Optional image used for WhatsApp/Facebook link previews. Falls back to the logo. |
| `phone` | `"+919876543210"` | Call button + footer. |
| `whatsapp` | `"+919876543210"` | WhatsApp button + footer. |
| `whatsappMessage` | `"Hello! …"` | Pre-filled WhatsApp message. |
| `email` | `""` | Footer. |
| `address` | `"…"` | Footer. |
| `googleMapsUrl` | `"https://maps.app.goo.gl/…"` | Location button. |
| `instagram`, `facebook`, `website` | `"https://…"` | Footer buttons. |
| `currency` | `"₹"` | Shown before every price. |
| `cuisine` | `["South Indian", "Chinese"]` | For Google. |
| `priceRange` | `"₹₹"` | For Google. |
| `notice` | `"…"` | Line under the header. |
| `footerNote` | `"…"` | Small print at the bottom. |
| `timezone` | `"Asia/Kolkata"` | For the Open now / Closed now label. |
| `openingHours` | see above | Hours table + open status. |
| `siteUrl` | `"https://username.github.io/repo/"` | Your menu's address, for Google and link previews. |
| `theme.primary`, `theme.secondary` | `"#8B0000"` | Brand colours. |
| `theme.accent` | `"#C8932D"` | Optional focus-ring colour. |
| `theme.headingFont` | `"sans"` | Optional modern headings. |

### `data/menu.json`: category

| Field | Required | Notes |
| --- | --- | --- |
| `id` | recommended | Unique, lowercase-with-dashes. |
| `name` | yes | Tab and heading text. |
| `description` | no | Line under the heading. |
| `displayOrder` | no | 1 = first. Without it, file order is used. |
| `isVisible` | no | `false` hides the whole category. |
| `items` | yes | List of dishes. |

### `data/menu.json`: item

| Field | Required | Default |
| --- | --- | --- |
| `id` | recommended | made from the name |
| `name` | yes | |
| `description` | no | none |
| `price` | yes (unless `variations`) | |
| `image` | no | text-only card |
| `isVeg` | recommended | no veg/non-veg mark |
| `isAvailable` | no | `true` |
| `isBestseller` | no | `false` |
| `isNew` | no | `false` |
| `spiceLevel` | no | `0` |
| `displayOrder` | no | file order |
| `offerPrice`, `offerLabel` | no | no offer |
| `variations` | no | single price |
| `isVisible` | no | `true` |

---

## Something went wrong?

| Problem | Fix |
| --- | --- |
| Page says **"There is a mistake in data/menu.json"** | A comma, quote or bracket is missing or extra. The message gives the position. Paste the file into <https://jsonlint.com> to find it, or restore the previous version from **History**. |
| My change doesn't show | Wait 2 minutes and refresh. On a phone, pull down to refresh. Check the **Actions** tab on GitHub: a green tick means it is published. |
| A photo shows a letter instead of the picture | The `image` path doesn't match the file name exactly (check spelling, capital letters and `.jpg` vs `.jpeg`). |
| The menu is slow | Photos are too big. Shrink them to about 800 px wide and under 150 KB. |
| I broke something and want to undo | On GitHub open the file → **History** → pick the last good version → copy its content back, or ask your menu provider. |

**How to restore an old version:** open the file on GitHub → click **History** → click the version from
before the mistake → click the **⋯** menu → **View file** → copy everything → edit the current file,
paste it, and commit.
