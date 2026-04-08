---
epic: "Epic 8: Data Synchronization"
status: "ready-for-dev"
---

# Epic 8: Data Synchronization

## Overview

Синхронизация всех данных приложения (settings, textInputs, fonts, images, favorites) между Zustand store и Supabase. Автоматическое сохранение изменений с debouncing и загрузка данных при логине.

## Goal

Обеспечить автоматическую двустороннюю синхронизацию всех пользовательских данных с облаком.

## Stories

### 8.1: Create Sync Hook ✅
**Status:** ready-for-dev  
**Dependencies:** 7.4  
**Description:** Создать hook для автоматической синхронизации Zustand store с Supabase.

**Key Deliverables:**
- `src/hooks/useSupabaseSync.ts` — Sync hook with debouncing
- Subscribe to store changes
- Debounced save (2 seconds)
- Load data on mount

---

### 8.2: Sync User Profile ✅
**Status:** ready-for-dev  
**Dependencies:** 8.1  
**Description:** Синхронизировать основные настройки пользователя (settings, textInputs, toolbar, pins, disabled images).

**Key Deliverables:**
- Enhanced `useSupabaseSync` with full profile sync
- `src/utils/validation.ts` — Data validation
- Bidirectional sync for all profile fields

---

### 8.3: Sync Fonts ✅
**Status:** ready-for-dev  
**Dependencies:** 8.2  
**Description:** Синхронизировать шрифты (Google Fonts, локальные, загруженные) с таблицей `user_fonts`.

**Key Deliverables:**
- `src/services/fontSync.ts` — Font sync service
- CRUD operations for fonts
- Integration with store actions
- Load fonts on login

---

### 8.4: Sync Images ✅
**Status:** ready-for-dev  
**Dependencies:** 8.2  
**Description:** Синхронизировать изображения с таблицей `user_images`.

**Key Deliverables:**
- `src/services/imageSync.ts` — Image sync service
- CRUD operations for images
- Integration with store actions
- Load images on login

---

### 8.5: Sync Favorites ✅
**Status:** ready-for-dev  
**Dependencies:** 8.2  
**Description:** Синхронизировать избранные тайлы с таблицей `user_favorites`.

**Key Deliverables:**
- `src/services/favoriteSync.ts` — Favorite sync service
- Full snapshot storage (tile + textInput)
- CRUD operations for favorites
- Load favorites on login

---

## Success Metrics

- [ ] Все изменения автоматически сохраняются в Supabase (debounced 2 сек)
- [ ] При логине все данные загружаются из Supabase
- [ ] Settings синхронизируются корректно
- [ ] TextInputs синхронизируются корректно
- [ ] Fonts синхронизируются корректно
- [ ] Images синхронизируются корректно
- [ ] Favorites синхронизируются корректно
- [ ] Неавторизованные пользователи используют localStorage

## Technical Notes

- Debouncing: 2 секунды после последнего изменения
- "Last write wins" стратегия для конфликтов
- DEFAULT_FONTS и DEFAULT_IMAGES не сохраняются в БД
- Favorites хранят полный snapshot тайла
- Валидация данных перед сохранением

## Data Flow

```
User Action → Zustand Store → useSupabaseSync (debounced) → Supabase
                            ↓
                      localStorage (backup)
```

## Related Epics

- **Epic 7:** Authentication Integration (dependency)
- **Epic 9:** File Storage Migration (parallel)

## Documentation

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
