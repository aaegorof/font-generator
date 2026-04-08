---
epic: "Epic 9: File Storage Migration"
status: "ready-for-dev"
---

# Epic 9: File Storage Migration

## Overview

Миграция загрузки и хранения файлов (шрифтов и изображений) с локального Express сервера на Supabase Storage. Реализация полного цикла работы с файлами: загрузка, хранение, генерация URL, отображение и удаление.

## Goal

Переместить все файловое хранилище в Supabase Storage и обеспечить работу с файлами для авторизованных пользователей.

## Stories

### 9.1: Font Upload to Storage ✅
**Status:** ready-for-dev  
**Dependencies:** 6.4, 8.3  
**Description:** Мигрировать загрузку шрифтов на Supabase Storage bucket `user-fonts`.

**Key Deliverables:**
- Enhanced `src/services/fontSync.ts` with upload methods
- File validation (size, type)
- Public URL generation
- `@font-face` injection with Storage URLs
- Storage path in `user_fonts` table

---

### 9.2: Image Upload to Storage ✅
**Status:** ready-for-dev  
**Dependencies:** 6.4, 8.4  
**Description:** Мигрировать загрузку изображений на Supabase Storage bucket `user-images`.

**Key Deliverables:**
- Enhanced `src/services/imageSync.ts` with upload methods
- File validation (size, type)
- Public URL generation
- Display images from Storage in tiles
- Storage path in `user_images` table

---

### 9.3: File Deletion from Storage ✅
**Status:** ready-for-dev  
**Dependencies:** 9.1, 9.2  
**Description:** Обеспечить каскадное удаление файлов из Storage при удалении через UI.

**Key Deliverables:**
- Cascade delete: DB record → Storage file
- `src/services/batchDelete.ts` — Batch deletion service
- `src/components/ConfirmDialog.tsx` — Confirmation dialog
- Error handling for deletion
- Cleanup orphaned files strategy

---

### 9.4: Express Server Decision ✅
**Status:** ready-for-dev  
**Dependencies:** 9.1, 9.2, 9.3  
**Description:** Оценить необходимость Express сервера и принять решение о его судьбе.

**Key Deliverables:**
- Analysis of Express server usage
- Decision documentation
- Code cleanup (if removing server)
- Updated documentation (README, ARCHITECTURE)
- Removed dependencies (if removing server)

**Recommended Decision:** Remove Express server completely
- Supabase Storage заменяет весь функционал
- Упрощение архитектуры
- Неавторизованные пользователи работают через localStorage

---

## Success Metrics

- [ ] Файлы шрифтов загружаются в Supabase Storage
- [ ] Файлы изображений загружаются в Supabase Storage
- [ ] Публичные URL генерируются корректно
- [ ] Загруженные файлы отображаются в UI
- [ ] Файлы удаляются из Storage при удалении через UI
- [ ] Express server удален (или решение задокументировано)
- [ ] Приложение работает без Express server

## Technical Notes

### Storage Structure

```
user-fonts/
├── {user_id}/
│   ├── {font_id}.woff2
│   ├── {font_id}.woff
│   └── {font_id}.ttf

user-images/
├── {user_id}/
│   ├── {image_id}.jpg
│   ├── {image_id}.png
│   └── {image_id}.webp
```

### File Limits

- **Fonts:** Max 5 MB, formats: .woff2, .woff, .ttf
- **Images:** Max 10 MB, formats: .jpg, .jpeg, .png, .webp

### RLS Policies

- Users can only upload/delete their own files
- Public read access for all files
- Configured in Story 6.4

## Migration Strategy

1. **Phase 1:** Implement upload to Supabase Storage (Stories 9.1, 9.2)
2. **Phase 2:** Implement deletion from Storage (Story 9.3)
3. **Phase 3:** Remove Express server (Story 9.4)

## Related Epics

- **Epic 6:** Supabase Infrastructure Setup (dependency)
- **Epic 8:** Data Synchronization (parallel)

## Documentation

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://web.dev/file-upload-best-practices/)

## Future Enhancements

- Image optimization (resize, compress)
- Thumbnails generation
- CDN integration
- Cleanup job for orphaned files
- Progress tracking for large uploads
