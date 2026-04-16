from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    if isinstance(response.data, dict):
        detail = response.data.get('detail', 'Сталася помилка.')
        fields = {key: value for key, value in response.data.items() if key != 'detail'}
    elif isinstance(response.data, list):
        detail = 'Помилка валідації.'
        fields = {'errors': response.data}
    else:
        detail = str(response.data) if response.data else 'Сталася помилка.'
        fields = {}

    response.data = {
        'detail': detail,
        'code': response.status_code,
        'fields': fields,
    }
    return response
