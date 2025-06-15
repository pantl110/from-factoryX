from django.db import models
import uuid

# Create your models here.

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(max_length=50, help_text="진행상태")
    execution_date = models.DateField(help_text="집행일자")
    due_date = models.DateField(help_text="납기일자")
    completed_date = models.DateField(null=True, blank=True, help_text="완료일자")

    def __str__(self):
        return f"{self.status} - {self.execution_date} ~ {self.due_date}"

class ProjectItem(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='items',
        help_text='연결된 프로젝트'
    )
    item = models.ForeignKey(
        'item.Item',
        on_delete=models.CASCADE,
        related_name='project_items',
        help_text='연결된 품목'
    )
    equipment = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.CASCADE,
        related_name='project_items',
        help_text='연결된 설비'
    )
    operation_status = models.CharField(max_length=50, help_text='가동상태')

    def __str__(self):
        return f"{self.project} - {self.item} - {self.equipment} - {self.operation_status}"
