-- ==========================================
-- SeedMain.sql - Główne dane aplikacji 10xCards
-- ==========================================
-- Ten plik zawiera wszystkie dane potrzebne do uruchomienia aplikacji
-- Uruchom po migracjach: npx supabase db reset

-- ==========================================
-- 1. UŻYTKOWNICY (auth.users)
-- ==========================================

-- Mateusz Ku
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, created_at, updated_at, 
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 
  '00000000-0000-0000-0000-000000000000', 
  'authenticated', 
  'authenticated', 
  'mateuszku@gmail.com', 
  '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890123456789012345678901234567890', 
  now(), 
  now(), 
  now(), 
  '{"provider":"email","providers":["email"]}', 
  '{}'
);

-- Test User
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, 
  email_confirmed_at, created_at, updated_at, 
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  'e0d9d9d9-d9d9-d9d9-d9d9-d9d9d9d9d9d9', 
  '00000000-0000-0000-0000-000000000000', 
  'authenticated', 
  'authenticated', 
  'test@10xdevs.pl', 
  '$2a$10$bcdefghijklmnopqrstuvwxyz12345678901234567890123456789012345678901', 
  now(), 
  now(), 
  now(), 
  '{"provider":"email","providers":["email"]}', 
  '{}'
);

-- ==========================================
-- 2. PUBLIC USERS (public.users)
-- ==========================================

INSERT INTO public.users (id, role, created_at, updated_at) VALUES
  ('d0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 'user', now(), now()),
  ('e0d9d9d9-d9d9-d9d9-d9d9-d9d9d9d9d9d9', 'user', now(), now());

-- ==========================================
-- 3. KATEGORIE (public.categories)
-- ==========================================

INSERT INTO public.categories (id, name, description, color, user_id, created_at, updated_at) VALUES
  ('f0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0', 'Programowanie', 'Ogólne zagadnienia programistyczne', '#3B82F6', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'JavaScript', 'Język programowania JavaScript', '#10B981', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'React', 'Biblioteka React', '#8B5CF6', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'TypeScript', 'Typowany JavaScript', '#F59E0B', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', 'Node.js', 'Runtime JavaScript', '#EF4444', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'Bazy danych', 'SQL, NoSQL, ORM', '#06B6D4', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f6e6e6e6-e6e6-e6e6-e6e6-e6e6e6e6e6e6', 'DevOps', 'Deployment, CI/CD, Docker', '#84CC16', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f7e7e7e7-e7e7-e7e7-e7e7-e7e7e7e7e7e7', 'Algorytmy', 'Struktury danych i algorytmy', '#F97316', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f8e8e8e8-e8e8-e8e8-e8e8-e8e8e8e8e8e8', 'Wzorce projektowe', 'Design patterns', '#EC4899', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('f9e9e9e9-e9e9-e9e9-e9e9-e9e9e9e9e9e9', 'Testowanie', 'Unit tests, E2E, TDD', '#6366F1', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('fa0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0', 'Bezpieczeństwo', 'Web security, OWASP', '#DC2626', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('fb1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Performance', 'Optymalizacja wydajności', '#059669', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('fc2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Architektura', 'System design, microservices', '#7C3AED', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('fd3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', 'Git', 'Kontrola wersji', '#1F2937', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('fe4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', 'Linux', 'Administracja systemem', '#F59E0B', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now());

-- ==========================================
-- 4. GRUPY (public.groups)
-- ==========================================

INSERT INTO public.groups (id, name, description, user_id, created_at, updated_at) VALUES
  ('g0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0', 'Podstawy', 'Podstawowe koncepcje', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'Zaawansowane', 'Zaawansowane tematy', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'Praktyczne', 'Praktyczne zastosowania', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'Teoria', 'Teoretyczne podstawy', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4', 'Narzędzia', 'Narzędzia i technologie', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5', 'Metodologie', 'Agile, Scrum, Kanban', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'Debugging', 'Debugowanie i troubleshooting', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f7', 'Monitoring', 'Monitoring i logi', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8', 'Deployment', 'Wdrażanie aplikacji', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('g9f9f9f9-f9f9-f9f9-f9f9-f9f9f9f9f9f9', 'Backend', 'Backend development', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('ga0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0', 'Frontend', 'Frontend development', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('gb1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'Mobile', 'Mobile development', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now());

-- ==========================================
-- 5. SOURCE TEXTS (public.source_texts)
-- ==========================================

INSERT INTO public.source_texts (id, title, content, user_id, created_at, updated_at) VALUES
  ('s0g0g0g0-g0g0-g0g0-g0g0-g0g0g0g0g0g0', 'JavaScript Fundamentals', 'Podstawy JavaScript: zmienne, funkcje, obiekty, prototypy...', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('s1g1g1g1-g1g1-g1g1-g1g1-g1g1g1g1g1g1', 'React Best Practices', 'Najlepsze praktyki w React: hooks, performance, patterns...', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now()),
  ('s2g2g2g2-g2g2-g2g2-g2g2-g2g2g2g2g2g2', 'Node.js Architecture', 'Architektura Node.js: event loop, streams, clustering...', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', now(), now());

-- ==========================================
-- 6. FLASHCARDS (public.flashcards)
-- ==========================================

INSERT INTO public.flashcards (id, user_id, source_text_id, front, back, creation_type, status, created_at, updated_at) VALUES
  ('fc0h0h0h0-h0h0-h0h0-h0h0-h0h0h0h0h0h0', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's0g0g0g0-g0g0-g0g0-g0g0-g0g0g0g0g0g0', 'Co to jest hoisting w JavaScript?', 'Hoisting to mechanizm JavaScript, który przenosi deklaracje zmiennych i funkcji na górę ich zakresu przed wykonaniem kodu.', 'ai_generated', 'active', now(), now()),
  ('fc1h1h1h1-h1h1-h1h1-h1h1-h1h1h1h1h1h1', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's0g0g0g0-g0g0-g0g0-g0g0-g0g0g0g0g0g0', 'Jaka jest różnica między let, const i var?', 'let: blokowy scope, można zmieniać; const: blokowy scope, nie można zmieniać; var: funkcyjny scope, można zmieniać.', 'ai_generated', 'active', now(), now()),
  ('fc2h2h2h2-h2h2-h2h2-h2h2-h2h2h2h2h2h2', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's0g0g0g0-g0g0-g0g0-g0g0-g0g0g0g0g0g0', 'Co to jest closure w JavaScript?', 'Closure to funkcja, która ma dostęp do zmiennych ze swojego zakresu zewnętrznego, nawet po zakończeniu wykonywania funkcji zewnętrznej.', 'ai_generated', 'active', now(), now()),
  ('fc3h3h3h3-h3h3-h3h3-h3h3-h3h3h3h3h3h3', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's1g1g1g1-g1g1-g1g1-g1g1-g1g1g1g1g1g1', 'Co to są React Hooks?', 'React Hooks to funkcje, które pozwalają na używanie stanu i innych funkcji React w komponentach funkcyjnych.', 'ai_generated', 'active', now(), now()),
  ('fc4h4h4h4-h4h4-h4h4-h4h4-h4h4h4h4h4h4', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's1g1g1g1-g1g1-g1g1-g1g1-g1g1g1g1g1g1', 'Kiedy używać useEffect?', 'useEffect służy do wykonywania efektów ubocznych w komponentach funkcyjnych, np. API calls, subscriptions, DOM manipulation.', 'ai_generated', 'active', now(), now()),
  ('fc5h5h5h5-h5h5-h5h5-h5h5-h5h5h5h5h5h5', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's1g1g1g1-g1g1-g1g1-g1g1-g1g1g1g1g1g1', 'Co to jest Virtual DOM?', 'Virtual DOM to lekka kopia rzeczywistego DOM, która pozwala React na efektywne aktualizowanie interfejsu użytkownika.', 'ai_generated', 'active', now(), now()),
  ('fc6h6h6h6-h6h6-h6h6-h6h6-h6h6h6h6h6h6', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's2g2g2g2-g2g2-g2g2-g2g2-g2g2g2g2g2g2', 'Co to jest Event Loop w Node.js?', 'Event Loop to mechanizm Node.js, który pozwala na asynchroniczne wykonywanie operacji I/O bez blokowania głównego wątku.', 'ai_generated', 'active', now(), now()),
  ('fc7h7h7h7-h7h7-h7h7-h7h7-h7h7h7h7h7h7', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's2g2g2g2-g2g2-g2g2-g2g2-g2g2g2g2g2g2', 'Co to są Streams w Node.js?', 'Streams to abstrakcje do pracy z danymi, które pozwalają na efektywne przetwarzanie dużych plików bez ładowania ich całkowicie do pamięci.', 'ai_generated', 'active', now(), now()),
  ('fc8h8h8h8-h8h8-h8h8-h8h8-h8h8h8h8h8h8', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's2g2g2g2-g2g2-g2g2-g2g2-g2g2g2g2g2g2', 'Co to jest Clustering w Node.js?', 'Clustering to technika, która pozwala Node.js na wykorzystanie wszystkich rdzeni CPU poprzez uruchomienie wielu procesów.', 'ai_generated', 'active', now(), now()),
  ('fc9h9h9h9-h9h9-h9h9-h9h9-h9h9h9h9h9h9', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest REST API?', 'REST API to styl architektury dla systemów rozproszonych, który wykorzystuje standardowe metody HTTP i formaty danych.', 'manual', 'active', now(), now()),
  ('fca0h0h0h0-h0h0-h0h0-h0h0-h0h0h0h0h0h0', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest JWT?', 'JWT (JSON Web Token) to standard do tworzenia tokenów dostępu, które zawierają informacje o użytkowniku i uprawnieniach.', 'manual', 'active', now(), now()),
  ('fcb1h1h1h1-h1h1-h1h1-h1h1-h1h1h1h1h1h1', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest CORS?', 'CORS (Cross-Origin Resource Sharing) to mechanizm, który pozwala na żądania między różnymi domenami w przeglądarce.', 'manual', 'active', now(), now()),
  ('fcc2h2h2h2-h2h2-h2h2-h2h2-h2h2h2h2h2h2', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest SQL Injection?', 'SQL Injection to atak, w którym atakujący wstrzykuje złośliwy kod SQL do zapytań bazy danych.', 'manual', 'active', now(), now()),
  ('fcd3h3h3h3-h3h3-h3h3-h3h3-h3h3h3h3h3h3', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest XSS?', 'XSS (Cross-Site Scripting) to atak, w którym atakujący wstrzykuje złośliwy kod JavaScript do strony internetowej.', 'manual', 'active', now(), now()),
  ('fce4h4h4h4-h4h4-h4h4-h4h4-h4h4h4h4h4h4', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest CSRF?', 'CSRF (Cross-Site Request Forgery) to atak, w którym atakujący wykonuje nieautoryzowane akcje w imieniu zalogowanego użytkownika.', 'manual', 'active', now(), now()),
  ('fcf5h5h5h5-h5h5-h5h5-h5h5-h5h5h5h5h5h5', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest Docker?', 'Docker to platforma do konteneryzacji aplikacji, która pozwala na łatwe wdrażanie i uruchamianie w różnych środowiskach.', 'manual', 'active', now(), now()),
  ('fcg6h6h6h6-h6h6-h6h6-h6h6-h6h6h6h6h6h6', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest CI/CD?', 'CI/CD (Continuous Integration/Continuous Deployment) to praktyka automatycznego budowania, testowania i wdrażania aplikacji.', 'manual', 'active', now(), now()),
  ('fch7h7h7h7-h7h7-h7h7-h7h7-h7h7h7h7h7h7', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest Git?', 'Git to system kontroli wersji, który pozwala na śledzenie zmian w kodzie i współpracę nad projektami.', 'manual', 'active', now(), now()),
  ('fci8h8h8h8-h8h8-h8h8-h8h8-h8h8h8h8h8h8', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest branch w Git?', 'Branch w Git to linia rozwoju, która pozwala na pracę nad funkcjonalnościami bez wpływu na główną gałąź kodu.', 'manual', 'active', now(), now()),
  ('fcj9h9h9h9-h9h9-h9h9-h9h9-h9h9h9h9h9h9', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest merge w Git?', 'Merge w Git to proces łączenia zmian z jednej gałęzi do drugiej, co pozwala na integrację funkcjonalności.', 'manual', 'active', now(), now()),
  ('fck0h0h0h0-h0h0-h0h0-h0h0-h0h0h0h0h0h0', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest rebase w Git?', 'Rebase w Git to proces przenoszenia zmian z jednej gałęzi na drugą, co pozwala na liniową historię commitów.', 'manual', 'active', now(), now()),
  ('fcl1h1h1h1-h1h1-h1h1-h1h1-h1h1h1h1h1h1', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest pull request?', 'Pull request to mechanizm w Git, który pozwala na proponowanie zmian i ich recenzję przed włączeniem do głównej gałęzi.', 'manual', 'active', now(), now()),
  ('fcm2h2h2h2-h2h2-h2h2-h2h2-h2h2h2h2h2h2', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest code review?', 'Code review to proces recenzji kodu przez innych programistów, który pomaga w utrzymaniu jakości i znajdowaniu błędów.', 'manual', 'active', now(), now()),
  ('fcn3h3h3h3-h3h3-h3h3-h3h3-h3h3h3h3h3h3', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest TDD?', 'TDD (Test-Driven Development) to praktyka programistyczna, w której najpierw pisze się testy, a potem kod, który je przechodzi.', 'manual', 'active', now(), now()),
  ('fco4h4h4h4-h4h4-h4h4-h4h4-h4h4h4h4h4h4', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest BDD?', 'BDD (Behavior-Driven Development) to praktyka programistyczna, która skupia się na zachowaniu systemu z perspektywy użytkownika.', 'manual', 'active', now(), now()),
  ('fcp5h5h5h5-h5h5-h5h5-h5h5-h5h5h5h5h5h5', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', NULL, 'Co to jest DDD?', 'DDD (Domain-Driven Design) to podejście do projektowania oprogramowania, które skupia się na domenie biznesowej.', 'manual', 'active', now(), now());

-- ==========================================
-- 7. AI MODELS (public.ai_models)
-- ==========================================

INSERT INTO public.ai_models (id, name, provider, model_id, is_free, max_tokens, created_at, updated_at) VALUES
  ('am0i0i0i0-i0i0-i0i0-i0i0-i0i0i0i0i0i0', 'Claude 3.5 Sonnet', 'anthropic', 'claude-3.5-sonnet-20241022', false, 4096, now(), now()),
  ('am1i1i1i1-i1i1-i1i1-i1i1-i1i1i1i1i1i1', 'Claude 3 Haiku', 'anthropic', 'claude-3-haiku-20240307', true, 4096, now(), now()),
  ('am2i2i2i2-i2i2-i2i2-i2i2-i2i2i2i2i2i2', 'GPT-4 Turbo', 'openai', 'gpt-4-turbo-preview', false, 4096, now(), now()),
  ('am3i3i3i3-i3i3-i3i3-i3i3-i3i3i3i3i3i3', 'GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', true, 4096, now(), now()),
  ('am4i4i4i4-i4i4-i4i4-i4i4-i4i4i4i4i4i4', 'Mistral 7B', 'mistral', 'mistral-7b-instruct', true, 4096, now(), now()),
  ('am5i5i5i5-i5i5-i5i5-i5i5-i5i5i5i5i5i5', 'Llama 2 7B', 'meta', 'llama-2-7b-chat', true, 4096, now(), now()),
  ('am6i6i6i6-i6i6-i6i6-i6i6-i6i6i6i6i6i6', 'Code Llama 7B', 'meta', 'codellama-7b-instruct', true, 4096, now(), now());

-- ==========================================
-- 8. GENERATION SESSIONS (public.generation_sessions)
-- ==========================================

INSERT INTO public.generation_sessions (id, user_id, source_text_id, ai_model_id, status, progress, created_at, updated_at) VALUES
  ('gs0j0j0j0-j0j0-j0j0-j0j0-j0j0j0j0j0j0', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's0g0g0g0-g0g0-g0g0-g0g0-g0g0g0g0g0g0', 'am0i0i0i0-i0i0-i0i0-i0i0-i0i0i0i0i0i0', 'completed', 100, now(), now()),
  ('gs1j1j1j1-j1j1-j1j1-j1j1-j1j1j1j1j1j1', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's1g1g1g1-g1g1-g1g1-g1g1-g1g1g1g1g1g1', 'am1i1i1i1-i1i1-i1i1-i1i1-i1i1i1i1i1i1', 'completed', 100, now(), now()),
  ('gs2j2j2j2-j2j2-j2j2-j2j2-j2j2j2j2j2j2', 'd0c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c8c8', 's2g2g2g2-g2g2-g2g2-g2g2-g2g2g2g2g2g2', 'am2i2i2i2-i2i2-i2i2-i2i2-i2i2i2i2i2i2', 'completed', 100, now(), now());

-- ==========================================
-- 9. RATE LIMIT RECORDS (public.rate_limit_records)
-- ==========================================

-- Puste - nie ma aktywnych blokad

-- ==========================================
-- KONIEC SEED DATA
-- ==========================================
-- Uruchom: npx supabase db reset
-- Lub: npx supabase db push
