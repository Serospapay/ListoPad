from typing import Iterable

from backend.models import Category


def ensure_categories_exist(category_names: Iterable[str]) -> None:
    for name in category_names:
        normalized = str(name).strip()
        if normalized:
            Category.objects.get_or_create(name=normalized)
