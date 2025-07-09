from django.test import TestCase
from user.models import User
from factory.models import Factory
from location.models import Location
from stock.models import Material

class LocationTestCase(TestCase):
    def setUp(self):
        # 테스트 사용자 생성
        self.user = User.objects.create_user(username="testuser", password="password1234!", email="testuser@example.com")
        
        # 테스트 공장 생성
        self.factory = Factory.objects.create(owner=self.user, name="Test Factory")
        
        # 테스트 재료 생성 (위치와의 관계 테스트용)
        self.material = Material.objects.create(
            factory=self.factory,
            name="Test Material",
            code="MAT001",
            unit="kg",
            spec="Spec",
            current_stock=10,
            standard_stock=5,
        )

    def test_create_location_and_field_types(self):
        """
        위치 생성 및 필드 타입 검증 테스트
        """
        # 위치 생성
        loc = Location.objects.create(type="material", location="A-1 창고", images=["https://test.com/img1.jpg"])
        
        # 필드 값 검증
        self.assertEqual(loc.location, "A-1 창고")
        self.assertIsInstance(loc.images, list)  # images 필드가 리스트 타입인지 확인
        self.assertEqual(loc.images[0], "https://test.com/img1.jpg")
        self.assertEqual(loc.type, "material")
        
        # 타임스탬프 필드 존재 확인
        self.assertIsNotNone(loc.created_at)
        self.assertIsNotNone(loc.updated_at)

    def test_location_str_and_repr(self):
        """
        위치 객체의 문자열 표현 테스트
        """
        loc = Location.objects.create(type="material", location="B-1", images=[])
        
        # __str__ 메서드가 "Location object"를 포함하는지 확인
        self.assertIn("Location object", str(loc))

    def test_update_location_images(self):
        """
        위치 이미지 배열 업데이트 테스트
        """
        # 초기 위치 생성
        loc = Location.objects.create(type="material", location="C-1", images=["url1"])
        
        # 이미지 배열에 새 URL 추가
        loc.images.append("url2")
        loc.save()
        
        # DB에서 다시 로드하여 변경사항 확인
        loc.refresh_from_db()
        self.assertIn("url2", loc.images)
        self.assertEqual(len(loc.images), 2)

    def test_delete_location_and_material_relation(self):
        """
        위치 삭제 시 재료와의 관계 처리 테스트
        """
        # 위치 생성 및 재료와 연결
        loc = Location.objects.create(type="material", location="D-1", images=[])
        self.material.location = loc
        self.material.save()
        
        # 삭제 전 ID 저장
        loc_id = loc.id
        self.material_id = self.material.id
        
        # 위치 삭제
        loc.delete()
        
        # 위치가 실제로 삭제되었는지 확인
        self.assertFalse(Location.objects.filter(id=loc_id).exists())
        
        # 재료의 location 필드가 None으로 설정되었는지 확인
        from stock.models import Material
        try:
            material = Material.objects.get(id=self.material_id)
            self.assertIsNone(material.location)
        except Material.DoesNotExist:
            pass  # 삭제된 경우도 허용

    def test_location_type_choices(self):
        """
        위치 타입 선택 테스트
        """
        # 유효한 타입으로 위치 생성
        loc = Location.objects.create(type="product", location="E-1", images=[])
        self.assertEqual(loc.type, "product")
        
        # 잘못된 값도 저장됨 (Django 기본 동작)
        loc2 = Location.objects.create(type="invalid", location="E-2", images=[])
        self.assertEqual(loc2.type, "invalid")

    def test_multiple_locations_and_query(self):
        """다중 위치 생성 및 조회 테스트"""
        # 여러 위치 생성
        loc1 = Location.objects.create(type="material", location="F-1", images=[])
        loc2 = Location.objects.create(type="material", location="F-2", images=[])
        loc3 = Location.objects.create(type="product", location="F-3", images=[])
        
        # material 타입의 위치만 조회
        all_material = Location.objects.filter(type="material")
        
        # 검증
        self.assertEqual(all_material.count(), 2)
        self.assertIn(loc1, all_material)
        self.assertIn(loc2, all_material)
        self.assertNotIn(loc3, all_material)

    def test_location_unicode_and_repr(self):
        """
        위치 유니코드 문자열 처리 테스트
        """
        # 한글 포함 위치명으로 위치 생성
        loc = Location.objects.create(type="material", location="유니코드창고", images=[])
        
        # 문자열 표현에 "Location object"가 포함되는지 확인
        self.assertIn("Location object", str(loc))

    def test_location_images_empty(self):
        """
        빈 이미지 배열 처리 테스트
        """
        # 빈 배열로 위치 생성
        loc = Location.objects.create(type="material", location="G-1", images=[])
        self.assertEqual(loc.images, [])

    def test_location_images_null(self):
        """
        Null 이미지 배열 처리 테스트
        """
        # None으로 이미지 설정
        loc = Location.objects.create(type="material", location="G-2", images=None)
        self.assertIsNone(loc.images)

    def test_location_update_timestamp(self):
        """
        위치 업데이트 시 타임스탬프 변경 테스트
        """
        import time
        
        # 초기 위치 생성
        loc = Location.objects.create(type="material", location="H-1", images=[])
        old_updated = loc.updated_at
        
        # 1초 대기 후 위치 정보 수정
        time.sleep(1)
        loc.location = "H-1-수정"
        loc.save()
        
        # DB에서 다시 로드하여 updated_at이 변경되었는지 확인
        loc.refresh_from_db()
        self.assertGreater(loc.updated_at, old_updated)
