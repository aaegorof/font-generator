# Архитектура проекта Font Generator

## Обзор

Font Generator — это React-приложение для генерации превью текста с различными шрифтами и изображениями. Приложение позволяет комбинировать шрифты, изображения и текст для создания тайлов, которые можно экспортировать.

## Технологический стек

- **Frontend**: React 19.2.4 + TypeScript 5.9.3 + Vite 8.0.1
- **Стилизация**: Tailwind CSS 4.2.2 (через `@tailwindcss/vite` плагин)
- **Управление состоянием**: Zustand 5.0.12 с persist middleware
- **Роутинг**: React Router DOM 7.13.2
- **Backend**: Supabase (Auth, Storage, Database)
- **Экспорт**: html-to-image 1.11.13

## Структура проекта

```
font-generator/
├── public/
│   └── fonts/              # Локальные и загруженные шрифты (.woff2, .woff, .ttf)
├── src/
│   ├── components/         # React компоненты
│   │   ├── Grid/          # Сетка тайлов
│   │   ├── Tile/          # Отдельный тайл с превью
│   │   ├── Toolbar/       # Панель инструментов с вкладками
│   │   │   └── pages/     # Страницы тулбара (Fonts, Images, Settings)
│   │   ├── StatusBar/     # Статус-бар внизу экрана
│   │   ├── FavoritesViewer/ # Просмотр избранных тайлов
│   │   └── FilterChip/    # Чип для фильтрации
│   ├── hooks/             # Кастомные React хуки
│   │   └── useFontFilter.ts # Фильтрация шрифтов
│   ├── store/             # Zustand store
│   │   └── useStore.ts    # Единое глобальное состояние
│   ├── types/             # TypeScript типы
│   │   └── index.ts       # Все общие типы проекта
│   ├── utils/             # Утилиты
│   │   ├── fonts.ts       # Работа со шрифтами (Google, локальные, загруженные)
│   │   ├── images.ts      # Работа с изображениями
│   │   ├── tileGenerator.ts # Генерация тайлов
│   │   ├── exportTile.ts  # Экспорт тайлов в PNG
│   │   └── exportSettings.ts # Импорт/экспорт настроек
│   ├── services/          # Сервисы для работы с Supabase
│   │   ├── fontSync.ts    # Синхронизация шрифтов
│   │   └── imageSync.ts   # Синхронизация изображений
│   ├── App.tsx            # Главный компонент приложения
│   └── main.tsx           # Точка входа
├── vite.config.ts         # Конфигурация Vite
└── tsconfig.json          # Конфигурация TypeScript
```

## Основные компоненты

### 1. App.tsx

Главный компонент приложения. Отвечает за:

- Инициализацию шрифтов (Google Fonts, локальные, загруженные)
- Роутинг между главной страницей и страницей избранного
- Общую структуру приложения

### 2. Grid (components/Grid/)

Отображает сетку тайлов с превью шрифтов и изображений.

### 3. Tile (components/Tile/)

Отдельный тайл с превью. Поддерживает:

- Отображение текста с выбранным шрифтом
- Фоновое изображение
- Добавление в избранное
- Экспорт в PNG
- Удаление

### 4. Toolbar (components/Toolbar/)

Панель инструментов с вкладками:

- **FontsPage**: Управление шрифтами (Google Fonts, локальные, загрузка)
- **ImagesPage**: Управление изображениями (загрузка, удаление)
- **SettingsPage**: Настройки текста, экспорт/импорт настроек

### 5. StatusBar (components/StatusBar/)

Статус-бар внизу экрана, показывает количество тайлов и избранных.

### 6. FavoritesViewer (components/FavoritesViewer/)

Просмотр и управление избранными тайлами.

## Управление состоянием (Zustand Store)

Все состояние приложения хранится в едином Zustand store (`src/store/useStore.ts`).

### Основные части состояния:

#### Персистентные (сохраняются в localStorage):

- `fonts`: Массив всех шрифтов (Google, локальные, загруженные)
- `images`: Массив загруженных изображений
- `textInputs`: Массив текстовых строк для отображения
- `favorites`: Массив избранных комбинаций (fontIds + imageUrl)
- `fontSettings`: Настройки шрифта (размер, цвет, жирность и т.д.)

#### Транзитные (НЕ сохраняются):

- `tiles`: Массив сгенерированных тайлов (генерируются на лету)
- `showFavorites`: Флаг отображения избранного
- `showToolbar`: Флаг отображения тулбара

### Ключевые действия (actions):

- `addFont()`, `removeFont()`: Управление шрифтами
- `addImage()`, `removeImage()`: Управление изображениями
- `addTextInput()`, `removeTextInput()`: Управление текстами
- `toggleFavorite()`: Добавление/удаление из избранного
- `generateAllTiles()`: Генерация всех тайлов (вызывается после изменений)
- `importAllSettings()`, `exportAllSettings()`: Импорт/экспорт настроек

## Работа со шрифтами

### Три источника шрифтов:

1. **Google Fonts** (`utils/fonts.ts`)
   - Список в константе `GOOGLE_FONTS`
   - Инжектятся через `<link>` тег в `<head>`
   - Функция: `setupGoogleFonts()`

2. **Локальные шрифты** (`public/fonts/`)
   - Список имен файлов в `localFontFileNames`
   - Инжектятся через `@font-face` правила
   - Требуют файлы `.woff2`, `.woff`, `.ttf`
   - Функция: `injectLocalFontFaces()`

3. **Загруженные шрифты**
   - Загружаются через Supabase Storage
   - Сохраняются в bucket `user-fonts/{user_id}/{font_id}.{ext}`
   - Инжектятся через индивидуальные `<style>` теги с публичными URL
   - Функция: `injectUploadedFont(font)`
   - Сервис: `FontSyncService` (src/services/fontSync.ts)

## Генерация тайлов

Тайлы генерируются функцией `generateAllTiles()` из `utils/tileGenerator.ts`.

### Логика генерации:

1. Для каждой комбинации текста, шрифта и изображения создается уникальный тайл
2. Тайлы генерируются при:
   - Загрузке приложения
   - Добавлении/удалении шрифтов, изображений или текстов
   - Изменении настроек шрифта
3. Каждый тайл имеет уникальный `id` (комбинация индексов)

## Экспорт тайлов

Экспорт в PNG реализован через библиотеку `html-to-image` (`utils/exportTile.ts`).

### Процесс экспорта:

1. Создается временный DOM элемент с содержимым тайла
2. Применяются стили и шрифты
3. Конвертируется в PNG через `toPng()`
4. Скачивается как файл

## Импорт/Экспорт настроек

Функции в `utils/exportSettings.ts` позволяют:

- Экспортировать все настройки в JSON файл
- Импортировать настройки из JSON файла
- Восстанавливать состояние приложения

## Supabase Integration

Приложение использует Supabase для:

### Authentication
- Google OAuth для входа пользователей
- Session management
- RLS (Row Level Security) policies

### Storage
- **user-fonts** bucket: Загрузка и хранение пользовательских шрифтов
  - Путь: `user-fonts/{user_id}/{font_id}.{ext}`
  - Поддержка форматов: `.woff2`, `.woff`, `.ttf`, `.otf`
  - Максимальный размер: 5 MB

- **user-images** bucket: Загрузка и хранение пользовательских изображений
  - Путь: `user-images/{user_id}/{image_id}.{ext}`
  - Поддержка форматов: `.jpg`, `.jpeg`, `.png`, `.webp`
  - Максимальный размер: 10 MB

### Database
- `user_fonts`: Метаданные загруженных шрифтов
- `user_images`: Метаданные загруженных изображений
- `user_favorites`: Избранные комбинации шрифтов и изображений

### Sync Services
- `FontSyncService` (src/services/fontSync.ts): Синхронизация шрифтов между localStorage и Supabase
- `ImageSyncService` (src/services/imageSync.ts): Синхронизация изображений между localStorage и Supabase

## Критические правила

### TypeScript:

- `verbatimModuleSyntax: true` — всегда использовать `import type` для типов
- Все общие типы в `src/types/index.ts`

### React:

- Только **именованные экспорты** (`export const Foo`)
- Использовать `memo()` для компонентов с частым ре-рендером
- Использовать `useCallback` для обработчиков событий

### Zustand:

- **Единый store** — не создавать дополнительные
- После мутаций вызывать `generateAllTiles()`
- `tiles` НЕ персистятся (всегда генерируются заново)

### Шрифты:

- Имена файлов локальных шрифтов должны точно совпадать с именами в коде
- Для Google Fonts использовать только шрифты из списка `GOOGLE_FONTS`
- Загруженные шрифты должны быть в формате `.woff2`, `.woff` или `.ttf`

## Разработка

### Запуск в dev режиме:

```bash
npm run dev
```

Запускает:

- Vite dev server (порт 5173)

### Сборка:

```bash
npm run build
```

### Форматирование:

```bash
npm run format
```

## Важные замечания

1. **Supabase required**: Для загрузки файлов требуется запущенный Supabase (локальный или облачный)
2. **Избранное**: Сопоставление по `fontIds + imageUrl`, а не по `id` тайла
3. **Tailwind v4**: Нет директив `@tailwind`, плагин все делает автоматически
4. **Prettier**: Обязательно использовать (no semicolons, single quotes, 2 spaces)
5. **localStorage vs Supabase**: Неавторизованные пользователи используют только localStorage; авторизованные — синхронизацию с Supabase

## Дополнительная информация

Для более детальных правил реализации см. `_bmad-output/project-context.md`.
