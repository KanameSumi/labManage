from rest_framework import serializers

from .models import Member

class MemberSerializer(serializers.ModelSerializer):

    class Meta:
        model = Member
        fields = [
            "id",
            "student_id",
            "name",
            "is_present",
            "status",
            "updated_at",
        ]