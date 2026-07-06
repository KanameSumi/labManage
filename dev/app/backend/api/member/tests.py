from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Member


class MemberDetailApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="admin",
            password="password123",
        )
        self.member = Member.objects.create(student_id="a12345", name="田中太郎")

    def test_member_can_be_updated(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            f"/api/member/{self.member.pk}/",
            {"name": "田中次郎", "student_id": "a54321"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.member.refresh_from_db()
        self.assertEqual(self.member.name, "田中次郎")
        self.assertEqual(self.member.student_id, "a54321")

    def test_member_can_be_deleted(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(f"/api/member/{self.member.pk}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Member.objects.filter(pk=self.member.pk).exists())
