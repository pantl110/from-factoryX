# Generated manually for UUID field migration
import uuid
from django.db import migrations, models


def migrate_ids_to_uuid(apps, schema_editor):
    """기존 ID들을 UUID로 마이그레이션"""
    db_alias = schema_editor.connection.alias
    
    # 기존 데이터가 있는지 확인
    User = apps.get_model('user', 'User')
    Jwt = apps.get_model('user', 'Jwt')
    
    # 기존 데이터를 임시로 저장
    users_data = []
    jwt_data = []
    
    # User 데이터 백업
    for user in User.objects.using(db_alias).all():
        users_data.append({
            'old_id': user.id,
            'username': user.username,
            'email': user.email,
            'password': user.password,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
            'is_superuser': user.is_superuser,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            'status': user.status,
        })
    
    # JWT 데이터 백업
    for jwt in Jwt.objects.using(db_alias).all():
        jwt_data.append({
            'old_id': jwt.id,
            'user_id': jwt.user_id,
            'access': jwt.access,
            'refresh': jwt.refresh,
        })
    
    return users_data, jwt_data


def reverse_migrate_ids(apps, schema_editor):
    """역방향 마이그레이션"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0002_add_new_models'),
    ]

    operations = [
        # 새로운 UUID 필드를 추가
        migrations.AddField(
            model_name='user',
            name='uuid_id',
            field=models.UUIDField(default=uuid.uuid4, null=True),
        ),
        migrations.AddField(
            model_name='jwt',
            name='uuid_id',
            field=models.UUIDField(default=uuid.uuid4, null=True),
        ),
        migrations.AddField(
            model_name='jwt',
            name='uuid_user_id',
            field=models.UUIDField(null=True),
        ),
        
        # 데이터 마이그레이션
        migrations.RunPython(migrate_ids_to_uuid, reverse_migrate_ids),
    ]
