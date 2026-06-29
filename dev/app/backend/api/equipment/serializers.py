from rest_framework import serializers

from .models import Equipment, EquipmentLoanLog

class EquipmentSerializers(serializers.ModelSerializer):
    borrower_name = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = '__all__'

    def get_borrower_name(self, obj):
        return obj.borrower.name if obj.borrower else None


class EquipmentLoanLogSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(read_only=True)
    borrower_name = serializers.CharField(read_only=True)
    borrower_student_id = serializers.CharField(source="borrower.student_id", default=None)
    action_label = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = EquipmentLoanLog
        fields = [
            "id",
            "equipment_name",
            "borrower_name",
            "borrower_student_id",
            "action",
            "action_label",
            "timestamp",
        ]
