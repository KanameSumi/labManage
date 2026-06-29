from rest_framework_simplejwt.authentication import JWTAuthentication

class AccessJWTAuthentication(JWTAuthentication):
    def get_header(self, request):
        token = request.COOKIES.get('access')
        if token:
            # 親クラスを呼ばず、DRFが欲しがっている bytes 型を直接返す
            return f"Bearer {token}".encode('utf-8')
        return super().get_header(request)

class RefreshJWTAuthentication(JWTAuthentication):
    def get_header(self, request):
        refresh = request.COOKIES.get('refresh')
        request.META['HTTP_REFRESH_TOKEN'] = refresh
        return super().get_header(request)
