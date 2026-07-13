# Deploying Createosaur v3 (D-016 / D-018)

The site is a static export (`apps/web/out/`) served as plain files from
DreamHost shared hosting. Deploys are file copies; rollback is copying the
previous folder back. Two supported paths:

## Path A — GitHub Action (the normal way, works from a phone)

`.github/workflows/deploy.yml` builds on a GitHub runner and rsyncs the
export to DreamHost. Trigger: **GitHub → Actions → deploy → Run workflow →
pick `staging` or `production`**.

### One-time setup

1. **DreamHost deploy user** (panel → Manage Users → Add User): a dedicated
   SHELL user whose home contains only the site directories. Never reuse the
   panel login.
2. **SSH key**: generate anywhere (`ssh-keygen -t ed25519 -f dh_deploy`),
   add the public half to the deploy user's `~/.ssh/authorized_keys` on
   DreamHost (panel file manager works for this).
3. **known_hosts pin**: `ssh-keyscan <server>.dreamhost.com` and keep the
   output.
4. **Repo secrets** (GitHub → Settings → Secrets and variables → Actions):

   | Secret | Value |
   |---|---|
   | `DH_HOST` | the DreamHost server hostname, e.g. `iad1-shared-xxxx.dreamhost.com` |
   | `DH_USER` | the deploy user |
   | `DH_SSH_KEY` | the **private** key (whole file, including header/footer lines) |
   | `DH_KNOWN_HOSTS` | the `ssh-keyscan` output |
   | `DH_PATH_STAGING` | staging web dir, e.g. `~/createosaur.nk00.com` |
   | `DH_PATH_PRODUCTION` | production web dir, e.g. `~/createosaur.com` |

The rsync runs with `--delete`: each target directory must be dedicated to
this site (the deploy makes it an exact mirror of the export).

## Path B — manual upload (no tooling at all)

`npm ci && npm run build`, then copy the **contents** of `apps/web/out/`
into the site's web directory (DreamHost file manager or any SFTP client).

## Serving constraints (both paths)

- **Serve from a domain or subdomain root, never a subpath.** The export
  uses absolute asset paths (`/_next/...`); `nk00.com/somefolder/` will
  render unstyled. Use e.g. `createosaur.nk00.com` for staging.
- `apps/web/public/.htaccess` ships inside the export and handles the two
  Apache gaps vs. Vercel: extensionless routes (`/lab` → `lab.html`) and
  `ErrorDocument 404`. If `/lab` 404s on a fresh deploy, that file is
  missing from the web dir.
- HTTPS: enable the free Let's Encrypt cert in the DreamHost panel for the
  domain **before** pointing DNS at it.

## The D-018 cutover runbook (production, one time)

1. Deploy `production` (Path A) or upload manually to the
   `createosaur.com` web dir, with the domain fully hosted on DreamHost.
2. Enable Let's Encrypt for `createosaur.com` + `www`.
3. Verify on the DreamHost-side URL first: landing, `/lab` (morph, pin,
   undo), a busy creature, `/404`, mobile width.
4. Cut DNS: replace the Vercel records (`CNAME → cname.vercel-dns.com`)
   with DreamHost's (letting DreamHost host the zone is simplest).
5. buildasaur.us → 301 redirect to `https://createosaur.com` (D-013;
   DreamHost "Redirect" hosting type). Never mirrored.
6. Tear down the Vercel project (remove domains, then delete) — closes out
   the broken v2 deploy (D-018) for good.
