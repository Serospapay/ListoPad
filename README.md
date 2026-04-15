# ЛистоПад — Книжкове видавництво (React + Django DRF)

Проєкт складається з:

- Frontend: `React 19 + TypeScript + Vite`
- Backend: `Django + Django REST Framework + JWT`
- Локальна БД за замовчуванням: `SQLite` (підтримка `PostgreSQL` через env)

## 1. Структура проєкту

- `App.tsx`, `components/`, `services/`, `types.ts` — фронтенд SPA
- `backend/` — Django application (models, serializers, views, settings)
- `manage.py` — Django entrypoint
- `.env.example` — приклад змінних середовища
- `requirements.txt` — Python залежності
- `run-local.bat` — батнік для локального запуску frontend + backend

## 2. Системні вимоги

- Node.js `>= 18`
- npm `>= 9`
- Python `3.9+`
- Windows PowerShell або cmd

## 3. Швидкий запуск (рекомендовано)

1. Скопіюйте `.env.example` у `.env` (за потреби).
2. Запустіть:

```bat
run-local.bat
```

Батнік автоматично:

- перевірить Node/Python
- встановить `npm` та `pip` залежності (якщо ще не встановлені)
- застосує міграції Django
- запустить:
  - backend: `http://127.0.0.1:8000`
  - frontend: `http://127.0.0.1:3000`

## 4. Ручний запуск (альтернатива)

### 4.1 Backend

```bash
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 4.2 Frontend

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

## 5. Основні endpoint-и

- `GET /health/` — health-check
- `POST /api/auth/login/`
- `POST /api/auth/register/`
- `POST /api/auth/refresh/`
- `GET /api/auth/me/`
- `GET /api/books/`
- `GET /api/categories/`
- `GET /api/orders/`
- `GET /api/orders/my/`
- `POST /api/orders/checkout/`
- `PATCH /api/orders/{id}/`
- `GET /api/wishlist/`
- `POST /api/wishlist/`
- `DELETE /api/wishlist/{bookId}/`
- `GET /api/promo-codes/`

## 6. Змінні середовища

Мінімально важливі:

- `VITE_API_BASE_URL` (frontend)
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `DJANGO_LOG_LEVEL`

База даних:

- `DB_ENGINE=sqlite` або `DB_ENGINE=postgres`
- для postgres: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`

Повний список — у `.env.example`.

## 7. Тести та перевірки

Frontend typecheck:

```bash
npm run lint
```

Backend тести:

```bash
python manage.py test
```

CI pipeline запускається автоматично через GitHub Actions (`.github/workflows/ci.yml`) і перевіряє:

- frontend lint + build
- backend tests

## 8. Типові проблеми

### Помилка `No module named django`

Виконайте:

```bash
python -m pip install -r requirements.txt
```

### Frontend не бачить backend

Перевірте:

- backend запущений на `127.0.0.1:8000`
- `VITE_API_BASE_URL=http://127.0.0.1:8000/api`

### Помилки CORS

Додайте origin frontend у `CORS_ALLOWED_ORIGINS`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 9. Production нотатки

- Встановити `DJANGO_DEBUG=False`
- Вказати реальний `DJANGO_SECRET_KEY`
- Обмежити `DJANGO_ALLOWED_HOSTS` і `CORS_ALLOWED_ORIGINS`
- Увімкнути `SECURE_*` параметри під HTTPS
- Використовувати PostgreSQL замість SQLite
