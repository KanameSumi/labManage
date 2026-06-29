from django.db import models

class Member(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)

    is_present = models.BooleanField(default=False)

    STATUS_CHOICES = [
        (0, "未登録"),
        (1, "在室予定あり"),
        (2, "在室予定なし"),
    ]

    status = models.IntegerField(
        choices=STATUS_CHOICES,
        default=0
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "member"

    def __str__(self):
        return self.name