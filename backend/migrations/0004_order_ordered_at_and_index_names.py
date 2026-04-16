from django.db import migrations, models
from django.utils import timezone


def fill_null_ordered_at(apps, schema_editor):
    Order = apps.get_model('backend', 'Order')
    for order in Order.objects.filter(ordered_at__isnull=True):
        order.ordered_at = order.date if order.date is not None else timezone.now()
        order.save(update_fields=['ordered_at'])


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0003_order_lifecycle_domain_events'),
    ]

    operations = [
        migrations.RunPython(fill_null_ordered_at, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='order',
            name='ordered_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.RenameIndex(
            model_name='book',
            new_name='backend_boo_invento_6bd35a_idx',
            old_name='backend_boo_invento_0564ff_idx',
        ),
        migrations.RenameIndex(
            model_name='book',
            new_name='backend_boo_title_7e48cf_idx',
            old_name='backend_boo_title_idx',
        ),
        migrations.RenameIndex(
            model_name='book',
            new_name='backend_boo_author_b14874_idx',
            old_name='backend_boo_author_idx',
        ),
        migrations.RenameIndex(
            model_name='domainevent',
            new_name='backend_dom_event_t_8aeb0f_idx',
            old_name='backend_devent_evt_created_idx',
        ),
        migrations.RenameIndex(
            model_name='domainevent',
            new_name='backend_dom_aggrega_b9fa13_idx',
            old_name='backend_devent_agg_idx',
        ),
        migrations.RenameIndex(
            model_name='inventorymovement',
            new_name='backend_inv_book_id_afeda4_idx',
            old_name='backend_inv_book_created_idx',
        ),
        migrations.RenameIndex(
            model_name='inventorymovement',
            new_name='backend_inv_movemen_412f62_idx',
            old_name='backend_inv_mov_created_idx',
        ),
        migrations.RenameIndex(
            model_name='notificationoutbox',
            new_name='backend_not_status_21c126_idx',
            old_name='backend_nout_status_created_idx',
        ),
        migrations.RenameIndex(
            model_name='notificationoutbox',
            new_name='backend_not_notific_608dad_idx',
            old_name='backend_nout_type_created_idx',
        ),
        migrations.RenameIndex(
            model_name='order',
            new_name='backend_ord_custome_83179a_idx',
            old_name='backend_ord_custome_ffafeb_idx',
        ),
        migrations.RenameIndex(
            model_name='order',
            new_name='backend_ord_status_aaf3da_idx',
            old_name='backend_ord_status_0b05d8_idx',
        ),
        migrations.RenameIndex(
            model_name='order',
            new_name='backend_ord_ordered_98ab9b_idx',
            old_name='backend_ord_ordered_idx',
        ),
        migrations.RenameIndex(
            model_name='order',
            new_name='backend_ord_promo_c_98846f_idx',
            old_name='backend_ord_promo_idx',
        ),
        migrations.RenameIndex(
            model_name='orderitem',
            new_name='backend_ord_book_id_225c56_idx',
            old_name='backend_ord_book_id_e7fbe8_idx',
        ),
        migrations.RenameIndex(
            model_name='orderstatushistory',
            new_name='backend_ord_order_i_88ead7_idx',
            old_name='backend_osh_order_changed_idx',
        ),
        migrations.RenameIndex(
            model_name='promocode',
            new_name='backend_pro_is_acti_53c449_idx',
            old_name='backend_pro_is_acti_3bbccf_idx',
        ),
        migrations.RenameIndex(
            model_name='promocode',
            new_name='backend_pro_expires_7c3c8d_idx',
            old_name='backend_pro_expires_idx',
        ),
        migrations.RenameIndex(
            model_name='wishlistitem',
            new_name='backend_wis_user_id_148dc9_idx',
            old_name='backend_wis_user_id_14f469_idx',
        ),
        migrations.RenameIndex(
            model_name='wishlistitem',
            new_name='backend_wis_book_id_163e85_idx',
            old_name='backend_wis_book_id_418951_idx',
        ),
    ]
