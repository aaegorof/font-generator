---
epic: 'Epic 7: Authentication Integration'
status: 'in-progress'
---

# Epic 7: Authentication Integration

## Overview

Интеграция авторизации через Google OAuth в приложение. Создание UI компонентов для входа/выхода, обработка auth flow и загрузка пользовательских данных.

## Goal

Реализовать полный цикл авторизации пользователей через Google OAuth с использованием Supabase Auth.

## Stories

### 7.1: Install Supabase Client ✅

**Status:** ready-for-dev  
**Dependencies:** 6.1  
**Description:** Установить Supabase JavaScript клиент и настроить environment variables.

**Key Deliverables:**

- `src/lib/supabase.ts` — Supabase client initialization
- `.env.local` — Environment variables
- `.env.example` — Environment variables template

---

### 7.2: Create Auth Hook ✅

**Status:** ready-for-dev  
**Dependencies:** 7.1  
**Description:** Создать React hook для управления состоянием авторизации.

**Key Deliverables:**

- `src/hooks/useAuth.ts` — Auth hook with sign in/out methods
- TypeScript types for User and Session

---

### 7.3: Build Auth UI - Login/Logout Buttons ✅

**Status:** ready-for-dev  
**Dependencies:** 6.2, 7.1, 7.2  
**Description:** Создать UI компоненты для авторизации (кнопки входа/выхода, отображение email).

**Key Deliverables:**

- `src/components/Auth/AuthButton.tsx` — Sign in/out button
- `src/components/Auth/AuthModal.tsx` — Auth modal (optional)
- Integration in StatusBar or TopBar

---

### 7.4: Handle Auth Flow ✅

**Status:** ready-for-dev  
**Dependencies:** 7.2, 7.3  
**Description:** Обработать OAuth callback, загрузку данных пользователя и создание профиля при первом входе.

**Key Deliverables:**

- `src/hooks/useAuthCallback.ts` — OAuth callback handler
- `src/hooks/useUserData.ts` — User data loader
- Profile creation logic for first-time users

---

## Success Metrics

- [ ] Пользователь может войти через Google OAuth
- [ ] После входа отображается email пользователя
- [ ] Пользователь может выйти из аккаунта
- [ ] При первом входе создается user profile
- [ ] Session персистится между перезагрузками
- [ ] OAuth callback обрабатывается корректно

## Technical Notes

- Использует Google OAuth настроенный в Story 6.2
- Supabase автоматически обрабатывает PKCE flow
- Session хранится в localStorage
- Refresh token автоматически обновляется

## Related Epics

- **Epic 6:** Supabase Infrastructure Setup (dependency)
- **Epic 8:** Data Synchronization (next)

## Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup Guide](docs/GOOGLE_OAUTH_SETUP.md)
- [Supabase Quickstart](docs/SUPABASE.md)
