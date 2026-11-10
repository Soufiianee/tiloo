# Deploy guide (beginner-friendly)

The site is a static website. Cloudflare Pages builds it from GitHub every time you push and hosts it for free. Allow about 30 minutes the first time.

## 1. Put the code on GitHub

1. Sign in at github.com and click **New repository**. Name it, for example `plugin-solar-tracker`. Choose Public or Private, and don't add a README.
2. If the project already lives in its own repository, skip to step 2.
3. Otherwise, on your computer, in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/plugin-solar-tracker.git
   git push -u origin main
   ```

## 2. Fill in the settings

Edit `config/site.json`:

| Setting | What to put |
|---|---|
| `SITE_NAME` | Your site's name. While it says `TBD`, the site shows "Plug-in Solar Tracker". |
| `BASE_URL` | Your final address, e.g. `https://example.org`. It is used for canonical links, the sitemap and social images. |
| `CONTACT_EMAIL` | Leave empty to hide the contact page and its footer link. Fill it in to publish it. |
| `CERT_WATCH_SIGNUP_EMBED_URL` | The embed URL of a hosted signup form (Buttondown, ConvertKit, MailerLite and similar). Empty means the form is hidden. |
| `EMAIL_SIGNUP_EMBED_URL` | Same, for a general newsletter (optional). |
| `ANALYTICS` | `{"provider": "plausible", "key": "your-domain.org"}` turns on Plausible. An empty key means no analytics. |

Affiliate links: in `config/affiliates.json`, a link becomes sponsored only when **both** `affiliate_id` and `link_template` are set. Example template: `{raw_url}?ref={id}`. Commit and push after editing.

## 3. Connect Cloudflare Pages

1. Create a free account at dash.cloudflare.com.
2. Go to **Workers & Pages → Create → Pages → Connect to Git**, authorise GitHub, and pick your repository.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build` (this validates the data first, and **the build fails if any data is invalid**, by design)
   - Build output directory: `dist`
   - Root directory: leave empty if the project is at the top of the repository. Set it to `plugin-solar` if it is still in that subfolder.
   - Environment variable: `NODE_VERSION` = `22`
4. Click **Save and Deploy**. After a minute or two you get a `*.pages.dev` address. Open it and check a few pages.

Netlify works the same way: build command `npm run build`, publish directory `dist`.

## 4. Add your own domain

1. In the Pages project, open **Custom domains → Set up a custom domain** and type your domain.
2. If the domain is already on Cloudflare, it adds the DNS record for you. Otherwise, add the CNAME record it shows at your domain registrar.
3. Wait until the status says **Active** (minutes to a few hours). HTTPS is automatic.
4. Make sure `BASE_URL` in `config/site.json` matches the domain exactly, then push again.

## 5. Tell search engines

**Google Search Console**
1. Go to search.google.com/search-console and add a **Domain** property for your domain.
2. Verify it with the TXT record Google gives you (add it in Cloudflare DNS).
3. Open **Sitemaps**, enter `sitemap.xml`, and submit.

**Bing Webmaster Tools**
1. Go to bing.com/webmasters and choose **Import from Google Search Console**, the quickest route. Or add the site by hand and verify it.
2. Submit `https://your-domain/sitemap.xml` under **Sitemaps**.

## 6. Keep it current

- Once a week, run the prompt in `MAINTENANCE_PROMPT.md` in Claude Code. It re-checks the sources, updates the data and pushes. Cloudflare redeploys automatically.
- `npm run staleness` shows what is due for a re-check.
- The page countdowns ("takes effect in N days") are computed in the browser. Dates printed on pages are fixed at build time, so redeploy at least weekly.
