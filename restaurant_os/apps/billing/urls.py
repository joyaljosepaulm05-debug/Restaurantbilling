from django.urls import path
from apps.members.views import CreditPaymentView
from . import views

urlpatterns = [
    # List all sales / Create new sale
    path('sales/',                      views.SaleListView.as_view(),      name='sale-list'),
    path('sales/create/',               views.CreateSaleView.as_view(),    name='sale-create'),

    # Sale detail (for receipt)
    path('sales/<int:sale_id>/',        views.SaleDetailView.as_view(),    name='sale-detail'),

    # Actions on a specific sale
    path('sales/<int:sale_id>/pay/',    views.ProcessPaymentView.as_view(),name='sale-pay'),
    path('sales/<int:sale_id>/void/',   views.VoidSaleView.as_view(),      name='sale-void'),
   
    path('sales/<int:sale_id>/pay-credit/',  CreditPaymentView.as_view(),name='sale-pay-credit'),
    path('sales/<int:sale_id>/print/', views.PrintReceiptView.as_view(), name='sale-print'),

]