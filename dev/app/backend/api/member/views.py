from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Member
from .serializers import MemberSerializer

# リスト表示
class MemberListView(APIView):
    authentication_classes = []
    def get(self, request, format=None):
        members = Member.objects.all()

        serializer = MemberSerializer(
            members,
            many=True
        )

        return Response(serializer.data)

# Member作成（管理画面用、認証必須）
class MemberCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = MemberSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 在室状況更新
class MemberPresentView(APIView):
    def patch(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        member.is_present = request.data["is_present"]

        # 在室になったら予定を未登録にする
        if member.is_present:
            member.status = 0

        member.save()

        return Response({
            "id": member.id,
            "is_present": member.is_present,
            "status": member.status,
            "updated_at": member.updated_at,
        })

# 予定設定
class MemberScheduleView(APIView):
    def patch(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        member.status = request.data["status"]
        member.save()

        return Response({
            "id": member.id,
            "status": member.status
        })
