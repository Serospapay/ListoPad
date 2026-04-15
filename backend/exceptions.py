from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    detail = response.data.get('detail', 'Сталася помилка.')
    fields = {}
    for key, value in response.data.items():
        if key != 'detail':
            fields[key] = value

    response.data = {
        'detail': detail,
        'code': response.status_code,
        'fields': fields,
    }
    return response
