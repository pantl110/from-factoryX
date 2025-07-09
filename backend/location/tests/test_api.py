from django.test import TestCase
from django.urls import reverse
from user.models import User
from factory.models import Factory
from location.models import Location
from stock.models import Material
import json

class LocationAPITestCase(TestCase):
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

    def test_create_location_api(self):
        """
        위치 생성 API 테스트
        """
        location_data = {
            "type": "material",
            "location": "A-1 창고",
            "images": ["https://test.com/img1.jpg"]
        }
        
        response = self.client.post("/api/v1/location/", 
                                   data=json.dumps(location_data),
                                   content_type="application/json")
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["location"], "A-1 창고")
        self.assertEqual(data["type"], "material")
        self.assertEqual(data["images"], ["https://test.com/img1.jpg"])

    def test_get_location_list_api(self):
        """
        위치 목록 조회 API 테스트
        """
        # 테스트 데이터 생성
        Location.objects.create(type="material", location="B-1", images=[])
        Location.objects.create(type="product", location="B-2", images=[])
        
        response = self.client.get("/api/v1/location/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_get_location_detail_api(self):
        """
        위치 상세 조회 API 테스트
        """
        loc = Location.objects.create(type="material", location="C-1", images=["url1", "url2"])
        
        response = self.client.get(f"/api/v1/location/{loc.id}/")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["location"], "C-1")
        self.assertEqual(data["type"], "material")
        self.assertEqual(data["images"], ["url1", "url2"])

    def test_update_location_api(self):
        """
        위치 수정 API 테스트
        """
        loc = Location.objects.create(type="material", location="D-1", images=["url1"])
        
        update_data = {
            "location": "D-1-수정",
            "images": ["url1", "url2", "url3"]
        }
        
        response = self.client.put(f"/api/v1/location/{loc.id}/",
                                  data=json.dumps(update_data),
                                  content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["location"], "D-1-수정")
        self.assertEqual(len(data["images"]), 3)

    def test_delete_location_api(self):
        """
        위치 삭제 API 테스트
        """
        loc = Location.objects.create(type="material", location="E-1", images=[])
        
        response = self.client.delete(f"/api/v1/location/{loc.id}/")
        
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Location.objects.filter(id=loc.id).exists())

    def test_location_type_filter_api(self):
        """
        위치 타입별 필터링 API 테스트
        """
        # 테스트 데이터 생성
        Location.objects.create(type="material", location="F-1", images=[])
        Location.objects.create(type="material", location="F-2", images=[])
        Location.objects.create(type="product", location="F-3", images=[])
        
        response = self.client.get("/api/v1/location/?type=material")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        for item in data:
            self.assertEqual(item["type"], "material")

    def test_location_validation_api(self):
        """
        위치 생성 시 유효성 검증 API 테스트
        """
        # 필수 필드 누락
        invalid_data = {
            "type": "material"
            # location 필드 누락
        }
        
        response = self.client.post("/api/v1/location/",
                                   data=json.dumps(invalid_data),
                                   content_type="application/json")
        
        self.assertEqual(response.status_code, 400)

    def test_location_unicode_api(self):
        """
        위치 한글 처리 API 테스트
        """
        location_data = {
            "type": "material",
            "location": "유니코드창고",
            "images": []
        }
        
        response = self.client.post("/api/v1/location/",
                                   data=json.dumps(location_data),
                                   content_type="application/json")
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["location"], "유니코드창고")

    def test_location_images_empty_api(self):
        """
        빈 이미지 배열 처리 API 테스트
        """
        location_data = {
            "type": "material",
            "location": "G-1",
            "images": []
        }
        
        response = self.client.post("/api/v1/location/",
                                   data=json.dumps(location_data),
                                   content_type="application/json")
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["images"], [])

    def test_location_images_null_api(self):
        """
        Null 이미지 배열 처리 API 테스트
        """
        location_data = {
            "type": "material",
            "location": "G-2",
            "images": None
        }
        
        response = self.client.post("/api/v1/location/",
                                   data=json.dumps(location_data),
                                   content_type="application/json")
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIsNone(data["images"])

    def test_location_patch_api(self):
        """
        위치 부분 수정 API 테스트
        """
        loc = Location.objects.create(type="material", location="H-1", images=["url1"])
        
        patch_data = {
            "location": "H-1-부분수정"
        }
        
        response = self.client.patch(f"/api/v1/location/{loc.id}/",
                                    data=json.dumps(patch_data),
                                    content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["location"], "H-1-부분수정")
        self.assertEqual(data["images"], ["url1"])  # 기존 값 유지

    def test_location_not_found_api(self):
        """
        존재하지 않는 위치 조회 API 테스트
        """
        response = self.client.get("/api/v1/location/99999/")
        
        self.assertEqual(response.status_code, 404)
