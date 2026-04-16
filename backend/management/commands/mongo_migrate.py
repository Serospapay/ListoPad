import pymongo.errors
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand
from pymongo import MongoClient


def _is_recoverable_mongo_conflict(exc: BaseException) -> bool:
    cur: BaseException | None = exc
    seen: set[int] = set()
    while cur is not None and id(cur) not in seen:
        seen.add(id(cur))
        if isinstance(cur, pymongo.errors.OperationFailure):
            if getattr(cur, 'code', None) == 85:
                return True
            msg = str(cur).lower()
            if 'index already exists with a different name' in msg or 'indexoptionsconflict' in msg:
                return True
        if isinstance(cur, pymongo.errors.CollectionInvalid):
            if 'already exists' in str(cur).lower():
                return True
        msg = str(cur).lower()
        if 'collection' in msg and 'already exists' in msg:
            return True
        cur = getattr(cur, '__cause__', None) or getattr(cur, '__context__', None)
    return False


def _repair_backend_collections_only() -> None:
    cfg = settings.DATABASES['default']
    if cfg.get('ENGINE') != 'django_mongodb_backend':
        return
    uri = cfg.get('HOST') or 'mongodb://localhost:27017/'
    db_name = cfg.get('NAME') or 'lystopad'
    client = MongoClient(uri)
    db = client[db_name]
    for cname in list(db.list_collection_names()):
        if cname.startswith('backend'):
            db.drop_collection(cname)
    db['django_migrations'].delete_many({'app': 'backend'})


def _repair_full_database_local() -> None:
    if not settings.DEBUG:
        raise RuntimeError('Повне скидання БД дозволене лише при DEBUG=True.')
    cfg = settings.DATABASES['default']
    if cfg.get('ENGINE') != 'django_mongodb_backend':
        return
    host = (cfg.get('HOST') or '').lower()
    if 'localhost' not in host and '127.0.0.1' not in host:
        raise RuntimeError('Повне скидання лише для localhost/127.0.0.1.')
    db_name = cfg.get('NAME') or 'lystopad'
    client = MongoClient(cfg.get('HOST'))
    client.drop_database(db_name)


class Command(BaseCommand):
    help = 'migrate з автовідновленням при конфліктах MongoDB (індекси/вже існуючі колекції).'

    def add_arguments(self, parser):
        parser.add_argument('--noinput', action='store_true', help='Без інтерактивних запитів.')
        parser.add_argument('--fake', action='store_true', help='Передати в migrate.')
        parser.add_argument('--fake-initial', action='store_true', help='Передати в migrate.')

    def handle(self, *args, **options):
        migrate_kw: dict = {
            'interactive': not options['noinput'],
            'verbosity': 1,
        }
        if options.get('fake'):
            migrate_kw['fake'] = True
        if options.get('fake_initial'):
            migrate_kw['fake_initial'] = True

        def run_migrate() -> None:
            call_command('migrate', **migrate_kw)

        try:
            run_migrate()
            return
        except Exception as e:
            if not _is_recoverable_mongo_conflict(e):
                raise

        self.stdout.write(
            self.style.WARNING(
                'Конфлікт стану MongoDB (індекси/колекції) — скидання колекцій backend і записів міграцій backend...'
            )
        )
        _repair_backend_collections_only()
        try:
            run_migrate()
            self.stdout.write(self.style.SUCCESS('Міграції застосовано після відновлення backend.'))
            return
        except Exception as e2:
            if not _is_recoverable_mongo_conflict(e2):
                raise

        self.stdout.write(
            self.style.WARNING('Повторний конфлікт — повне скидання локальної БД (DEBUG + localhost)...')
        )
        _repair_full_database_local()
        run_migrate()
        self.stdout.write(self.style.SUCCESS('Міграції застосовано після повного скидання локальної БД.'))
