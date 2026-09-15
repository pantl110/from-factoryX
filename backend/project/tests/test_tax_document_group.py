from django.test import TestCase

from factory.models import Factory
from project.models import Project
from project.schemas.outbound import ProjectModelOut, ProjectStatusDetailOut
from project.tax_documents import get_linked_tax_documents
from tax.models import NationalTaxService, TaxDocumentGroup
from user.models import User


class ProjectTaxDocumentGroupTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="project-tax-group@example.com",
            password="password1234!",
        )
        self.factory = Factory.objects.create(
            owner=self.user,
            name="Project Tax Group Factory",
            business_registration_number="123-45-67890",
        )

    def test_legacy_single_document_is_returned_as_one_item(self):
        document = NationalTaxService.objects.create(
            user=self.user,
            factory=self.factory,
        )
        project = Project.objects.create(name="단일 문서 프로젝트", tax_invoice=document)

        self.assertEqual(get_linked_tax_documents(project), [document])

    def test_grouped_documents_are_returned_without_splitting_project(self):
        group = TaxDocumentGroup.objects.create(
            factory=self.factory,
            created_by=self.user,
        )
        taxable = NationalTaxService.objects.create(
            user=self.user,
            factory=self.factory,
            document_group=group,
            tax_type="taxable",
        )
        exempt = NationalTaxService.objects.create(
            user=self.user,
            factory=self.factory,
            document_group=group,
            tax_type="exempt",
            document_kind="invoice",
        )
        project = Project.objects.create(name="혼합 문서 프로젝트", tax_invoice=taxable)

        self.assertEqual(
            [document.id for document in get_linked_tax_documents(project)],
            [taxable.id, exempt.id],
        )
        self.assertEqual(Project.objects.filter(id=project.id).count(), 1)

        loaded_project = (
            Project.objects.select_related(
                "tax_invoice",
                "tax_invoice__document_group",
            )
            .prefetch_related("tax_invoice__document_group__documents")
            .get(id=project.id)
        )
        list_payload = ProjectModelOut.from_orm(loaded_project)
        detail_payload = ProjectStatusDetailOut.from_orm(loaded_project)
        self.assertEqual(list_payload.tax_document_count, 2)
        self.assertEqual(detail_payload.tax_document_count, 2)
        self.assertEqual(
            list_payload.tax_document_group_key,
            str(group.group_key),
        )
        self.assertEqual(
            [document.id for document in list_payload.tax_documents],
            [taxable.id, exempt.id],
        )
