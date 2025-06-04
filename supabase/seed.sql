-- ==========================================
-- 10xCards MVP - Podstawowe dane
-- ==========================================
-- Cel: Wstawienie podstawowych kategorii i grup do bazy danych
-- Data: 2024-12-04

-- wstawienie domyślnych kategorii
insert into public.categories (name, description) values
  ('Programowanie', 'Pytania i pojęcia związane z programowaniem'),
  ('JavaScript', 'Koncepty specyficzne dla JavaScript'),
  ('React', 'Komponenty React, hooki i wzorce'),
  ('TypeScript', 'Typy TypeScript, interfejsy i zaawansowane funkcje'),
  ('CSS', 'Stylowanie, layout i frameworki CSS'),
  ('Bazy danych', 'Zapytania SQL, koncepty bazodanowe'),
  ('Algorytmy', 'Struktury danych i algorytmy'),
  ('Testowanie', 'Testy jednostkowe, testy integracyjne'),
  ('DevOps', 'CI/CD, deployment, infrastruktura'),
  ('API', 'REST, GraphQL, projektowanie API'),
  ('Frontend', 'Ogólne koncepty frontend'),
  ('Backend', 'Programowanie po stronie serwera'),
  ('Bezpieczeństwo', 'Bezpieczeństwo aplikacji i danych'),
  ('Wydajność', 'Optymalizacja wydajności'),
  ('Wzorce projektowe', 'Wzorce projektowe i architektoniczne');

-- wstawienie domyślnych grup  
insert into public.groups (name, description) values
  ('Podstawy', 'Podstawowe koncepty dla początkujących'),
  ('Zaawansowane', 'Zaawansowane tematy dla doświadczonych programistów'),
  ('Przygotowanie do rozmowy', 'Pytania typowe na rozmowach kwalifikacyjnych'),
  ('Szybkie powtórki', 'Szybkie powtarzanie kluczowych pojęć'),
  ('Dogłębne studium', 'Szczegółowe studium złożonych tematów'),
  ('Najlepsze praktyki', 'Zalecane podejścia i konwencje'),
  ('Częste błędy', 'Typowe błędy i jak ich unikać'),
  ('Świat rzeczywisty', 'Praktyczne przykłady z prawdziwych projektów'),
  ('Pojęcia', 'Teoretyczne koncepty i definicje'),
  ('Implementacja', 'Konkretne implementacje i kod'),
  ('Debugowanie', 'Debugowanie i rozwiązywanie problemów'),
  ('Architektura', 'Architektura aplikacji i systemów');

-- ==========================================
-- koniec pliku seed
-- ========================================== 