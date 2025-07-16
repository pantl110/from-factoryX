from ninja import Router
from ninja.responses import Response
from api.security import jwt_auth
from document.utils import content_ocr
from document.schemas.inbound import OcrIn
from typing import Dict, Any
import base64

router = Router(tags=["Quotation"], auth=jwt_auth)


@router.post(
    "/ocr",
    summary="[C] 견적서 OCR 업로드",
    description="OCR 업로드",
    response={200: Dict[str, Any]},
    auth=jwt_auth,
)
async def upload_file(request, payload: OcrIn):
    """
    Endpoint to upload a file and read it as binary data.

    Args:
        payload: The uploaded file

    Returns:
        Dict containing file information and upload status
    """
    try:
        # Read the file as binary data
        file_content = payload.data
        content = base64.b64decode(file_content)
        data = await content_ocr(content)
        print(data)
        # Here you would process the binary data as needed
        # For now, just returning basic file information
        return {"status": "success"}
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=400)
