from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from user.schemas.outbound import (
    UserMeOut,
    SuccessOut,
    UserRefreshTokenOut,
    EmailVerificationOut,
    EmailVerificationCodeOut,
)
from user.schemas.inbound import (
    UserSignupIn,
    UserLoginIn,
    RefreshTokenIn,
    UserUpdateIn,
    EmailVerificationRequestIn,
    EmailVerificationCodeIn,
    PasswordResetIn,
)
from user.models import Jwt, User
from user import utils
from django.conf import settings
from api.exceptions import CustomAuthorizationError
from django.http import JsonResponse
from api.security import jwt_auth
from user.utils import validate_email_format
from user.models import EmailVerification
from django.utils import timezone
from datetime import timedelta
from uuid import UUID

User = get_user_model()
router = Router(tags=["Users"])


# @router.post(
#     "/send-verification-code",
#     summary="[C] 이메일 인증 코드 발송",
#     description="회원가입 또는 비밀번호 재설정을 위한 이메일 인증 코드를 발송합니다.",
#     response={200: EmailVerificationOut},
# )
# async def send_verification_code(request, data: EmailVerificationRequestIn):
#     """이메일 인증 코드 발송"""

#     # 이메일 형식 검증
#     try:
#         validate_email(data.email)
#     except EmailNotValidError:
#         raise HttpError(400, "올바른 이메일 형식이 아닙니다.")

#     # 인증 타입 검증
#     valid_types = ["signup", "password_reset"]
#     if data.verification_type not in valid_types:
#         raise HttpError(400, "올바르지 않은 인증 타입입니다.")

#     # 회원가입의 경우 이미 등록된 이메일인지 확인
#     if data.verification_type == "signup":
#         if await User.objects.filter(email=data.email).aexists():
#             raise HttpError(400, "이미 등록된 이메일입니다.")

#     # 비밀번호 재설정의 경우 등록된 이메일인지 확인
#     if data.verification_type == "password_reset":
#         if not await User.objects.filter(email=data.email).aexists():
#             raise HttpError(400, "등록되지 않은 이메일입니다.")

#     try:
#         # 기존 미인증 코드 삭제
#         await EmailVerification.objects.filter(
#             email=data.email,
#             verification_type=data.verification_type,
#             is_verified=False,
#         ).adelete()

#         # 새 인증 코드 생성
#         code = utils.generate_verification_code()
#         expires_at = timezone.now() + timedelta(minutes=5)  # 5분 후 만료

#         verification = await EmailVerification.objects.acreate(
#             email=data.email,
#             code=code,
#             verification_type=data.verification_type,
#             expires_at=expires_at,
#         )

#         # 이메일 발송 (동기 함수)
#         send_success = await sync_to_async(utils.send_verification_email)(
#             data.email, code, data.verification_type
#         )

#         if send_success:
#             return {
#                 "detail": "인증 코드가 발송되었습니다.",
#                 "expires_at": verification.expires_at.isoformat(),
#             }
#         else:
#             await verification.adelete()
#             raise HttpError(500, "인증 코드 발송에 실패했습니다.")

#     except Exception as e:
#         raise HttpError(500, "인증 코드 발송 중 오류가 발생했습니다.")


# @router.post(
#     "/verify-code",
#     summary="[C] 이메일 인증 코드 확인",
#     description="발송된 이메일 인증 코드를 확인합니다.",
#     response={200: EmailVerificationCodeOut},
# )
# async def verify_code(request, data: EmailVerificationCodeIn):
#     """이메일 인증 코드 확인"""

#     try:
#         from user.models import EmailVerification

#         # 인증 코드 조회
#         verification = await EmailVerification.objects.aget(
#             email=data.email,
#             code=data.code,
#             verification_type=data.verification_type,
#             is_verified=False,
#         )

#         # 만료 시간 확인
#         if verification.is_expired():
#             raise HttpError(400, "인증 코드가 만료되었습니다.")

#         # 인증 완료 처리
#         verification.is_verified = True
#         await verification.asave()

#         return {"detail": "인증이 완료되었습니다.", "is_verified": True}

#     except EmailVerification.DoesNotExist:
#         raise HttpError(400, "유효하지 않은 인증 코드입니다.")
#     except HttpError:
#         # HttpError는 다시 발생시킴
#         raise
#     except Exception as e:
#         raise HttpError(500, "인증 코드 확인 중 오류가 발생했습니다.")


# @router.post(
#     "/reset-password",
#     summary="[C] 비밀번호 재설정",
#     description="인증 코드를 통해 비밀번호를 재설정합니다.",
#     response={200: SuccessOut},
# )
# async def reset_password(request, data: PasswordResetIn):
#     """비밀번호 재설정"""

#     # 비밀번호 확인
#     if data.new_password != data.new_password_confirm:
#         raise HttpError(400, "비밀번호가 일치하지 않습니다.")

#     try:
#         from user.models import EmailVerification

#         # 인증된 코드 확인 (이미 verified=True인 코드 찾기)
#         verification = await EmailVerification.objects.aget(
#             email=data.email,
#             code=data.code,
#             verification_type="password_reset",
#             is_verified=True,
#         )

#         # 만료 시간 확인 (인증 후 5분 내에 비밀번호 재설정해야 함)
#         if verification.is_expired():
#             raise HttpError(400, "인증 시간이 만료되었습니다. 다시 인증해주세요.")

#         # 사용자 찾기
#         user = await User.objects.aget(email=data.email)

#         # 비밀번호 변경
#         user.set_password(data.new_password)
#         await sync_to_async(user.save)()

#         # 사용된 인증 코드 삭제
#         await verification.adelete()

#         # 기존 JWT 토큰 삭제 (재로그인 필요)
#         await Jwt.objects.filter(user_id=user.id).adelete()

#         return {"detail": "비밀번호가 성공적으로 변경되었습니다."}

#     except EmailVerification.DoesNotExist:
#         raise HttpError(400, "유효하지 않은 인증 코드입니다.")
#     except User.DoesNotExist:
#         raise HttpError(400, "등록되지 않은 이메일입니다.")
#     except Exception as e:
#         raise HttpError(500, "비밀번호 변경 중 오류가 발생했습니다.")


@router.post(
    "/signup",
    summary="[C] 회원가입",
    description="이메일 인증 후 회원가입을 진행합니다.",
    response={200: UserMeOut},
)
async def signup(request, data: UserSignupIn):
    if await User.objects.filter(email=data.email).aexists():
        raise HttpError(420, "이미 등록된 이메일입니다.")

    if data.password != data.password_confirm:
        raise HttpError(400, "비밀번호가 일치하지 않습니다.")

    if not data.terms_of_service:
        raise HttpError(400, "이용약관에 동의해주세요.")

    if not data.privacy_policy_agreement:
        raise HttpError(400, "개인정보 수집 및 이용 동의에 동의해주세요.")

    # 이메일 인증 완료 여부 확인
    from user.models import EmailVerification

    verification_exists = await EmailVerification.objects.filter(
        email=data.email, verification_type="signup", is_verified=True
    ).aexists()

    if not verification_exists:
        raise HttpError(400, "이메일 인증을 먼저 완료해주세요.")

    try:
        user = await sync_to_async(User.objects.create_user)(
            email=data.email,
            password=data.password,
        )

        user = await User.objects.aget(id=user.id)

        return user
    except Exception as e:
        raise HttpError(
            400, "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        )


@router.post(
    "/login",
    summary="[C] 로그인",
    description="이메일과 비밀번호로 로그인을 진행합니다.",
    response={
        200: UserMeOut,
    },
)
async def login(request, data: UserLoginIn):
    # 이메일 형식 검증
    await validate_email_format(data.email)

    # 이메일로 사용자 찾기
    try:
        user = await User.objects.aget(email=data.email)
    except User.DoesNotExist:
        raise HttpError(400, "등록되지 않은 이메일입니다.")

    if not await sync_to_async(user.check_password)(data.password):
        raise HttpError(400, "비밀번호가 일치하지 않습니다.")

    await Jwt.objects.filter(user_id=user.id).adelete()

    access, access_exp = utils.get_access_token({"user_id": str(user.id)})
    refresh, refresh_exp = utils.get_refresh_token()

    await Jwt.objects.acreate(
        user_id=user.id,
        access=access,
        refresh=refresh,
    )

    response = JsonResponse({"status": user.status})
    if settings.DJANGO_ENV_NAME == "local":
        response = JsonResponse(
            {
                "status": user.status,
                "access_token": access,
                "refresh_token": refresh,
            }
        )

    return utils.set_cookie_jwt(response, access, refresh, access_exp, refresh_exp)


@router.post(
    "/logout",
    summary="[C] 로그아웃",
    description="로그아웃을 진행합니다.",
    response={
        200: SuccessOut,
    },
    auth=jwt_auth,
)
async def logout(request):
    user = request.auth
    await Jwt.objects.filter(user_id=user.id).adelete()
    return {"detail": "로그아웃 되었어요."}


@router.post(
    "/refresh-token",
    summary="[C] 토큰 갱신",
    description="만료된 Access Token을 갱신합니다.",
    response={
        200: UserRefreshTokenOut,
    },
)
async def refresh_token(request, data: RefreshTokenIn):
    try:
        await utils.validate_refresh_token(data.refresh_token)

        # Refresh Token을 통해 DB에서 JWT Entry를 가져옴
        jwt_entry = await Jwt.objects.select_related("user").aget(
            refresh=data.refresh_token
        )

        user = jwt_entry.user
        if not user:
            raise HttpError(400, "Invalid user")

        # 새로운 Access Token 및 Refresh Token 생성
        access, access_exp = utils.get_access_token({"user_id": str(user.id)})
        refresh, refresh_exp = utils.get_refresh_token()

        # 기존 Refresh Token 업데이트
        await Jwt.objects.aupdate_or_create(
            user_id=user.id,
            defaults={"access": access, "refresh": refresh},
        )

        response = JsonResponse({"status": user.status})
        if settings.DJANGO_ENV_NAME == "local":
            response = JsonResponse(
                {
                    "status": user.status,
                    "access_token": access,
                    "refresh_token": refresh,
                }
            )
        return utils.set_cookie_jwt(response, access, refresh, access_exp, refresh_exp)

    except CustomAuthorizationError as e:
        raise HttpError(400, str(e))


@router.get(
    "/me",
    summary="[C] 내 정보 조회",
    description="내 정보를 조회합니다.",
    response={200: UserMeOut},
    auth=jwt_auth,
)
async def get_me(request):
    user = await User.objects.aget(id=request.auth.id)
    return user


@router.patch(
    "/{user_id}",
    summary="[C] 회원 정보 수정",
    description="회원 정보를 수정합니다.",
    response={200: UserMeOut},
    auth=jwt_auth,
)
async def update_user(request, user_id: UUID, data: UserUpdateIn):
    async def get_user_by_id(user_id: int):
        return await User.objects.aget(id=user_id)

    if request.auth.status != User.UserStatusChoice.admin:
        raise HttpError(400, "관리자가 아니에요.")

    user = await get_user_by_id(user_id)

    await user.asave()
    return await get_user_by_id(user_id)
