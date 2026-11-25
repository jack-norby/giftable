# Giftable 🎁

Family Christmas wish lists for Jack, Jillian, Lila and Etta.

- Each kid fills in their own list from a **private edit link**.
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

If `config.js` is left empty the app runs in **demo mode**: everything works,
but lists are saved only in that one browser.

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

### 3. Send the links

Get each kid's private edit token by running this in the Supabase SQL Editor:

```sql
select p.name, s.edit_token
from giftable_people p join giftable_secrets s on s.person_id = p.id
order by p.sort;
```

Then send:

- **Each kid** their own edit link:
  `https://YOUR-USERNAME.github.io/giftable/#/jack/edit/THEIR-TOKEN`
  (use `jillian`, `lila`, `etta` for the others).
- **Everyone else** the family link: `https://YOUR-USERNAME.github.io/giftable/`

### Add to home screen

- **iPhone:** open the link in Safari → Share → **Add to Home Screen**.
- **Android:** open the link in Chrome → ⋮ menu → **Add to Home screen**.

Kids should do this from their edit link, so the icon opens straight to their list.

## Good to know

- Claims are hidden from a kid on any device where they've opened their edit link.
  If a kid opens the family link on a *different* device, they could see claims,
  so it's a surprise-keeper, not a vault.
- A giver can undo a claim from the same phone or browser they claimed it on.
- To add another person (a spouse, a new grandkid), run in the SQL Editor:

  ```sql
  insert into giftable_people (slug, name, sort) values ('sam', 'Sam', 5);
  insert into giftable_secrets (person_id) select id from giftable_people where slug = 'sam';
  ```
