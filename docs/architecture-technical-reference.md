# ListoPad: технічний референс архітектури та потоків даних

## 1. Системний профіль

| Параметр | Значення |
| --- | --- |
| Тип системи | Full-stack SPA + REST API |
| Frontend | React 19, TypeScript, Vite |
| Backend | Django 5.2, DRF, JWT (SimpleJWT) |
| Основна БД | MongoDB (`django-mongodb-backend`) |
| Альтернативні БД | PostgreSQL, SQLite |
| Транспорт | HTTP/JSON |
| Архітектурний стиль | Компонентний frontend + доменний backend |

## 2. Архітектурні шари

| Шар | Основні каталоги/файли | Відповідальність |
| --- | --- | --- |
| UI (Presentation) | `components/*`, `App.tsx` | Рендеринг, маршрути, UX-стани, форми |
| API Client | `services/api.ts` | Єдиний gateway запитів, токени, retry, нормалізація payload |
| Contracts | `types.ts` | Типи DTO, доменні структури на frontend |
| API Layer | `backend/views.py`, `backend/serializers.py` | Валідація, маршрути, трансформація даних |
| Domain Layer | `backend/domain/*` | Бізнес-правила (orders, reviews, events, notifications) |
| Persistence | `backend/models.py` | Сутності, індекси, зв'язки, обмеження |
| Ops/Test | `backend/tests.py`, `e2e/smoke.spec.ts`, `backend/management/commands/*` | Тести, демо-сидінг, стабілізація середовища |

## 3. Основні сутності даних

| Сутність | Ключові поля | Ключові зв'язки/обмеження |
| --- | --- | --- |
| `Book` | `title`, `author`, `price`, `inventory`, `rating`, `review_count` | M2M з `Category`; індекси `inventory/title/author/rating` |
| `Category` | `name` | `name` унікальний |
| `Order` | `customer_id`, `status`, `total_amount`, `idempotency_key` | FK на `User`; `idempotency_key` унікальний |
| `OrderItem` | `order`, `book`, `quantity`, `line_total` | FK на `Order` і `Book` |
| `OrderStatusHistory` | `order`, `from_status`, `to_status`, `changed_at` | Історія переходів статусу |
| `InventoryMovement` | `book`, `order`, `movement_type`, `quantity` | Типи: `reserve/debit/restock/release/adjust` |
| `PromoCode` | `code`, `discount_type`, `value`, `min_order_amount`, `per_user_limit` | `code` унікальний |
| `PromoCodeRedemption` | `promo_code`, `user`, `order` | Трекінг фактичного використання промо |
| `WishlistItem` | `user`, `book` | Унікальна пара `user + book` |
| `BookReview` | `book`, `user`, `rating`, `status`, `moderation_note` | Унікальна пара `book + user`; стани `pending/approved/rejected` |
| `DomainEvent` | `event_type`, `aggregate_type`, `aggregate_id`, `payload` | Журнал доменних подій |
| `NotificationOutbox` | `notification_type`, `recipient`, `status` | Статуси доставки `pending/sent/failed` |

## 4. Матриця ролей і доступів

| Ресурс/операція | Гість | Авторизований user | Адмін |
| --- | ---: | ---: | ---: |
| Перегляд каталогу `GET /api/books/` | Так | Так | Так |
| Створення/редагування книги | Ні | Ні | Так |
| Публічні відгуки книги `GET /api/books/{id}/reviews/` | Так | Так | Так |
| Створити відгук `POST /api/books/{id}/reviews/` | Ні | Так | Так |
| Модерація відгуків `/api/book-reviews/*` | Ні | Ні | Так |
| Checkout `/api/orders/checkout/` | Ні | Так | Так |
| Мої замовлення `/api/orders/my/` | Ні | Так | Так |
| Адмін-реєстр замовлень `/api/orders/` | Ні | Ні | Так |
| Wishlist `/api/wishlist/*` | Ні | Так | Так |
| CRM аналітика `/api/analytics/crm/` | Ні | Ні | Так |
| Диспетчеризація outbox `/api/notifications/dispatch/` | Ні | Ні | Так |

## 5. Каталог API-ендпойнтів (поточний контракт)

### 5.1 Auth / Session

| Метод | Шлях | Призначення |
| --- | --- | --- |
| `POST` | `/api/auth/login/` | Отримання JWT-пари |
| `POST` | `/api/auth/refresh/` | Ротація access-токена |
| `POST` | `/api/auth/register/` | Реєстрація + стартова JWT-пара |
| `GET` | `/api/auth/me/` | Профіль поточного користувача |
| `GET` | `/api/auth/demo-accounts/` | Автогенерація/видача демо-акаунтів |

### 5.2 Catalog / Content

| Метод | Шлях | Призначення |
| --- | --- | --- |
| `GET/POST` | `/api/books/` | Каталог / створення книги |
| `GET/PUT/PATCH/DELETE` | `/api/books/{id}/` | Операції з конкретною книгою |
| `GET/POST` | `/api/books/{id}/reviews/` | Публічні відгуки / submit відгуку |
| `GET/PATCH` | `/api/book-reviews/` / `/api/book-reviews/{id}/` | Адмін-модерація відгуків |
| `GET/POST/DELETE` | `/api/categories/` | Довідник категорій |

### 5.3 Orders / Checkout

| Метод | Шлях | Призначення |
| --- | --- | --- |
| `POST` | `/api/orders/checkout/` | Створення замовлення (ідемпотентний checkout) |
| `POST` | `/api/orders/checkout-preview/` | Попередній розрахунок totals |
| `GET` | `/api/orders/my/` | Замовлення поточного користувача |
| `GET` | `/api/orders/` | Адмін-реєстр замовлень |
| `PATCH` | `/api/orders/{id}/` | Зміна статусу (адмін) |

### 5.4 User Ops / CRM / Health

| Метод | Шлях | Призначення |
| --- | --- | --- |
| `GET/POST/DELETE` | `/api/wishlist/` / `/api/wishlist/{bookId}/` | Список бажаного |
| `GET` | `/api/promo-codes/` | Активні промокоди |
| `GET` | `/api/users/` | Список користувачів (адмін) |
| `GET` | `/api/analytics/crm/` | Агрегована CRM-аналітика |
| `POST` | `/api/notifications/dispatch/` | Примусовий запуск outbox-dispatch |
| `GET` | `/health/` | Health-check застосунку |

## 6. Ключові потоки даних

| ID | Потік | Вхід | Вихід | Сховища |
| --- | --- | --- | --- | --- |
| `F1` | Каталог/пошук | `q, category, price, year, rating, publisher` | Відфільтрований список `Book[]` | `Book`, `Category` |
| `F2` | Checkout | кошик + методи доставки/оплати + promo | `orderId`, `order`, оновлений склад | `Order`, `OrderItem`, `InventoryMovement`, `PromoCode*` |
| `F3` | Preview totals | кошик + доставка + promo | `subtotal/shipping/discount/total` | `Book`, `PromoCode*` |
| `F4` | Статус замовлення | `orderId`, `new_status` | оновлений `OrderDetail` + history | `Order`, `OrderStatusHistory`, `InventoryMovement` |
| `F5` | Submit review | `rating`, `comment` (auth user) | review зі статусом `pending` | `BookReview` |
| `F6` | Moderation review | `status`, `moderation_note` (admin) | модераційний результат + оновлений рейтинг книги | `BookReview`, `Book` |
| `F7` | Public reviews | `bookId` | лише `approved` відгуки + агрегований рейтинг | `BookReview`, `Book` |
| `F8` | Outbox dispatch | pending notifications | batch-обробка відправок | `NotificationOutbox`, `DomainEvent` |

## 7. Машини станів

### 7.1 Order status transition graph

| Поточний стан | Дозволені наступні |
| --- | --- |
| `ordered` | `paid`, `cancelled` |
| `paid` | `packed`, `cancelled` |
| `packed` | `shipped`, `cancelled` |
| `shipped` | `delivered` |
| `delivered` | `closed` |
| `closed` | — |
| `cancelled` | — |

### 7.2 Review moderation states

| Поточний стан | Можливі переходи |
| --- | --- |
| `pending` | `approved` / `rejected` / `pending` |
| `approved` | `pending` / `rejected` / `approved` |
| `rejected` | `pending` / `approved` / `rejected` |

## 8. Надійність, консистентність, контроль

| Механізм | Реалізація | Призначення |
| --- | --- | --- |
| Idempotency checkout | `Order.idempotency_key` + перевірка перед створенням | Захист від дубль-замовлень |
| Domain errors contract | `detail + code + fields` | Детермінований контракт помилок для frontend |
| Token auto-refresh | `services/api.ts` (`401 -> refresh -> retry`) | Безперервність сесії |
| Retry policy | backoff для `429/5xx` | Стійкість до тимчасових збоїв |
| Inventory movement log | `reserve/debit/release/restock` | Аудит і контроль складських операцій |
| Review moderation gate | Публікація лише `approved` | Контроль якості контенту |

## 9. Конфігурація середовища

| Група | Ключі |
| --- | --- |
| Frontend | `VITE_API_BASE_URL` |
| Core Django | `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_LOG_LEVEL` |
| CORS | `CORS_ALLOWED_ORIGINS` |
| DB selector | `DB_ENGINE` (`mongodb` / `postgres` / `sqlite`) |
| Mongo | `MONGODB_URI`, `MONGODB_NAME` |
| Postgres | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` |

## 10. Контрольний чек-лист архітектури (операційний)

| Перевірка | Статус/критерій |
| --- | --- |
| API доступний | `GET /health/` повертає `status=ok` |
| JWT контур | login + refresh + me працюють без розсинхрону |
| Checkout | idempotency і status transition валідні |
| Reviews | submit/moderation/public filter консистентні |
| Inventory | рухи коректно відображаються при `paid/cancelled` |
| UI contract | frontend отримує уніфіковані DTO і `ApiErrorShape` |
| Тести | backend unit/integration + e2e smoke проходять |
