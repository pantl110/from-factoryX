import hashlib
import secrets

from django.db import models

from common.models import BaseModel
from factory.models import Factory


class ApiKey(BaseModel):
    factory = models.ForeignKey(
        Factory,
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    name = models.CharField(max_length=100)
    key_prefix = models.CharField(max_length=20, db_index=True)
    key_hash = models.CharField(max_length=64, unique=True)
    is_test = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.key_prefix

    @property
    def is_active(self):
        return self.revoked_at is None


def generate_api_key(is_test: bool = False) -> tuple[str, str, str]:
    prefix = "pantl_test_" if is_test else "pantl_live_"
    raw = prefix + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw.encode()).hexdigest()
    return raw, prefix, key_hash