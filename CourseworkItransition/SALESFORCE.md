# Salesforce Integration — Документация

## Статус

✅ **Реализовано и задеплоено** на `app.basharov.org`

---

## Что было сделано

На странице профиля пользователя добавлена кнопка **«Add to Salesforce CRM»**. При нажатии открывается форма, пользователь вводит компанию, должность и телефон. Бэкенд создаёт в Salesforce объекты **Account** (компания) и **Contact** (пользователь). В ответ возвращаются прямые ссылки на созданные объекты в Salesforce.

---

## Архитектура

```
ProfilePage (React)
  → кнопка → SalesforceModal (форма)
    → onSubmit → salesforceApi.push() (axios)
      → POST /api/salesforce/push (SalesforceController)
        → SalesforceService.PushContactAsync()
          → GetAccessTokenAsync()  — OAuth 2.0 Client Credentials
          → CreateAccountAsync()   — POST /sobjects/Account
          → CreateContactAsync()   — POST /sobjects/Contact
        → возвращает AccountId, ContactId, AccountUrl, ContactUrl
      → SalesforceModal показывает результат со ссылками
```

### Ключевые файлы

| Файл | Назначение |
|------|------------|
| `backend/Services/SalesforceService.cs` | Вся логика: OAuth + создание объектов в Salesforce |
| `backend/Services/Interfaces/ISalesforceService.cs` | Интерфейс сервиса |
| `backend/Controllers/SalesforceController.cs` | Эндпоинт `POST /api/salesforce/push` |
| `backend/Models/Dto/Salesforce/SalesforcePushRequest.cs` | Входные данные: Phone, Company, JobTitle |
| `backend/Models/Dto/Salesforce/SalesforcePushResultDto.cs` | Результат: AccountId, ContactId, AccountUrl, ContactUrl |
| `frontend/src/components/SalesforceModal.tsx` | Модальное окно с формой и результатом |
| `frontend/src/api/salesforceApi.ts` | Axios-клиент для `/api/salesforce/push` |
| `frontend/src/pages/ProfilePage.tsx` | Страница профиля, содержит кнопку и SalesforceModal |

---

## Авторизация в Salesforce

### Используемый метод: OAuth 2.0 Client Credentials Flow

Это серверная авторизация — без участия пользователя. Приложение использует `client_id` и `client_secret` для получения `access_token`.

**Запрос токена:**
```http
POST https://<MY_DOMAIN>.my.salesforce.com/services/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=<CLIENT_ID>
&client_secret=<CLIENT_SECRET>
```

**Ответ:**
```json
{
  "access_token": "...",
  "instance_url": "https://orgfarm-1bb6c16b71-dev-ed.develop.my.salesforce.com",
  "token_type": "Bearer"
}
```

Полученный `access_token` используется в заголовке `Authorization: Bearer <token>` для всех последующих запросов к Salesforce REST API.

### Почему НЕ Username-Password Flow

Изначально планировался Username-Password Flow (логин + пароль + security token). Он не заработал по нескольким причинам:
- В Salesforce **Agentforce Dev Org** был создан **External Client App** (а не традиционный Connected App). External Client App не поддерживает Username-Password Flow.
- Username-Password Flow устарел и отключён по умолчанию в новых организациях Salesforce (начиная с Summer '23).
- Client Credentials Flow — правильный современный способ для server-to-server интеграции.

### Настройка в Salesforce

1. **External Client App** (аналог Connected App) создан в Salesforce Dev Org
2. Включён **Client Credentials Flow**
3. Настроен **Run As** — пользователь, от имени которого выполняются запросы
4. IP Relaxation: **Relax IP restrictions**

---

## Конфигурация

### appsettings.json (локально, не коммитится в git)

```json
"Salesforce": {
  "ClientId": "<CONSUMER_KEY>",
  "ClientSecret": "<CONSUMER_SECRET>",
  "LoginUrl": "https://orgfarm-1bb6c16b71-dev-ed.develop.my.salesforce.com"
}
```

> ⚠️ `appsettings.json` в `.gitignore`. Реальные credentials там не попадают в репозиторий.

### docker-compose.prod.yml (продакшн)

```yaml
Salesforce__ClientId: ${SALESFORCE_CLIENT_ID}
Salesforce__ClientSecret: ${SALESFORCE_CLIENT_SECRET}
Salesforce__LoginUrl: ${SALESFORCE_LOGIN_URL}
```

### .env.prod на сервере (/opt/inventory/.env.prod)

```
SALESFORCE_CLIENT_ID=<CONSUMER_KEY>
SALESFORCE_CLIENT_SECRET=<CONSUMER_SECRET>
SALESFORCE_LOGIN_URL=https://orgfarm-1bb6c16b71-dev-ed.develop.my.salesforce.com
```

---

## Что создаётся в Salesforce

### Account (компания)

```http
POST <instance_url>/services/data/v59.0/sobjects/Account
Authorization: Bearer <access_token>

{ "Name": "<company из формы>" }
```

### Contact (контакт)

```http
POST <instance_url>/services/data/v59.0/sobjects/Contact
Authorization: Bearer <access_token>

{
  "FirstName": "<из displayName пользователя>",
  "LastName":  "<из displayName пользователя>",
  "Email":     "<email пользователя из БД>",
  "Phone":     "<phone из формы>",
  "Title":     "<jobTitle из формы>",
  "AccountId": "<id созданного Account>"
}
```

Имя и email берутся автоматически из профиля текущего пользователя (из базы данных). Пользователь вводит только компанию, должность и телефон.

---

## Важные детали

### URL домена Salesforce

Salesforce использует кастомный домен **My Domain** — это не `login.salesforce.com`. Правильный URL:
```
https://orgfarm-1bb6c16b71-dev-ed.develop.my.salesforce.com
```

Его можно найти в браузере, когда открыта Salesforce Dev Org — это часть URL до `/lightning/`.

Если использовать `login.salesforce.com` с Agentforce Dev Org, получаем ошибку:
```json
{ "error": "invalid_grant", "error_description": "request not supported on this domain" }
```

### Токен не кешируется

Каждый запрос к `/api/salesforce/push` получает новый `access_token`. Для учебного проекта это приемлемо. В продакшне стоит добавить кеширование токена (он действует ~1 час).

---

## Как проверить что всё работает

1. Зайти на `app.basharov.org` под любым аккаунтом
2. Открыть страницу профиля
3. Нажать кнопку **«Add to Salesforce CRM»**
4. Заполнить форму (компания, должность, телефон)
5. Нажать **Submit**
6. В ответе появятся ссылки на созданные Account и Contact
7. Перейти по ссылкам — откроется Salesforce Dev Org с созданными объектами
