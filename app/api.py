"""EDGE (experimental): FastAPI wrapper around app.triage_service.triage(). No
business logic here — parse request, call the service, map exceptions to status
codes, same rule as app/cli.py (Constitution VI)."""

from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # the CLI relies on the caller's shell having sourced .env; this edge loads it itself

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.config import ConfigError
from app.retrieval.search import InvalidQueryError
from app.retrieval.store import StaleIndexError
from app.triage_service import triage

app = FastAPI(title="BasisMedic (experimental)")

WEB_DIR = Path(__file__).resolve().parent.parent / "web"


class TriageRequest(BaseModel):
    log: str


@app.get("/")
def index() -> FileResponse:
    return FileResponse(WEB_DIR / "index.html")


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
