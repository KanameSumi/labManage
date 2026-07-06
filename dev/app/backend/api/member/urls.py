from django.urls import path
from . import views

urlpatterns = [
    path('all/', views.MemberListView.as_view()),
    path('', views.MemberCreateView.as_view()),
    path('<int:pk>/', views.MemberDetailView.as_view()),
    path("present/<int:pk>/",views.MemberPresentView.as_view()),
    path("schedule/<int:pk>/",views.MemberScheduleView.as_view()),
]