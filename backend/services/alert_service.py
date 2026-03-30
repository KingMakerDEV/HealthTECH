"""
Alert Service
Handles all outbound notifications: email via Brevo, SMS via Twilio.
Called by the Escalation Decision Agent.
"""
import logging
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from twilio.rest import Client as TwilioClient

from app.config import settings

logger = logging.getLogger(__name__)


# ── Email via Brevo ───────────────────────────────────────────────

async def send_email_alert(
    to_email: str,
    to_name:  str,
    subject:  str,
    body:     str,
) -> bool:
    """
    Sends a transactional email via Brevo (formerly Sendinblue).
    Returns True on success, False on failure.
    """
    try:
        configuration              = sib_api_v3_sdk.Configuration()
        configuration.api_key["api-key"] = settings.BREVO_API_KEY

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )

        html_body = f"""
        <html><body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #00C896; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">CARENETRA Health Alert</h2>
            </div>
            <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #333;">{body}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">
                    This is an automated alert from CARENETRA Autonomous Clinical Monitoring System.
                    Do not reply to this email.
                </p>
            </div>
        </div>
        </body></html>
        """

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": to_name}],
            sender={"email": settings.SENDER_EMAIL, "name": settings.SENDER_NAME},
            subject=subject,
            html_content=html_body,
        )

        api_instance.send_transac_email(send_smtp_email)
        logger.info(f"[AlertService] Email sent to {to_email}")
        return True

    except ApiException as e:
        logger.error(f"[AlertService] Brevo API error: {e}")
        return False
    except Exception as e:
        logger.error(f"[AlertService] Email failed: {e}")
        return False


# ── SMS via Twilio ────────────────────────────────────────────────

async def send_sms_alert(to_phone: str, body: str) -> bool:
    """
    Sends an SMS via Twilio.
    Returns True on success, False on failure.
    to_phone must be in E.164 format e.g. +919876543210
    """
    try:
        client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        message = client.messages.create(
            body=body[:1600],   # SMS character limit
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to_phone,
        )

        logger.info(f"[AlertService] SMS sent to {to_phone} | SID: {message.sid}")
        return True

    except Exception as e:
        logger.error(f"[AlertService] Twilio SMS failed to {to_phone}: {e}")
        return False