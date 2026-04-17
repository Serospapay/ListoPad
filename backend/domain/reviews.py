from django.db.models import Avg, Count

from backend.models import Book, BookReview


def recalculate_book_rating(book: Book) -> None:
    stats = BookReview.objects.filter(book=book, status=BookReview.Status.APPROVED).aggregate(
        avg_rating=Avg('rating'),
        total_reviews=Count('id'),
    )
    avg_rating = float(stats['avg_rating'] or 0)
    total_reviews = int(stats['total_reviews'] or 0)
    Book.objects.filter(pk=book.pk).update(rating=avg_rating, review_count=total_reviews)
