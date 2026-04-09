# 10xCards

## Opis

Aplikacja webowa do tworzenia fiszek edukacyjnych: generowanie przez LLM z tekstu, ręczna edycja, SRS, statystyki. Backend oparty o **Supabase** (PostgreSQL + Auth + REST), frontend **Astro 5** (SSR, `@astrojs/node`), React 19, Tailwind 4, Shadcn/ui (tryb ciemny).

## Stack (zgodnie z repo)


| Warstwa        | Technologie                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| Frontend       | Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui                   |
| Runtime        | Node.js **22.14.0** (`.nvmrc`)                                               |
| Backend danych | `@supabase/ssr`, `@supabase/supabase-js` — zapytania `from(...)`, sesja auth |
| AI             | OpenRouter (`OPENROUTER_API_KEY`) — endpointy w `src/pages/api/ai/`          |
| Testy          | Vitest + RTL; Playwright (E2E)                                               |


Zmienne serwerowe są podpinane w `astro.config.mjs` (`SUPABASE_*`, `MOCK_AUTH`, `MOCK_USER_*`, `OPENROUTER_API_KEY`).

## Supabase — czego potrzebujesz (logicznie)

W **Supabase Cloud** jeden host ma `/auth/v1/*` (Auth) i `/rest/v1/*` (PostgREST). W **lokalnym `docker-compose` w tym repo** jest **tylko PostgREST** pod `/rest/v1/` (bez GoTrue); logowanie na dev to **`MOCK_AUTH=true`** (middleware + API auth zwracają sukces bez wywołań Auth API). Schemat `auth` i tabela `auth.users` są tworzone migracją `20240101000000_bootstrap_auth_and_roles.sql` przy **initdb** Postgresa.

| Komponent                       | Rola w tej aplikacji                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| **PostgreSQL**                  | Dane (`public.*`), migracje w `supabase/migrations/`, RLS; seed w `seed-simple.sql` po migracjach |
| **PostgREST**                   | REST — `supabase.from(...)`                                                                        |
| **Brama (nginx w compose)**     | Tylko sieć Docker: `/rest/v1/` → PostgREST (`fiszki-gateway:8000`).                                |
| **Studio / Realtime / Storage** | Nie są w compose; opcjonalnie `npx supabase start`                                                 |

**Opcje produkcyjne:**

1. **Supabase Cloud** — URL projektu + klucz `anon` z dashboardu; wyłącz `MOCK_AUTH`.
2. **Self-hosted pełny stack** (Auth + Realtime itd.) — szablon [Self-Hosted Supabase](https://supabase.com/docs/guides/self-hosting/docker); ten compose jest **uproszczony** pod lokalny dev.

**`SUPABASE_URL`:** serwerowo (`createSupabaseServerClient`). W Dockerze: `http://fiszki-gateway:8000`.

**`SUPABASE_KEY` (lokalny Docker + mock):** JWT z rolą **`service_role`** i tym samym sekretem co `PGRST_JWT_SECRET` / `JWT_SECRET` (PostgREST omija RLS). **Tylko dev** — nie commituj prawdziwych sekretów. W chmurze użyj klucza `anon` z panelu.

**Uwaga:** przy kliencie Supabase w przeglądarce ten sam host musi być osiągalny z przeglądarki (proxy / publiczny URL).

## Docker na Linux VM

### Nazewnictwo kontenerów

Wzorzec: `fiszki-<serwis>` — `fiszki-web`, `fiszki-postgres`, `fiszki-rest`, `fiszki-gateway`.

### Porty na hoście (bez kolizji z typowym homelabem)

| Usługa | Port hosta (domyślnie) | Uwagi |
|--------|-------------------------|--------|
| Aplikacja SSR | **3001** | Unikaj **3080, 5000, 5555, 9000** itd. (u Ciebie zajęte). |
| PostgreSQL | **54332** | Osobna instancja względem innych Postgresów w Dockerze (mealie, alicja). |
| **fiszki-gateway** | *brak* | Tylko sieć Docker; `fiszki-web` łączy się do niego po nazwie — **bez** osobnej domeny i bez portu na hoście. |

Nadpisanie: `HOST_APP_PORT`, `HOST_POSTGRES_PORT` w `.env`.

Obraz DB: `postgres:17-alpine`. Migracje i seed lecą przy **pierwszym** utworzeniu volume (`docker-entrypoint-initdb.d`).

### Uruchomienie

```powershell
Copy-Item .env.example .env
# Uzupełnij SUPABASE_KEY, OPENROUTER_API_KEY
docker compose up -d --build
```

### Postgres: migracje i ponowny start

Przy **pierwszym** starcie pustego volume: skrypt `docker/postgres/docker-init-migrations.sh` odpala `supabase/migrations/*.sql` (sort wersji), potem `seed-simple.sql`.

Jeśli init się wysypał albo zmieniłeś kolejność migracji: `docker compose down`, `docker volume rm <projekt>_supabase_db`, popraw `.env`, `docker compose up -d --build`.

**PostgREST / Postgres:** `PGRST_DB_URI` używa **`POSTGRES_PASSWORD`** — musi być zgodne z hasłem, z którym powstał volume. Typowy błąd: zmiana hasła w `.env` bez usunięcia volume → `password authentication failed`.

### Cloudflare Tunnel (Zero Trust)

`cloudflared` na hoście **nie widzi** nazw typu `fiszki-web` (to tylko sieć Docker). Jako **Service** daj `http://127.0.0.1:3001` albo `http://<IP_VM>:3001` — port z `HOST_APP_PORT`. Nie używaj `http://fiszki-web:3001` (502).

### Nginx Proxy Manager (masz już NPM na VM)

1. **Sieć Docker** — kontener NPM musi widzieć `fiszki-gateway` i `fiszki-web` po nazwie. Po starcie stacku:
   ```powershell
   docker network connect fiszki-net nginx-proxy-manager
   ```
   (jeśli kontener NPM nazywa się inaczej — podmień nazwę).

2. **Dwa proxy hosty** (jeśli aplikacja i PostgREST mają być pod HTTPS z zewnątrz):

   | Domena (przykład) | Forward |
   |-------------------|---------|
   | `fiszki.szczur3k-home.loan` | `http://fiszki-web:3001` |
   | `fiszki-api.szczur3k-home.loan` | `http://fiszki-gateway:8000` |

   SSL: Let’s Encrypt w NPM. **Websockets:** w NPM włącz, jeśli kiedyś dodasz Realtime.

3. **`.env` na VM**

   - `SUPABASE_URL=https://fiszki-api.szczur3k-home.loan` (bez `/` na końcu)
   - `MOCK_AUTH=false` jeśli używasz prawdziwego Auth (np. Supabase Cloud); przy samym PostgREST bez Auth API ustaw zgodnie z wdrożeniem

Cookie auth w produkcji wymaga **HTTPS** (`secure` w `src/db/supabase.client.ts`).

**Dlaczego jest `fiszki-gateway` skoro masz NPM?** NPM terminuje TLS; gateway w compose agreguje PostgREST pod `/rest/v1/` (w chmurze Supabase robi podobnie z wieloma ścieżkami).

### Uwaga do Dockerfile

Obraz aplikacji buduje Astro w stage `builder` — wymagane są **wszystkie** zależności z `package.json` (łącznie z devDependencies do `astro build`).

## Rozwój lokalny (bez Dockera)

```powershell
npm install
npm run dev
```

Domyślnie dev server na porcie **3000** (`astro.config.mjs`). Pełny stack Supabase lokalnie: `npx supabase start` (CLI) — porty w `supabase/config.toml` (API 54321, DB 54322, …).

## Zmienne środowiskowe

Skopiuj `.env.example` → `.env`. Minimalnie:

- `SUPABASE_URL`, `SUPABASE_KEY` (lokalnie: JWT `service_role` + `JWT_SECRET` jak w przykładzie)
- `OPENROUTER_API_KEY` (generowanie fiszek)
- `MOCK_AUTH=true` na lokalny stack bez prawdziwego Auth API

## Skrypty npm


| Skrypt                      | Opis              |
| --------------------------- | ----------------- |
| `npm run dev`               | Dev Astro         |
| `npm run build`             | Build produkcyjny |
| `npm run preview`           | Podgląd buildu    |
| `npm run lint` / `lint:fix` | ESLint            |
| `npm run format`            | Prettier          |
| `npm run test`              | Vitest            |
| `npm run test:e2e`          | Playwright        |


## Zakres funkcji (API)

- `POST /api/flashcards/generate`, `PUT /api/flashcards/edit`, `DELETE /api/flashcards/delete`, `GET /api/flashcards/review`, `POST /api/flashcards/add`
- AI: m.in. `src/pages/api/ai/chat.ts`
- Auth i serwisy domenowe w `src/lib/services/`

## Status

MVP — funkcje rdzeniowe działają; dalszy rozwój wg backlogu.

## Licencja

MIT