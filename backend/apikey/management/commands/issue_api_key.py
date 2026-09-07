from django.core.management.base import BaseCommand, CommandError

from apikey.models import ApiKey, generate_api_key
from factory.models import Factory


class Command(BaseCommand):
    help = "공장에 연결된 파트너 API Key를 발급합니다."

    def add_arguments(self, parser):
        parser.add_argument("factory_id", type=int)
        parser.add_argument("name", type=str)
        parser.add_argument("--test", action="store_true")

    def handle(self, *args, **options):
        try:
            factory = Factory.objects.get(id=options["factory_id"])
        except Factory.DoesNotExist as exc:
            raise CommandError("해당 공장을 찾을 수 없습니다.") from exc

        raw, prefix, key_hash = generate_api_key(is_test=options["test"])
        api_key = ApiKey.objects.create(
            factory=factory,
            name=options["name"],
            key_prefix=raw[: len(prefix) + 8],
            key_hash=key_hash,
            is_test=options["test"],
        )

        self.stdout.write(
            self.style.SUCCESS(
                "발급된 키 (한 번만 표시됨, 안전하게 보관): " + raw
            )
        )
        self.stdout.write(f"키 ID: {api_key.id}")
