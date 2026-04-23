# DEPLOYMENT.md — School Wave Studios on the family VPS

> **Audience:** A Claude Code instance running on the Ubuntu VPS that will deploy or
> redeploy this app. Read every step before executing the first command. Stop at every
> checkpoint marked **HUMAN INPUT NEEDED** and wait for the operator (the dad).
>
> **Goal:** Get `school-wave-studios` running in a Docker container behind nginx with
> HTTPS, on an unlisted subdomain, with a persistent SQLite volume that survives
> container restarts.

---

## 0 · Inputs you must collect from the operator before starting

Ask the operator for these once at the start. Do not guess them, and do not proceed
until they are written down somewhere you can re-read:

1. **Subdomain** — e.g. `schoolwave.example.com`. Must already have a DNS A record
   pointing at this VPS's public IP. (Verify with `dig +short <subdomain>` — the
   output should be the VPS IP and nothing else.)
2. **Operator's email** — required by Let's Encrypt for cert-expiry warnings.
3. **Source location** — either:
   - a Git URL the VPS can clone, **or**
   - the operator will `scp` the project tarball to the VPS and tell you the path.
4. **Install root** — where on the VPS the project should live. Default: `/opt/school-wave-studios`.

If any of the four is missing, stop and ask. Do **not** invent a value.

---

## 1 · Verify VPS prerequisites

Run each command and confirm the listed expected output before continuing. If a check
fails, stop and report which one — do not try to install missing pieces yourself
without the operator's approval (these are root-level changes on a shared machine).

| Check | Command | Expected |
|---|---|---|
| Docker installed | `docker --version` | `Docker version 24.x` or newer |
| Compose plugin | `docker compose version` | `Docker Compose version v2.x` |
| Nginx installed | `nginx -v` | `nginx version: nginx/1.18+` |
| Certbot installed | `certbot --version` | `certbot 1.x` or newer |
| Nginx site dirs exist | `ls /etc/nginx/sites-available /etc/nginx/sites-enabled` | both list at least the `default` symlink |
| User can run docker | `docker ps` | table prints (no `permission denied`) |
| Subdomain resolves | `dig +short <subdomain>` | exactly the VPS public IP |
| Public IP reachable on 80/443 | `ss -tlnp \| grep -E ':80|:443'` | nginx listening on both |

---

## 2 · Get the source onto the VPS

### 2a · If using Git

```bash
sudo mkdir -p /opt
sudo chown $USER:$USER /opt
git clone <repo-url> /opt/school-wave-studios
cd /opt/school-wave-studios/school-wave-studios
```

> The repo nests the Next.js app one level deep (`SchoolOrganiser/school-wave-studios/`).
> All subsequent commands assume your CWD is the inner `school-wave-studios` folder
> (the one containing `package.json` and `deploy/`).

### 2b · If using a tarball

```bash
sudo mkdir -p /opt && sudo chown $USER:$USER /opt
tar -xzf <path-to-tarball> -C /opt/
cd /opt/school-wave-studios/school-wave-studios   # adjust if tarball flattens it
```

### Verify the layout

```bash
ls deploy/                  # should show: Dockerfile  docker-compose.yml  nginx.conf.example
ls drizzle/ | head          # should show 0000_late_pyro.sql, 0001_goofy_korath.sql, meta/
test -f package.json && echo OK
```

---

## 3 · Build and start the container

```bash
cd /opt/school-wave-studios/school-wave-studios/deploy
docker compose up -d --build
```

This will take ~3–8 minutes the first time because it has to:

1. Pull `node:24-slim`.
2. `pnpm install` all dependencies (better-sqlite3 may compile from source if no
   prebuild matches the VPS architecture — that's why we install `python3` and
   `build-essential` in the Dockerfile).
3. `pnpm build` — Next.js standalone build.
4. Copy `.next/standalone`, `.next/static`, `public/`, and `drizzle/` into the runner image.

When it returns, verify:

```bash
docker compose ps                                  # status: Up (healthy after ~30s)
docker compose logs --tail=50 app                  # look for migration log + Next.js "Ready in"
docker exec school-wave-studios ls /data           # should show sws.db and a -wal/-shm pair
```

The two SQLite migration files (`0000_…sql`, `0001_…sql`) auto-apply on first boot
via `src/instrumentation.ts` → `runMigrations()`. Both should be recorded in the
internal `__drizzle_migrations` table; you can confirm with:

```bash
docker exec school-wave-studios \
  node -e "const d=require('better-sqlite3')('/data/sws.db'); console.log(d.prepare('SELECT * FROM __drizzle_migrations').all())"
```

Expected: two rows, one per migration.

---

## 4 · Smoke-test the container directly

Before touching nginx, prove the container is healthy on the loopback interface:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/   # expect 200
curl -fsS http://127.0.0.1:3000/api/me                              # expect {"user":null} with HTTP 401
```

If either fails, do not proceed. Read `docker compose logs app` and report the error
to the operator.

---

## 5 · Configure nginx as a reverse proxy

### 5a · Generate the site config from the template

```bash
sudo cp /opt/school-wave-studios/school-wave-studios/deploy/nginx.conf.example \
        /etc/nginx/sites-available/schoolwave
sudo sed -i "s/schoolwave\.example\.com/<subdomain>/g" /etc/nginx/sites-available/schoolwave
```

Replace `<subdomain>` with the real value the operator gave you in Step 0.

### 5b · Activate it

```bash
sudo ln -sf /etc/nginx/sites-available/schoolwave /etc/nginx/sites-enabled/schoolwave
sudo nginx -t                                    # MUST print "syntax is ok" + "test is successful"
sudo systemctl reload nginx
```

If `nginx -t` fails, fix the config — do not reload a broken nginx, you'll knock
every other site on this VPS offline.

### 5c · Verify HTTP redirects (HTTPS not enabled yet)

```bash
curl -I http://<subdomain>/                      # expect 301 -> https://<subdomain>/
```

---

## 6 · Enable HTTPS with Let's Encrypt

### HUMAN INPUT NEEDED

`certbot --nginx` is interactive. Tell the operator to run this themselves and watch
the prompts (it asks about HSTS / redirect preferences):

```bash
sudo certbot --nginx -d <subdomain> -m <operator-email> --agree-tos
```

When they accept the defaults, certbot will rewrite `/etc/nginx/sites-available/schoolwave`
to listen on 443 with the issued certificate. The renewal cron is installed automatically.

### Verify

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://<subdomain>/    # expect 200
curl -fsS https://<subdomain>/robots.txt | head                    # must contain "Disallow: /"
curl -sI https://<subdomain>/ | grep -i x-robots-tag               # must contain "noindex"
```

All three must pass. If any fails, read `/var/log/nginx/error.log` and report.

---

## 7 · End-to-end verification (do this from a phone, not the VPS)

Send the operator this checklist; they should verify on the daughter's phone:

- [ ] `https://<subdomain>/` loads with a green padlock.
- [ ] No browser console errors (view-source or remote inspect).
- [ ] Sign-up flow: pick a username, set a 4-digit PIN, land on Today.
- [ ] Add a lesson → it persists across page refresh.
- [ ] Sign out, sign back in with the same username + PIN.
- [ ] Settings → Theme → switch palettes; reload; theme survives.
- [ ] DevTools → Application → Cookies: `sws_session` is `HttpOnly`, `Secure`, `SameSite=Lax`.

Once those all pass, the deploy is done. Tell the operator the URL is ready to share
with the daughter's class only — no Google indexing, no public listing.

---

## 8 · Operations

### Live logs

```bash
docker compose -f /opt/school-wave-studios/school-wave-studios/deploy/docker-compose.yml \
  logs -f app
```

### Backup the SQLite volume

The whole DB is a single file inside the `sws-data` named volume. Take a snapshot:

```bash
mkdir -p /var/backups/schoolwave
docker run --rm \
  -v sws-data:/data \
  -v /var/backups/schoolwave:/backup \
  alpine tar czf /backup/sws-backup-$(date +%Y%m%d-%H%M).tgz -C /data .
```

Schedule it via cron if the operator wants daily backups:

```cron
15 3 * * *  docker run --rm -v sws-data:/data -v /var/backups/schoolwave:/backup alpine tar czf /backup/sws-backup-$(date +\%Y\%m\%d).tgz -C /data .
```

### Restore from a backup

```bash
docker compose -f .../deploy/docker-compose.yml down
docker run --rm -v sws-data:/data -v /var/backups/schoolwave:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/<file>.tgz -C /data"
docker compose -f .../deploy/docker-compose.yml up -d
```

### Update to a newer version

```bash
cd /opt/school-wave-studios
git fetch && git pull --ff-only
cd school-wave-studios/deploy
docker compose up -d --build               # rebuilds image, restarts container
```

The container restart re-runs `instrumentation.ts`, which applies any new migration
files automatically. The volume (and therefore the database) is untouched.

### Rollback to the previous version

```bash
cd /opt/school-wave-studios
git log --oneline -5                       # find the previous commit SHA
git checkout <sha>
cd school-wave-studios/deploy
docker compose up -d --build
```

> **Caveat on rollback:** if the version you're rolling back to has *fewer* migrations
> than the live DB, the schema will be ahead of the code. Drizzle won't try to undo
> the migration, but the older code may break if it relies on a column that no longer
> exists in its schema. For non-trivial rollbacks, restore a backup taken from before
> the bad upgrade as well.

### Stop / start without rebuilding

```bash
docker compose stop          # graceful stop, keeps the container
docker compose start         # bring it back up
docker compose down          # remove container (volume survives)
docker compose down -v       # ⚠ ALSO removes the sws-data volume = WIPES THE DATABASE
```

Never run `down -v` without a fresh backup and explicit operator approval.

---

## 9 · Troubleshooting

| Symptom | Likely cause | First thing to check |
|---|---|---|
| `502 Bad Gateway` from nginx | Container not listening on 3000 | `docker compose ps` + `curl 127.0.0.1:3000` |
| Container restart-loops | Migration error or DB corruption | `docker compose logs --tail=200 app` |
| `better-sqlite3` build fails during `docker compose up --build` | No matching prebuild for VPS arch (e.g. ARM64) | Build tools are already in `deps` stage; if it still fails, paste error to operator |
| HTTPS shows expired cert | Certbot renewal hook missing | `sudo certbot renew --dry-run` |
| Site indexed by Google despite `noindex` | nginx `X-Robots-Tag` header missing | `curl -sI https://<subdomain>/ \| grep -i x-robots` |
| Login works but session lost on refresh | Cookie not `Secure` because served over HTTP somewhere | confirm nginx forces HTTPS, no mixed-origin redirects |
| `relation does not exist` style errors | Migration didn't run | check `__drizzle_migrations` table (Step 3) |

---

## 10 · Reference

| Thing | Value |
|---|---|
| Container name | `school-wave-studios` |
| Container port | 3000 (bound to `127.0.0.1` only — never exposed publicly) |
| Image tag | `school-wave-studios:latest` |
| Named volume | `sws-data` (mounted at `/data` inside container) |
| DB file inside container | `/data/sws.db` (+ `.wal`, `.shm` from WAL mode) |
| Migration files | `drizzle/0000_late_pyro.sql`, `drizzle/0001_goofy_korath.sql` |
| Migration runner | [src/instrumentation.ts](src/instrumentation.ts) → [src/lib/migrate.ts](src/lib/migrate.ts) |
| Nginx site file | `/etc/nginx/sites-available/schoolwave` |
| Cert location | `/etc/letsencrypt/live/<subdomain>/` (managed by certbot) |
| Env vars set in compose | `NODE_ENV=production`, `DB_PATH=/data/sws.db` |
| Privacy posture | `robots.txt: Disallow: /`, `<meta name="robots" content="noindex">`, nginx adds `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` |

---

## 11 · What this runbook does NOT cover

- Multi-VPS / clustering — single-instance only. SQLite + a named volume is the
  whole story.
- Off-site backups — the `tar` snapshot above lands on the same VPS. If that disk
  dies, so does the backup. The operator should `rsync` `/var/backups/schoolwave/`
  to somewhere else (their laptop, an S3 bucket, etc.) on a schedule.
- A staging environment — there is no staging; the deploy goes straight to
  production. Test changes in `pnpm dev` before pushing.
- CI/CD — deploys are manual via SSH + git pull. Setting up GitHub Actions to
  push images automatically is a future-phase task, not part of this runbook.
