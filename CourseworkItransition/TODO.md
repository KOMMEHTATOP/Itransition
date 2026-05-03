# TODO

## Фаза 9 — Незакрытые баги

- [ ] **MDEditor тулбар чёрный в светлой теме** — библиотека читает `prefers-color-scheme` ОС и игнорирует Bootstrap `data-bs-theme`.
      CSS overrides через `[data-bs-theme] .w-md-editor` не дали результата. Нужно найти через DevTools точный CSS-селектор, который задаёт фон тулбара, и перебить его явно.

## Фаза 3 — Инвентари (технические долги)

- [x] Bootstrap JS не подключён — кнопка-бургер в navbar не работает на мобильных.
      Добавь в `frontend/src/main.tsx`: `import 'bootstrap/dist/js/bootstrap.bundle.min.js'`
- [x] `useAutosave` сравнивает `data` по ссылке — таймер сбрасывался при каждом рендере.
      Исправлено: `editData` обёрнут в `useMemo` в `SettingsTab.tsx`.
- [x] "Accessible to Me" на `/profile` пока показывает только публичные инвентари других пользователей.
      Полноценный список (включая инвентари с явным доступом) будет реализован в Фазе 6.

## Фаза 2 — Авторизация

- [x] Заполнить реальный JWT ключ в `appsettings.json`
- [x] Заполнить Google `ClientId` / `ClientSecret` в `appsettings.json`
- [x] Заполнить GitHub `ClientId` / `ClientSecret` в `appsettings.json`
- [x] Зарегистрировать callback URLs в Google Console и GitHub Developer
- [ ] Сменить пароль admin в `appsettings.json`
- [x] Axios response interceptor: при 401 вызывать `logout()` и редиректить на `/login`
- [x] GitHub может не вернуть email — генерируется placeholder `github_{id}@noemail.placeholder`
- [x] `useEffect` в `AuthCallbackPage` — пустой массив зависимостей, добавлен eslint-disable комментарий
- [x] CORS разрешён только `localhost:5173` — добавлен `https://app.basharov.org` через `Frontend:ProdUrl`
- [x] Блокировка: добавлен `AdminController` (бэкенд) и `AdminPage` (фронтенд) с block/unblock/delete/promote/demote.
