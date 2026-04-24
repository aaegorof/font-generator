# Исправление дубликатов изображений и шрифтов

## Проблема

В базе данных появлялись дубликаты записей в таблицах `user_images` и `user_fonts` из-за неправильной логики синхронизации.

### Причины:

1. **При загрузке из БД**: Метод `useUserData` использовал `addImage()` вместо `setUserImages()`, что триггерило повторное сохранение в БД
2. **При добавлении новых**: `addImage()` и `addFont()` не проверяли существование записи перед вставкой
3. **Отсутствие проверки на дубликаты** в `saveImage()` и `saveFont()`

## Исправления

### 1. useUserData.ts
✅ Использует `setUserImages()` вместо `addImage()` - не триггерит sync

### 2. imageSync.ts & fontSync.ts
✅ Добавлена проверка на существование перед вставкой:
```typescript
// Check if image already exists to avoid duplicates
const { data: existing } = await supabase
  .from('user_images')
  .select('id')
  .eq('user_id', userId)
  .eq('url', url)
  .maybeSingle()

if (existing) {
  return // Skip insert
}
```

### 3. useStore.ts
✅ `addImage()` и `addFont()` проверяют дубликаты перед добавлением в store

## Очистка существующих дубликатов

### Вариант 1: Через Supabase Studio (рекомендуется)

1. Откройте Supabase Studio → SQL Editor
2. Вставьте содержимое файла `supabase/migrations/cleanup_duplicates.sql`
3. Нажмите "Run"
4. Проверьте результат в таблицах `user_images` и `user_fonts`

### Вариант 2: Через CLI

```bash
# Если используете local Supabase
supabase db execute -f supabase/migrations/cleanup_duplicates.sql

# Или напрямую через psql
psql $DATABASE_URL -f supabase/migrations/cleanup_duplicates.sql
```

### Вариант 3: Ручная очистка через SQL

```sql
-- Посмотреть дубликаты изображений
SELECT user_id, url, COUNT(*) as count
FROM user_images
GROUP BY user_id, url
HAVING COUNT(*) > 1;

-- Посмотреть дубликаты шрифтов
SELECT user_id, font_def->>'id' as font_id, COUNT(*) as count
FROM user_fonts
GROUP BY user_id, font_def->>'id'
HAVING COUNT(*) > 1;
```

## Проверка

После очистки дубликатов:

1. Перезагрузите приложение
2. Проверьте, что все изображения и шрифты отображаются корректно
3. Попробуйте загрузить новое изображение/шрифт
4. Выйдите и войдите снова - не должно появиться новых дубликатов

## Файлы изменены

- `src/hooks/useUserData.ts` - использует `setUserImages()`
- `src/services/imageSync.ts` - проверка на дубликаты
- `src/services/fontSync.ts` - проверка на дубликаты
- `src/store/useStore.ts` - проверка перед добавлением
- `supabase/migrations/cleanup_duplicates.sql` - SQL скрипт для очистки

## Тестирование

1. ✅ Загрузить новое изображение - должна создаться одна запись
2. ✅ Выйти и войти - не должно появиться дубликатов
3. ✅ Попытаться загрузить тот же файл повторно - должна остаться одна запись
4. ✅ Проверить Storage - файлы не дублируются
