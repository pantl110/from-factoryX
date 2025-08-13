from ninja import Router
from api.security import jwt_auth
from aws.schemas.inbound import UploadSchema
import mimetypes
import uuid
from django.conf import settings
from aws.clients import get_boto3_s3_client


router = Router(tags=["AWS"])


@router.post(
    "/upload",
    summary="[C] S3 파일 업로드 (new)",
    description="파일을 업로드합니다.",
    auth=jwt_auth,
)
async def upload_file_post(request, payload: UploadSchema):
    file_name = payload.file_name
    file_name = file_name.replace(" ", "_") if file_name else "default_image.png"

    # 확장자를 확인해서 content-type을 지정해줄 수 있음
    fields = {}
    content_type, _ = mimetypes.guess_type(file_name)  # mp3 -> audio/mpeg
    if content_type is None:
        content_type = "application/octet-stream"
    fields["Content-Type"] = content_type

    uuid_hex = uuid.uuid4().hex
    object_name = f"objects/{uuid_hex}/{file_name}"
    object_url = f"{settings.AWS_CLOUDFRONT_URL}/{object_name}"

    s3_client = await get_boto3_s3_client()
    presigned_url = s3_client.generate_presigned_post(
        Fields=fields,  # Content-Type
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=object_name,
        Conditions=[
            fields,  # Content-Type
            ["content-length-range", 1, 15728640],  # 용량 제한 15MB
        ],
        ExpiresIn=300,
    )

    return {
        "upload_url": presigned_url,
        "object_url": object_url,
    }
