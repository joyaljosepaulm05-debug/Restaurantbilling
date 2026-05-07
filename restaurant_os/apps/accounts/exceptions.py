from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """
    WHY a custom handler: Default DRF error format is inconsistent.
    We normalize ALL errors to: {"success": false, "error": "...", "detail": ...}
    This makes frontend error handling trivial — always check response.error.
    """
    response = exception_handler(exc, context)

    if response is not None:
        return Response({
            'success': False,
            'error':   response.status_text,
            'detail':  response.data,
        }, status=response.status_code)

    return response