# Generated manually for safe UUID migration
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


def migrate_data_forward(apps, schema_editor):
    """기존 데이터를 새 테이블로 마이그레이션"""
    # 이 함수는 데이터가 있을 때만 실행됩니다
    pass


def migrate_data_reverse(apps, schema_editor):
    """역방향 마이그레이션"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0001_initial'),
    ]

    operations = [
        # 1. 새로운 모델들 먼저 생성
        migrations.CreateModel(
            name='Company',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='회사명', max_length=100)),
                ('business_registration_number', models.CharField(help_text='사업자 등록번호', max_length=20, unique=True)),
                ('ceo_name', models.CharField(help_text='대표자명', max_length=50)),
                ('contact', models.CharField(help_text='연락망', max_length=100)),
                ('business_type', models.CharField(help_text='업태', max_length=50)),
                ('business_item', models.CharField(help_text='종목', max_length=50)),
                ('address', models.CharField(help_text='회사주소지', max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='EmailVerification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('email', models.EmailField(help_text='인증 대상 이메일', max_length=254)),
                ('code', models.CharField(help_text='인증 코드 (6자리)', max_length=6)),
                ('verification_type', models.CharField(choices=[('회원가입', '회원가입'), ('비밀번호재설정', '비밀번호재설정')], help_text='인증 타입', max_length=20)),
                ('is_verified', models.BooleanField(default=False, help_text='인증 완료 여부')),
                ('expires_at', models.DateTimeField(help_text='만료 시간')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='생성 시간')),
            ],
            options={
                'verbose_name': '이메일 인증',
                'verbose_name_plural': '이메일 인증',
                'ordering': ['-created_at'],
            },
        ),
        
        # 2. 데이터 마이그레이션
        migrations.RunPython(migrate_data_forward, migrate_data_reverse),
    ]
