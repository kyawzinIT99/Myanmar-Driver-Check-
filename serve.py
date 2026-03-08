# serve.py — Myanmar Driver Check on Modal
# Serves static HTML/JS/CSS app as a web endpoint.
# Credentials: stored in ~/.modal.toml (never in this file).

import modal
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles

# ── App definition ────────────────────────────────────
# App name is deliberately generic — does not expose
# the workspace/brand name to end users in the URL slug.
app = modal.App("driver-check-mm")

# ── Static files to bundle into the image ────────────
STATIC_DIR = Path(__file__).parent
STATIC_FILES = [
    "index.html",
    "app.js",
    "style.css",
    "manifest.json",
]

# Build a Docker image that includes the static files
image = (
    modal.Image.debian_slim()
    .pip_install("fastapi[standard]")
    .add_local_file(STATIC_DIR / "index.html",   "/assets/index.html")
    .add_local_file(STATIC_DIR / "app.js",        "/assets/app.js")
    .add_local_file(STATIC_DIR / "style.css",     "/assets/style.css")
    .add_local_file(STATIC_DIR / "manifest.json", "/assets/manifest.json")
)

# ── FastAPI app ───────────────────────────────────────
web_app = FastAPI(
    title="Myanmar Driver Check",
    description="Odd-Even driving eligibility checker for Myanmar drivers.",
    docs_url=None,   # disable /docs — keep the endpoint clean
    redoc_url=None,
)

ASSETS = Path("/assets")

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
}

# Security headers added to every response
SECURITY_HEADERS = {
    "X-Content-Type-Options":    "nosniff",
    "X-Frame-Options":           "DENY",
    "X-XSS-Protection":          "1; mode=block",
    "Referrer-Policy":           "strict-origin-when-cross-origin",
    "Permissions-Policy":        "camera=(self), microphone=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    # Cache static assets for 1 hour; allow revalidation
    "Cache-Control":             "public, max-age=3600, must-revalidate",
}

def make_response(filename: str) -> Response:
    filepath = ASSETS / filename
    if not filepath.exists():
        return Response("Not found", status_code=404)
    suffix = filepath.suffix
    content_type = CONTENT_TYPES.get(suffix, "application/octet-stream")
    content = filepath.read_bytes()
    return Response(
        content=content,
        media_type=content_type,
        headers=SECURITY_HEADERS,
    )

@web_app.get("/",              response_class=HTMLResponse)
@web_app.get("/index.html",    response_class=HTMLResponse)
def root():
    return make_response("index.html")

@web_app.get("/app.js")
def serve_js():
    return make_response("app.js")

@web_app.get("/style.css")
def serve_css():
    return make_response("style.css")

@web_app.get("/manifest.json")
def serve_manifest():
    return make_response("manifest.json")

# Health check — for uptime monitoring
@web_app.get("/health")
def health():
    return {
        "status": "ok",
        "app": "Myanmar Driver Check",
        "data_version": "v1.2",
        "data_verified": "2026-03-08",
        "scheme_effective": "2026-03-07",
    }

# ── Modal web endpoint ────────────────────────────────
@app.function(
    image=image,
    # Keep-warm: 1 instance always running — zero cold-start for Myanmar drivers
    min_containers=1,
    # Scale up to 20 containers under load (handles thousands of concurrent users)
    max_containers=20,
)
@modal.concurrent(max_inputs=100)   # Each container handles 100 concurrent requests
@modal.asgi_app()
def serve():
    return web_app
