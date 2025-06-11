from django.db import models

# Create your models here.

class QuotationRequest(models.Model):
    company_name = models.CharField(max_length=100, help_text="회사명")
    business_registration_number = models.CharField(max_length=20, help_text="사업자등록번호")
    ceo_name = models.CharField(max_length=50, help_text="대표자명")
    business_type = models.CharField(max_length=50, help_text="업태")
    business_item = models.CharField(max_length=50, help_text="종목")
    due_date = models.DateField(help_text="납기일자")
    client = models.CharField(max_length=100, help_text="거래처")
    company_address = models.CharField(max_length=200, help_text="회사주소")
    delivery_address = models.CharField(max_length=200, help_text="납품처주소")
    manager_name = models.CharField(max_length=50, help_text="담당자명")
    manager_email = models.EmailField(max_length=100, help_text="담당자 이메일")
    manager_phone = models.CharField(max_length=30, help_text="담당자 연락처")
    manager_fax = models.CharField(max_length=30, null=True, blank=True, help_text="담당자 팩스번호")
    created_at = models.DateField(auto_now_add=True, help_text="견적서 생성일자")
    status = models.CharField(max_length=30, help_text="상태")

    def __str__(self):
        return f"{self.company_name} - {self.client} ({self.status})"

class QuotationRequestItem(models.Model):
    quotation_request = models.ForeignKey(
        QuotationRequest,
        on_delete=models.CASCADE,
        related_name='items',
        help_text='견적 요청서'
    )
    item_name = models.CharField(max_length=100, help_text='품목')
    item_code = models.CharField(max_length=50, help_text='품목 코드')
    specification = models.CharField(max_length=100, help_text='규격')
    unit = models.CharField(max_length=20, help_text='단위')
    unit_price = models.PositiveIntegerField(help_text='단가')
    quantity = models.PositiveIntegerField(help_text='제작수량')
    amount = models.PositiveIntegerField(help_text='금액')

    def __str__(self):
        return f"{self.item_name} ({self.item_code})"

