from django.urls import path
from . import views

urlpatterns = [
    path('',              views.MemberListCreateView.as_view(),  name='member-list'),
    path('<int:pk>/',     views.MemberDetailView.as_view(),      name='member-detail'),
    path('lookup/',       views.CardLookupView.as_view(),        name='card-lookup'),
    path('<int:pk>/topup/',     views.TopUpView.as_view(),       name='member-topup'),
    path('<int:pk>/statement/', views.MemberStatementView.as_view(), name='member-statement'),
]