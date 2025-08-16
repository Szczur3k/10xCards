-- ==========================================
-- 10xCards MVP - Podstawowe dane
-- ==========================================
-- Cel: Wstawienie podstawowych kategorii i grup do bazy danych
-- Data: 2024-12-04

-- Mock user dla developmentu (używany przez mock auth)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  '$2a$10$dummy.hash.for.development.only',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
) ON CONFLICT (id) DO NOTHING;

-- Dodaj usera do public.users (trigger może nie działać podczas seed)
INSERT INTO public.users (id, role) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'user')
ON CONFLICT (id) DO NOTHING;

-- wstawienie domyślnych kategorii z user_id
insert into public.categories (name, description, user_id) values
  ('Programowanie', 'Pytania i pojęcia związane z programowaniem', '550e8400-e29b-41d4-a716-446655440000'),
  ('JavaScript', 'Koncepty specyficzne dla JavaScript', '550e8400-e29b-41d4-a716-446655440000'),
  ('React', 'Komponenty React, hooki i wzorce', '550e8400-e29b-41d4-a716-446655440000'),
  ('TypeScript', 'Typy TypeScript, interfejsy i zaawansowane funkcje', '550e8400-e29b-41d4-a716-446655440000'),
  ('CSS', 'Stylowanie, layout i frameworki CSS', '550e8400-e29b-41d4-a716-446655440000'),
  ('Bazy danych', 'Zapytania SQL, koncepty bazodanowe', '550e8400-e29b-41d4-a716-446655440000'),
  ('Algorytmy', 'Struktury danych i algorytmy', '550e8400-e29b-41d4-a716-446655440000'),
  ('Testowanie', 'Testy jednostkowe, testy integracyjne', '550e8400-e29b-41d4-a716-446655440000'),
  ('DevOps', 'CI/CD, deployment, infrastruktura', '550e8400-e29b-41d4-a716-446655440000'),
  ('API', 'REST, GraphQL, projektowanie API', '550e8400-e29b-41d4-a716-446655440000'),
  ('Frontend', 'Ogólne koncepty frontend', '550e8400-e29b-41d4-a716-446655440000'),
  ('Backend', 'Programowanie po stronie serwera', '550e8400-e29b-41d4-a716-446655440000'),
  ('Bezpieczeństwo', 'Bezpieczeństwo aplikacji i danych', '550e8400-e29b-41d4-a716-446655440000'),
  ('Wydajność', 'Optymalizacja wydajności', '550e8400-e29b-41d4-a716-446655440000'),
  ('Wzorce projektowe', 'Wzorce projektowe i architektoniczne', '550e8400-e29b-41d4-a716-446655440000');

-- wstawienie domyślnych grup z user_id
insert into public.groups (name, description, user_id) values
  ('Podstawy', 'Podstawowe koncepty dla początkujących', '550e8400-e29b-41d4-a716-446655440000'),
  ('Zaawansowane', 'Zaawansowane tematy dla doświadczonych programistów', '550e8400-e29b-41d4-a716-446655440000'),
  ('Przygotowanie do rozmowy', 'Pytania typowe na rozmowach kwalifikacyjnych', '550e8400-e29b-41d4-a716-446655440000'),
  ('Szybkie powtórki', 'Szybkie powtarzanie kluczowych pojęć', '550e8400-e29b-41d4-a716-446655440000'),
  ('Dogłębne studium', 'Szczegółowe studium złożonych tematów', '550e8400-e29b-41d4-a716-446655440000'),
  ('Najlepsze praktyki', 'Zalecane podejścia i konwencje', '550e8400-e29b-41d4-a716-446655440000'),
  ('Częste błędy', 'Typowe błędy i jak ich unikać', '550e8400-e29b-41d4-a716-446655440000'),
  ('Świat rzeczywisty', 'Praktyczne przykłady z prawdziwych projektów', '550e8400-e29b-41d4-a716-446655440000'),
  ('Pojęcia', 'Teoretyczne koncepty i definicje', '550e8400-e29b-41d4-a716-446655440000'),
  ('Implementacja', 'Konkretne implementacje i kod', '550e8400-e29b-41d4-a716-446655440000'),
  ('Debugowanie', 'Debugowanie i rozwiązywanie problemów', '550e8400-e29b-41d4-a716-446655440000'),
  ('Architektura', 'Architektura aplikacji i systemów', '550e8400-e29b-41d4-a716-446655440000');

-- ==========================================
-- koniec pliku seed
-- ========================================== 