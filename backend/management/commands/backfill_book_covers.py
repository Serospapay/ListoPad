from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand

from backend.management.commands.seed_demo_books import DEMO_BOOKS
from backend.models import Book


OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"
OPEN_LIBRARY_COVER_BY_ID = "https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
GOOGLE_BOOKS_SEARCH_URL = "https://www.googleapis.com/books/v1/volumes"
REQUEST_TIMEOUT_SECONDS = 8

PLACEHOLDER_MARKERS = (
    "images.unsplash.com",
    "source.unsplash.com",
    "example.com",
    "dummyimage.com",
    "placehold.co",
    "placeholder.com",
)


@dataclass(frozen=True)
class CoverCandidate:
    url: str
    source: str


def _http_get_json(url: str) -> Optional[dict]:
    request = Request(
        url,
        headers={
            "User-Agent": "ListoPad-CoverBackfill/1.0",
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            payload = response.read().decode("utf-8")
        return json.loads(payload)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return None


def _url_looks_valid_image(url: str) -> bool:
    return bool(url and url.startswith(("http://", "https://")))


def _is_cover_missing_or_placeholder(cover_url: str) -> bool:
    if not cover_url or not cover_url.strip():
        return True
    lowered = cover_url.lower().strip()
    return any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def _seed_cover_for(book: Book) -> Optional[CoverCandidate]:
    for row in DEMO_BOOKS:
        if row["title"].strip().lower() == book.title.strip().lower() and row["author"].strip().lower() == book.author.strip().lower():
            cover_url = row.get("cover_image", "").strip()
            if _url_looks_valid_image(cover_url):
                return CoverCandidate(url=cover_url, source="seed_demo_books")
    return None


def _open_library_cover(book: Book) -> Optional[CoverCandidate]:
    query = f"{OPEN_LIBRARY_SEARCH_URL}?title={quote_plus(book.title)}&author={quote_plus(book.author)}&limit=5"
    payload = _http_get_json(query)
    if not payload:
        return None

    docs = payload.get("docs", [])
    for doc in docs:
        cover_id = doc.get("cover_i")
        if cover_id:
            return CoverCandidate(
                url=OPEN_LIBRARY_COVER_BY_ID.format(cover_id=cover_id),
                source="openlibrary",
            )
    return None


def _google_books_cover(book: Book) -> Optional[CoverCandidate]:
    query_text = quote_plus(f'intitle:"{book.title}" inauthor:"{book.author}"')
    query = f"{GOOGLE_BOOKS_SEARCH_URL}?q={query_text}&maxResults=5&printType=books&langRestrict=uk"
    payload = _http_get_json(query)
    if not payload:
        return None

    for item in payload.get("items", []):
        image_links = item.get("volumeInfo", {}).get("imageLinks", {})
        # Prefer larger variants when available.
        candidate = (
            image_links.get("extraLarge")
            or image_links.get("large")
            or image_links.get("medium")
            or image_links.get("thumbnail")
            or image_links.get("smallThumbnail")
        )
        if not candidate:
            continue
        candidate = candidate.replace("http://", "https://")
        if _url_looks_valid_image(candidate):
            return CoverCandidate(url=candidate, source="google_books")
    return None


def _resolve_cover(book: Book, use_seed: bool) -> Optional[CoverCandidate]:
    if use_seed:
        seed_candidate = _seed_cover_for(book)
        if seed_candidate:
            return seed_candidate

    return _open_library_cover(book) or _google_books_cover(book)


class Command(BaseCommand):
    help = (
        "Підбирає і проставляє релевантні обкладинки для книг без обкладинки "
        "(або з placeholder-зображенням) через seed/Open Library/Google Books."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Лише показати зміни, не записуючи в БД.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Обмежити кількість оброблених книг (0 = без ліміту).",
        )
        parser.add_argument(
            "--replace-all",
            action="store_true",
            help="Оновлювати cover_image для всіх книг, а не лише для порожніх/placeholder.",
        )
        parser.add_argument(
            "--no-seed-match",
            action="store_true",
            help="Не використовувати локальну карту DEMO_BOOKS для точних збігів.",
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        limit: int = options["limit"]
        replace_all: bool = options["replace_all"]
        use_seed: bool = not options["no_seed_match"]

        books_qs = Book.objects.all().order_by("id")
        if limit > 0:
            books_qs = books_qs[:limit]

        scanned = 0
        updated = 0
        skipped = 0
        not_found = 0

        for book in books_qs:
            scanned += 1

            if not replace_all and not _is_cover_missing_or_placeholder(book.cover_image):
                skipped += 1
                continue

            candidate = _resolve_cover(book, use_seed=use_seed)
            if not candidate:
                not_found += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"[MISS] {book.title} — {book.author}: не знайдено релевантну обкладинку"
                    )
                )
                continue

            if book.cover_image == candidate.url:
                skipped += 1
                continue

            if not dry_run:
                book.cover_image = candidate.url
                book.save(update_fields=["cover_image"])
            updated += 1
            mode = "PLAN" if dry_run else "SET"
            self.stdout.write(
                self.style.SUCCESS(
                    f"[{mode}] {book.title} — {book.author} -> {candidate.source}"
                )
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Готово. Перевірено: {scanned}, оновлено: {updated}, пропущено: {skipped}, без збігу: {not_found}."
            )
        )
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY-RUN: зміни в БД не застосовано."))
