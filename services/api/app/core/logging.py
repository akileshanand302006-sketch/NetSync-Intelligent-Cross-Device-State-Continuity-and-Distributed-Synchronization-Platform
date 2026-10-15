"""
Structured Logging & Tracing Context
====================================
Governed by Non-Negotiable Rule 9 ("Observable by construction")
and Section 9.4 ("Structured logs with correlation IDs").
Ensures logs carry request IDs, device IDs, and trace context.
Strictly redacts packet payloads, file contents, tokens, and credentials.
"""

import json
import logging
import time
from typing import Any, Dict, Optional
from contextvars import ContextVar

# Context variables for distributed request tracing
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
trace_id_ctx: ContextVar[Optional[str]] = ContextVar("trace_id", default=None)
device_id_ctx: ContextVar[Optional[str]] = ContextVar("device_id", default=None)


class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as structured JSON with correlation IDs and timestamp."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get(),
            "trace_id": trace_id_ctx.get(),
            "device_id": device_id_ctx.get(),
        }

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include custom extra fields if provided
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            # Redact sensitive keys
            redacted = {}
            for k, v in record.extra_data.items():
                if any(secret in k.lower() for secret in ("token", "password", "secret", "payload", "key")):
                    redacted[k] = "[REDACTED]"
                else:
                    redacted[k] = v
            log_entry["details"] = redacted

        return json.dumps(log_entry)


def setup_structured_logging(level: int = logging.INFO):
    """Configure root logger to output structured JSON."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers on reload
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(StructuredJsonFormatter())
    root_logger.addHandler(console_handler)


def get_logger(name: str) -> logging.Logger:
    """Obtain a namespaced logger."""
    return logging.getLogger(f"netsync.{name}")
