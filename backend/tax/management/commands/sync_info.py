from django.core.management.base import BaseCommand
from tax.models import NationalTaxService

from factory.schemas.outbound import FactoryClientRowOut
from stock.schemas.outbound import ProductRowOut


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        queryset = (
            NationalTaxService.objects.select_related("client")
            .prefetch_related("product")
            .all()
        )
        for obj in queryset:
            self.stdout.write(f"ID: {obj.id}")
            if obj.client_id and not obj.client_info:
                self.stdout.write(f"Client ID: {obj.client_id}")
                obj.client_info = FactoryClientRowOut.from_orm(obj.client).dict()
            if obj.product.exists() and not obj.products_info:
                self.stdout.write(
                    f"Product IDs: {', '.join(str(product.id) for product in obj.product.all())}"
                )
                obj.products_info = [
                    ProductRowOut.from_orm(product).dict()
                    for product in obj.product.all()
                ]
            obj.save()
            self.stdout.write(f"Updated ID: {obj.id} with mgt_key: {obj.mgt_key}")
            self.stdout.write(f"Client Info: {obj.client_info}")
            self.stdout.write(f"Products Info: {obj.products_info}")

        self.stdout.write("Sync completed.")
