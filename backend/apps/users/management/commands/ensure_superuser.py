import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create superuser from env vars if it doesn't exist"

    def handle(self, *args, **options):
        User = get_user_model()
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        if not email or not password:
            self.stdout.write("DJANGO_SUPERUSER_EMAIL or PASSWORD not set, skipping.")
            return
        if User.objects.filter(email=email).exists():
            self.stdout.write(f"Superuser {email} already exists.")
            return
        User.objects.create_superuser(email=email, password=password)
        self.stdout.write(f"Superuser {email} created.")
