# Быстрый старт (на русском)

## Запуск всего одной командой

```bash
# 1. Убедись что Docker Desktop запущен

# 2. Проверь что всё готово к работе
npm run check

# 3. Запусти всё одной командой
npm run dev:full
```

Эта команда запускает:

- **Supabase** (база данных, авторизация, хранилище)
- **Vite** (фронтенд на React)
- **Express** (бэкенд для обработки картинок)

## Куда зайти

После запуска `npm run dev:full`:

| Сервис              | URL                                                     | Описание                     |
| ------------------- | ------------------------------------------------------- | ---------------------------- |
| **Фронтенд**        | http://localhost:5173                                   | Приложение на React          |
| **API**             | http://localhost:3000                                   | Express сервер               |
| **Supabase Studio** | http://127.0.0.1:54323                                  | UI для работы с базой данных |
| **Postgres**        | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Прямое подключение к БД      |

## Основные команды

```bash
# Проверить готовность окружения
npm run check

# Запустить всё
npm run dev:full

# Или запускать отдельно:
npm run supabase:start    # Запустить Supabase
npm run dev              # Запустить фронт + бэк

# Посмотреть статус
npm run supabase:status

# Остановить Supabase
npm run supabase:stop

# Обновить TypeScript типы после изменений в БД
npm run db:types

# Тесты
npm test

# Форматирование кода
npm run format
```

## Если что-то не работает

### "Cannot connect to Docker daemon"

**Решение**: Запусти Docker Desktop и подожди пока он полностью загрузится.

```bash
# Проверь что Docker работает
docker ps
```

### "Port already in use" (порт занят)

**Решение**: Убей процесс который занял порт:

```bash
# Найди что использует порт
lsof -i :54321  # Supabase API
lsof -i :54323  # Supabase Studio
lsof -i :5173   # Vite
lsof -i :3000   # Express

# Убей процесс
kill -9 <PID>
```

### Supabase глючит

```bash
# Ядерный вариант: сбрось всё
npm run supabase:stop
docker system prune -a --volumes
npm run supabase:start
```

## Переменные окружения

Для локальной разработки используй `.env.local`:

```bash
cp .env.example .env.local
```

Ключевые переменные:

```env
# Локальный Supabase (значения по умолчанию)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<возьми из 'supabase status'>

# Опционально: Google OAuth
VITE_GOOGLE_CLIENT_ID=твой-google-client-id
```

Чтобы получить `VITE_SUPABASE_ANON_KEY`:

1. Запусти `npm run supabase:status`
2. Скопируй значение `anon key`
3. Вставь в `.env.local`

## Работа с базой данных

### Миграции

```bash
# Создать новую миграцию
supabase migration new название_миграции

# Применить миграции (сброс базы)
supabase db reset

# Сгенерировать TypeScript типы
npm run db:types
```

### Работа со схемой

1. Открой Supabase Studio: http://127.0.0.1:54323
2. Иди в раздел "SQL Editor"
3. Напиши SQL или используй Table Editor
4. После изменений:
   ```bash
   npm run db:types  # Обновить типы
   ```

## Воркфлоу разработки

1. **Запусти сервисы**: `npm run dev:full`
2. **Делай изменения**: Код автоматически перезагружается
3. **Проверяй базу**: Supabase Studio → http://127.0.0.1:54323
4. **Тестируй**: `npm test`
5. **Коммить**: Сначала `npm run format`

## BMad Agents (Агенты для разработки)

### Скилл продакт-менеджера

**John (Product Manager)** доступен! Чтобы с ним пообщаться:

```
talk to John
```

или

```
I need the product manager
```

### Другие доступные агенты

- **John** (`bmad-agent-pm`) - Product Manager для создания PRD
- **Winston** (`bmad-agent-architect`) - Архитектор
- **Amelia** (`bmad-agent-dev`) - Разработчик
- **Quinn** (`bmad-agent-qa`) - QA инженер
- **Paige** (`bmad-agent-tech-writer`) - Технический писатель
- **Sally** (`bmad-agent-ux-designer`) - UX дизайнер
- **Bob** (`bmad-agent-sm`) - Scrum мастер
- **Barry** (`bmad-agent-quick-flow-solo-dev`) - Quick Flow Solo Dev

### BMad воркфлоу

```bash
# Создать Product Brief
"create product brief"

# Создать PRD
"create PRD"

# Создать архитектуру
"create architecture"

# Создать UX дизайн
"create UX"

# Создать эпики и истории
"create epics and stories"

# Запустить спринт планирование
"run sprint planning"

# Имплементировать историю
"dev story [номер истории]"

# Код ревью
"run code review"
```

## Дальше

- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) — Подробная инструкция
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Архитектура проекта
- [GOOGLE_OAUTH_QUICKSTART.md](./GOOGLE_OAUTH_QUICKSTART.md) — Настройка Google OAuth
