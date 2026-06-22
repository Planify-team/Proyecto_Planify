from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views.auth_views import register, login, logout, me
from apps.users.views.password_reset import password_reset_request, password_reset_confirm

urlpatterns = [
    path("register/", register, name="auth-register"),
    path("login/", login, name="auth-login"),
    path("logout/", logout, name="auth-logout"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", me, name="auth-me"),
    path("password-reset/", password_reset_request, name="auth-password-reset"),
    path("password-reset/confirm/", password_reset_confirm, name="auth-password-reset-confirm"),
]
