from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


def migrate_legacy_order_statuses(apps, schema_editor):
    Order = apps.get_model('backend', 'Order')
    mapping = {
        'shipping': 'shipped',
        'at_branch': 'delivered',
        'received': 'closed',
    }
    for row in Order.objects.all():
        if row.status in mapping:
            row.status = mapping[row.status]
            row.save(update_fields=['status'])


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0002_wishlist_promo_order_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='low_stock_threshold',
            field=models.PositiveIntegerField(default=3),
        ),
        migrations.AddField(
            model_name='order',
            name='subtotal_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='shipping_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='idempotency_key',
            field=models.CharField(blank=True, max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='order',
            name='delivered_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='closed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='cancelled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(migrate_legacy_order_statuses, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(
                choices=[
                    ('ordered', 'Створено'),
                    ('paid', 'Оплачено'),
                    ('packed', 'Упаковано'),
                    ('shipped', 'Відправлено'),
                    ('delivered', 'Доставлено'),
                    ('closed', 'Закрито'),
                    ('cancelled', 'Скасовано'),
                ],
                default='ordered',
                max_length=50,
            ),
        ),
        migrations.CreateModel(
            name='InventoryMovement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('movement_type', models.CharField(choices=[
                    ('reserve', 'Резерв'),
                    ('debit', 'Списання'),
                    ('restock', 'Поповнення'),
                    ('release', 'Розрезерв'),
                    ('adjust', 'Коригування'),
                ], max_length=20)),
                ('quantity', models.IntegerField()),
                ('note', models.CharField(blank=True, default='', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('book', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='inventory_movements', to='backend.book')),
                ('order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='inventory_movements', to='backend.order')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='OrderStatusHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_status', models.CharField(blank=True, default='', max_length=50)),
                ('to_status', models.CharField(choices=[
                    ('ordered', 'Створено'),
                    ('paid', 'Оплачено'),
                    ('packed', 'Упаковано'),
                    ('shipped', 'Відправлено'),
                    ('delivered', 'Доставлено'),
                    ('closed', 'Закрито'),
                    ('cancelled', 'Скасовано'),
                ], max_length=50)),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('changed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='status_history', to='backend.order')),
            ],
            options={'ordering': ['-changed_at']},
        ),
        migrations.CreateModel(
            name='DomainEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(max_length=100)),
                ('aggregate_type', models.CharField(max_length=100)),
                ('aggregate_id', models.CharField(max_length=100)),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='NotificationOutbox',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[
                    ('order_created', 'Створення замовлення'),
                    ('order_status_changed', 'Оновлення статусу замовлення'),
                ], max_length=40)),
                ('recipient', models.EmailField(max_length=254)),
                ('subject', models.CharField(max_length=255)),
                ('body', models.TextField()),
                ('status', models.CharField(choices=[
                    ('pending', 'В черзі'),
                    ('sent', 'Відправлено'),
                    ('failed', 'Помилка'),
                ], default='pending', max_length=20)),
                ('error_message', models.CharField(blank=True, default='', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='book',
            index=models.Index(fields=['title'], name='backend_boo_title_idx'),
        ),
        migrations.AddIndex(
            model_name='book',
            index=models.Index(fields=['author'], name='backend_boo_author_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['ordered_at'], name='backend_ord_ordered_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['promo_code'], name='backend_ord_promo_idx'),
        ),
        migrations.AddIndex(
            model_name='promocode',
            index=models.Index(fields=['expires_at'], name='backend_pro_expires_idx'),
        ),
        migrations.AddIndex(
            model_name='inventorymovement',
            index=models.Index(fields=['book', 'created_at'], name='backend_inv_book_created_idx'),
        ),
        migrations.AddIndex(
            model_name='inventorymovement',
            index=models.Index(fields=['movement_type', 'created_at'], name='backend_inv_mov_created_idx'),
        ),
        migrations.AddIndex(
            model_name='orderstatushistory',
            index=models.Index(fields=['order', 'changed_at'], name='backend_osh_order_changed_idx'),
        ),
        migrations.AddIndex(
            model_name='domainevent',
            index=models.Index(fields=['event_type', 'created_at'], name='backend_devent_evt_created_idx'),
        ),
        migrations.AddIndex(
            model_name='domainevent',
            index=models.Index(fields=['aggregate_type', 'aggregate_id'], name='backend_devent_agg_idx'),
        ),
        migrations.AddIndex(
            model_name='notificationoutbox',
            index=models.Index(fields=['status', 'created_at'], name='backend_nout_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='notificationoutbox',
            index=models.Index(fields=['notification_type', 'created_at'], name='backend_nout_type_created_idx'),
        ),
    ]
