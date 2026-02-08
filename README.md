# Enclose 🎮

Стратегическая игра "Точки и квадраты" — Telegram Mini App

![Enclose Game](https://img.shields.io/badge/Platform-Telegram%20Mini%20App-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)
![Vite](https://img.shields.io/badge/Vite-6.4-646cff)

## 🎯 Описание

Enclose — это классическая игра "Точки и квадраты" с современным дизайном и плавными анимациями. Соединяй точки, захватывай квадраты и побеждай!

## ✨ Особенности

- 🎨 **Современный UI** — градиенты, glassmorphism, анимации
- 🤖 **AI противник** — 3 уровня сложности (легкий, средний, сложный)
- 👥 **PvP режим** — игра вдвоём на одном устройстве
- 🎵 **Звуковые эффекты** — клики, захваты, победа
- 📱 **Telegram интеграция** — haptic feedback, native UI
- 🌍 **Локализация** — русский и английский языки
- 📐 **3 размера поля** — мини (13), стандарт (25), большой (41)

## 🛠 Технологии

| Категория | Технология |
|-----------|------------|
| UI | React 18 |
| Типы | TypeScript |
| Сборка | Vite |
| Стили | Tailwind CSS |
| State | Zustand |
| Анимации | Framer Motion |

## 🚀 Запуск

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev:web

# Production билд
npm run build --workspace=@enclose/web
```

## 📁 Структура

```
apps/
├── web/                    # Telegram Mini App (React)
│   ├── src/
│   │   ├── game/          # Экраны игры
│   │   ├── components/    # UI компоненты
│   │   ├── store/         # Zustand stores
│   │   └── lib/           # Утилиты
│   └── dist/              # Production билд
└── api/                    # Backend (опционально)

packages/
└── game-core/             # Игровая логика (shared)
```

## 📱 Деплой в Telegram

1. Собрать production билд
2. Задеплоить на Railway/Vercel/Netlify
3. Создать бота через @BotFather (`/newbot`)
4. Подключить Mini App (`/newapp`)
5. Готово! 🎉

## 📄 Лицензия

MIT License — см. [LICENSE](LICENSE)

---

Made with ❤️ for Telegram
