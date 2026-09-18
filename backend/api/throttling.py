from ninja.throttling import SimpleRateThrottle

from apikey.models import ApiKey


class PartnerApiKeyThrottle(SimpleRateThrottle):
    rate = "60/m"

    def __init__(self):
        super().__init__(rate=self.rate)

    def get_cache_key(self, request):
        auth = getattr(request, "auth", None)
        if not isinstance(auth, ApiKey):
            return None
        return self.cache_format % {
            "scope": "partner_api",
            "ident": auth.key_prefix,
        }
