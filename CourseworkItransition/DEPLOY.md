# Деплой — пошаговый план

## Архитектура

```
Пользователь
    │
    ├── app.basharov.org  →  Cloudflare Pages  (React SPA, статика, CDN)
    │
    └── api.basharov.org  →  Cloudflare DNS Proxy
                                    │
                              VPS 176.123.182.172
                                    │
                              Nginx (SSL termination)
                                    │
                          ┌─────────┴──────────┐
                     Docker: api           Docker: db
                  (ASP.NET Core)        (PostgreSQL 16)
```

- Фронт: **Cloudflare Pages** — бесплатный CDN, автодеплой из GitHub
- Бэкенд: **Docker** на VPS, проксируется через Nginx
- БД: **PostgreSQL** в Docker на VPS (порт 5432 закрыт снаружи)
- SSL: **Cloudflare Origin Certificate** на Nginx (бесплатный, 15 лет)
- CI/CD: **GitHub Actions**

---

## Часть 1 — Подготовка локально

### 1.1 Создать `docker-compose.prod.yml` в корне проекта

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: inventory_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    image: ghcr.io/GITHUB_USERNAME/REPO_NAME/backend:latest
    restart: unless-stopped
    depends_on:
      - db
    ports:
      - "5054:8080"
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ConnectionStrings__DefaultConnection: "Host=db;Database=inventory_db;Username=postgres;Password=${DB_PASSWORD}"
      Jwt__Key: ${JWT_KEY}
      Jwt__Issuer: InventoryApi
      Jwt__Audience: InventoryApp
      Jwt__ExpiresInMinutes: "1440"
      Authentication__Google__ClientId: ${GOOGLE_CLIENT_ID}
      Authentication__Google__ClientSecret: ${GOOGLE_CLIENT_SECRET}
      Authentication__GitHub__ClientId: ${GITHUB_CLIENT_ID}
      Authentication__GitHub__ClientSecret: ${GITHUB_CLIENT_SECRET}
      AdminSeed__Email: ${ADMIN_EMAIL}
      AdminSeed__Password: ${ADMIN_PASSWORD}
      Frontend__Url: https://app.basharov.org
      Frontend__ProdUrl: https://app.basharov.org

volumes:
  pgdata:
```

> Замени `GITHUB_USERNAME` и `REPO_NAME` на свои значения.

### 1.2 Создать `backend/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["backend/backend.csproj", "backend/"]
RUN dotnet restore "backend/backend.csproj"
COPY backend/ backend/
WORKDIR /src/backend
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "backend.dll"]
```

> Проверь точное название `.csproj` файла в папке `backend/` и замени при необходимости.

### 1.3 Создать `.env.prod` на сервере (НЕ коммитить в Git)

Этот файл будет создан вручную прямо на VPS в шаге 3.

---

## Часть 2 — Настройка Cloudflare

### 2.1 DNS-записи

Зайди в Cloudflare Dashboard → домен `basharov.org` → DNS.

Добавь записи:

| Тип | Имя | Значение | Proxy |
|-----|-----|----------|-------|
| A | `api` | `176.123.182.172` | ✅ Proxied (оранжевое облако) |
| CNAME | `app` | будет создан автоматически Pages | ✅ Proxied |

> `app.basharov.org` создастся сам когда подключишь Cloudflare Pages в шаге 2.2.

### 2.2 SSL → Full (strict)

Cloudflare Dashboard → SSL/TLS → Overview → выбери **Full (strict)**.

### 2.3 Получить Cloudflare Origin Certificate

Cloudflare Dashboard → SSL/TLS → Origin Server → **Create Certificate**:

- Hostnames: `basharov.org`, `*.basharov.org`
- Validity: 15 years
- Скачай два файла: `cert.pem` и `key.pem`
- Загрузи их на VPS (шаг 3.4)

### 2.4 Подключить Cloudflare Pages

Cloudflare Dashboard → Workers & Pages → Create → Pages → **Connect to Git**:

- Выбери репозиторий
- Branch: `master`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `frontend`
- Добавь переменные окружения (Environment variables):
  ```
  VITE_CLOUDINARY_CLOUD_NAME = твоё_значение
  VITE_CLOUDINARY_UPLOAD_PRESET = твоё_значение
  ```
- После первого деплоя: Settings → Custom domains → добавь `app.basharov.org`

---

## Часть 3 — Настройка VPS

Подключись по SSH: `ssh root@176.123.182.172`

### 3.1 Обновить систему и установить Docker

```bash
apt update && apt upgrade -y

# Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Docker Compose plugin
apt install -y docker-compose-plugin

# Nginx
apt install -y nginx

# Certbot не нужен — используем Cloudflare Origin Certificate
```

### 3.2 Настроить firewall

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

### 3.3 Создать директорию проекта

```bash
mkdir -p /opt/inventory
cd /opt/inventory
```

### 3.4 Загрузить SSL-сертификаты (из шага 2.3)

```bash
mkdir -p /etc/ssl/cloudflare

# Скопируй содержимое cert.pem и key.pem с Cloudflare
nano /etc/ssl/cloudflare/cert.pem    # вставь сертификат
nano /etc/ssl/cloudflare/key.pem     # вставь приватный ключ

chmod 600 /etc/ssl/cloudflare/key.pem
```

### 3.5 Настроить Nginx

```bash
nano /etc/nginx/sites-available/api.basharov.org
```

Содержимое файла:

```nginx
server {
    listen 443 ssl;
    server_name api.basharov.org;

    ssl_certificate     /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass         http://localhost:5054;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}

server {
    listen 80;
    server_name api.basharov.org;
    return 301 https://$host$request_uri;
}
```

```bash
ln -s /etc/nginx/sites-available/api.basharov.org /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3.6 Создать `.env.prod` на сервере

```bash
nano /opt/inventory/.env.prod
```

```env
DB_PASSWORD=придумай_сложный_пароль
JWT_KEY=скопируй_из_appsettings.json
GOOGLE_CLIENT_ID=из_Google_Console
GOOGLE_CLIENT_SECRET=из_Google_Console
GITHUB_CLIENT_ID=из_GitHub_Developer_Settings
GITHUB_CLIENT_SECRET=из_GitHub_Developer_Settings
ADMIN_EMAIL=твой_admin@email.com
ADMIN_PASSWORD=надёжный_пароль_админа
```

```bash
chmod 600 /opt/inventory/.env.prod
```

### 3.7 Добавить SSH-ключ для GitHub Actions

На VPS создай отдельного пользователя для деплоя:

```bash
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
```

На своей локальной машине сгенерируй пару ключей:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key
# Сохрани: deploy_key (приватный) и deploy_key.pub (публичный)
```

На VPS добавь публичный ключ:

```bash
echo "содержимое_deploy_key.pub" >> /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Дать deploy доступ к папке проекта
chown -R deploy:deploy /opt/inventory
```

---

## Часть 4 — GitHub Actions

### 4.1 Добавить секреты в GitHub

GitHub → репозиторий → Settings → Secrets and variables → Actions → **New repository secret**:

| Секрет | Значение |
|--------|----------|
| `VPS_HOST` | `176.123.182.172` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | содержимое файла `deploy_key` (приватный ключ) |
| `VPS_PORT` | `22` |

### 4.2 Создать `.github/workflows/deploy-backend.yml`

```yaml
name: Deploy Backend

on:
  push:
    branches: [master]
    paths:
      - 'backend/**'
      - 'docker-compose.prod.yml'
      - '.github/workflows/deploy-backend.yml'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/backend

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: backend/Dockerfile
          push: true
          tags: ghcr.io/${{ env.IMAGE_NAME }}:latest

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd /opt/inventory
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            docker compose -f docker-compose.prod.yml --env-file .env.prod pull api
            docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
            docker image prune -f
```

### 4.3 Фронт деплоится автоматически через Cloudflare Pages

Cloudflare Pages сам следит за ветками GitHub — никакого дополнительного workflow не нужно. При каждом push в `master` (если изменились файлы в `frontend/`) Cloudflare запустит сборку и задеплоит.

Если хочешь ограничить — в настройках Pages можно отключить автодеплой и подключить через GitHub Actions с `cloudflare/pages-action`, но это усложнение без пользы.

---

## Часть 5 — Первый деплой

### 5.1 Скопировать `docker-compose.prod.yml` на VPS

```bash
scp docker-compose.prod.yml deploy@176.123.182.172:/opt/inventory/
```

### 5.2 Первый запуск на VPS

```bash
ssh deploy@176.123.182.172
cd /opt/inventory

# Авторизоваться в GHCR
echo GITHUB_PAT | docker login ghcr.io -u GITHUB_USERNAME --password-stdin
# (GITHUB_PAT — Personal Access Token с правом read:packages)

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

БД создастся автоматически. При старте API EF Core применит миграции, `SeedAsync` создаст роли и admin-пользователя из `.env.prod`.

### 5.3 Проверить

```bash
docker compose -f docker-compose.prod.yml logs api --tail=50
```

Открой в браузере: `https://api.basharov.org/api/inventories` — должен вернуть `[]` или список.

### 5.4 Обновить OAuth callback URLs

**Google Console** (console.cloud.google.com):
- Authorized redirect URIs: добавь `https://api.basharov.org/api/auth/google/callback`

**GitHub Developer Settings** (github.com → Settings → Developer settings → OAuth Apps):
- Authorization callback URL: `https://api.basharov.org/api/auth/github/callback`

---

## Часть 6 — Структура файлов в репозитории после настройки

```
/
├── backend/
│   ├── Dockerfile          ← новый
│   └── ...
├── frontend/
│   └── ...
├── .github/
│   └── workflows/
│       └── deploy-backend.yml   ← новый
├── docker-compose.prod.yml      ← новый
├── DEPLOY.md
├── FEATURES.md
└── TODO.md
```

**На VPS** (`/opt/inventory/`):
```
docker-compose.prod.yml
.env.prod               ← только здесь, НЕ в Git
```

---

## Чеклист перед первым деплоем

- [ ] `backend/Dockerfile` создан и проверен локально (`docker build`)
- [ ] `docker-compose.prod.yml` создан, заменены GITHUB_USERNAME/REPO_NAME
- [ ] DNS записи в Cloudflare добавлены
- [ ] SSL режим Cloudflare: **Full (strict)**
- [ ] Origin Certificate скачан и загружен на VPS
- [ ] Nginx настроен и перезапущен (`nginx -t` без ошибок)
- [ ] `.env.prod` создан на VPS с реальными значениями
- [ ] SSH-ключ для deploy добавлен на VPS
- [ ] GitHub Secrets добавлены (VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_PORT)
- [ ] Cloudflare Pages подключён к репозиторию
- [ ] `VITE_CLOUDINARY_*` переменные добавлены в Pages
- [ ] OAuth callback URLs обновлены (Google + GitHub)
- [ ] Admin пароль изменён в `.env.prod` (не оставлять `Admin123!`)
