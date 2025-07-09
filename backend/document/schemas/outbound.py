from ninja import ModelSchema
from document.models import Quotation, QuotationProduct

class QuotationOut(ModelSchema):
    class Meta:
        model = Quotation
        fields = "__all__"

class QuotationProductOut(ModelSchema):
    class Meta:
        model = QuotationProduct
        fields = "__all__"
