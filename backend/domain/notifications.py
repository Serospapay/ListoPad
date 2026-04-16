from django.core.mail import send_mail
from django.utils import timezone

from backend.models import NotificationOutbox


def enqueue_notification(notification_type: str, recipient: str, subject: str, body: str) -> NotificationOutbox:
    return NotificationOutbox.objects.create(
        notification_type=notification_type,
        recipient=recipient,
        subject=subject,
        body=body,
    )


def process_outbox_batch(limit: int = 20) -> int:
    processed = 0
    pending = NotificationOutbox.objects.filter(status=NotificationOutbox.DeliveryStatus.PENDING).order_by('created_at')[:limit]
    for item in pending:
        try:
            send_mail(
                subject=item.subject,
                message=item.body,
                from_email=None,
                recipient_list=[item.recipient],
                fail_silently=False,
            )
            item.status = NotificationOutbox.DeliveryStatus.SENT
            item.sent_at = timezone.now()
            item.error_message = ''
            item.save(update_fields=['status', 'sent_at', 'error_message'])
            processed += 1
        except Exception as exc:
            item.status = NotificationOutbox.DeliveryStatus.FAILED
            item.error_message = str(exc)[:255]
            item.save(update_fields=['status', 'error_message'])
    return processed
