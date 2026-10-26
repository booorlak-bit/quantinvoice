# Quantinvoice

Менеджер инвойсов на Next.js и Supabase (Postgres). Это перенос Framer-шаблона Quantum в код.

- `/invoices/<slug>` — публичная страница инвойса для клиента. Черновики (Draft) видит только админ.
- `/` — список инвойсов: поиск, фильтр по статусу, вид List/Grid. Доступен только после входа.
- `/admin/invoices/new`, `/admin/invoices/<id>` — создание и редактирование инвойса.
- `/admin/settings` — данные компании («Invoice From», логотип, почта для «Get in Touch», заметки по умолчанию).
- `/login` — вход по паролю из `ADMIN_PASSWORD`.

## Стек

- Next.js 16 (App Router, Cache Components), React 19, CSS Modules.
- Postgres в Supabase через общий пулер Supavisor под отдельной ролью `quantinvoice_app`. На всех таблицах включён RLS, а у ролей Data API (`anon`, `authenticated`) нет доступа. Публичный ключ Supabase ничего не открывает.
- Шрифт Switzer (Fontshare, ITF Free Font License) лежит в `app/fonts`.

## База данных

- `supabase/migrations/20261026000000_init.sql` — схема, RLS и роль приложения.
- `supabase/seed.sql` — шесть демо-инвойсов из оригинального шаблона.

Пароль роли не хранится в репозитории:

```sql
alter role quantinvoice_app password '<пароль>';
```

## Локальный запуск

```bash
cp .env.example .env.local   # заполнить значения
npm install
npm run dev
```

## Деплой

Проект на Vercel подключён к этому репозиторию: каждый пуш в `main` автоматически уходит в продакшн. Переменные окружения (`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`) задаются в настройках проекта на Vercel.
