# Inventory Management App

A web application for managing arbitrary inventories with custom fields, built with ASP.NET Core + React.

🔗 **Live demo:** [basharov.org](https://basharov.org)

## Tech Stack

**Backend:** ASP.NET Core 9, Entity Framework Core, PostgreSQL  
**Frontend:** React 18, TypeScript, Vite, Bootstrap 5  
**Auth:** JWT + OAuth (Google, GitHub)  
**Real-time:** SignalR  
**Storage:** Cloudinary (images)  
**Deploy:** Docker, Nginx, Cloudflare Pages, GitHub Actions

## Features

- Custom inventories with configurable fields (string, number, boolean, multiline, link)
- Custom item ID formats with drag-and-drop builder (fixed text, sequence, random, GUID, date/time)
- Full-text search across all inventories and items
- Role-based access: admin, creator, write-access users, read-only guests
- Admin panel: user management, blocking, role assignment
- Real-time comments via SignalR
- Per-item likes
- Markdown support in descriptions and comments
- Tag cloud with autocomplete
- Auto-save with optimistic locking
- Dark/light theme, English/Russian UI
- Responsive design

## Running Locally

### Prerequisites
- .NET 9 SDK
- Node.js 20+
- PostgreSQL 16+

### Backend
```bash
cd CourseworkItransition/backend
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend
```bash
cd CourseworkItransition/frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:5000`.