from django.test import TestCase
from django.contrib.auth import get_user_model
from factory.models import Factory, FactoryClient, FactoryMember
from tax.models import NationalTaxService, CashReceipt, TaxInvoiceAccount, AccountStatus
from project.models import Project
import jwt
from django.conf import settings
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta

User = get_user_model()


class TaxAPIV2TestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser_v2", email="test_v2@example.com", password="testpass123"
        )
        self.factory = Factory.objects.create(name="테스트 공장 V2", owner=self.user)
        
        one_month_ago = datetime.now() - relativedelta(months=1)
        FactoryMember.objects.create(
            factory=self.factory,
            user=self.user,
            role=FactoryMember.FactoryMemberType.admin,
            status=FactoryMember.MemberStatus.active,
            invited_by=self.user,
        )
        FactoryMember.objects.filter(factory=self.factory, user=self.user).update(created_at=one_month_ago)
        
        self.client_company1 = FactoryClient.objects.create(
            factory=self.factory, name="테스트 거래처 1", business_registration_number="123-45-67890"
        )
        self.client_company2 = FactoryClient.objects.create(
            factory=self.factory, name="테스트 거래처 2", business_registration_number="987-65-43210"
        )
        self.token = jwt.encode(
            {"user_id": self.user.id, "exp": datetime.now() + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def _create_tax_invoice(self, client=None, **kwargs):
        defaults = {
            "factory": self.factory,
            "client": client or self.client_company1,
            "transaction_date": date(2025, 6, 1),
            "transaction_amount": 100000,
            "tax_amount": 10000,
            "tax_invoice_type": "sales",
            "publish_status": "published",
        }
        defaults.update(kwargs)
        return NationalTaxService.objects.create(**defaults)

    def _create_cash_receipt(self, client=None, **kwargs):
        defaults = {
            "factory": self.factory,
            "client": client or self.client_company1,
            "transaction_date": date(2025, 6, 2),
            "transaction_amount": 50000,
            "tax_amount": 5000,
            "cash_receipt_type": "purchase",
        }
        defaults.update(kwargs)
        return CashReceipt.objects.create(**defaults)

    def _get(self, params=""):
        url = f"/v2/tax/published?factory_id={self.factory.id}"
        if params:
            url += f"&{params}"
        return self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_list_published_documents_all(self):
        self._create_tax_invoice()
        receipt = self._create_cash_receipt()
        if not TaxInvoiceAccount.objects.filter(cash_receipt=receipt).exists():
            TaxInvoiceAccount.objects.create(
                cash_receipt=receipt, status=AccountStatus.waiting,
                total_billed_amount=55000, outstanding_balance=55000
            )

        response = self._get()
        self.assertEqual(response.status_code, 200)
        data = response.json()
        document_types = [item["document_type"] for item in data["data"]]
        self.assertIn("tax", document_types)
        self.assertIn("cash-receipt", document_types)
        self.assertEqual(len(data["data"]), 2)

    def test_list_published_documents_tax_only(self):
        invoice = self._create_tax_invoice()
        self._create_cash_receipt()

        response = self._get("document_type=tax")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["document_type"], "tax")
        self.assertEqual(data["data"][0]["id"], invoice.id)

    def test_list_published_documents_sales_tax_only(self):
        sales_invoice = self._create_tax_invoice(tax_invoice_type="sales")
        purchase_invoice = self._create_tax_invoice(
            client=self.client_company2, tax_invoice_type="purchase", transaction_date=date(2025, 6, 2)
        )

        response = self._get("document_type=sales-tax")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertEqual(len(data["data"]), 1)
        self.assertIn(sales_invoice.id, ids)
        self.assertNotIn(purchase_invoice.id, ids)

    def test_list_published_documents_purchase_tax_only(self):
        sales_invoice = self._create_tax_invoice()
        purchase_invoice = self._create_tax_invoice(
            client=self.client_company2, tax_invoice_type="purchase", transaction_date=date(2025, 6, 2)
        )
        receipt = self._create_cash_receipt(transaction_date=date(2025, 6, 3))

        response = self._get("document_type=purchase-tax")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertEqual(len(data["data"]), 1)
        self.assertIn(purchase_invoice.id, ids)
        self.assertNotIn(sales_invoice.id, ids)
        self.assertNotIn(receipt.id, ids)

    def test_list_published_documents_cash_receipt_only(self):
        self._create_tax_invoice()
        receipt = self._create_cash_receipt(item_name="테스트 품목")

        response = self._get("document_type=cash-receipt")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["document_type"], "cash-receipt")
        self.assertEqual(data["data"][0]["id"], receipt.id)
        self.assertNotIn("tax", [item["document_type"] for item in data["data"]])

    def test_list_published_documents_purchase_type(self):
        purchase_invoice = self._create_tax_invoice(tax_invoice_type="purchase")
        sales_invoice = self._create_tax_invoice(
            client=self.client_company2, tax_invoice_type="sales", transaction_date=date(2025, 6, 2)
        )
        purchase_receipt = self._create_cash_receipt(transaction_date=date(2025, 6, 3))
        sales_receipt = self._create_cash_receipt(
            client=self.client_company2, cash_receipt_type="sales", transaction_date=date(2025, 6, 4)
        )

        response = self._get("document_type=purchase")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertIn(purchase_invoice.id, ids)
        self.assertIn(purchase_receipt.id, ids)
        self.assertNotIn(sales_invoice.id, ids)
        self.assertNotIn(sales_receipt.id, ids)

    def test_list_published_documents_filter_by_account_status(self):
        overdue_invoice = self._create_tax_invoice()
        account = TaxInvoiceAccount.objects.get(tax_invoice=overdue_invoice)
        account.status = AccountStatus.overdue
        account.save()

        waiting_receipt = self._create_cash_receipt(client=self.client_company2)
        TaxInvoiceAccount.objects.create(
            cash_receipt=waiting_receipt, status=AccountStatus.waiting,
            total_billed_amount=55000, outstanding_balance=55000
        )

        response = self._get("account_status=overdue")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["id"], overdue_invoice.id)
        self.assertEqual(data["data"][0]["account"]["status"], "overdue")

    def test_list_published_documents_filter_by_date_range(self):
        invoice_in_range = self._create_tax_invoice(transaction_date=date(2025, 6, 15))
        invoice_out_range = self._create_tax_invoice(
            client=self.client_company2, transaction_date=date(2025, 5, 1)
        )

        response = self._get("start_date=2025-06-01&end_date=2025-06-30")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item["id"] for item in data["data"]]
        self.assertIn(invoice_in_range.id, ids)
        self.assertNotIn(invoice_out_range.id, ids)

    def test_list_published_documents_search_by_q(self):
        invoice = self._create_tax_invoice()
        self.client_company1.name = "좋아하는 거래처"
        self.client_company1.save()

        response = self._get("q=좋아")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(invoice.id, [item["id"] for item in data["data"]])

    def test_list_published_documents_ordering(self):
        old_invoice = self._create_tax_invoice()
        new_receipt = self._create_cash_receipt(transaction_date=date(2025, 6, 3))

        response = self._get("ordering=-transaction_date")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)
        self.assertEqual(data["data"][0]["id"], new_receipt.id)
        self.assertEqual(data["data"][1]["id"], old_invoice.id)

    def test_list_published_documents_ordering_by_agreed_payment_date(self):
        late_invoice = self._create_tax_invoice()
        late_account = TaxInvoiceAccount.objects.get(tax_invoice=late_invoice)
        late_account.agreed_payment_date = date(2025, 7, 15)
        late_account.save()

        early_invoice = self._create_tax_invoice(client=self.client_company2, transaction_date=date(2025, 6, 2))
        early_account = TaxInvoiceAccount.objects.get(tax_invoice=early_invoice)
        early_account.agreed_payment_date = date(2025, 7, 1)
        early_account.save()

        response = self._get("document_type=tax&ordering=-agreed_payment_date")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 2)
        self.assertEqual(data["data"][0]["id"], late_invoice.id)
        self.assertEqual(data["data"][1]["id"], early_invoice.id)

    def test_list_published_documents_with_project(self):
        project = Project.objects.create(name="테스트 프로젝트")
        invoice = self._create_tax_invoice()
        project.tax_invoice = invoice
        project.save()

        response = self._get("document_type=tax")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["project_id"], project.id)

    def test_list_published_documents_empty_result(self):
        response = self._get()
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["data"]), 0)
        self.assertEqual(data["count"], 0)

    def test_list_published_documents_without_auth(self):
        url = f"/v2/tax/published?factory_id={self.factory.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)

    def test_list_published_documents_missing_factory_id(self):
        response = self.client.get("/v2/tax/published", HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(response.status_code, 422)
