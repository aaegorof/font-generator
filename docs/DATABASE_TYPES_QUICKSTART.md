# Database Types - Быстрый старт

## Зачем это нужно?

TypeScript типы автоматически генерируются из схемы базы данных Supabase. Это означает:

- ✅ Автокомплит для всех таблиц и колонок
- ✅ Проверка типов на этапе компиляции
- ✅ Типы всегда синхронизированы с базой данных
- ✅ Меньше ошибок в runtime

## Быстрый старт

### 1. После изменения схемы БД

```bash
# Регенерируйте типы
npm run db:types
```

### 2. Используйте типы в коде

```typescript
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/supabase'

// Тип автоматически выводится из схемы БД
type UserProfile = Tables<'user_profiles'>

async function getProfile(userId: string) {
  const { data } = await supabase
    .from('user_profiles') // ✅ Автокомплит таблиц
    .select('*')
    .eq('id', userId) // ✅ Автокомплит колонок
    .single()

  return data // ✅ TypeScript знает тип: UserProfile
}
```

## Основные типы

### Tables - для чтения

```typescript
type UserProfile = Tables<'user_profiles'>
type UserImage = Tables<'user_images'>
type UserFont = Tables<'user_fonts'>
type UserFavorite = Tables<'user_favorites'>
```

### TablesInsert - для вставки

```typescript
type NewProfile = TablesInsert<'user_profiles'>

const profile: NewProfile = {
  id: userId,
  settings: { columns: 4 },
  text_inputs: [],
  // created_at, updated_at - опциональны (автоматически)
}
```

### TablesUpdate - для обновления

```typescript
type ProfileUpdate = TablesUpdate<'user_profiles'>

const update: ProfileUpdate = {
  toolbar_open: false,
  // Все поля опциональны
}
```

## Примеры

### Создание профиля

```typescript
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/supabase'

async function createProfile(userId: string) {
  const newProfile: TablesInsert<'user_profiles'> = {
    id: userId,
    settings: { columns: 4, padding: 10 },
    text_inputs: [],
    toolbar_open: true,
  }

  const { data, error } = await supabase.from('user_profiles').insert(newProfile).select().single()

  return { data, error }
}
```

### Обновление настроек

```typescript
import { supabase } from '@/lib/supabase'
import type { TablesUpdate } from '@/types/supabase'

async function updateSettings(userId: string, settings: unknown) {
  const update: TablesUpdate<'user_profiles'> = {
    settings,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(update)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}
```

### Загрузка изображения

```typescript
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/supabase'

async function saveImage(userId: string, path: string, url: string) {
  const newImage: TablesInsert<'user_images'> = {
    user_id: userId,
    storage_path: path,
    url,
  }

  const { data, error } = await supabase.from('user_images').insert(newImage).select().single()

  return { data, error }
}
```

## Типизация JSON полей

JSON поля в базе данных имеют тип `Json`. Типизируйте их при использовании:

```typescript
import type { Tables } from '@/types/supabase'
import type { Settings, TextInput } from '@/types'

const profile: Tables<'user_profiles'> = await getProfile(userId)

// Типизируйте JSON поля
const settings = profile.settings as Settings
const textInputs = profile.text_inputs as TextInput[]
```

## Workflow

```bash
# 1. Создайте миграцию
supabase migration new add_feature

# 2. Примените миграцию
supabase db reset

# 3. Регенерируйте типы
npm run db:types

# 4. Используйте новые типы в коде
# TypeScript автоматически подхватит изменения

# 5. Закоммитьте
git add src/types/database.types.ts
git commit -m "Update database types"
```

## Полезные ссылки

- [Полная документация](./DATABASE_TYPES.md)
- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
