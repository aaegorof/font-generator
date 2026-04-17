# Database Types

Этот проект использует автоматически генерируемые TypeScript типы из схемы Supabase базы данных.

## Генерация типов

Типы автоматически генерируются из схемы базы данных с помощью Supabase CLI.

### Команда для регенерации типов

```bash
npm run db:types
```

Эта команда:

1. Подключается к локальной Supabase базе данных
2. Анализирует схему базы данных
3. Генерирует TypeScript типы в `src/types/database.types.ts`

### Когда регенерировать типы

Регенерируйте типы после:

- Создания новых миграций
- Изменения схемы базы данных
- Добавления/изменения таблиц, колонок, или enum'ов

## Использование типов

### Импорт типов

```typescript
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/supabase'
```

### Типы таблиц

```typescript
// Тип для чтения данных из таблицы
type UserProfile = Tables<'user_profiles'>

// Тип для вставки данных
type UserProfileInsert = TablesInsert<'user_profiles'>

// Тип для обновления данных
type UserProfileUpdate = TablesUpdate<'user_profiles'>
```

### Примеры использования

#### Чтение данных

```typescript
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/supabase'

type UserProfile = Tables<'user_profiles'>

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data // TypeScript знает, что это UserProfile
}
```

#### Вставка данных

```typescript
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/types/supabase'

type NewUserProfile = TablesInsert<'user_profiles'>

async function createUserProfile(profile: NewUserProfile) {
  const { data, error } = await supabase.from('user_profiles').insert(profile).select().single()

  if (error) {
    console.error('Error creating profile:', error)
    return null
  }

  return data
}
```

#### Обновление данных

```typescript
import { supabase } from '@/lib/supabase'
import type { TablesUpdate } from '@/types/supabase'

type UserProfileUpdate = TablesUpdate<'user_profiles'>

async function updateUserProfile(userId: string, updates: UserProfileUpdate) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}
```

### Работа с JSON полями

Для JSON полей (например, `settings`, `text_inputs`) используйте типизацию:

```typescript
import type { Tables } from '@/types/supabase'
import type { Settings, TextInput } from '@/types'

type UserProfile = Tables<'user_profiles'>

// Типизированный доступ к JSON полям
const profile: UserProfile = await getUserProfile(userId)
const settings = profile.settings as Settings
const textInputs = profile.text_inputs as TextInput[]
```

## Структура базы данных

### Таблицы

#### `user_profiles`

Профили пользователей с настройками и состоянием UI.

```typescript
{
  id: string // UUID пользователя (FK к auth.users)
  settings: Json // Настройки приложения (Settings)
  text_inputs: Json // Текстовые поля (TextInput[])
  toolbar_open: boolean // Состояние тулбара
  layer_font_pins: Json // Закрепленные шрифты
  disabled_images: Json // Отключенные изображения
  created_at: string // Дата создания
  updated_at: string // Дата обновления
}
```

#### `user_images`

Загруженные пользователями изображения.

```typescript
{
  id: string // UUID изображения
  user_id: string // UUID пользователя
  storage_path: string // Путь в Storage
  url: string // Публичный URL
  created_at: string // Дата загрузки
}
```

#### `user_fonts`

Загруженные пользователями шрифты.

```typescript
{
  id: string // UUID шрифта
  user_id: string // UUID пользователя
  font_def: Json // Определение шрифта (FontDef)
  storage_path: string | null // Путь в Storage (для загруженных)
  created_at: string // Дата загрузки
}
```

#### `user_favorites`

Избранные комбинации.

```typescript
{
  id: string // UUID избранного
  user_id: string // UUID пользователя
  favorite_data: Json // Данные избранного (FavoriteItem)
  created_at: string // Дата создания
}
```

## Лучшие практики

1. **Всегда регенерируйте типы после изменения схемы**

   ```bash
   npm run db:types
   ```

2. **Используйте типы для всех операций с БД**

   ```typescript
   // ✅ Хорошо
   const { data } = await supabase.from('user_profiles').select('*')

   // ❌ Плохо (без типизации)
   const { data } = await supabase.from('user_profiles' as any).select('*')
   ```

3. **Типизируйте JSON поля**

   ```typescript
   // ✅ Хорошо
   const settings = profile.settings as Settings

   // ❌ Плохо
   const settings = profile.settings
   ```

4. **Используйте правильные типы для операций**

   ```typescript
   // Для чтения
   type Profile = Tables<'user_profiles'>

   // Для вставки (некоторые поля опциональны)
   type NewProfile = TablesInsert<'user_profiles'>

   // Для обновления (все поля опциональны)
   type ProfileUpdate = TablesUpdate<'user_profiles'>
   ```

## Интеграция с миграциями

После создания новой миграции:

```bash
# 1. Создайте миграцию
supabase migration new add_new_table

# 2. Примените миграцию
supabase db reset

# 3. Регенерируйте типы
npm run db:types

# 4. Закоммитьте изменения
git add src/types/database.types.ts
git commit -m "Update database types"
```

## Troubleshooting

### Типы не обновляются

1. Убедитесь, что локальная база данных запущена:

   ```bash
   supabase status
   ```

2. Примените все миграции:

   ```bash
   supabase db reset
   ```

3. Регенерируйте типы:
   ```bash
   npm run db:types
   ```

### Ошибки TypeScript после регенерации

Если после регенерации типов появились ошибки TypeScript:

1. Проверьте, что все JSON поля правильно типизированы
2. Обновите типы в коде, если структура таблиц изменилась
3. Перезапустите TypeScript сервер в IDE

## Ссылки

- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
