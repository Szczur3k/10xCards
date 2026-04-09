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


Zmienne serwerowe są podpinane w `astro.config.mjs` (`SUPABASE_`*, `MOCK_AUTH`, `OPENROUTER_API_KEY`).

## Supabase — czego potrzebujesz (logicznie)

Klient Supabase w kodzie oczekuje **jednego** `SUPABASE_URL` w stylu chmury: ten sam host obsługuje ścieżki `/auth/v1/*` (GoTrue) i `/rest/v1/*` (PostgREST). Stąd:


| Komponent                       | Rola w tej aplikacji                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| **PostgreSQL**                  | Dane (`public.*`), migracje w `supabase/migrations/`, RLS na rolach `anon` / `authenticated`       |
| **GoTrue**                      | Rejestracja, logowanie, JWT; polityki w SQL odwołują się do `auth.users`                           |
| **PostgREST**                   | REST nad tabelami — to realizuje wywołania `supabase.from(...)`                                    |
| **Brama (nginx w compose)**     | **Tylko sieć Docker** — scala `/auth/v1` → GoTrue i `/rest/v1` → PostgREST pod jednym hostem wewnętrznym (`fiszki-gateway:8000`). To nie jest „publiczne API”; Cloudflare/NPM dotyczy wyłącznie **aplikacji** (port `fiszki-web`). |
| **Studio / Realtime / Storage** | W tym MVP **nie** są w compose; lokalny dev przez `supabase start` może je włączyć (`config.toml`) |


**Opcje produkcyjne:**

1. **Supabase Cloud** — najmniej operacji: hostujesz tylko obraz aplikacji, w `.env` dajesz URL projektu i klucz `anon` z dashboardu.
2. **Self-hosted (Docker)** — ten repo ma `docker-compose.yml`: Postgres + GoTrue + PostgREST + nginx. Pełny zestaw jak w chmurze (Realtime, Storage, Studio) to osobny temat — oficjalny szablon: [Self-Hosted Supabase](https://supabase.com/docs/guides/self-hosting/docker).

**`SUPABASE_URL` w tym projekcie:** używany jest wyłącznie **serwerowo** (`createSupabaseServerClient` w middleware / API). Nie ma wywołań Supabase z Reacta w przeglądarce, więc **domyślnie w Dockerze** wystarcza `http://fiszki-gateway:8000` — bez domeny i bez wystawiania API na zewnątrz.

**`SUPABASE_KEY`:** anon JWT zgodny z `JWT_SECRET` (GoTrue + PostgREST).

**Uwaga na przyszłość:** jeśli dodasz klienta Supabase w przeglądarce, wtedy przeglądarka musiałaby widzieć ten sam host co `SUPABASE_URL` (proxy pod domeną apki albo osobny publiczny endpoint).

## Docker na Linux VM

### Nazewnictwo kontenerów

Wzorzec: `fiszki-<serwis>` — `fiszki-web`, `fiszki-postgres`, `fiszki-auth`, `fiszki-rest`, `fiszki-gateway`.

### Porty na hoście (bez kolizji z typowym homelabem)

| Usługa | Port hosta (domyślnie) | Uwagi |
|--------|-------------------------|--------|
| Aplikacja SSR | **3001** | Unikaj **3080, 5000, 5555, 9000** itd. (u Ciebie zajęte). |
| PostgreSQL | **54332** | Osobna instancja względem innych Postgresów w Dockerze (mealie, alicja). |
| **fiszki-gateway** | *brak* | Tylko sieć Docker; `fiszki-web` łączy się do niego po nazwie — **bez** osobnej domeny i bez portu na hoście. |

Nadpisanie: `HOST_APP_PORT`, `HOST_POSTGRES_PORT` w `.env`.

Obraz DB: `supabase/postgres:17.6.1.106` (PostgreSQL 17 w obrazie Supabase). `supabase/config.toml` → `major_version = 17`.

### Uruchomienie

```powershell
Copy-Item .env.example .env
# Uzupełnij SUPABASE_KEY, OPENROUTER_API_KEY
docker compose up -d --build
```

### Postgres: migracje i ponowny start

Obraz Postgres **ignoruje** podkatalog `migrations/` w `docker-entrypoint-initdb.d` — w repo jest `docker/postgres/01-run-migrations.sh`, który uruchamia pliki z `supabase/migrations/` (sort `V`), potem `09-seed.sql`.

Jeśli `fiszki-postgres` padł przy pierwszym init (np. błąd seed), **usuń volume** z danymi (`docker compose down`, potem `docker volume rm <nazwa>_supabase_db` — nazwę zobaczysz w `docker volume ls`) i odpal ponownie. Initdb wykonuje się tylko przy **pustym** volume.

**GoTrue / PostgREST:** w `docker-compose` jest `GOTRUE_API_EXTERNAL_URL` (wymagane w GoTrue v2). Jeśli PostgREST zgłasza `password authentication failed for user postgres`, sprawdź `.env`: pusta lub zmieniona w połowie `POSTGRES_PASSWORD` musi być **taka sama** jak przy utworzeniu volume (albo usuń volume i zainicjuj od zera).

### Cloudflare Tunnel (Zero Trust)

`cloudflared` na hoście **nie widzi** nazw typu `fiszki-web` (to tylko sieć Docker). Jako **Service** daj `http://127.0.0.1:3001` albo `http://<IP_VM>:3001` — port z `HOST_APP_PORT`. Nie używaj `http://fiszki-web:3001` (502).

### Nginx Proxy Manager (masz już NPM na VM)

1. **Sieć Docker** — kontener NPM musi widzieć `fiszki-gateway` i `fiszki-web` po nazwie. Po starcie stacku:
   ```powershell
   docker network connect fiszki-net nginx-proxy-manager
   ```
   (jeśli kontener NPM nazywa się inaczej — podmień nazwę).

2. **Dwa proxy hosty** (subdomena pod API jest konieczna — jeden `SUPABASE_URL` dla JS):

   | Domena (przykład) | Forward |
   |-------------------|---------|
   | `fiszki.szczur3k-home.loan` | `http://fiszki-web:3001` |
   | `fiszki-api.szczur3k-home.loan` | `http://fiszki-gateway:8000` |

   SSL: Let’s Encrypt w NPM. **Websockets:** w NPM włącz, jeśli kiedyś dodasz Realtime.

3. **`.env` na VM**

   - `SUPABASE_URL=https://fiszki-api.szczur3k-home.loan` (bez `/` na końcu)
   - `SITE_URL=https://fiszki.szczur3k-home.loan`
   - `URI_ALLOW_LIST=https://fiszki.szczur3k-home.loan`

Cookie auth w produkcji wymaga **HTTPS** (`secure` w `src/db/supabase.client.ts`).

**Dlaczego jest `fiszki-gateway` skoro masz NPM?** NPM tylko **terminuje TLS** i przekazuje ruch do jednego upstreamu. Klient `@supabase/supabase-js` i tak potrzebuje **jednego** hosta z ścieżkami `/auth/v1` i `/rest/v1`. Wewnętrzny nginx w compose robi to samo co Kong w chmurze — to nie drugi „publiczny” serwer WWW obok NPM.

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

- `SUPABASE_URL`, `SUPABASE_KEY`
- `OPENROUTER_API_KEY` (generowanie fiszek)
- przy Dockerze: `SITE_URL`, `URI_ALLOW_LIST` zgodne z adresem, pod którym wchodzisz do aplikacji

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