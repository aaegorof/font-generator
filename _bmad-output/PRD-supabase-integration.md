---
workflowType: 'prd'
status: 'draft'
---

# Product Requirements Document - Supabase Integration

**Author:** Artemiy
**Date:** 2026-04-08
**Version:** 1.0

## Executive Summary

Интеграция self-hosted Supabase (Docker) с Google OAuth авторизацией для централизованного хранения пользовательских настроек, шрифтов, изображений и избранного. Цель — подготовить фундамент для будущего расширения функционала с множеством пользовательских и общих настроек.

## Problem Statement

### Current State

- Все настройки хранятся в localStorage через Zustand persist
- Нет авторизации и пользовательских аккаунтов
- Загруженные файлы (шрифты, изображения) хранятся локально в `public/fonts/`
- Express сервер (порт 3001) обрабатывает загрузку файлов
- Невозможно работать с разных устройств
- Нет централизованного управления данными

### Problems

1. **Масштабируемость**: При росте функционала localStorage станет узким местом
2. **Персонализация**: Нет возможности сохранять настройки для конкретного пользователя
3. **Синхронизация**: Невозможно работать с разных устройств
4. **Файловое хранилище**: Локальное хранение файлов не масштабируется
5. **Безопасность**: Нет контроля доступа к данным

## Goals & Success Metrics

### Primary Goals

1. Развернуть self-hosted Supabase в Docker
2. Настроить Google OAuth авторизацию
3. Мигрировать все данные из localStorage в Supabase PostgreSQL
4. Мигрировать файловое хранилище в Supabase Storage
5. Сохранить обратную совместимость (работа без авторизации через localStorage)

### Success Metrics

- ✅ Supabase развернут и доступен локально
- ✅ Google OAuth работает корректно
- ✅ Все данные синхронизируются с БД
- ✅ Файлы загружаются в Supabase Storage
- ✅ Приложение работает как с авторизацией, так и без нее

### Non-Goals (Future Backlog)

- Offline режим (Service Worker + IndexedDB)
- Realtime синхронизация между устройствами
- Командная работа / шаринг настроек
- Миграция существующих данных из localStorage (нет пользователей)

## User Stories

### US-1: Авторизация через Google

**As a** пользователь  
**I want** войти в приложение через Google аккаунт  
**So that** мои настройки сохранялись в облаке

**Acceptance Criteria:**

- Кнопка "Sign in with Google" в UI
- После клика — редирект на Google OAuth
- После успешной авторизации — возврат в приложение
- Отображение email пользователя в UI
- Кнопка "Sign out"

---

### US-2: Автоматическая синхронизация настроек

**As a** авторизованный пользователь  
**I want** чтобы все мои изменения автоматически сохранялись  
**So that** я не терял свою работу

**Acceptance Criteria:**

- При изменении настроек — автосохранение в Supabase (debounced 2 сек)
- При логине — загрузка настроек из Supabase
- При логауте — очистка store
- Индикатор синхронизации в UI (опционально)

---

### US-3: Загрузка шрифтов в Supabase Storage

**As a** авторизованный пользователь  
**I want** загружать шрифты в облако  
**So that** они были доступны с любого устройства

**Acceptance Criteria:**

- Загрузка шрифтов через UI работает как раньше
- Файлы сохраняются в Supabase Storage (`user-fonts/{user_id}/`)
- Метаданные шрифта сохраняются в БД
- Генерация публичного URL для шрифта
- Инжекция `@font-face` с URL из Storage

---

### US-4: Загрузка изображений в Supabase Storage

**As a** авторизованный пользователь  
**I want** загружать изображения в облако  
**So that** они были доступны с любого устройства

**Acceptance Criteria:**

- Загрузка изображений через UI работает как раньше
- Файлы сохраняются в Supabase Storage (`user-images/{user_id}/`)
- Метаданные изображения сохраняются в БД
- Генерация публичного URL для изображения
- Отображение изображений из Storage в тайлах

---

### US-5: Работа без авторизации (Fallback)

**As a** неавторизованный пользователь  
**I want** продолжать работать с приложением как раньше  
**So that** я мог попробовать функционал без регистрации

**Acceptance Criteria:**

- Приложение работает через localStorage как раньше
- Все функции доступны
- Кнопка "Sign in with Google" видна в UI
- После логина — опция импорта данных из localStorage (future)

## Technical Requirements

### Infrastructure

#### Docker Compose Setup

```yaml
services:
  postgres: # PostgreSQL 15
  kong: # API Gateway
  auth: # Supabase Auth
  rest: # PostgREST
  storage: # Supabase Storage
  realtime: # Supabase Realtime (опционально)
  studio: # Supabase Studio (UI для разработки)
```

**Порты:**

- `3000` — Supabase Studio
- `8000` — Kong API Gateway
- `5432` — PostgreSQL (внутренний)

**Volumes:**

- `supabase_db_data` — PostgreSQL данные
- `supabase_storage_data` — Storage файлы

---

### Database Schema

#### Table: `user_profiles`

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  text_inputs JSONB NOT NULL DEFAULT '[]',
  toolbar_open BOOLEAN NOT NULL DEFAULT true,
  layer_font_pins JSONB NOT NULL DEFAULT '{}',
  disabled_images JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

#### Table: `user_fonts`

```sql
CREATE TABLE user_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  font_def JSONB NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_fonts_user_id ON user_fonts(user_id);

-- RLS Policies
ALTER TABLE user_fonts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fonts"
  ON user_fonts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fonts"
  ON user_fonts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fonts"
  ON user_fonts FOR DELETE
  USING (auth.uid() = user_id);
```

#### Table: `user_images`

```sql
CREATE TABLE user_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_images_user_id ON user_images(user_id);

-- RLS Policies
ALTER TABLE user_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images"
  ON user_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON user_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON user_images FOR DELETE
  USING (auth.uid() = user_id);
```

#### Table: `user_favorites`

```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);

-- RLS Policies
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);
```

---

### Storage Buckets

#### Bucket: `user-fonts`

- **Path structure**: `{user_id}/{font_id}.{ext}`
- **Allowed extensions**: `.woff2`, `.woff`, `.ttf`
- **Max file size**: 5 MB
- **Public**: Yes (с RLS)
- **RLS Policy**: Пользователи могут загружать/удалять только свои файлы

#### Bucket: `user-images`

- **Path structure**: `{user_id}/{image_id}.{ext}`
- **Allowed extensions**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **Max file size**: 10 MB
- **Public**: Yes (с RLS)
- **RLS Policy**: Пользователи могут загружать/удалять только свои файлы

---

### Frontend Architecture

#### New Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "@supabase/auth-ui-react": "^0.4.x",
  "@supabase/auth-ui-shared": "^0.1.x"
}
```

#### New Files Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client initialization
├── hooks/
│   ├── useAuth.ts               # Authentication hook
│   └── useSupabaseSync.ts       # Store <-> Supabase sync
├── components/
│   └── Auth/
│       ├── AuthButton.tsx       # Sign in/out button
│       └── AuthModal.tsx        # Auth modal with Google OAuth
└── store/
    └── useStore.ts              # Updated with Supabase sync
```

#### Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Auth Hook (`src/hooks/useAuth.ts`)

```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen to auth state changes
  // Sign in with Google
  // Sign out
  // Load user data from Supabase
  // Save user data to Supabase
}
```

#### Sync Hook (`src/hooks/useSupabaseSync.ts`)

```typescript
export const useSupabaseSync = () => {
  // Subscribe to store changes
  // Debounced save to Supabase (2 sec)
  // Load from Supabase on mount
  // Handle conflicts
}
```

---

### Environment Variables

#### `.env.local`

```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=<anon_key_from_supabase>

# Google OAuth
VITE_GOOGLE_CLIENT_ID=<google_client_id>
```

---

### Data Flow

#### Without Authentication (Current)

```
User Action → Zustand Store → localStorage (persist)
```

#### With Authentication (New)

```
User Action → Zustand Store → useSupabaseSync (debounced) → Supabase
                            ↓
                      localStorage (backup)
```

#### On Login

```
Google OAuth → Supabase Auth → Load data from Supabase → Zustand Store
```

#### On Logout

```
Sign Out → Clear Zustand Store → Revert to localStorage
```

---

## Implementation Plan (Epics)

### Epic 6: Supabase Infrastructure Setup ⭐ (Current)

**Goal:** Развернуть и настроить Supabase локально

**Stories:**

1. **Story 6.1**: Setup Docker Compose для Supabase
   - Создать `docker-compose.yml`
   - Настроить volumes и networks
   - Запустить и проверить доступность

2. **Story 6.2**: Configure Google OAuth
   - Создать проект в Google Cloud Console
   - Получить Client ID и Client Secret
   - Настроить OAuth в Supabase Studio

3. **Story 6.3**: Create Database Schema
   - Создать таблицы (`user_profiles`, `user_fonts`, `user_images`, `user_favorites`)
   - Настроить RLS policies
   - Создать indexes

4. **Story 6.4**: Setup Storage Buckets
   - Создать buckets (`user-fonts`, `user-images`)
   - Настроить RLS policies для Storage
   - Настроить CORS

5. **Story 6.5**: Test Infrastructure
   - Проверить подключение к БД
   - Проверить Google OAuth flow
   - Проверить загрузку файлов в Storage

---

### Epic 7: Authentication Integration

**Goal:** Интегрировать авторизацию в приложение

**Stories:**

1. **Story 7.1**: Install Supabase Client
   - Установить зависимости
   - Создать `src/lib/supabase.ts`
   - Настроить environment variables

2. **Story 7.2**: Create Auth Hook
   - Создать `useAuth` hook
   - Реализовать sign in / sign out
   - Обработка auth state changes

3. **Story 7.3**: Build Auth UI
   - Компонент `AuthButton` в StatusBar
   - Модальное окно `AuthModal` с Google OAuth
   - Отображение email пользователя

4. **Story 7.4**: Handle Auth Flow
   - Редирект после логина
   - Загрузка данных пользователя
   - Обработка ошибок

---

### Epic 8: Data Synchronization

**Goal:** Синхронизировать Zustand store с Supabase

**Stories:**

1. **Story 8.1**: Create Sync Hook
   - Создать `useSupabaseSync` hook
   - Debounced save (2 sec)
   - Load on mount

2. **Story 8.2**: Sync User Profile
   - Синхронизация `settings`
   - Синхронизация `textInputs`
   - Синхронизация `toolbarOpen`, `layerFontPins`, `disabledImages`

3. **Story 8.3**: Sync Fonts
   - Загрузка шрифтов из `user_fonts` таблицы
   - Сохранение новых шрифтов
   - Удаление шрифтов

4. **Story 8.4**: Sync Images
   - Загрузка изображений из `user_images` таблицы
   - Сохранение новых изображений
   - Удаление изображений

5. **Story 8.5**: Sync Favorites
   - Загрузка избранного из `user_favorites` таблицы
   - Добавление в избранное
   - Удаление из избранного

---

### Epic 9: File Storage Migration

**Goal:** Мигрировать файлы в Supabase Storage

**Stories:**

1. **Story 9.1**: Font Upload to Storage
   - Обновить `FontsPage` для загрузки в Storage
   - Генерация публичного URL
   - Инжекция `@font-face` с новым URL

2. **Story 9.2**: Image Upload to Storage
   - Обновить `ImagesPage` для загрузки в Storage
   - Генерация публичного URL
   - Отображение изображений из Storage

3. **Story 9.3**: File Deletion from Storage
   - Удаление файлов шрифтов при удалении из UI
   - Удаление файлов изображений при удалении из UI

4. **Story 9.4**: Express Server Decision
   - Оценить необходимость Express сервера
   - Опционально: удалить или оставить как fallback

---

## Security & Privacy

### Row Level Security (RLS)

- Все таблицы защищены RLS
- Пользователи видят только свои данные
- Политики проверяют `auth.uid() = user_id`

### Storage Security

- Buckets защищены RLS
- Пользователи могут загружать/удалять только свои файлы
- Публичный доступ только для чтения

### Environment Variables

- Все ключи в `.env.local` (не коммитить в git)
- `.env.local` добавлен в `.gitignore`

---

## Testing Strategy

### Unit Tests

- Тесты для `useAuth` hook
- Тесты для `useSupabaseSync` hook
- Тесты для Supabase client functions

### Integration Tests

- Тест авторизации через Google OAuth
- Тест загрузки/сохранения данных
- Тест загрузки файлов в Storage

### Manual Testing

- Проверка работы без авторизации
- Проверка работы с авторизацией
- Проверка синхронизации между вкладками (future)

---

## Risks & Mitigations

### Risk 1: Google OAuth Configuration

**Risk:** Сложности с настройкой OAuth  
**Mitigation:** Использовать официальную документацию Supabase, тестировать на локальном окружении

### Risk 2: Data Migration

**Risk:** Потеря данных при миграции  
**Mitigation:** Нет пользователей, нечего терять. В будущем — функция импорта из localStorage

### Risk 3: Performance

**Risk:** Медленная синхронизация с Supabase  
**Mitigation:** Debounced save (2 sec), оптимизация запросов, индексы в БД

### Risk 4: Docker Setup Complexity

**Risk:** Сложности с настройкой Docker Compose  
**Mitigation:** Использовать официальный Supabase Docker setup, документация

---

## Future Enhancements (Backlog)

### Offline Mode

- Service Worker для кэширования
- IndexedDB для локального хранилища
- Синхронизация при восстановлении соединения

### Realtime Sync

- Использовать Supabase Realtime
- Синхронизация между вкладками/устройствами в реальном времени

### Team Collaboration

- Шаринг настроек между пользователями
- Командные проекты

### Migration Tool

- Импорт данных из localStorage при первом логине
- UI для миграции

---

## Appendix

### References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

### Related Documents

- `ARCHITECTURE.md` — Текущая архитектура проекта
- `src/store/useStore.ts` — Zustand store
- `server.js` — Express сервер для загрузки файлов

---

**Status:** Draft → Ready for Epic 1 Implementation
