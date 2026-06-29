from django.urls import path
from . import views

urlpatterns = [
    path("manage/",views.EquipmentModelViewSet.as_view({'get': 'list', 'post': 'create'})),
    path("manage/<int:pk>/",views.EquipmentModelViewSet.as_view({'get': 'retrieve','patch' : 'partial_update', 'delete': 'destroy'})),
    path("borrow/<int:pk>/",views.BorrowViewSet.as_view()),
    path("loan-logs/", views.LoanLogView.as_view()),
]