from django.db import models

# Create your models here.

class Order(models.Model):


    def __str__(self):
        return f"주문서: "

class ProductionInstruction(models.Model):


    def __str__(self):
        return f"생산지시서: "

class TransactionStatement(models.Model):


    def __str__(self):
        return f"거래명세서: "

class SalesTaxInvoice(models.Model):


    def __str__(self):
        return f"매출세금계산서: "

class PurchaseTaxInvoice(models.Model):

    def __str__(self):
        return f"매입세금계산서: "
