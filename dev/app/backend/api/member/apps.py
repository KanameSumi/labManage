from django.apps import AppConfig

class MemberConfig(AppConfig):
    name = "api.member"

    def ready(self):
        import api.member