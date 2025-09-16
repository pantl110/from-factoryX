import boto3
import logging
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage
from django.conf import settings
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class SESEmailBackend(BaseEmailBackend):
    """
    AWS SES Email Backend for Django
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.ses_client = None
        
    def open(self):
        """Initialize SES client"""
        if self.ses_client:
            return False
            
        try:
            self.ses_client = boto3.client(
                'ses',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_SES_REGION
            )
            return True
        except Exception as e:
            if not self.fail_silently:
                raise
            logger.error(f"Failed to initialize SES client: {e}")
            return False
    
    def close(self):
        """Close SES client connection"""
        self.ses_client = None
    
    def send_messages(self, email_messages):
        """Send email messages using AWS SES"""
        if not email_messages:
            return 0
            
        if not self.open():
            return 0
            
        num_sent = 0
        for message in email_messages:
            if self._send_message(message):
                num_sent += 1
                
        return num_sent
    
    def _send_message(self, message):
        """Send individual email message"""
        try:
            # Prepare email data
            destination = {
                'ToAddresses': message.to,
            }
            
            if message.cc:
                destination['CcAddresses'] = message.cc
                
            if message.bcc:
                destination['BccAddresses'] = message.bcc
            
            # Send email
            response = self.ses_client.send_email(
                Source=message.from_email,
                Destination=destination,
                Message={
                    'Subject': {
                        'Data': message.subject,
                        'Charset': 'UTF-8'
                    },
                    'Body': {
                        'Text': {
                            'Data': message.body,
                            'Charset': 'UTF-8'
                        }
                    }
                }
            )
            
            logger.info(f"Email sent successfully. MessageId: {response['MessageId']}")
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"SES Error {error_code}: {error_message}")
            
            if not self.fail_silently:
                raise
            return False
            
        except Exception as e:
            logger.error(f"Unexpected error sending email: {e}")
            if not self.fail_silently:
                raise
            return False


class SESEmailService:
    """
    High-level SES email service with templates
    """
    
    def __init__(self):
        self.ses_client = boto3.client(
            'ses',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_SES_REGION
        )
    
    def send_verification_email(self, to_email, verification_code, verification_type):
        """Send verification email with custom template"""
        try:
            if verification_type == "signup":
                subject = "[Factory X] 회원가입 인증 코드"
                template = self._get_signup_template(verification_code)
            elif verification_type == "password_reset":
                subject = "[Factory X] 비밀번호 재설정 인증 코드"
                template = self._get_password_reset_template(verification_code)
            else:
                raise ValueError(f"Unsupported verification type: {verification_type}")
            
            response = self.ses_client.send_email(
                Source=settings.DEFAULT_FROM_EMAIL,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {
                        'Data': subject,
                        'Charset': 'UTF-8'
                    },
                    'Body': {
                        'Html': {
                            'Data': template,
                            'Charset': 'UTF-8'
                        },
                        'Text': {
                            'Data': self._html_to_text(template),
                            'Charset': 'UTF-8'
                        }
                    }
                }
            )
            
            logger.info(f"Verification email sent to {to_email}. MessageId: {response['MessageId']}")
            return True
            
        except ClientError as e:
            logger.error(f"SES Error: {e.response['Error']['Message']}")
            return False
        except Exception as e:
            logger.error(f"Error sending verification email: {e}")
            return False
    
    def _get_signup_template(self, code):
        """Get HTML template for signup verification"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Factory X 회원가입 인증</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Factory X 회원가입 인증</h2>
                <p>안녕하세요! Factory X입니다.</p>
                <p>회원가입을 완료하기 위해 아래 인증 코드를 입력해주세요.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <h3 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">{code}</h3>
                </div>
                
                <p style="color: #6c757d; font-size: 14px;">
                    이 코드는 <strong>3분간</strong> 유효합니다.<br>
                    본인이 요청하지 않은 인증이라면 이 이메일을 무시해주세요.
                </p>
                
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    Factory X 팀<br>
                    이 이메일은 자동으로 발송된 메일입니다.
                </p>
            </div>
        </body>
        </html>
        """
    
    def _get_password_reset_template(self, code):
        """Get HTML template for password reset verification"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Factory X 비밀번호 재설정</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc3545;">Factory X 비밀번호 재설정</h2>
                <p>안녕하세요! Factory X입니다.</p>
                <p>비밀번호 재설정을 위해 아래 인증 코드를 입력해주세요.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <h3 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 5px;">{code}</h3>
                </div>
                
                <p style="color: #6c757d; font-size: 14px;">
                    이 코드는 <strong>3분간</strong> 유효합니다.<br>
                    본인이 요청하지 않은 인증이라면 이 이메일을 무시하고 비밀번호를 변경해주세요.
                </p>
                
                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                <p style="color: #6c757d; font-size: 12px;">
                    Factory X 팀<br>
                    이 이메일은 자동으로 발송된 메일입니다.
                </p>
            </div>
        </body>
        </html>
        """
    
    def _html_to_text(self, html_content):
        """Convert HTML to plain text for fallback"""
        # Simple HTML to text conversion
        import re
        text = re.sub('<[^<]+?>', '', html_content)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        return text.strip()
