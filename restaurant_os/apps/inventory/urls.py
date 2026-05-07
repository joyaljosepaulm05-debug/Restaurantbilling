from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/',         views.CategoryListCreateView.as_view(),  name='categories'),

    # Menu Items
    path('items/',              views.MenuItemListCreateView.as_view(),   name='menu-items'),
    path('items/<int:pk>/',     views.MenuItemDetailView.as_view(),       name='menu-item-detail'),

    # PLU Lookup — Speed Critical
    path('plu/<str:short_code>/', views.PLULookupView.as_view(),         name='plu-lookup'),

    # Full menu for billing screen
    path('menu/',               views.BillingMenuView.as_view(),          name='billing-menu'),

    # Stock
    path('stock/add/',          views.StockAddView.as_view(),             name='stock-add'),
    path('stock/<int:item_id>/', views.StockLevelView.as_view(),          name='stock-level'),
]