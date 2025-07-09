from ninja import ModelSchema
from location.models import Location

class LocationOut(ModelSchema):
    class Meta:
        model = Location
        fields = "__all__"
