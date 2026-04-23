# Inventory Management App

Web-приложение для управления произвольными инвентарями с кастомными полями.

## Требования

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/)

## Запуск в dev-режиме

### 1. База данных

Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE inventory_db;
```

### 2. Backend

```bash
cd backend

# Укажите строку подключения (или отредактируйте appsettings.Development.json)
# "Host=localhost;Database=inventory_db;Username=postgres;Password=yourpassword"

dotnet restore
dotnet ef database update
dotnet run
```

API будет доступен на `http://localhost:5000`.  
Swagger UI: `http://localhost:5000/swagger`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`.  
Все запросы к `/api/*` проксируются на `http://localhost:5000`.

## Структура проекта

```
/
├── backend/          # ASP.NET Core Web API
│   ├── Data/         # ApplicationDbContext
│   ├── Models/       # EF Core модели
│   ├── Controllers/  # API контроллеры
│   └── ...
└── frontend/         # React + TypeScript (Vite)
    └── src/
        ├── App.tsx
        └── ...
```
