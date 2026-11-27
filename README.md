# Giftable 🎁

Family Christmas wish lists for Jack, Jillian, Lila and Etta.

- Each kid logs in with their name and a password to fill in their own list.
- Parents, grandparents and anyone else open the **family link**, pick a person,
  and tap **I'll get this** so nobody buys the same gift twice.
- The kid never sees what's been claimed on their own list.
- Works on any phone or computer, and can be added to the home screen like an app.

Categories: Beauty & body, Books, Games, Clothing, Shoes, Essentials (underwear,
socks, hats, gloves, winter coats), Favorite snacks, Favorite drinks, Home
appliances, Decorations, Charities. Each person also has favorite colors and sizes.
Every gift can have a link, price, priority, size and color (clothing, shoes and
essentials), and notes.

## How it's built

A plain website (no build step) hosted on GitHub Pages, with a free Supabase
database so everyone sees the same lists.

| File | What it is |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | The app |
| `config.js` | Where the Supabase URL and key go |
| `supabase/setup.sql` | Creates the database tables and the four kids |
| `manifest.webmanifest`, `sw.js`, `icons/` | Home-screen app support |

| `supabase/functions/giftable-preview/` | The link auto-fill helper (a Supabase Edge Function) |
| `.github/workflows/keep-awake.yml` | Visits the database weekly so the free plan doesn't pause it |

## Setup

### 1. Database (Supabase)

1. In your Supabase project, open **SQL Editor**, paste all of `supabase/setup.sql`, and run it.
2. Open **Project Settings → API** and copy the **Project URL** and the
   **publishable / anon key** into `config.js`.

### 2. Website (GitHub Pages)

1. Create a new repository on GitHub, for example `giftable`.
2. Upload every file in this folder (keep the `icons` and `supabase` folders).
3. In the repository, go to **Settings → Pages**, choose **Deploy from a branch**,
   pick `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://YOUR-USERNAME.github.io/giftable/`.

### 3. Passwords and sharing

Each kid logs in with their **name and password**. There are no private links.

- Send **everyone** the family link: `https://jack-norby.github.io/giftable/`
- Each kid taps **Log in to edit your list**, picks their name, and types their password.
- Capital letters don't matter. 5 wrong tries locks that name for 15 minutes.
- After logging in they can tap **Change password**, and **Log out** on a shared computer.

To reset a forgotten password, run this in the Supabase SQL Editor
(change the name and type the new password in lowercase):

```sql
update giftable_secrets
   set pin_hash = crypt('newpassword', gen_salt('bf')), failed_attempts = 0, locked_until = null
 where person_id = (select id from giftable_people where slug = 'jack');
```

### Add to home screen

- **iPhone:** open the link in Safari → Share → **Add to Home Screen**.
- **Android:** open the link in Chrome → ⋮ menu → **Add to Home screen**.

On iPhone the home-screen app keeps its own login, so kids log in once more
after adding it.

## Features

- **Shopper codes.** A shopper's first claim gives them a code like `SUE-7K4PX`.
  Entering it on **My shopping list** on another device brings their claims there.
- **My shopping list** with *Mark as bought* and a running total.
- **Protected claims.** If a kid deletes or edits a gift someone claimed, the
  claimer is warned instead of the gift silently vanishing.
- **✨ New badges** for gifts added or put on sale since your last visit.
- **⭐ Top picks.** Each person can star up to 3 gifts; they show first.
- **Photos and auto-fill.** Paste a store link and tap ✨ Fill in. Some stores
  (Amazon, for example) block this, so the details are typed in by hand.
- **Sale prices**, a **price filter**, and a **thank-you list** from Dec 25.
- **Parent dashboard** (link at the bottom of the family page): progress and
  spending per kid, who's shopping, reset passwords, add people, and a
  spreadsheet backup. The parent password is set in the SQL Editor (see
  `supabase/setup.sql`) and can be changed from the dashboard.

### Auto-fill helper

Deploy `supabase/functions/giftable-preview/index.ts` as an Edge Function named
`giftable-preview` with **Verify JWT turned off**.

## Good to know

- Claims are hidden from a kid on any device where they're logged in. If a kid
  browses the family link on a device where they're *not* logged in, they could
  see claims, so it's a surprise-keeper, not a vault.
- A giver can undo a claim from the same phone or browser they claimed it on.
- To add another person (a spouse, a new grandkid), run in the SQL Editor:

  ```sql
  insert into giftable_people (slug, name, sort) values ('sam', 'Sam', 5);
  insert into giftable_secrets (person_id, pin_hash)
  select id, crypt('sam', gen_salt('bf')) from giftable_people where slug = 'sam';
  ```
