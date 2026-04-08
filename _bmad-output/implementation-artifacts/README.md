# Implementation Artifacts - Supabase Integration

Этот каталог содержит детальные спецификации для реализации интеграции Supabase в проект Font Generator.

## Структура

### Эпики (Epics)

- [Epic 6: Supabase Infrastructure Setup](epic-6-supabase-infrastructure.md) ✅ (Completed)
- [Epic 7: Authentication Integration](epic-7-authentication-integration.md) 🔄 (In Progress)
- [Epic 8: Data Synchronization](epic-8-data-synchronization.md) 📋 (Ready)
- [Epic 9: File Storage Migration](epic-9-file-storage-migration.md) 📋 (Ready)

---

## Epic 7: Authentication Integration

### Stories

| Story | Title | Status | Dependencies | File |
|-------|-------|--------|--------------|------|
| 7.1 | Install Supabase Client | ready-for-dev | 6.1 | [7.1-install-supabase-client.md](7.1-install-supabase-client.md) |
| 7.2 | Create Auth Hook | ready-for-dev | 7.1 | [7.2-create-auth-hook.md](7.2-create-auth-hook.md) |
| 7.3 | Build Auth UI - Login/Logout | ready-for-dev | 6.2, 7.1, 7.2 | [7.3-auth-ui-login-logout.md](7.3-auth-ui-login-logout.md) |
| 7.4 | Handle Auth Flow | ready-for-dev | 7.2, 7.3 | [7.4-handle-auth-flow.md](7.4-handle-auth-flow.md) |

**Goal:** Реализовать полный цикл авторизации через Google OAuth

**Key Deliverables:**
- Supabase client setup
- Auth hook (`useAuth`)
- Auth UI components
- OAuth callback handling
- User profile creation

---

## Epic 8: Data Synchronization

### Stories

| Story | Title | Status | Dependencies | File |
|-------|-------|--------|--------------|------|
| 8.1 | Create Sync Hook | ready-for-dev | 7.4 | [8.1-create-sync-hook.md](8.1-create-sync-hook.md) |
| 8.2 | Sync User Profile | ready-for-dev | 8.1 | [8.2-sync-user-profile.md](8.2-sync-user-profile.md) |
| 8.3 | Sync Fonts | ready-for-dev | 8.2 | [8.3-sync-fonts.md](8.3-sync-fonts.md) |
| 8.4 | Sync Images | ready-for-dev | 8.2 | [8.4-sync-images.md](8.4-sync-images.md) |
| 8.5 | Sync Favorites | ready-for-dev | 8.2 | [8.5-sync-favorites.md](8.5-sync-favorites.md) |

**Goal:** Автоматическая двусторонняя синхронизация всех данных с Supabase

**Key Deliverables:**
- Sync hook (`useSupabaseSync`)
- Sync services (fonts, images, favorites)
- Data validation
- Debounced auto-save (2 sec)
- Load data on login

---

## Epic 9: File Storage Migration

### Stories

| Story | Title | Status | Dependencies | File |
|-------|-------|--------|--------------|------|
| 9.1 | Font Upload to Storage | ready-for-dev | 6.4, 8.3 | [9.1-font-upload-to-storage.md](9.1-font-upload-to-storage.md) |
| 9.2 | Image Upload to Storage | ready-for-dev | 6.4, 8.4 | [9.2-image-upload-to-storage.md](9.2-image-upload-to-storage.md) |
| 9.3 | File Deletion from Storage | ready-for-dev | 9.1, 9.2 | [9.3-file-deletion-from-storage.md](9.3-file-deletion-from-storage.md) |
| 9.4 | Express Server Decision | ready-for-dev | 9.1, 9.2, 9.3 | [9.4-express-server-decision.md](9.4-express-server-decision.md) |

**Goal:** Миграция файлового хранилища на Supabase Storage

**Key Deliverables:**
- Font upload to Storage
- Image upload to Storage
- Cascade file deletion
- Express server removal (recommended)

---

## Dependency Graph

```
Epic 6 (Completed)
  └─> 6.1 Docker Compose ✅
  └─> 6.2 Google OAuth ✅
  └─> 6.3 Database Schema ✅
  └─> 6.4 Storage Buckets ✅
  └─> 6.5 Test Infrastructure ✅

Epic 7 (In Progress)
  └─> 7.1 Install Supabase Client (depends on 6.1)
      └─> 7.2 Create Auth Hook (depends on 7.1)
          └─> 7.3 Build Auth UI (depends on 6.2, 7.1, 7.2)
          └─> 7.4 Handle Auth Flow (depends on 7.2, 7.3)

Epic 8 (Ready)
  └─> 8.1 Create Sync Hook (depends on 7.4)
      └─> 8.2 Sync User Profile (depends on 8.1)
          ├─> 8.3 Sync Fonts (depends on 8.2)
          ├─> 8.4 Sync Images (depends on 8.2)
          └─> 8.5 Sync Favorites (depends on 8.2)

Epic 9 (Ready)
  ├─> 9.1 Font Upload (depends on 6.4, 8.3)
  ├─> 9.2 Image Upload (depends on 6.4, 8.4)
  └─> 9.3 File Deletion (depends on 9.1, 9.2)
      └─> 9.4 Express Server Decision (depends on 9.1, 9.2, 9.3)
```

---

## Implementation Order

### Phase 1: Authentication (Epic 7)
1. Story 7.1: Install Supabase Client
2. Story 7.2: Create Auth Hook
3. Story 7.3: Build Auth UI
4. Story 7.4: Handle Auth Flow

### Phase 2: Data Sync (Epic 8)
1. Story 8.1: Create Sync Hook
2. Story 8.2: Sync User Profile
3. Stories 8.3, 8.4, 8.5: Sync Fonts, Images, Favorites (parallel)

### Phase 3: File Storage (Epic 9)
1. Stories 9.1, 9.2: Font & Image Upload (parallel)
2. Story 9.3: File Deletion
3. Story 9.4: Express Server Decision

---

## Quick Reference

### New Files Created

**Hooks:**
- `src/hooks/useAuth.ts` — Authentication hook
- `src/hooks/useAuthCallback.ts` — OAuth callback handler
- `src/hooks/useUserData.ts` — User data loader
- `src/hooks/useSupabaseSync.ts` — Data synchronization hook

**Services:**
- `src/services/fontSync.ts` — Font CRUD and upload
- `src/services/imageSync.ts` — Image CRUD and upload
- `src/services/favoriteSync.ts` — Favorite CRUD
- `src/services/batchDelete.ts` — Batch deletion

**Components:**
- `src/components/Auth/AuthButton.tsx` — Sign in/out button
- `src/components/Auth/AuthModal.tsx` — Auth modal (optional)
- `src/components/ConfirmDialog.tsx` — Confirmation dialog

**Utils:**
- `src/lib/supabase.ts` — Supabase client
- `src/utils/auth.ts` — Auth helpers
- `src/utils/validation.ts` — Data validation

**Types:**
- `src/types/supabase.ts` — Supabase TypeScript types

---

## Testing Strategy

### Unit Tests
- Auth hook tests
- Sync hook tests
- Service layer tests
- Validation tests

### Integration Tests
- Full auth flow
- Data synchronization
- File upload/delete
- OAuth callback

### Manual Testing
- Each story includes detailed manual testing scenarios
- Verification checklists
- Edge cases

---

## Documentation

### Related Documents
- [PRD: Supabase Integration](../PRD-supabase-integration.md)
- [Supabase Setup Guide](../../docs/SUPABASE.md)
- [Google OAuth Setup](../../docs/GOOGLE_OAUTH_SETUP.md)
- [Google OAuth Quickstart](../../docs/GOOGLE_OAUTH_QUICKSTART.md)

### External References
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

---

## Notes

- Все стори содержат подробные технические детали
- Каждая story включает acceptance criteria и testing scenarios
- Dependencies четко определены для правильного порядка реализации
- Неавторизованные пользователи продолжают работать через localStorage
- Express server рекомендуется удалить после миграции (Story 9.4)

---

**Last Updated:** 2026-04-08  
**Status:** All stories for Epics 7, 8, 9 created and ready for development
