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

Biblioteka oczekuje **jednego** hosta ze ścieżkami `/auth/v1/*` (GoTrue) i `/rest/v1/*` (PostgREST). W Dockerze robi to `fiszki-gateway`; **nie** musi to być adres publiczny ani domenowy.


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
# Uzupełnij SUPABASE_KEY, OPENROUTER_API_KEY (SUPABASE_URL możesz pominąć — domyślnie wewnętrzny gateway)
docker compose up -d --build
```

### Domena, Cloudflare Tunnel, NPM

Kontenery **nie muszą** znać domeny. `SUPABASE_URL` domyślnie to `http://fiszki-gateway:8000` — ruch Postgres / Auth / REST zamyka się w sieci Docker między `fiszki-web` a resztą stacku.

Na brzegu (Cloudflare Tunnel → port na hoście → Twój nginx / NPM) ustawiasz tylko **aplikację**, np. forward na `http://127.0.0.1:3001` (albo IP VM + port). **Nie** musisz wystawiać osobnego URL dla „API Supabase”.

**GoTrue (`SITE_URL`, `URI_ALLOW_LIST`):** ustaw w `.env` dopiero wtedy, gdy logujesz się spoza `localhost` — na adres, który faktycznie widzisz w przeglądarce (tunnel, IP:port). Dotyczy redirectów (np. reset hasła), nie „domeny bazy”.

Cookie `secure` w produkcji za HTTPS — wtedy i tak adres apki pochodzi z tunelu/NPM, nie z konfiguracji Postgresa.

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

- `SUPABASE_KEY`, `OPENROUTER_API_KEY`
- `SUPABASE_URL` — opcjonalnie; w Dockerze domyślnie `http://fiszki-gateway:8000`
- `SITE_URL` / `URI_ALLOW_LIST` — gdy nie używasz localhost (tunnel, LAN IP)

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