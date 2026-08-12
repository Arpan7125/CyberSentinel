"""Real, sourced threat intelligence pulled from the public internet.

Everything this endpoint serves comes from CISA's Known Exploited
Vulnerabilities (KEV) catalogue — a public, authoritative feed of CVEs with
*confirmed* in-the-wild exploitation. Each item keeps its CVE id and a link
back to the primary source so a reader can always verify it independently.

Two rules this module holds to, both inherited from CyberIntelPage's history
(that page once shipped a fabricated "CVE-2023-XXXXX" advisory attributed to
analysts who never wrote it):

1. Nothing is invented. No summarising, no inferred severity, no filler. The
   fields below are passed through from CISA, renamed but not reinterpreted.
   KEV carries no CVSS score, so this endpoint does not publish one — it
   surfaces the signal CISA *does* give (known ransomware campaign use) and
   leaves it at that.
2. If the feed cannot be reached, the endpoint says so and returns nothing.
   A security product that invents advisories is worse than one showing none.
"""

import logging

import requests
from django.core.cache import cache
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

KEV_FEED_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
KEV_HUMAN_URL = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
NVD_DETAIL_URL = "https://nvd.nist.gov/vuln/detail/"

# KEV is republished roughly weekly, so a long TTL is plenty and keeps us from
# hammering a free government feed on every page load.
CACHE_KEY = "intel:cisa_kev:v1"
CACHE_TTL_SECONDS = 6 * 60 * 60

DEFAULT_LIMIT = 24
MAX_LIMIT = 100


def _normalise(entry):
    """Map one KEV record onto our field names.

    Every read is a .get() with a fallback: this is a third-party schema we do
    not control, and a renamed field upstream should degrade one card, not 500
    the whole page.
    """
    cve_id = (entry.get("cveID") or "").strip()
    vendor = (entry.get("vendorProject") or "").strip()
    product = (entry.get("product") or "").strip()

    return {
        "id": cve_id,
        "cve_id": cve_id,
        "title": (entry.get("vulnerabilityName") or cve_id or "Unnamed vulnerability").strip(),
        "vendor": vendor,
        "product": product,
        # Displayed as the card's category chip.
        "category": vendor or "Advisory",
        "summary": (entry.get("shortDescription") or "").strip(),
        "required_action": (entry.get("requiredAction") or "").strip(),
        "date_added": entry.get("dateAdded") or "",
        "due_date": entry.get("dueDate") or "",
        # CISA reports this as the string "Known" / "Unknown", not a boolean.
        "known_ransomware": (entry.get("knownRansomwareCampaignUse") or "").strip().lower() == "known",
        "source_name": "CISA KEV",
        "source_url": f"{NVD_DETAIL_URL}{cve_id}" if cve_id else KEV_HUMAN_URL,
    }


def _fetch_catalogue():
    """Return the parsed KEV payload, or None if it could not be retrieved.

    TLS verification is deliberately left on. This is a security product; an
    unverified fetch of a threat feed is a supply chain for bad advisories.
    """
    cached = cache.get(CACHE_KEY)
    if cached is not None:
        return cached

    try:
        response = requests.get(
            KEV_FEED_URL,
            timeout=15,
            headers={"User-Agent": "CyberSentinel/1.0 (threat-intel-reader)"},
        )
    except requests.RequestException as exc:
        logger.warning("CISA KEV feed unreachable: %s", exc)
        return None

    if response.status_code != 200:
        logger.warning("CISA KEV feed returned HTTP %s", response.status_code)
        return None

    try:
        payload = response.json()
    except ValueError as exc:
        logger.warning("CISA KEV feed returned a non-JSON body: %s", exc)
        return None

    if not isinstance(payload.get("vulnerabilities"), list):
        logger.warning("CISA KEV feed is missing its 'vulnerabilities' array — schema may have changed.")
        return None

    cache.set(CACHE_KEY, payload, CACHE_TTL_SECONDS)
    return payload


class ThreatIntelFeedView(APIView):
    """Newest actively-exploited vulnerabilities, straight from CISA.

    Authenticated because it is a dashboard feature and because an open,
    uncached proxy in front of someone else's free feed is a liability.
    """

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", DEFAULT_LIMIT))
        except (TypeError, ValueError):
            limit = DEFAULT_LIMIT
        limit = max(1, min(limit, MAX_LIMIT))

        payload = _fetch_catalogue()
        if payload is None:
            return Response(
                {
                    "error": "The CISA threat feed could not be reached right now.",
                    "detail": (
                        "Live advisories are unavailable until the connection recovers. "
                        "Nothing is shown rather than showing stale or invented intelligence."
                    ),
                    "source_url": KEV_HUMAN_URL,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        vulnerabilities = payload.get("vulnerabilities", [])

        # KEV ships oldest-first; the dashboard wants what is new.
        ordered = sorted(
            vulnerabilities,
            key=lambda item: item.get("dateAdded") or "",
            reverse=True,
        )

        items = [_normalise(entry) for entry in ordered[:limit]]

        return Response(
            {
                "source": {
                    "name": "CISA Known Exploited Vulnerabilities Catalog",
                    "url": KEV_HUMAN_URL,
                    "released": payload.get("dateReleased", ""),
                    "catalog_version": payload.get("catalogVersion", ""),
                },
                "total_in_catalog": payload.get("count", len(vulnerabilities)),
                "count": len(items),
                "items": items,
            }
        )
