from ninja import Schema

# for create_project method
class ProjectCreateIn(Schema):
    id:int
    class Config: from_attributes = True
