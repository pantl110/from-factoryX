from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
import httpx
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


async def websocket_test(request):
    return render(request, "websocket_test.html")
