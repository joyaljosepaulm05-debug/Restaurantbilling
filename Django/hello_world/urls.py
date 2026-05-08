from django.urls import path
from .views import HomeView, ItemDetailView, AddInventoryView,MenuAPIView

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('item/<int:item_id>/', ItemDetailView.as_view(), name='item_detail'),
    path('add/', AddInventoryView.as_view(), name='add_inventory'),
    path('api/menu/', MenuAPIView.as_view(), name='menu_api'),
]