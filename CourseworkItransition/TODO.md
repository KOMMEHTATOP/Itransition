# TODO

## Фаза 3 — Инвентари (технические долги)

- [ ] Bootstrap JS не подключён — кнопка-бургер в navbar не работает на мобильных.
      Добавь в `frontend/src/main.tsx`: `import 'bootstrap/dist/js/bootstrap.bundle.min.js'`
- [ ] `useAutosave` сравнивает `data` по ссылке — таймер сбрасывается при каждом рендере.
      Не критично (данные сохранятся), но может слегка задерживать сохранение.
      Исправить в Phase 9 (финальная полировка): обернуть `editData` в `useMemo` в `InventoryDetailPage`.
- [ ] "Accessible to Me" на `/profile` пока показывает только публичные инвентари других пользователей.
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
- [ ] Блокировка: поле `IsBlocked` проверяется при логине, но нет UI для admin чтобы блокировать пользователей (будет в Фазе 9)
