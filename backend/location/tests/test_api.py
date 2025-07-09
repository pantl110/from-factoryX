from django.test import TestCase
from user.models import User
from factory.models import Factory
from location.models import Location
from stock.models import Material

class LocationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password1234!", email="testuser@example.com")
        self.factory = Factory.objects.create(owner=self.user, name="Test Factory")
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
        loc = Location.objects.create(type="material", location="A-1 창고", images=["https://test.com/img1.jpg"])
        self.assertEqual(loc.location, "A-1 창고")
        self.assertIsInstance(loc.images, list)
        self.assertEqual(loc.images[0], "https://test.com/img1.jpg")
        self.assertEqual(loc.type, "material")
        self.assertIsNotNone(loc.created_at)
        self.assertIsNotNone(loc.updated_at)

    def test_location_str_and_repr(self):
        loc = Location.objects.create(type="material", location="B-1", images=[])
        self.assertIn("Location object", str(loc))

    def test_update_location_images(self):
        loc = Location.objects.create(type="material", location="C-1", images=["url1"])
        loc.images.append("url2")
        loc.save()
        loc.refresh_from_db()
        self.assertIn("url2", loc.images)
        self.assertEqual(len(loc.images), 2)

    def test_delete_location_and_material_relation(self):
        loc = Location.objects.create(type="material", location="D-1", images=[])
        self.material.location = loc
        self.material.save()
        loc_id = loc.id
        self.material_id = self.material.id
        loc.delete()
        self.assertFalse(Location.objects.filter(id=loc_id).exists())
        from stock.models import Material
        try:
            material = Material.objects.get(id=self.material_id)
            self.assertIsNone(material.location)
        except Material.DoesNotExist:
            pass  # 삭제된 경우도 허용

    def test_location_type_choices(self):
        loc = Location.objects.create(type="product", location="E-1", images=[])
        self.assertEqual(loc.type, "product")
        # 잘못된 값도 저장됨 (Django 기본 동작)
        loc2 = Location.objects.create(type="invalid", location="E-2", images=[])
        self.assertEqual(loc2.type, "invalid")

    def test_multiple_locations_and_query(self):
        loc1 = Location.objects.create(type="material", location="F-1", images=[])
        loc2 = Location.objects.create(type="material", location="F-2", images=[])
        loc3 = Location.objects.create(type="product", location="F-3", images=[])
        all_material = Location.objects.filter(type="material")
        self.assertEqual(all_material.count(), 2)
        self.assertIn(loc1, all_material)
        self.assertIn(loc2, all_material)
        self.assertNotIn(loc3, all_material)

    def test_location_unicode_and_repr(self):
        loc = Location.objects.create(type="material", location="유니코드창고", images=[])
        self.assertIn("Location object", str(loc))

    def test_location_images_empty(self):
        loc = Location.objects.create(type="material", location="G-1", images=[])
        self.assertEqual(loc.images, [])

    def test_location_images_null(self):
        loc = Location.objects.create(type="material", location="G-2", images=None)
        self.assertIsNone(loc.images)

    def test_location_update_timestamp(self):
        import time
        loc = Location.objects.create(type="material", location="H-1", images=[])
        old_updated = loc.updated_at
        time.sleep(1)
        loc.location = "H-1-수정"
        loc.save()
        loc.refresh_from_db()
        self.assertGreater(loc.updated_at, old_updated)
