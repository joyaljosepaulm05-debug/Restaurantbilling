from django.shortcuts import render, get_object_or_404, redirect
from django.views import View
from django.views.generic import ListView, DetailView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import MenuItem
from .forms import InventoryForm
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import MenuItemSerializer
from .services import get_weather_data
# 1. Home View (List of items)
class HomeView(ListView):
    model = MenuItem
    template_name = 'hello_world/index.html'
    context_object_name = 'items'

    def get_context_data(self, **kwargs):
        # 1. Get the standard data (the list of items)
        context = super().get_context_data(**kwargs)
        
        # 2. Call your service to get the live weather
        # This is the same logic used in your API!
        context['weather'] = get_weather_data()
        
        return context

# 2. Item Detail View
class ItemDetailView(DetailView):
    model = MenuItem
    template_name = 'Hello_world/detail.html'
    context_object_name = 'item'
    pk_url_kwarg = 'item_id'

# 3. Add Inventory View
class AddInventoryView(LoginRequiredMixin, CreateView):
    model = MenuItem
    form_class = InventoryForm
    template_name = 'Hello_world/add_inventory.html'
    success_url = reverse_lazy('home')
class MenuAPIView(APIView):
    def get(self, request):
        # 1. Fetch the weather using your Service
        weather = get_weather_data()
        
        # 2. Fetch all menu items and translate them via the Serializer
        items = MenuItem.objects.all()
        serializer = MenuItemSerializer(items, many=True)
        
        # 3. Combine both into a single "Data Package"
        data_package = {
            'location': 'Angamaly',
            'weather': weather,      # Raw dictionary from OpenWeather
            'menu_items': serializer.data  # Translated list from your DB
        }

        return Response(data_package) 
