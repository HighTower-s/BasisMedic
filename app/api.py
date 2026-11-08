"""EDGE (experimental): FastAPI wrapper around app.triage_service.triage(). No
business logic here — parse request, call the service, map exceptions to status
codes, same rule as app/cli.py (Constitution VI)."""

from dotenv import load_dotenv

load_dotenv()  # the CLI relies on the caller's shell having sourced .env; this edge loads it itself

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app import config
from app.config import ConfigError
from app.retrieval.search import InvalidQueryError
from app.retrieval.store import StaleIndexError
from app.triage_service import triage

app = FastAPI(title="BasisMedic (experimental)")

# The frontend is the Next.js app in web/. Locally it proxies /api/* to this
# server (same-origin, no CORS needed). Deployed separately (e.g. Vercel +
# Render), the browser calls this origin directly, so CORS must be explicit.
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allowed_origins(),
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class TriageRequest(BaseModel):
    log: str


@app.post("/api/triage")
def api_triage(request: TriageRequest) -> JSONResponse:
    try:
        result = triage(request.log)
    except InvalidQueryError as exc:
        return JSONResponse({"error": str(exc)}, status_code=422)
    except StaleIndexError as exc:
        return JSONResponse({"error": str(exc)}, status_code=409)
    except ConfigError as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)
    except Exception as exc:  # UpstreamError or any gateway failure
        return JSONResponse({"error": str(exc)}, status_code=502)

    return JSONResponse(result.model_dump())
