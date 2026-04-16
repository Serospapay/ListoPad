from backend.models import DomainEvent


def emit_domain_event(event_type: str, aggregate_type: str, aggregate_id: str, payload: dict) -> DomainEvent:
    return DomainEvent.objects.create(
        event_type=event_type,
        aggregate_type=aggregate_type,
        aggregate_id=str(aggregate_id),
        payload=payload or {},
    )
