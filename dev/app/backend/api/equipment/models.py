from django.db import models

class Equipment(models.Model):

    CATEGORY_CHOICES = [
        (0, "不明"),
        (1, "鍵"),
        (2, "機材"),
        (3, "書籍"),
    ]

    category = models.IntegerField(
        choices=CATEGORY_CHOICES,
        default=0
    )

    name = models.CharField(max_length=100)
    is_borrowed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    borrower = models.ForeignKey(
        "member.Member",  # アプリ名.Member
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = "equipment"

    def __str__(self):
        return self.name


class EquipmentLoanLog(models.Model):
    ACTION_CHOICES = [
        ("borrow", "貸出"),
        ("return", "返却"),
    ]

    equipment_name = models.CharField(max_length=100)
    borrower_name = models.CharField(max_length=100)
    equipment = models.ForeignKey(
        "Equipment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    borrower = models.ForeignKey(
        "member.Member",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "equipment_loan_log"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.equipment_name} - {self.get_action_display()}"
