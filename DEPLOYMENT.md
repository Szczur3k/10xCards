# Deployment Guide - 10xCards na Ubuntu Server

## Wymagania

### Ubuntu Server

- Ubuntu 20.04+ 
- Docker i Docker Compose
- Git
- Nginx (opcjonalnie dla reverse proxy)

### Zewnętrzne usługi

- **Supabase** - baza danych i autentykacja
- **OpenRouter** - API dla AI generation

## Instalacja na Ubuntu Server

### 1. Instalacja Docker i Docker Compose

```bash
# Aktualizacja systemu
sudo apt update && sudo apt upgrade -y

# Instalacja Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dodanie użytkownika do grupy docker
sudo usermod -aG docker $USER

# Instalacja Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Restart sesji
newgrp docker
```

### 2. Klonowanie repozytorium

```bash
git clone <your-repo-url>
cd 10xCards
```

### 3. Konfiguracja zmiennych środowiskowych

```bash
# Kopiowanie przykładowego pliku
cp env.example .env

# Edycja zmiennych
nano .env
```

**Wymagane zmienne:**

- `SUPABASE_KEY` - Anon key z Supabase (lokalnego)
- `OPENROUTER_API_KEY` - API key z OpenRouter

**Uwaga:** `SUPABASE_URL` jest automatycznie ustawiony na lokalny Supabase w Docker.

### 4. Build i uruchomienie

```bash
# Build i uruchomienie
docker-compose up -d --build

# Sprawdzenie statusu
docker-compose ps

# Logi
docker-compose logs -f app
```

### 5. Konfiguracja Nginx (opcjonalnie)

```bash
# Instalacja Nginx
sudo apt install nginx -y

# Konfiguracja reverse proxy
sudo nano /etc/nginx/sites-available/10xcards
```

**Konfiguracja Nginx:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktywacja konfiguracji
sudo ln -s /etc/nginx/sites-available/10xcards /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Zarządzanie aplikacją

### Podstawowe komendy

```bash
# Uruchomienie
docker-compose up -d

# Zatrzymanie
docker-compose down

# Restart
docker-compose restart

# Aktualizacja
git pull
docker-compose up -d --build

# Logi
docker-compose logs -f app

# Shell do kontenera
docker-compose exec app sh
```

### Monitoring

```bash
# Status kontenerów
docker-compose ps

# Zasoby
docker stats

# Health check
curl http://localhost:3000/
```

## Konfiguracja DNS

1. **A Record** - wskazanie na IP serwera
2. **CNAME** - subdomena (opcjonalnie)

## Bezpieczeństwo

### Firewall

```bash
# UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### SSL (Let's Encrypt)

```bash
# Certbot
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

### Problemy z buildem

```bash
# Czyszczenie cache Docker
docker system prune -a

# Rebuild bez cache
docker-compose build --no-cache
```

### Problemy z pamięcią

```bash
# Sprawdzenie użycia pamięci
free -h
docker stats
```

### Logi błędów

```bash
# Szczegółowe logi
docker-compose logs --tail=100 app

# Logi systemu
journalctl -u docker
```

## Porty

- **3001** - Aplikacja (wewnętrzny Docker)
- **80** - Nginx (zewnętrzny)
- **54322** - Supabase PostgreSQL (wewnętrzny)
- **22** - SSH

Aplikacja będzie dostępna na porcie **3001** wewnętrznie, a przez Nginx na porcie **80** zewnętrznie.