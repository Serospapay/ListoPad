from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Book',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('author', models.CharField(max_length=255)),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('inventory', models.IntegerField(default=0)),
                ('description', models.TextField(blank=True, null=True)),
                ('cover_image', models.TextField()),
                ('pages', models.IntegerField(default=0)),
                ('year', models.IntegerField(default=2024)),
                ('publisher', models.CharField(default='ЛистоПад', max_length=100)),
                ('cover', models.CharField(default='Тверда', max_length=100)),
                ('format', models.CharField(default='145x215 мм', max_length=100)),
                ('weight', models.CharField(default='550 г', max_length=100)),
                ('rating', models.FloatField(default=0.0)),
                ('categories', models.ManyToManyField(blank=True, to='backend.category')),
            ],
            options={
                'ordering': ['-id'],
                'indexes': [models.Index(fields=['inventory'], name='backend_boo_invento_0564ff_idx')],
            },
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('customer_id', models.CharField(max_length=100)),
                ('customer_name', models.CharField(max_length=255)),
                ('book_title', models.CharField(blank=True, default='', max_length=255)),
                ('amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('status', models.CharField(choices=[('ordered', 'Оформлено'), ('shipping', 'Відправлено'), ('at_branch', 'У відділенні'), ('received', 'Отримано')], default='ordered', max_length=50)),
                ('payment_method', models.CharField(choices=[('card', 'Банківська карта'), ('apple_pay', 'Apple Pay'), ('google_pay', 'Google Pay'), ('cash_on_delivery', 'При отриманні')], default='card', max_length=50)),
                ('delivery_method', models.CharField(choices=[('nova_poshta', 'Нова Пошта'), ('standard', 'Самовивіз')], default='nova_poshta', max_length=50)),
                ('tracking_number', models.CharField(blank=True, max_length=100, null=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date'],
                'indexes': [models.Index(fields=['customer_id'], name='backend_ord_custome_ffafeb_idx'), models.Index(fields=['status'], name='backend_ord_status_0b05d8_idx')],
            },
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField()),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('line_total', models.DecimalField(decimal_places=2, max_digits=10)),
                ('book', models.ForeignKey(db_index=False, on_delete=django.db.models.deletion.PROTECT, related_name='order_items', to='backend.book')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='backend.order')),
            ],
            options={
                'indexes': [models.Index(fields=['book'], name='backend_ord_book_id_e7fbe8_idx')],
            },
        ),
    ]
