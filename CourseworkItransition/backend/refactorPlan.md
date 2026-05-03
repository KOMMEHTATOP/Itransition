# Refactoring Plan

## Phase 1 — Extensions (не ломает ничего)

- [ ] Создать `Extensions/DatabaseExtensions.cs` — `AddDatabase()` + `InitializeDatabaseAsync()`
- [ ] Создать `Extensions/IdentityExtensions.cs` — `AddIdentityServices()`
- [ ] Создать `Extensions/AuthExtensions.cs` — `AddJwtAuthentication()` + `AddOAuthProviders()`
- [ ] Создать `Extensions/CorsExtensions.cs` — `AddCorsPolicy()`
- [ ] Создать `Extensions/ServiceExtensions.cs` — `AddApplicationServices()` (пока пустой)
- [ ] Упростить `Program.cs` — заменить всё на вызовы extension методов

## Phase 2 — Data Layer

- [ ] Создать папку `Data/Configurations/`
- [ ] Создать `CategoryConfiguration.cs` — перенести `HasData` из `OnModelCreating`
- [ ] Создать `InventoryConfiguration.cs`
- [ ] Создать `ItemConfiguration.cs`
- [ ] Создать `InventoryFieldConfiguration.cs`
- [ ] Создать `ItemFieldValueConfiguration.cs`
- [ ] Создать `InventoryTagConfiguration.cs`
- [ ] Создать `InventoryAccessConfiguration.cs`
- [ ] Создать `CustomIdElementConfiguration.cs`
- [ ] Создать `CommentConfiguration.cs`
- [ ] Создать `ItemLikeConfiguration.cs`
- [ ] Упростить `ApplicationDbContext.OnModelCreating` — только `ApplyConfigurationsFromAssembly`
- [ ] Создать `Data/DatabaseSeeder.cs` — перенести `SeedAsync` из `Program.cs`

## Phase 3 — Base Infrastructure

- [ ] Создать `Models/Dto/BatchIdsRequest.cs` — вынести из `AdminController`
- [ ] Создать `Common/Result.cs` — Result паттерн (`Result<T>`, `ResultStatus`)
- [ ] Создать `Controllers/ApiControllerBase.cs` — `UserId()`, `IsAdmin()`, `FromResult<T>()`

## Phase 4 — Interfaces

- [ ] Создать `Services/Interfaces/IJwtService.cs`
- [ ] Создать `Services/Interfaces/ICustomIdGeneratorService.cs`
- [ ] Создать `Services/Interfaces/IAdminService.cs`
- [ ] Создать `Services/Interfaces/IAuthService.cs`
- [ ] Создать `Services/Interfaces/IInventoryService.cs`
- [ ] Создать `Services/Interfaces/IItemService.cs`
- [ ] Создать `Services/Interfaces/ICommentService.cs`
- [ ] Создать `Services/Interfaces/ISearchService.cs`
- [ ] Создать `Services/Interfaces/IUserService.cs`
- [ ] Создать `Services/Interfaces/IStorageService.cs` — для Cloudinary и будущих интеграций

## Phase 5 — Services Implementation

- [ ] Обновить `JwtService` — реализует `IJwtService`
- [ ] Обновить `CustomIdGeneratorService` — реализует `ICustomIdGeneratorService`
- [ ] Создать `AdminService` — реализует `IAdminService`, логика из `AdminController`
- [ ] Создать `AuthService` — реализует `IAuthService`, логика из `AuthController`
- [ ] Создать `InventoryService` — реализует `IInventoryService`, логика из `InventoriesController`
- [ ] Создать `ItemService` — реализует `IItemService`, логика из `ItemsController`
- [ ] Создать `CommentService` — реализует `ICommentService`, логика из `CommentsController`
- [ ] Создать `SearchService` — реализует `ISearchService`, логика из `SearchController`
- [ ] Создать `UserService` — реализует `IUserService`, логика из `UsersController`
- [ ] Создать `Integrations/CloudinaryStorageService` — реализует `IStorageService`
- [ ] Зарегистрировать все сервисы в `ServiceExtensions.cs`

## Phase 6 — Controllers Refactoring

- [ ] `AdminController` — наследует `ApiControllerBase`, инжектит `IAdminService`, убрать `_db`
- [ ] `AuthController` — наследует `ApiControllerBase`, инжектит `IAuthService`
- [ ] `InventoriesController` — наследует `ApiControllerBase`, инжектит `IInventoryService`
- [ ] `ItemsController` — наследует `ApiControllerBase`, инжектит `IItemService`
- [ ] `CommentsController` — наследует `ApiControllerBase`, инжектит `ICommentService`
- [ ] `SearchController` — наследует `ApiControllerBase`, инжектит `ISearchService`
- [ ] `UsersController` — наследует `ApiControllerBase`, инжектит `IUserService`

## Phase 7 — Validation

- [ ] Установить пакет `FluentValidation.AspNetCore`
- [ ] Создать валидаторы для основных request моделей
- [ ] Зарегистрировать валидаторы в `ServiceExtensions.cs`

## Итоговая структура

```
backend/
├── Controllers/
│   ├── ApiControllerBase.cs
│   ├── AdminController.cs
│   ├── AuthController.cs
│   ├── InventoriesController.cs
│   ├── ItemsController.cs
│   ├── CommentsController.cs
│   ├── SearchController.cs
│   └── UsersController.cs
├── Services/
│   ├── Interfaces/
│   │   ├── IAdminService.cs
│   │   ├── IAuthService.cs
│   │   ├── IInventoryService.cs
│   │   ├── IItemService.cs
│   │   ├── ICommentService.cs
│   │   ├── ISearchService.cs
│   │   ├── IUserService.cs
│   │   ├── IJwtService.cs
│   │   ├── ICustomIdGeneratorService.cs
│   │   └── IStorageService.cs
│   ├── Integrations/
│   │   └── CloudinaryStorageService.cs
│   ├── AdminService.cs
│   ├── AuthService.cs
│   ├── InventoryService.cs
│   ├── ItemService.cs
│   ├── CommentService.cs
│   ├── SearchService.cs
│   ├── UserService.cs
│   ├── JwtService.cs
│   └── CustomIdGeneratorService.cs
├── Data/
│   ├── ApplicationDbContext.cs
│   ├── DatabaseSeeder.cs
│   └── Configurations/
│       ├── CategoryConfiguration.cs
│       ├── InventoryConfiguration.cs
│       ├── ItemConfiguration.cs
│       ├── InventoryFieldConfiguration.cs
│       ├── ItemFieldValueConfiguration.cs
│       ├── InventoryTagConfiguration.cs
│       ├── InventoryAccessConfiguration.cs
│       ├── CustomIdElementConfiguration.cs
│       ├── CommentConfiguration.cs
│       └── ItemLikeConfiguration.cs
├── Models/
│   └── Dto/
│       └── BatchIdsRequest.cs
├── Common/
│   └── Result.cs
├── Extensions/
│   ├── ServiceExtensions.cs
│   ├── AuthExtensions.cs
│   ├── CorsExtensions.cs
│   ├── DatabaseExtensions.cs
│   └── IdentityExtensions.cs
├── Hubs/
│   └── InventoryHub.cs
└── Program.cs
```