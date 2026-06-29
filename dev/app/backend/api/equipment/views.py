from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.viewsets import ModelViewSet

from .models import Equipment, EquipmentLoanLog
from .serializers import EquipmentSerializers, EquipmentLoanLogSerializer
from api.member.models import Member

# 備品全体に関する関数
class EquipmentModelViewSet(ModelViewSet):
    """
    備品操作に関する関数（ModelViewSet）
    """
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializers

    def destroy(self, request, *args, **kwargs):
        equipment = self.get_object()
        if bool(equipment.is_borrowed):
            return Response(
                {"detail": "貸出中のため削除できません"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

class BorrowViewSet(APIView):
    """
    貸出操作に関する関数
    """
    def patch(self, request, pk):
        try:
            equipment = Equipment.objects.get(pk=pk)
        except Equipment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        is_borrowed = request.data.get("is_borrowed")
        borrower_id = request.data.get("borrower")
        previous_borrower = equipment.borrower
        action = "return"
        borrower = previous_borrower

        if str(is_borrowed).lower() in ("true", "1", "yes"):
            if not borrower_id:
                return Response(
                    {"detail": "borrower is required when borrowing equipment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                borrower = Member.objects.get(pk=int(borrower_id))
            except (TypeError, ValueError, Member.DoesNotExist):
                return Response(
                    {"detail": "Valid borrower is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            equipment.is_borrowed = True
            equipment.borrower = borrower
            action = "borrow"
        else:
            equipment.is_borrowed = False
            equipment.borrower = None

        equipment.save()
        EquipmentLoanLog.objects.create(
            equipment=equipment,
            equipment_name=equipment.name,
            borrower=borrower,
            borrower_name=borrower.name if borrower else "",
            action=action,
        )
        serializer = EquipmentSerializers(equipment)
        return Response(serializer.data)

class LoanLogView(APIView):
    def get(self, request):
        logs = EquipmentLoanLog.objects.select_related("equipment", "borrower").all()
        serializer = EquipmentLoanLogSerializer(logs, many=True)
        return Response(serializer.data)
