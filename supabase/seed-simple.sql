-- ==========================================
-- seed-simple.sql - Prosty seed tylko z użytkownikami
-- ==========================================

-- Sprawdź czy użytkownicy już istnieją
DO $$
BEGIN
    -- Dodaj testowego użytkownika tylko jeśli nie istnieje
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'test@10xdevs.pl') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, 
            email_confirmed_at, created_at, updated_at, 
            raw_app_meta_data, raw_user_meta_data
        ) VALUES (
            gen_random_uuid(), 
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
    END IF;
    
    -- Dodaj Mateusza tylko jeśli nie istnieje
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mateuszku@gmail.com') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, 
            email_confirmed_at, created_at, updated_at, 
            raw_app_meta_data, raw_user_meta_data
        ) VALUES (
            gen_random_uuid(), 
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
    END IF;
END $$;

-- Dodaj do public.users jeśli nie istnieją
INSERT INTO public.users (id, role, created_at, updated_at)
SELECT 
    au.id, 
    'user', 
    now(), 
    now()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);
