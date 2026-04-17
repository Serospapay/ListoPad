from django.contrib.auth.models import User

DEMO_ACCOUNTS = [
    {
        'role': 'admin',
        'email': 'demo.admin@lystopad.local',
        'password': 'DemoAdmin123!',
        'name': 'Demo Admin',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'role': 'user',
        'email': 'demo.user@lystopad.local',
        'password': 'DemoUser123!',
        'name': 'Demo User',
        'is_staff': False,
        'is_superuser': False,
    },
]


def ensure_demo_accounts() -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for row in DEMO_ACCOUNTS:
        first_name, _, last_name = row['name'].partition(' ')
        defaults = {
            'email': row['email'],
            'first_name': first_name,
            'last_name': last_name,
            'is_staff': row['is_staff'],
            'is_superuser': row['is_superuser'],
            'is_active': True,
        }
        user, created = User.objects.get_or_create(
            username=row['email'],
            defaults=defaults,
        )
        if created:
            user.set_password(row['password'])
            user.save(update_fields=['password'])
        else:
            changed = False
            for key, value in defaults.items():
                if getattr(user, key) != value:
                    setattr(user, key, value)
                    changed = True
            if not user.check_password(row['password']):
                user.set_password(row['password'])
                changed = True
            if changed:
                user.save()
        result.append(
            {
                'role': row['role'],
                'email': row['email'],
                'password': row['password'],
                'name': row['name'],
            }
        )
    return result
