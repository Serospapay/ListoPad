from decimal import Decimal

from django.core.management.base import BaseCommand

from backend.models import Book, Category


def _cover(isbn13: str) -> str:
    digits = ''.join(c for c in isbn13 if c.isdigit())
    return f'https://covers.openlibrary.org/b/isbn/{digits}-L.jpg'


# Реальні книги: відомі автори, класичні твори та бестселери; ISBN — для обкладинок Open Library;
# рік — перше видання оригіналу або типовий рік канонічного тексту; видавництво — приклад відомого світового/українського бренду видання.
DEMO_BOOKS = [
    {
        'title': '1984',
        'author': 'Джордж Орвелл',
        'price': Decimal('320.00'),
        'inventory': 28,
        'description': (
            'Антиутопічний роман 1949 року про тоталітарний нагляд, мову правди та роль пам’яті. '
            'Один із найцитованих творів ХХ століття.'
        ),
        'cover_image': _cover('9780141187761'),
        'pages': 328,
        'year': 1949,
        'publisher': 'Penguin Books',
        'cover': 'М’яка',
        'format': '129x198 мм',
        'weight': '280 г',
        'rating': 4.7,
        'categories': ['Класика', 'Проза'],
    },
    {
        'title': 'Гаррі Поттер і філософський камінь',
        'author': 'Дж. К. Ролінг',
        'price': Decimal('450.00'),
        'inventory': 40,
        'description': (
            'Перший роман серії про юного чарівника та школу чарів і чаклунства «Гоґвортс». '
            'Видано у 1997 році в Великій Британії.'
        ),
        'cover_image': _cover('9780747532743'),
        'pages': 223,
        'year': 1997,
        'publisher': 'Bloomsbury',
        'cover': 'Тверда',
        'format': '130x198 мм',
        'weight': '410 г',
        'rating': 4.8,
        'categories': ['Фентезі', 'Підліткова література'],
    },
    {
        'title': 'Хобіт, або Туди й назад',
        'author': 'Дж. Р. Р. Толкін',
        'price': Decimal('380.00'),
        'inventory': 22,
        'description': (
            'Фентезі-роман 1937 року про подорож Більбо Беґінса — класика жанру та пролог до «Володаря перснів».'
        ),
        'cover_image': _cover('9780547928227'),
        'pages': 300,
        'year': 1937,
        'publisher': 'Houghton Mifflin Harcourt',
        'cover': 'М’яка',
        'format': '140x210 мм',
        'weight': '420 г',
        'rating': 4.7,
        'categories': ['Фентезі', 'Класика'],
    },
    {
        'title': '451 градус за Фаренгейтом',
        'author': 'Рей Бредбері',
        'price': Decimal('310.00'),
        'inventory': 18,
        'description': (
            'Науково-фантастичний роман 1953 року про суспільство, що спалює книги, та роль культури пам’яті.'
        ),
        'cover_image': _cover('9781451673319'),
        'pages': 256,
        'year': 1953,
        'publisher': 'Simon & Schuster',
        'cover': 'М’яка',
        'format': '135x203 мм',
        'weight': '260 г',
        'rating': 4.6,
        'categories': ['Наукова фантастика', 'Класика'],
    },
    {
        'title': 'Гордість і упередження',
        'author': 'Джейн Остін',
        'price': Decimal('290.00'),
        'inventory': 25,
        'description': (
            'Роман 1813 року про стосунки та шлюб у англійському суспільстві на початку XIX століття.'
        ),
        'cover_image': _cover('9780141439518'),
        'pages': 432,
        'year': 1813,
        'publisher': 'Penguin Classics',
        'cover': 'М’яка',
        'format': '129x198 мм',
        'weight': '320 г',
        'rating': 4.6,
        'categories': ['Класика', 'Роман'],
    },
    {
        'title': 'Вбити пересмішника',
        'author': 'Харпер Лі',
        'price': Decimal('340.00'),
        'inventory': 20,
        'description': (
            'Роман 1960 року про дитинство в Алабамі, расову несправедливість і моральний вибір. '
            'Лауреат Пулітцерівської премії.'
        ),
        'cover_image': _cover('9780061120084'),
        'pages': 336,
        'year': 1960,
        'publisher': 'Harper Perennial',
        'cover': 'М’яка',
        'format': '135x203 мм',
        'weight': '300 г',
        'rating': 4.8,
        'categories': ['Класика', 'Проза'],
    },
    {
        'title': 'Sapiens. Коротка історія людства',
        'author': 'Ювал Ної Харарі',
        'price': Decimal('520.00'),
        'inventory': 35,
        'description': (
            'Нон-фікшн 2011 року: еволюція Homo sapiens, аграрна революція, об’єднання мас людей ідеями.'
        ),
        'cover_image': _cover('9780062316110'),
        'pages': 464,
        'year': 2011,
        'publisher': 'Harper',
        'cover': 'М’яка',
        'format': '152x229 мм',
        'weight': '540 г',
        'rating': 4.6,
        'categories': ['Нон-фікшн', 'Історія'],
    },
    {
        'title': 'Атомні звички',
        'author': 'Джеймс Клір',
        'price': Decimal('480.00'),
        'inventory': 42,
        'description': (
            'Практична книга 2018 року про малі щоденні зміни, систему звичок і накопичувальний ефект у часі.'
        ),
        'cover_image': _cover('9780735211292'),
        'pages': 320,
        'year': 2018,
        'publisher': 'Avery',
        'cover': 'Тверда',
        'format': '152x229 мм',
        'weight': '520 г',
        'rating': 4.7,
        'categories': ['Нон-фікшн', 'Саморозвиток'],
    },
    {
        'title': 'Мислення швидко й повільно',
        'author': 'Даніель Канеман',
        'price': Decimal('560.00'),
        'inventory': 15,
        'description': (
            'Підсумок досліджень Нобелівського лауреата з економіки: інтуїція, упередження та раціональний вибір.'
        ),
        'cover_image': _cover('9780374275631'),
        'pages': 499,
        'year': 2011,
        'publisher': 'Farrar, Straus and Giroux',
        'cover': 'М’яка',
        'format': '152x229 мм',
        'weight': '580 г',
        'rating': 4.6,
        'categories': ['Нон-фікшн', 'Психологія'],
    },
    {
        'title': 'Майстер і Маргарита',
        'author': 'Михайло Булгаков',
        'price': Decimal('360.00'),
        'inventory': 24,
        'description': (
            'Роман, написаний у 1928–1940 роках; сатирична історія про диявола в Москві 1930-х та драму Понтія Пилата.'
        ),
        'cover_image': _cover('9780679730158'),
        'pages': 432,
        'year': 1967,
        'publisher': 'Vintage International',
        'cover': 'М’яка',
        'format': '130x203 мм',
        'weight': '380 г',
        'rating': 4.8,
        'categories': ['Класика', 'Проза'],
    },
    {
        'title': 'Сто років самотності',
        'author': 'Габрієль Гарсіа Маркес',
        'price': Decimal('410.00'),
        'inventory': 19,
        'description': (
            'Роман 1967 року, Нобелівська премія 1982; хроніка роду Буендіа у вигаданому містечку Макондо.'
        ),
        'cover_image': _cover('9780060883287'),
        'pages': 417,
        'year': 1967,
        'publisher': 'Harper Perennial',
        'cover': 'М’яка',
        'format': '135x203 мм',
        'weight': '360 г',
        'rating': 4.7,
        'categories': ['Класика', 'Магічний реалізм'],
    },
    {
        'title': 'Маленький принц',
        'author': 'Антуан де Сент-Екзюпері',
        'price': Decimal('220.00'),
        'inventory': 50,
        'description': (
            'Повість-казка 1943 року льотчика й письменника; роздуми про дружбу, відповідальність і дитячий погляд.'
        ),
        'cover_image': _cover('9780152048044'),
        'pages': 96,
        'year': 1943,
        'publisher': 'Houghton Mifflin Harcourt',
        'cover': 'М’яка',
        'format': '130x198 мм',
        'weight': '120 г',
        'rating': 4.8,
        'categories': ['Класика', 'Дитяча література'],
    },
    {
        'title': 'Злочин і кара',
        'author': 'Федір Достоєвський',
        'price': Decimal('395.00'),
        'inventory': 21,
        'description': (
            'Роман 1866 року про Раскольникова та моральні наслідки «дозволеного» злочину заради ідеї.'
        ),
        'cover_image': _cover('9780140449136'),
        'pages': 671,
        'year': 1866,
        'publisher': 'Penguin Classics',
        'cover': 'М’яка',
        'format': '129x198 мм',
        'weight': '480 г',
        'rating': 4.7,
        'categories': ['Класика', 'Роман'],
    },
    {
        'title': 'Кобзар',
        'author': 'Тарас Шевченко',
        'price': Decimal('280.00'),
        'inventory': 33,
        'description': (
            'Збірка поезії Тараса Шевченка — фундамент української літературної мови та національного відродження XIX ст.'
        ),
        'cover_image': _cover('9789661016892'),
        'pages': 384,
        'year': 1840,
        'publisher': 'Видавництво Старого Лева',
        'cover': 'Тверда',
        'format': '145x215 мм',
        'weight': '520 г',
        'rating': 4.9,
        'categories': ['Поезія', 'Українська література'],
    },
    {
        'title': 'Тіні забутих предків',
        'author': 'Михайло Коцюбинський',
        'price': Decimal('265.00'),
        'inventory': 16,
        'description': (
            'Повість 1911 року про життя гуцулів у Карпатах, любов і вічні образи гірського фольклору.'
        ),
        'cover_image': _cover('9789660368724'),
        'pages': 176,
        'year': 1911,
        'publisher': 'Фоліо',
        'cover': 'М’яка',
        'format': '165x240 мм',
        'weight': '240 г',
        'rating': 4.7,
        'categories': ['Класика', 'Українська література'],
    },
    {
        'title': 'Лісова пісня',
        'author': 'Леся Українка',
        'price': Decimal('240.00'),
        'inventory': 27,
        'description': (
            'Драма-феєрія 1911 року на міфологічні мотиви; дія у вигаданих лісових просторах і світі духів природи.'
        ),
        'cover_image': _cover('9789661015552'),
        'pages': 112,
        'year': 1911,
        'publisher': 'Видавництво Старого Лева',
        'cover': 'М’яка',
        'format': '145x215 мм',
        'weight': '200 г',
        'rating': 4.8,
        'categories': ['Драма', 'Українська література'],
    },
    {
        'title': 'Homo Deus. Людство завтра',
        'author': 'Ювал Ної Харарі',
        'price': Decimal('510.00'),
        'inventory': 30,
        'description': (
            'Продовження «Sapiens»: технології, довголіття, алгоритми та виклики майбутнього для людства.'
        ),
        'cover_image': _cover('9780062464345'),
        'pages': 448,
        'year': 2015,
        'publisher': 'Harper',
        'cover': 'М’яка',
        'format': '152x229 мм',
        'weight': '520 г',
        'rating': 4.5,
        'categories': ['Нон-фікшн', 'Історія'],
    },
    {
        'title': 'Старий і море',
        'author': 'Ернест Хемінгуей',
        'price': Decimal('275.00'),
        'inventory': 23,
        'description': (
            'Повість 1952 року про рибалку Сантьяго та боротьбу з марліном; Пулітцерівська премія 1953 року.'
        ),
        'cover_image': _cover('9780684801223'),
        'pages': 127,
        'year': 1952,
        'publisher': 'Scribner',
        'cover': 'М’яка',
        'format': '130x198 мм',
        'weight': '140 г',
        'rating': 4.6,
        'categories': ['Класика', 'Проза'],
    },
    {
        'title': 'Дюна',
        'author': 'Френк Герберт',
        'price': Decimal('540.00'),
        'inventory': 31,
        'description': (
            'Науково-фантастичний роман 1965 року про боротьбу за планету Арракіс, владу, ресурси та екологію.'
        ),
        'cover_image': _cover('9780441013593'),
        'pages': 688,
        'year': 1965,
        'publisher': 'Ace',
        'cover': 'М’яка',
        'format': '152x229 мм',
        'weight': '710 г',
        'rating': 4.8,
        'categories': ['Наукова фантастика', 'Класика'],
    },
    {
        'title': 'Володар перснів',
        'author': 'Дж. Р. Р. Толкін',
        'price': Decimal('890.00'),
        'inventory': 17,
        'description': (
            'Епічна трилогія 1954-1955 років про знищення Персня Всевладдя та подорож Братства у Середзем’ї.'
        ),
        'cover_image': _cover('9780544003415'),
        'pages': 1216,
        'year': 1954,
        'publisher': 'Mariner Books',
        'cover': 'Тверда',
        'format': '156x235 мм',
        'weight': '1200 г',
        'rating': 4.9,
        'categories': ['Фентезі', 'Класика'],
    },
    {
        'title': 'Ловець у житі',
        'author': 'Дж. Д. Селінджер',
        'price': Decimal('335.00'),
        'inventory': 21,
        'description': (
            'Роман 1951 року про підлітка Голдена Колфілда, відчуження та пошук ідентичності.'
        ),
        'cover_image': _cover('9780316769488'),
        'pages': 277,
        'year': 1951,
        'publisher': 'Little, Brown and Company',
        'cover': 'М’яка',
        'format': '132x201 мм',
        'weight': '250 г',
        'rating': 4.4,
        'categories': ['Класика', 'Підліткова література'],
    },
    {
        'title': 'Яскравий новий світ',
        'author': 'Олдос Гакслі',
        'price': Decimal('325.00'),
        'inventory': 20,
        'description': (
            'Антиутопія 1932 року про технологічно кероване суспільство, контроль і втрату свободи вибору.'
        ),
        'cover_image': _cover('9780060850524'),
        'pages': 288,
        'year': 1932,
        'publisher': 'Harper Perennial',
        'cover': 'М’яка',
        'format': '135x203 мм',
        'weight': '260 г',
        'rating': 4.5,
        'categories': ['Класика', 'Наукова фантастика'],
    },
    {
        'title': 'Алхімік',
        'author': 'Пауло Коельйо',
        'price': Decimal('300.00'),
        'inventory': 44,
        'description': (
            'Філософський роман 1988 року про пастуха Сантьяго, подорож до мрії та пошук власного шляху.'
        ),
        'cover_image': _cover('9780062315007'),
        'pages': 208,
        'year': 1988,
        'publisher': 'HarperOne',
        'cover': 'М’яка',
        'format': '129x198 мм',
        'weight': '210 г',
        'rating': 4.5,
        'categories': ['Проза', 'Саморозвиток'],
    },
    {
        'title': 'Ім’я троянди',
        'author': 'Умберто Еко',
        'price': Decimal('430.00'),
        'inventory': 14,
        'description': (
            'Історичний детектив 1980 року про серію загадкових смертей у монастирі XIV століття.'
        ),
        'cover_image': _cover('9780156001311'),
        'pages': 536,
        'year': 1980,
        'publisher': 'Mariner Books',
        'cover': 'М’яка',
        'format': '140x210 мм',
        'weight': '560 г',
        'rating': 4.6,
        'categories': ['Детектив', 'Історичний роман'],
    },
    {
        'title': 'Код да Вінчі',
        'author': 'Ден Браун',
        'price': Decimal('390.00'),
        'inventory': 26,
        'description': (
            'Трилер 2003 року з криптографічними загадками, символами мистецтва та таємними товариствами.'
        ),
        'cover_image': _cover('9780307474278'),
        'pages': 689,
        'year': 2003,
        'publisher': 'Anchor',
        'cover': 'М’яка',
        'format': '135x203 мм',
        'weight': '620 г',
        'rating': 4.4,
        'categories': ['Трилер', 'Детектив'],
    },
    {
        'title': 'Дівчина з тату дракона',
        'author': 'Стіг Ларссон',
        'price': Decimal('410.00'),
        'inventory': 18,
        'description': (
            'Скандинавський детектив 2005 року про розслідування зникнення та корпоративні злочини.'
        ),
        'cover_image': _cover('9780307949486'),
        'pages': 672,
        'year': 2005,
        'publisher': 'Vintage Crime/Black Lizard',
        'cover': 'М’яка',
        'format': '135x203 мм',
        'weight': '630 г',
        'rating': 4.5,
        'categories': ['Детектив', 'Трилер'],
    },
    {
        'title': 'Крадійка книжок',
        'author': 'Маркус Зузак',
        'price': Decimal('370.00'),
        'inventory': 29,
        'description': (
            'Роман 2005 року про дівчинку в Німеччині часів Другої світової війни; оповідачем виступає Смерть.'
        ),
        'cover_image': _cover('9780375842207'),
        'pages': 592,
        'year': 2005,
        'publisher': 'Knopf Books for Young Readers',
        'cover': 'М’яка',
        'format': '140x210 мм',
        'weight': '590 г',
        'rating': 4.7,
        'categories': ['Історичний роман', 'Проза'],
    },
    {
        'title': 'Ловець повітряних зміїв',
        'author': 'Халед Хоссейні',
        'price': Decimal('360.00'),
        'inventory': 22,
        'description': (
            'Роман 2003 року про дружбу, провину і спокуту на тлі подій в Афганістані другої половини ХХ століття.'
        ),
        'cover_image': _cover('9781594631931'),
        'pages': 401,
        'year': 2003,
        'publisher': 'Riverhead Books',
        'cover': 'М’яка',
        'format': '132x201 мм',
        'weight': '370 г',
        'rating': 4.7,
        'categories': ['Проза', 'Історичний роман'],
    },
    {
        'title': 'Дорога',
        'author': 'Кормак Маккарті',
        'price': Decimal('330.00'),
        'inventory': 12,
        'description': (
            'Постапокаліптичний роман 2006 року про батька і сина, що виживають у зруйнованому світі.'
        ),
        'cover_image': _cover('9780307387899'),
        'pages': 304,
        'year': 2006,
        'publisher': 'Vintage',
        'cover': 'М’яка',
        'format': '129x198 мм',
        'weight': '280 г',
        'rating': 4.4,
        'categories': ['Проза', 'Наукова фантастика'],
    },
    {
        'title': 'Чистий код',
        'author': 'Роберт Мартін',
        'price': Decimal('760.00'),
        'inventory': 27,
        'description': (
            'Практичний посібник 2008 року з інженерії ПЗ: іменування, архітектурні принципи та підтримуваний код.'
        ),
        'cover_image': _cover('9780132350884'),
        'pages': 464,
        'year': 2008,
        'publisher': 'Prentice Hall',
        'cover': 'М’яка',
        'format': '178x235 мм',
        'weight': '780 г',
        'rating': 4.8,
        'categories': ['IT', 'Нон-фікшн'],
    },
    {
        'title': 'The Pragmatic Programmer',
        'author': 'Andrew Hunt, David Thomas',
        'price': Decimal('820.00'),
        'inventory': 19,
        'description': (
            'Оновлене видання 2019 року про інженерні практики, мислення розробника та побудову надійних систем.'
        ),
        'cover_image': _cover('9780135957059'),
        'pages': 352,
        'year': 2019,
        'publisher': 'Addison-Wesley Professional',
        'cover': 'М’яка',
        'format': '178x235 мм',
        'weight': '690 г',
        'rating': 4.9,
        'categories': ['IT', 'Нон-фікшн'],
    },
    {
        'title': 'Deep Work. Зосереджена робота',
        'author': 'Кел Ньюпорт',
        'price': Decimal('470.00'),
        'inventory': 34,
        'description': (
            'Книга 2016 року про концентрацію, мінімізацію відволікань і підвищення якості інтелектуальної праці.'
        ),
        'cover_image': _cover('9781455586691'),
        'pages': 304,
        'year': 2016,
        'publisher': 'Grand Central Publishing',
        'cover': 'Тверда',
        'format': '152x229 мм',
        'weight': '470 г',
        'rating': 4.6,
        'categories': ['Саморозвиток', 'Нон-фікшн'],
    },
    {
        'title': 'Zero to One',
        'author': 'Peter Thiel, Blake Masters',
        'price': Decimal('450.00'),
        'inventory': 23,
        'description': (
            'Бізнес-книга 2014 року про створення інноваційних компаній, монополії та цінність унікальних ідей.'
        ),
        'cover_image': _cover('9780804139298'),
        'pages': 224,
        'year': 2014,
        'publisher': 'Crown Business',
        'cover': 'Тверда',
        'format': '145x215 мм',
        'weight': '380 г',
        'rating': 4.5,
        'categories': ['Бізнес', 'Нон-фікшн'],
    },
    {
        'title': 'Багатий тато, бідний тато',
        'author': 'Роберт Кійосакі',
        'price': Decimal('390.00'),
        'inventory': 39,
        'description': (
            'Популярна книга 1997 року про фінансову грамотність, активи/пасиви та підхід до особистих фінансів.'
        ),
        'cover_image': _cover('9781612680194'),
        'pages': 336,
        'year': 1997,
        'publisher': 'Plata Publishing',
        'cover': 'М’яка',
        'format': '140x210 мм',
        'weight': '350 г',
        'rating': 4.3,
        'categories': ['Бізнес', 'Саморозвиток'],
    },
    {
        'title': 'Людина в пошуках справжнього сенсу',
        'author': 'Віктор Франкл',
        'price': Decimal('345.00'),
        'inventory': 28,
        'description': (
            'Психологічний нон-фікшн 1946 року про досвід концтаборів і логотерапію як пошук сенсу життя.'
        ),
        'cover_image': _cover('9780807014295'),
        'pages': 184,
        'year': 1946,
        'publisher': 'Beacon Press',
        'cover': 'М’яка',
        'format': '129x198 мм',
        'weight': '190 г',
        'rating': 4.9,
        'categories': ['Психологія', 'Нон-фікшн'],
    },
    {
        'title': 'Норвезький ліс',
        'author': 'Харукі Муракамі',
        'price': Decimal('355.00'),
        'inventory': 24,
        'description': (
            'Роман 1987 року про дорослішання, втрату та крихкість стосунків у Токіо кінця 1960-х.'
        ),
        'cover_image': _cover('9780375704024'),
        'pages': 296,
        'year': 1987,
        'publisher': 'Vintage',
        'cover': 'М’яка',
        'format': '132x201 мм',
        'weight': '280 г',
        'rating': 4.5,
        'categories': ['Проза', 'Сучасна література'],
    },
    {
        'title': 'Kafka on the Shore',
        'author': 'Haruki Murakami',
        'price': Decimal('420.00'),
        'inventory': 18,
        'description': (
            'Роман 2002 року з елементами магічного реалізму: паралельні історії, пам’ять і доля.'
        ),
        'cover_image': _cover('9781400079278'),
        'pages': 505,
        'year': 2002,
        'publisher': 'Vintage',
        'cover': 'М’яка',
        'format': '132x201 мм',
        'weight': '490 г',
        'rating': 4.6,
        'categories': ['Сучасна література', 'Магічний реалізм'],
    },
]


class Command(BaseCommand):
    help = 'Додає у каталог демонстраційні позиції з реальними книгами (пропускає вже наявні за парою «назва + автор»).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Оновити поля, якщо книга з такою назвою й автором уже є.',
        )

    def handle(self, *args, **options):
        force: bool = options['force']
        created_n = 0
        updated_n = 0
        skipped_n = 0

        for row in DEMO_BOOKS:
            cat_names = row.get('categories', [])
            categories = []
            for name in cat_names:
                cat, _ = Category.objects.get_or_create(name=name)
                categories.append(cat)

            data = {k: v for k, v in row.items() if k != 'categories'}
            title = data['title']
            author = data['author']

            existing = Book.objects.filter(title=title, author=author).first()
            if existing and not force:
                skipped_n += 1
                continue

            if existing and force:
                for field, value in data.items():
                    setattr(existing, field, value)
                existing.save()
                existing.categories.set(categories)
                updated_n += 1
                continue

            book = Book.objects.create(**data)
            book.categories.set(categories)
            created_n += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Готово: створено {created_n}, оновлено {updated_n}, пропущено (вже є) {skipped_n}.'
            )
        )
