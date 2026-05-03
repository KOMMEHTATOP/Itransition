# TODO

## Деплой — действия вручную

### Cloudflare

- [ ] **DNS** — Cloudflare Dashboard → `basharov.org` → DNS → добавить запись:
  - Тип: `A`, Имя: `api`, Значение: `176.123.182.172`, Proxy: включён (оранжевое облако)

- [ ] **SSL режим** — Cloudflare Dashboard → SSL/TLS → Overview → выбрать **Full (strict)**

- [ ] **Origin Certificate** — Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate:
  - Hostnames: `basharov.org`, `*.basharov.org`, срок: 15 лет
  - Скачать `cert.pem` и `key.pem` — загрузить на VPS (шаг ниже)

- [ ] **Cloudflare Pages** — Workers & Pages → Create → Pages → Connect to Git:
  - Репозиторий: `KOMMEHTATOP/Itransition`
  - Branch: `master`
  - Build command: `npm run build`
  - Build output: `dist`
  - Root directory: `frontend`
  - Environment variables:
    ```
    VITE_CLOUDINARY_CLOUD_NAME = <твоё значение>
    VITE_CLOUDINARY_UPLOAD_PRESET = <твоё значение>
    ```
  - После первого деплоя: Settings → Custom domains → добавить `app.basharov.org`

---

### VPS (ssh root@176.123.182.172)

- [ ] **Установить окружение** — выполнить на VPS:
  ```bash
  apt update && apt upgrade -y
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker && systemctl start docker
  apt install -y docker-compose-plugin nginx
  ```

- [ ] **Firewall**:
  ```bash
  ufw allow OpenSSH
  ufw allow 80
  ufw allow 443
  ufw enable
  ```

- [ ] **Загрузить SSL-сертификаты** (файлы из шага Cloudflare Origin Certificate):
  ```bash
  mkdir -p /etc/ssl/cloudflare
  nano /etc/ssl/cloudflare/cert.pem   # вставить содержимое cert.pem
  nano /etc/ssl/cloudflare/key.pem    # вставить содержимое key.pem
  chmod 600 /etc/ssl/cloudflare/key.pem
  ```

- [ ] **Nginx** — создать файл `/etc/nginx/sites-available/api.basharov.org` и вставить конфиг из `DEPLOY.md` (раздел 3.5), затем:
  ```bash
  ln -s /etc/nginx/sites-available/api.basharov.org /etc/nginx/sites-enabled/
  nginx -t
  systemctl reload nginx
  ```

- [ ] **Создать deploy-пользователя**:
  ```bash
  useradd -m -s /bin/bash deploy
  usermod -aG docker deploy
  mkdir -p /home/deploy/.ssh
  mkdir -p /opt/inventory
  chown -R deploy:deploy /opt/inventory
  ```

- [ ] **SSH-ключ для GitHub Actions** — на локальной машине сгенерировать:
  ```bash
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key
  ```
  Затем на VPS добавить публичный ключ:
  ```bash
  echo "<содержимое deploy_key.pub>" >> /home/deploy/.ssh/authorized_keys
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys
  chown -R deploy:deploy /home/deploy/.ssh
  ```

- [ ] **Создать `/opt/inventory/.env.prod`** на VPS:
  ```env
  DB_PASSWORD=<придумай сложный пароль>
  JWT_KEY=<скопировать значение Jwt.Key из backend/appsettings.json>
  GOOGLE_CLIENT_ID=<из Google Cloud Console>
  GOOGLE_CLIENT_SECRET=<из Google Cloud Console>
  GITHUB_CLIENT_ID=<из GitHub → Settings → Developer settings → OAuth Apps>
  GITHUB_CLIENT_SECRET=<из GitHub → Settings → Developer settings → OAuth Apps>
  ADMIN_EMAIL=<твой email для admin-аккаунта>
  ADMIN_PASSWORD=<надёжный пароль, не Admin123!>
  ```
  ```bash
  chmod 600 /opt/inventory/.env.prod
  ```

- [ ] **Скопировать docker-compose на VPS**:
  ```bash
  scp docker-compose.prod.yml deploy@176.123.182.172:/opt/inventory/
  ```

---

### GitHub

- [ ] **Secrets** — репозиторий → Settings → Secrets and variables → Actions → добавить:
  | Имя | Значение |
  |-----|----------|
  | `VPS_HOST` | `176.123.182.172` |
  | `VPS_USER` | `deploy` |
  | `VPS_SSH_KEY` | содержимое файла `deploy_key` (приватный ключ) |
  | `VPS_PORT` | `22` |

---

### Первый запуск (на VPS от пользователя deploy)

- [ ] Авторизоваться в GHCR и запустить:
  ```bash
  ssh deploy@176.123.182.172
  cd /opt/inventory
  echo <GITHUB_PAT> | docker login ghcr.io -u KOMMEHTATOP --password-stdin
  docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
  ```
  > `GITHUB_PAT` — Personal Access Token с правом `read:packages` (GitHub → Settings → Developer settings → Personal access tokens)

- [ ] Проверить логи: `docker compose -f docker-compose.prod.yml logs api --tail=50`
- [ ] Открыть `https://api.basharov.org/api/inventories` — должен вернуть `[]`

---

### OAuth callback URLs

- [ ] **Google** — [console.cloud.google.com](https://console.cloud.google.com) → OAuth → Authorized redirect URIs → добавить:
  `https://api.basharov.org/api/auth/google/callback`

- [ ] **GitHub** — GitHub → Settings → Developer settings → OAuth Apps → Authorization callback URL:
  `https://api.basharov.org/api/auth/github/callback`

---

## Прочее

- [ ] Сменить пароль admin в `appsettings.json`
