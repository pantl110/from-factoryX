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
    UserMeWithMemberOut,
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
from user.models import EmailVerification
from django.utils import timezone
from datetime import timedelta, datetime
from user.models import EmailVerification
from factory.models import Factory, FactoryMember

User = get_user_model()
router = Router(tags=["Users"])


@router.post(
    "/send-verification-code",
    summary="[C] 이메일 인증 코드 발송",
    description="회원가입 또는 비밀번호 재설정을 위한 이메일 인증 코드를 발송합니다.",
    response={200: EmailVerificationOut},
)
async def send_verification_code(request, data: EmailVerificationRequestIn):
    """이메일 인증 코드 발송"""

    # 이메일 형식 검증
    await utils.validate_email_format(data.email)

    # 인증 타입 검증
    valid_types = ["signup", "password_reset"]
    if data.verification_type not in valid_types:
        raise HttpError(400, "올바르지 않은 인증 타입입니다.")

    # 회원가입의 경우 이미 등록된 이메일인지 확인
    if data.verification_type == "signup":
        if await User.objects.filter(email=data.email).aexists():
            raise HttpError(400, "이미 등록된 이메일입니다.")

    # 비밀번호 재설정의 경우 등록된 이메일인지 확인
    if data.verification_type == "password_reset":
        if not await User.objects.filter(email=data.email).aexists():
            raise HttpError(400, "등록되지 않은 이메일입니다.")

    # 기존 미인증 코드 삭제
    await EmailVerification.objects.filter(
        email=data.email,
        verification_type=data.verification_type,
        is_verified=False,
    ).adelete()

    # 새 인증 코드 생성
    code = utils.generate_verification_code()

    verification = await EmailVerification.objects.acreate(
        email=data.email,
        code=code,
        verification_type=data.verification_type,
    )
    expires_at = verification.created_at + timedelta(minutes=3)  # 3분 후 만료

    # 이메일 발송 (동기 함수)
    send_success = await sync_to_async(utils.send_verification_email)(
        data.email, code, data.verification_type
    )

    if send_success:
        return {
            "detail": "인증 코드가 발송되었습니다.",
            "expires_at": expires_at.isoformat(),
        }
    else:
        await verification.adelete()
        raise HttpError(500, "인증 코드 발송에 실패했습니다.")


@router.post(
    "/verify-code",
    summary="[C] 이메일 인증 코드 확인",
    description="발송된 이메일 인증 코드를 확인합니다.",
    response={200: EmailVerificationCodeOut},
)
async def verify_code(request, data: EmailVerificationCodeIn):
    """이메일 인증 코드 확인"""

    try:

        # 인증 코드 조회
        verification = await EmailVerification.objects.aget(
            email=data.email,
            code=data.code,
            verification_type=data.verification_type,
            is_verified=False,
        )

        # 만료 시간 확인
        if verification.created_at + timedelta(minutes=3) < timezone.now():
            raise HttpError(400, "인증 코드가 만료되었습니다.")

        # 인증 완료 처리
        verification.is_verified = True
        await verification.asave()

        return {"detail": "인증이 완료되었습니다.", "is_verified": True}

    except EmailVerification.DoesNotExist:
        raise HttpError(400, "유효하지 않은 인증 코드입니다.")


@router.post(
    "/reset-password",
    summary="[C] 비밀번호 재설정",
    description="인증 코드를 통해 비밀번호를 재설정합니다.",
    response={200: SuccessOut},
)
async def reset_password(request, data: PasswordResetIn):
    """비밀번호 재설정"""

    # 비밀번호 확인
    if data.new_password != data.new_password_confirm:
        raise HttpError(400, "비밀번호가 일치하지 않습니다.")

    try:
        # 인증된 코드 확인 (이미 verified=True인 코드 찾기)
        verification = await EmailVerification.objects.aget(
            email=data.email,
            code=data.code,
            verification_type="password_reset",
            is_verified=True,
        )

        # 만료 시간 확인 (인증 후 5분 내에 비밀번호 재설정해야 함)
        if verification.created_at + timedelta(minutes=5) < timezone.now():
            raise HttpError(400, "인증 시간이 만료되었습니다. 다시 인증해주세요.")

        # 사용자 찾기
        user = await User.objects.aget(email=data.email)

        # 비밀번호 변경
        user.set_password(data.new_password)
        await sync_to_async(user.save)()

        # 사용된 인증 코드 삭제
        await verification.adelete()

        # 기존 JWT 토큰 삭제 (재로그인 필요)
        await Jwt.objects.filter(user_id=user.id).adelete()

        return {"detail": "비밀번호가 성공적으로 변경되었습니다."}

    except EmailVerification.DoesNotExist:
        raise HttpError(400, "유효하지 않은 인증 코드입니다.")
    except User.DoesNotExist:
        raise HttpError(400, "등록되지 않은 이메일입니다.")
    except Exception as e:
        raise HttpError(500, "비밀번호 변경 중 오류가 발생했습니다.")


@router.post(
    "/signup",
    summary="[C] 회원가입",
    description="이메일 인증 후 회원가입을 진행합니다.",
    response={200: UserMeOut},
)
async def signup(request, data: UserSignupIn):
    user = None
    try:
        user = await User.objects.aget(email=data.email)
    except User.DoesNotExist:
        pass

    if user and user.status == User.UserStatusChoice.active:
        raise HttpError(400, "이미 가입된 이메일입니다.")

    if data.password != data.password_confirm:
        raise HttpError(400, "비밀번호가 일치하지 않습니다.")

    if not data.terms_of_service:
        raise HttpError(400, "이용약관에 동의해주세요.")

    if not data.privacy_policy_agreement:
        raise HttpError(400, "개인정보 수집 및 이용 동의에 동의해주세요.")

    # 이메일 인증 완료 여부 확인
    verification_exists = await EmailVerification.objects.filter(
        email=data.email, verification_type="signup", is_verified=True
    ).aexists()

    if not verification_exists:
        raise HttpError(400, "이메일 인증을 먼저 완료해주세요.")

    # 초대 처리
    target_factory = None
    invite_info = None

    if data.factory_id:
        try:
            # 팩토리 존재 확인
            target_factory = await Factory.objects.aget(id=data.factory_id)

            # 해당 팩토리의 inviting에서 이메일 확인
            inviting = target_factory.inviting or []
            for item in inviting:
                if item["email"] == data.email:
                    invite_info = item
                    break

            if not invite_info:
                raise HttpError(400, "해당 팩토리에서 초대받지 않은 이메일입니다.")

            # 역할 일치 확인
            if invite_info["role"] != data.invite_role:
                raise HttpError(400, "초대받은 역할과 일치하지 않습니다.")

            # 추가 보안 검사: 이미 가입된 사용자인지 확인
            existing_member = await FactoryMember.objects.filter(
                factory=target_factory, user__email=data.email
            ).aexists()

            if existing_member:
                raise HttpError(400, "이미 해당 팩토리의 멤버입니다.")

        except Factory.DoesNotExist:
            raise HttpError(400, "존재하지 않는 팩토리입니다.")
        except Exception as e:
            raise e

    if user and user.status == User.UserStatusChoice.withdraw:
        user.status = User.UserStatusChoice.inactive
        await user.asave()
    else:
        # 신규 사용자 생성
        try:
            user = await sync_to_async(User.objects.create_user)(
                email=data.email,
                password=data.password,
            )

            user = await User.objects.aget(id=user.id)

            # 팩토리 멤버 등록 처리

            if target_factory and invite_info:
                # 초대받은 경우 - 해당 팩토리에만 등록
                # invited_by User 인스턴스 찾기
                invited_by_user = None
                if invite_info.get("invited_by"):
                    invited_by_user = await User.objects.aget(
                        id=invite_info["invited_by"]
                    )

                # FactoryMember 생성
                await FactoryMember.objects.acreate(
                    factory=target_factory,
                    user=user,
                    role=invite_info["role"],
                    status=FactoryMember.MemberStatus.active,
                    invited_by=invited_by_user,
                    invited_at=invite_info.get("invited_at"),
                )

                # 해당 팩토리의 inviting에서 해당 항목 삭제
                inviting = target_factory.inviting or []
                inviting = [item for item in inviting if item["email"] != user.email]
                target_factory.inviting = inviting
                await sync_to_async(target_factory.save)()

                # 다른 모든 공장의 inviting에서도 해당 이메일 제거
                other_factories = await sync_to_async(list)(
                    Factory.objects.exclude(id=target_factory.id).filter(
                        inviting__isnull=False
                    )
                )
                for factory in other_factories:
                    if factory.inviting:
                        factory.inviting = [
                            item
                            for item in factory.inviting
                            if item["email"] != user.email
                        ]
                        await sync_to_async(factory.save)()
            else:
                # 일반 가입 - 초대가 있으면 처리하고, 없어도 회원가입 가능
                factories_with_invites = await sync_to_async(list)(
                    Factory.objects.filter(inviting__isnull=False)
                )

                for factory in factories_with_invites:
                    inviting = factory.inviting or []
                    matched_invite = None

                    # 해당 이메일로 초대된 항목 찾기
                    for item in inviting:
                        if item["email"] == user.email:
                            matched_invite = item
                            break

                    if matched_invite:
                        # invited_by User 인스턴스 찾기
                        invited_by_user = None
                        if matched_invite.get("invited_by"):
                            invited_by_user = await User.objects.aget(
                                id=matched_invite["invited_by"]
                            )

                        # FactoryMember 생성 - 초대된 공장에 멤버로 등록
                        await FactoryMember.objects.acreate(
                            factory=factory,
                            user=user,
                            role=matched_invite["role"],
                            status=FactoryMember.MemberStatus.active,
                            invited_by=invited_by_user,
                            invited_at=matched_invite.get("invited_at"),
                        )

                        # inviting에서 해당 항목 삭제
                        factory.inviting = [
                            item for item in inviting if item["email"] != user.email
                        ]
                        await sync_to_async(factory.save)()

                # 초대를 받지 않았어도 회원가입은 성공 (멤버 등록 없음)

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
    await utils.validate_email_format(data.email)

    # 이메일로 사용자 찾기
    try:
        user = await User.objects.aget(email=data.email)
    except User.DoesNotExist:
        raise HttpError(400, "등록되지 않은 이메일입니다.")

    if not await sync_to_async(user.check_password)(data.password):
        raise HttpError(400, "비밀번호가 일치하지 않습니다.")

    if user.status == User.UserStatusChoice.withdraw:
        raise HttpError(400, "탈퇴한 계정입니다. 재가입이 필요합니다.")

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

    # 쿠키 삭제를 위한 응답 생성
    response = JsonResponse({"detail": "로그아웃 되었어요."})

    # 쿠키 삭제 (만료일을 과거로 설정하여 삭제)
    response.delete_cookie("access")
    response.delete_cookie("refresh")

    return response


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
    response={200: UserMeWithMemberOut},
    auth=jwt_auth,
)
async def get_me(request):
    user = request.auth

    try:
        member = await FactoryMember.objects.filter(user=user).afirst()
        member_id = member.id if member else None
    except:
        member_id = None

    return {
        "email": user.email,
        "status": user.status,
        "username": user.username,
        "phone_number": user.phone_number,
        "profile_image": user.profile_image,
        "member_id": member_id,
    }


@router.patch(
    "/me",
    summary="[C] 회원 정보 수정",
    description="회원 정보를 수정합니다.",
    response={200: UserMeWithMemberOut},
    auth=jwt_auth,
)
async def update_user(request, payload: UserUpdateIn):
    user = request.auth
    data = payload.dict(exclude_unset=True)
    for attr, value in data.items():
        setattr(user, attr, value)
    await user.asave()

    try:
        member = await FactoryMember.objects.filter(user=user).afirst()
        member_id = member.id if member else None
    except:
        member_id = None

    return {
        "email": user.email,
        "status": user.status,
        "username": user.username,
        "phone_number": user.phone_number,
        "profile_image": user.profile_image,
        "member_id": member_id,
    }


@router.post(
    "/withdraw",
    summary="[C] 회원 탈퇴",
    description="회원 탈퇴를 진행합니다.",
    response={200: SuccessOut},
    auth=jwt_auth,
)
async def withdraw(request):
    user = request.auth
    user.status = User.UserStatusChoice.withdraw
    await user.asave()
    return {"detail": "회원 탈퇴가 완료되었습니다."}
