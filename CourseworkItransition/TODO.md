# TODO

## Фаза 2 — Авторизация

- [ ] Заполнить реальный JWT ключ в `appsettings.json`
- [ ] Заполнить Google `ClientId` / `ClientSecret` в `appsettings.json`
- [ ] Заполнить Facebook `AppId` / `AppSecret` в `appsettings.json`
- [ ] Зарегистрировать callback URLs в Google Console и Facebook Developer
- [ ] Сменить пароль admin в `appsettings.json`
- [ ] Axios response interceptor: при 401 вызывать `logout()` и редиректить на `/login`
- [ ] Facebook может не вернуть email — нет обработки этого кейса в `AuthController`
- [ ] `useEffect` в `AuthCallbackPage` — пустой массив зависимостей вызовет warning ESLint
- [ ] CORS разрешён только `localhost:5173` — при деплое добавить прод-домен
- [ ] Блокировка: поле `IsBlocked` проверяется при логине, но нет UI для admin чтобы блокировать пользователей
