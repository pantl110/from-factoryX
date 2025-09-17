from ninja.errors import HttpError
import jwt, random, string
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from api.exceptions import CustomAuthorizationError
from zoneinfo import ZoneInfo
from uuid import UUID
import re


User = get_user_model()


# 이메일 형식 검증 정규표현식
EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"


async def validate_email_format(email):
    """
    이메일 형식이 올바른지 검증하는 함수
    """
    if not email or not isinstance(email, str):
        raise HttpError(400, "올바른 이메일 형식이 아닙니다")

    if not re.match(EMAIL_REGEX, email):
        raise HttpError(400, "올바른 이메일 형식이 아닙니다")


def get_random(length):
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def get_access_token(payload):
    # JWT의 exp는 UTC 기준이므로 UTC로 명시적으로 설정
    exp_utc = timezone.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRATION_TIME)
    return (
        jwt.encode(
            {
                "exp": exp_utc,
                **payload,
            },
            settings.SECRET_KEY,
            algorithm="HS256",
        ),
        exp_utc,
    )


def get_refresh_token():
    # JWT의 exp는 UTC 기준이므로 UTC로 명시적으로 설정
    exp_utc = timezone.utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRATION_TIME)
    return (
        jwt.encode(
            {
                "exp": exp_utc,
                "data": get_random(10),
            },
            settings.SECRET_KEY,
            algorithm="HS256",
        ),
        exp_utc,
    )


async def validate_refresh_token(token):
    try:
        decoded = jwt.decode(token, key=settings.SECRET_KEY, algorithms="HS256")
        # JWT의 exp는 UTC 기준이므로 UTC로 비교
        exp_datetime_utc = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        current_utc = timezone.utcnow()
        if exp_datetime_utc < current_utc:
            raise CustomAuthorizationError("토큰이 만료되었습니다.", 401)
    except jwt.ExpiredSignatureError:
        raise CustomAuthorizationError("토큰이 만료되었습니다.", 401)
    except jwt.DecodeError:
        raise CustomAuthorizationError("올바르지 않은 토큰입니다.", 401)


async def decodeJWT(bearer):
    if not bearer:
        return None

    token = bearer[7:]
    try:
        decoded = jwt.decode(token, key=settings.SECRET_KEY, algorithms="HS256")
        # JWT의 exp는 UTC 기준이므로 UTC로 비교
        exp_datetime_utc = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        current_utc = timezone.utcnow()
        if exp_datetime_utc < current_utc:
            raise CustomAuthorizationError("토큰이 만료되었습니다.", 401)
    except jwt.exceptions.ExpiredSignatureError:
        raise CustomAuthorizationError("토큰이 만료되었습니다.", 401)
    except jwt.exceptions.DecodeError:
        raise CustomAuthorizationError("올바르지 않은 토큰입니다.", 401)

    if decoded:
        try:
            from uuid import UUID

            user_id = (
                UUID(decoded["user_id"])
                if isinstance(decoded["user_id"], str)
                else decoded["user_id"]
            )
            return await User.objects.aget(id=user_id)
        except User.DoesNotExist:
            return None


# async def create_password_reset_token(user):
#     token = secrets.token_urlsafe(32)
#     await PasswordEmailVerification.objects.filter(
#         user=user, is_verified=False
#     ).adelete()
#     verification = await PasswordEmailVerification.objects.acreate(
#         user=user, token=token, is_verified=False
#     )
#     return verification


def set_cookie_jwt(response, access, refresh, access_exp, refresh_exp, reset=None):
    domain = settings.SESSION_COOKIE_DOMAIN
    secure = settings.SESSION_COOKIE_SECURE
    samesite = settings.SESSION_COOKIE_SAMESITE

    response.set_cookie(
        key="access",
        value=access,
        expires=access_exp,
        secure=secure,
        samesite=samesite,
        httponly=False,
        domain=domain,
    )

    response.set_cookie(
        key="refresh",
        value=refresh,
        expires=refresh_exp,
        secure=secure,
        samesite=samesite,
        httponly=True,
        domain=domain,
    )

    if reset:
        response.set_cookie(
            key="reset",
            value=reset,
            expires=access_exp,
            secure=secure,
            samesite=samesite,
            httponly=True,
            domain=domain,
        )

    return response


def generate_verification_code():
    """6자리 인증 코드 생성"""
    return "".join(random.choices(string.digits, k=6))


def send_verification_email(email, code, verification_type):
    """인증 이메일 발송"""
    from django.conf import settings

    # AWS SES 사용 여부 확인
    if getattr(settings, "USE_SES", False):
        try:
            from .backends import SESEmailService

            ses_service = SESEmailService()
            return ses_service.send_verification_email(email, code, verification_type)
        except Exception as e:
            print(f"SES 이메일 발송 실패: {e}")
            return False

    # 개발 환경에서는 콘솔에 출력
    if verification_type == "signup":
        subject = "[Factory X] 회원가입 인증 코드"
        message = f"""
안녕하세요! Factory X입니다.

회원가입을 완료하기 위해 아래 인증 코드를 입력해주세요.

인증 코드: {code}

이 코드는 5분간 유효합니다.

감사합니다.
        """
    elif verification_type == "password_reset":
        subject = "[Factory X] 비밀번호 재설정 인증 코드"
        message = f"""
안녕하세요! Factory X입니다.

비밀번호 재설정을 위해 아래 인증 코드를 입력해주세요.

인증 코드: {code}

이 코드는 5분간 유효합니다.

감사합니다.
        """
    else:
        return False

    try:
        # Django의 기본 이메일 백엔드 사용 (콘솔 또는 SMTP)
        from django.core.mail import send_mail

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        # print(f"=== 이메일 발송 ===")
        # print(f"To: {email}")
        # print(f"Subject: {subject}")
        # print(f"Code: {code}")
        # print(f"=================")

        return True
    except Exception as e:
        print(f"이메일 발송 실패: {e}")
        return False


def create_verification_code(email, verification_type):
    """인증 코드 생성 및 저장"""
    from .models import EmailVerification

    # 기존 미인증 코드 삭제
    EmailVerification.objects.filter(
        email=email, verification_type=verification_type, is_verified=False
    ).delete()

    # 새 인증 코드 생성
    code = generate_verification_code()
    expires_at = timezone.now() + timedelta(minutes=5)  # 5분 후 만료

    verification = EmailVerification.objects.create(
        email=email,
        code=code,
        verification_type=verification_type,
        expires_at=expires_at,
    )

    # 이메일 발송
    send_success = send_verification_email(email, code, verification_type)

    if send_success:
        return verification
    else:
        verification.delete()
        return None


def verify_email_code(email, code, verification_type):
    """이메일 인증 코드 검증"""
    from .models import EmailVerification

    try:
        verification = EmailVerification.objects.get(
            email=email,
            code=code,
            verification_type=verification_type,
            is_verified=False,
        )

        if verification.is_expired():
            return False, "인증 코드가 만료되었습니다."

        # 인증 완료 처리
        verification.is_verified = True
        verification.save()

        return True, "인증이 완료되었습니다."

    except EmailVerification.DoesNotExist:
        return False, "유효하지 않은 인증 코드입니다."


async def get_user_by_id(user_id: UUID):
    try:
        return await User.objects.aget(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "사용자를 찾을 수 없습니다.")
