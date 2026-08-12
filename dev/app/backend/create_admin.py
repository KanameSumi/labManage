
from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(username="t-yamada").exists():
    User.objects.create_superuser(
        username="t-yamada",
        email="t-yamada@example.com",
        password="LabPassword"
    )
