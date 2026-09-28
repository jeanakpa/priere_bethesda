import os
import json
import http.client
import threading

class SmsService:

    @staticmethod
    def _send_async(base_url, api_key, clean_phone, message_body, otp_code):
        try:
            conn = http.client.HTTPSConnection(base_url, timeout=5)
            payload = json.dumps({
                "messages": [
                    {
                        "destinations": [{"to": clean_phone}],
                        "from": "BETHESDA",
                        "text": message_body
                    }
                ]
            })
            headers = {
                'Authorization': f'App {api_key}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            conn.request("POST", "/sms/2/text/advanced", payload, headers)
            res = conn.getresponse()
            data = res.read().decode("utf-8")
            print(f"Infobip API Response ({res.status}): {data}")
            conn.close()
        except Exception as e:
            print(f"[SMS ERROR] Exception lors de l'envoi SMS Infobip: {e}")

    @staticmethod
    def send_otp_sms(to_phone, otp_code):
        """
        Sends an SMS with the OTP code via Infobip REST API in background thread.
        Target phone format: 2250556936994
        """
        api_key = os.getenv("INFOBIP_API_KEY", "9a76c54f3c3a80c1d6706ceec7c1052e-0580d685-3133-407a-9ebd-e859894a98dc")
        base_url = os.getenv("INFOBIP_BASE_URL", "pd54el.api.infobip.com")
        clean_phone = to_phone.replace("+", "").replace(" ", "").strip()
        if not clean_phone:
            clean_phone = "2250556936994"

        message_body = f"Code de vérification TEMPLE BETHESDA : {otp_code}. Valide pendant 5 minutes. Ne le partagez avec personne."

        print(f"\n==========================================")
        print(f"[SMS INFOBIP] Envoi SMS vers {clean_phone}")
        print(f"==========================================\n")

        # Asynchronous dispatch
        thread = threading.Thread(
            target=SmsService._send_async,
            args=(base_url, api_key, clean_phone, message_body, otp_code),
            daemon=True
        )
        thread.start()
        return True, "Envoi SMS initié"
