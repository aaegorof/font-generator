# Epic 6: Supabase Infrastructure Setup

**Epic Goal:** Развернуть и настроить self-hosted Supabase локально в Docker с Google OAuth авторизацией

**Priority:** P0 (Blocker для всех остальных Epic'ов)

**Estimated Effort:** 3-5 дней

---

## Stories Overview

| Story | Title | Effort | Status |
|-------|-------|--------|--------|
| 6.1 | Setup Docker Compose для Supabase | 1 день | Not Started |
| 6.2 | Configure Google OAuth | 0.5 дня | Not Started |
| 6.3 | Create Database Schema | 1 день | Not Started |
| 6.4 | Setup Storage Buckets | 0.5 дня | Not Started |
| 6.5 | Test Infrastructure | 0.5 дня | Not Started |

---

## Dependencies

**Requires:**
- Docker Desktop установлен и запущен
- Google Cloud Console аккаунт
- Базовое понимание PostgreSQL

**Blocks:**
- Epic 2: Authentication Integration
- Epic 3: Data Synchronization
- Epic 4: File Storage Migration

---

## Success Criteria

- ✅ Supabase доступен локально на `http://localhost:8000`
- ✅ Supabase Studio доступен на `http://localhost:3000`
- ✅ PostgreSQL база данных создана и доступна
- ✅ Google OAuth настроен и работает
- ✅ Storage buckets созданы с RLS policies
- ✅ Все таблицы созданы с правильными схемами
- ✅ Тестовый пользователь может авторизоваться через Google

---

## Notes

- Все конфигурационные файлы должны быть в папке `supabase/`
- `.env` файлы не коммитить в git (добавить в `.gitignore`)
- Использовать официальный Supabase Docker setup как основу
- Документировать все шаги в README

---

## Related Documents

- `_bmad-output/PRD-supabase-integration.md` — Полный PRD
- `ARCHITECTURE.md` — Текущая архитектура проекта
