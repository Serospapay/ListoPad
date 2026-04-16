# ADR-001: Архітектура ЛистоПад (backend + frontend)

## Статус

Прийнято.

## Контекст

Потрібна наскрізна модель e-commerce для книжкового видавництва: каталог, кошик, оформлення замовлення, ролі користувачів, аналітика для адміністрації, інтеграція з MongoDB-first середовищем.

## Рішення

### Backend (Django REST Framework)

- **Доменний шар** у `backend/domain/`: каталог (`catalog.py`), замовлення з ідемпотентним checkout (`orders.py`), події зміни стану (`events.py`), черга сповіщень через outbox (`notifications.py`).
- **API**: ресурси DRF для книг, категорій, замовлень, wishlist, промокодів; окремі ендпоінти `/api/analytics/crm/`, `/api/notifications/dispatch/`, `/health/` з перевіркою БД.
- **RBAC**: `IsAdminOrReadOnly` для каталогу, `IsAdminOnly` для списку користувачів, замовлень (admin), аналітики та диспатчу outbox.
- **Checkout**: обов’язковий `Idempotency-Key` (заголовок або поле `idempotencyKey` у тілі) для запобігання подвійним списанням зі складу.
- **Спостережуваність**: middleware `RequestIdMiddleware`, заголовок `X-Request-Id`, структуровані логи в консоль.

### Frontend (React + Vite)

- **Маршрутизація**: React Router (`BrowserRouter` у `index.tsx`), lazy-завантаження адмін-модулів.
- **Стійкість**: `ErrorBoundary`, персист кошика в `localStorage` (`lystopad_cart_v2`).
- **Клієнт**: `fetch` з обробкою помилок у сервісах; списки з підтримкою DRF pagination.

### Тестування

- **Backend**: `python manage.py test` у CI проти контейнера MongoDB (`DB_ENGINE=mongodb`).
- **Frontend**: Vitest для утиліт (наприклад, `unwrapList`).
- **E2E**: Playwright smoke (завантаження головної сторінки).

### Залежності Python

- `requirements.txt`: **Django 5.2** та офіційний **`django-mongodb-backend`** (MongoDB Inc.), `pymongo` — без застарілого **djongo** (він несумісний із Django 4.2+ і Python 3.13+).
- Опційно `DB_ENGINE=sqlite` лише для швидких тестів без живого MongoDB.

## Наслідки

- Поділ доменної логіки спрощує розширення статусів замовлення і подій.
- Ідемпотентність checkout знижує ризик дублікатів при повторних запитах.
- Додаткові інтеграційні сценарії варто ганяти на staging з тим самим рядком підключення, що й у проді.
