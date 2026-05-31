"""GCP helpers: Cloud Logging structured output + request middleware.

Cloud Run / GKE collects JSON written to stdout as structured logs, so this
starter can emit Cloud Logging-friendly logs without requiring the
google-cloud-logging client locally.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
import uuid
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


_SEVERITY_MAP = {
    logging.DEBUG: "DEBUG",
    logging.INFO: "INFO",
    logging.WARNING: "WARNING",
    logging.ERROR: "ERROR",
    logging.CRITICAL: "CRITICAL",
}


class CloudLoggingJsonFormatter(logging.Formatter):
    """Cloud Logging-compatible JSON formatter."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "severity": _SEVERITY_MAP.get(record.levelno, record.levelname),
            "message": record.getMessage(),
            "logger": record.name,
        }
        trace = getattr(record, "trace", None)
        if trace:
            payload["logging.googleapis.com/trace"] = trace
        for key in ("method", "path", "status", "latency_ms", "request_id"):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(logger_name: str = "app") -> logging.Logger:
    logger = logging.getLogger(logger_name)
    if getattr(logger, "_gcp_configured", False):
        return logger

    level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.setLevel(level)
    logger.handlers.clear()

    if os.getenv("GCP_LOGGING_ENABLED") == "1":
        if os.getenv("GCP_LOGGING_USE_CLIENT") == "1":
            try:
                import google.cloud.logging  # type: ignore
                from google.cloud.logging.handlers import CloudLoggingHandler  # type: ignore

                client = google.cloud.logging.Client()
                handler: logging.Handler = CloudLoggingHandler(client, name=logger_name)
            except Exception as exc:  # pragma: no cover - fallback
                sys.stderr.write(f"[gcp] CloudLoggingHandler unavailable: {exc}\n")
                handler = logging.StreamHandler(sys.stdout)
                handler.setFormatter(CloudLoggingJsonFormatter())
        else:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(CloudLoggingJsonFormatter())
    else:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s %(name)s - %(message)s")
        )

    logger.addHandler(handler)
    logger.propagate = False
    logger._gcp_configured = True  # type: ignore[attr-defined]
    return logger


def _extract_trace(request: Request) -> str | None:
    project = os.getenv("GCP_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT")
    header = request.headers.get("x-cloud-trace-context")
    if not project or not header:
        return None
    trace_id = header.split("/", 1)[0]
    if not trace_id:
        return None
    return f"projects/{project}/traces/{trace_id}"


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Emit one structured access log per request."""

    def __init__(self, app, logger: logging.Logger):
        super().__init__(app)
        self._logger = logger

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        trace = _extract_trace(request)
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - start) * 1000
            self._logger.exception(
                "request failed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "latency_ms": round(elapsed_ms, 2),
                    "request_id": request_id,
                    "trace": trace,
                },
            )
            raise
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["x-request-id"] = request_id
        self._logger.info(
            "request completed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "latency_ms": round(elapsed_ms, 2),
                "request_id": request_id,
                "trace": trace,
            },
        )
        return response
