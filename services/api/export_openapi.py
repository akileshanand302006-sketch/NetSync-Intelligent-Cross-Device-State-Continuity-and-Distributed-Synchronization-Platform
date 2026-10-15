"""
Export FastAPI OpenAPI Specification
====================================
Generates `docs/openapi.json` from the live FastAPI application router.
Used for client contract synchronization, type generation, and drift detection.
"""

import json
from pathlib import Path
from app.main import app

docs_dir = Path(__file__).resolve().parent.parent.parent / "docs"
output_file = docs_dir / "openapi.json"

openapi_schema = app.openapi()
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(openapi_schema, f, indent=2)

print(f"Exported OpenAPI specification ({len(openapi_schema['paths'])} paths) to {output_file}")
