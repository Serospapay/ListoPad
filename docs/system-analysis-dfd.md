# ListoPad — Data Flow Diagrams (DFD)

## Нотація

- `E*` — зовнішня сутність (External Entity)
- `P*` — процес (Process)
- `D*` — сховище даних (Data Store)

## DFD-0 (Context Diagram)

```mermaid
flowchart LR
  E1Guest["E1 Гість"]
  E2AuthUser["E2 Авторизований користувач"]
  E3Admin["E3 Адміністратор"]
  E4Notify["E4 Канал нотифікацій"]
  P0Platform["P0 Платформа ListoPad"]

  E1Guest -->|"Пошук, фільтри, перегляд книг"| P0Platform
  P0Platform -->|"Каталог, рейтинги, підтверджені відгуки"| E1Guest

  E2AuthUser -->|"Вхід, checkout, wishlist, відгук"| P0Platform
  P0Platform -->|"Профіль, історія замовлень, статуси"| E2AuthUser

  E3Admin -->|"Керування товарами, модерація, статуси"| P0Platform
  P0Platform -->|"CRM-аналітика, реєстр замовлень, черга модерації"| E3Admin

  P0Platform -->|"Події order_created/order_status_changed"| E4Notify
  E4Notify -->|"Повідомлення про замовлення"| E2AuthUser
```

## DFD-1 (System Decomposition)

```mermaid
flowchart TB
  E2User["E2 Користувач"]
  E3Admin["E3 Адміністратор"]

  P1Auth["P1 Auth і профіль"]
  P2Catalog["P2 Каталог і пошук"]
  P3Checkout["P3 Checkout і замовлення"]
  P4Reviews["P4 Відгуки і рейтинг"]
  P5AdminPanel["P5 Адмін-панель"]

  D1Users["D1 Users"]
  D2Books["D2 Books"]
  D3Orders["D3 Orders + OrderItems + StatusHistory"]
  D4BookReviews["D4 BookReviews"]
  D5Wishlist["D5 Wishlist"]
  D6Promo["D6 PromoCodes + Redemptions"]
  D7Inventory["D7 InventoryMovements"]
  D8EventsOutbox["D8 DomainEvents + NotificationOutbox"]

  E2User -->|"Логін/профіль"| P1Auth
  E2User -->|"Пошук/перегляд"| P2Catalog
  E2User -->|"Оформлення замовлення"| P3Checkout
  E2User -->|"Оцінка і коментар"| P4Reviews

  E3Admin -->|"Операції адміна"| P5AdminPanel
  E3Admin -->|"Модерація відгуків"| P4Reviews
  E3Admin -->|"Оновлення статусів замовлень"| P3Checkout

  P1Auth <--> D1Users
  P2Catalog <--> D2Books
  P2Catalog <--> D5Wishlist

  P3Checkout <--> D2Books
  P3Checkout <--> D3Orders
  P3Checkout <--> D6Promo
  P3Checkout <--> D7Inventory
  P3Checkout --> D8EventsOutbox

  P4Reviews <--> D4BookReviews
  P4Reviews --> D2Books

  P5AdminPanel --> D2Books
  P5AdminPanel --> D3Orders
  P5AdminPanel --> D4BookReviews
  P5AdminPanel --> D8EventsOutbox
```

## DFD-2A (Checkout та життєвий цикл замовлення, деталізація P3)

```mermaid
flowchart LR
  E2Buyer["E2 Користувач"]
  E3Manager["E3 Адміністратор"]

  P31Checkout["P3.1 Checkout API"]
  P32Status["P3.2 Status Engine"]

  D2Books["D2 Books"]
  D3Orders["D3 Orders + Items + History"]
  D6Promo["D6 PromoCodes + Redemptions"]
  D7Inv["D7 InventoryMovements"]
  D8Outbox["D8 DomainEvents + NotificationOutbox"]

  E2Buyer -->|"Кошик, доставка, оплата, промокод"| P31Checkout
  P31Checkout -->|"Перевірка залишків і цін"| D2Books
  P31Checkout -->|"Валідація промокоду і лімітів"| D6Promo
  P31Checkout -->|"Створення order + items + history(ordered)"| D3Orders
  P31Checkout -->|"Reserve рухи складу"| D7Inv
  P31Checkout -->|"Подія order_created"| D8Outbox
  P31Checkout -->|"Підтвердження оформлення"| E2Buyer

  E3Manager -->|"Команда переходу статусу"| P32Status
  P32Status -->|"Оновлення status + history"| D3Orders
  P32Status -->|"Debit/Release/Restock"| D7Inv
  P32Status -->|"Подія order_status_changed"| D8Outbox
  P32Status -->|"Оновлений статус"| E2Buyer
```

## DFD-2B (Відгуки, модерація, рейтинг, деталізація P4)

```mermaid
flowchart LR
  E2Reviewer["E2 Авторизований користувач"]
  E3Moderator["E3 Адміністратор"]
  E1Public["E1 Будь-який відвідувач"]

  P41Submit["P4.1 Submit Review"]
  P42Moderate["P4.2 Moderation"]
  P43Aggregate["P4.3 Rating Aggregator"]
  P44PublicApi["P4.4 Public Reviews API"]

  D4Reviews["D4 BookReviews"]
  D2Books["D2 Books (rating, reviewsCount)"]

  E2Reviewer -->|"Оцінка 1..5 + коментар"| P41Submit
  P41Submit -->|"Upsert review зі статусом pending"| D4Reviews

  E3Moderator -->|"Approve/Reject + moderation_note"| P42Moderate
  P42Moderate -->|"Оновлення статусу review"| D4Reviews
  P42Moderate -->|"Тригер перерахунку"| P43Aggregate
  P43Aggregate -->|"Середній рейтинг тільки з approved"| D2Books

  E1Public -->|"Запит публічних відгуків"| P44PublicApi
  P44PublicApi -->|"Читання тільки approved"| D4Reviews
  P44PublicApi -->|"Відгуки + агрегований рейтинг"| E1Public
```
