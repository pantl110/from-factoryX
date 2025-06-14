from django.db import models


class BaseModel(models.Model):
    """Common Model Definition"""

    created_at = models.DateTimeField(auto_now_add=True, help_text="생성일")
    updated_at = models.DateTimeField(auto_now=True, help_text="수정일")

    class Meta:
        abstract = True


class Unit(models.Model):
    code = models.CharField(max_length=20, unique=True, help_text="단위코드")
    name = models.CharField(max_length=50, help_text="단위명")
    description = models.TextField(blank=True, help_text="설명")
    is_active = models.BooleanField(default=True, help_text="사용여부")

    def __str__(self):
        return f"{self.name} ({self.code})"
