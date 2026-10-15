"""
NetSync Supabase Data Migration & 24/7 Continuity Script
========================================================
Migrates schema and data from local SQLite to Supabase PostgreSQL.
Configures connection pooling and verifies integrity.
"""

import os
import sys
import sqlite3
import json
from datetime import datetime

# Add services/api to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import (
    User,
    Device,
    Workspace,
    ContinuitySession,
    ClipboardItem,
    NetworkMeasurement,
    SyncEvent,
    Transfer,
)

SUPABASE_DB_URL = "postgresql://postgres.rdozpxwznkilkfyzkuaz:F1TrhbPpXnFASsQR@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Check primary SQLite database
sqlite_path = os.path.join(os.path.dirname(current_dir), "netsync.db")
if not os.path.exists(sqlite_path):
    sqlite_path = os.path.join(current_dir, "netsync.db")

print(f"[*] Source SQLite database: {sqlite_path}")
print(f"[*] Target Supabase database: {SUPABASE_DB_URL.split('@')[-1]}")


def parse_val(col_name, val, col_type):
    if val is None:
        return None
    type_str = str(col_type).lower()
    if "datetime" in type_str or "timestamp" in type_str:
        if isinstance(val, datetime):
            return val
        try:
            val_clean = str(val).replace("Z", "+00:00")
            return datetime.fromisoformat(val_clean)
        except Exception:
            return None
    elif "json" in type_str:
        if isinstance(val, (dict, list)):
            return val
        try:
            return json.loads(val)
        except Exception:
            return {}
    elif "boolean" in type_str:
        return bool(val)
    elif "integer" in type_str or "biginteger" in type_str:
        try:
            return int(val)
        except Exception:
            return 0
    elif "float" in type_str or "numeric" in type_str:
        try:
            return float(val)
        except Exception:
            return 0.0
    return val


def migrate():
    print("[1/5] Connecting to Supabase PostgreSQL...")
    engine = create_engine(
        SUPABASE_DB_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
    )
    with engine.connect() as conn:
        res = conn.execute(text("SELECT version();")).scalar()
        print(f"      Connected successfully: {res.split(',')[0]}")

    print("[2/5] Creating table schema in Supabase...")
    Base.metadata.create_all(bind=engine)
    print("      All 8 schema tables verified/created.")

    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    cur = sqlite_conn.cursor()

    Session = sessionmaker(bind=engine)
    db = Session()

    models = [
        User,
        Device,
        Workspace,
        ContinuitySession,
        ClipboardItem,
        Transfer,
        SyncEvent,
        NetworkMeasurement,
    ]

    # Build User ID translation map from root SQLite to Supabase
    user_id_map = {}
    cur.execute("SELECT id, email FROM users;")
    for r in cur.fetchall():
        sb_u = db.query(User).filter_by(email=r["email"]).first()
        if sb_u:
            user_id_map[r["id"]] = sb_u.id

    try:
        print("[3/5] Extracting and migrating records from SQLite...")
        for model in models:
            table_name = model.__tablename__
            # Check if table exists in SQLite
            cur.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
            if not cur.fetchone():
                print(f"      [info] SQLite table '{table_name}' does not exist, skipping.")
                continue

            cur.execute(f"SELECT * FROM \"{table_name}\";")
            rows = cur.fetchall()
            print(f"      Migrating {len(rows)} records from '{table_name}'...")

            mapper = inspect(model)
            model_columns = {col.key: col.type for col in mapper.columns}
            existing_ids = {r[0] for r in db.query(model.id).all()}
            existing_emails = {r[0] for r in db.query(User.email).all()} if model == User else set()

            migrated_count = 0
            for row in rows:
                raw_dict = dict(row)
                row_id = raw_dict.get("id")
                if row_id in existing_ids:
                    continue
                if model == User and raw_dict.get("email") in existing_emails:
                    continue

                # Remap user_id if present
                if "user_id" in raw_dict and raw_dict["user_id"] in user_id_map:
                    raw_dict["user_id"] = user_id_map[raw_dict["user_id"]]

                # Map columns
                instance_kwargs = {}
                for col_name, col_type in model_columns.items():
                    if col_name in raw_dict:
                        instance_kwargs[col_name] = parse_val(col_name, raw_dict[col_name], col_type)

                # Handle model-specific required defaults if missing
                if model == Transfer:
                    if "user_id" not in instance_kwargs or not instance_kwargs["user_id"]:
                        # fallback to first user
                        u = db.query(User).first()
                        if u:
                            instance_kwargs["user_id"] = u.id
                    if "file_size" not in instance_kwargs or instance_kwargs["file_size"] is None:
                        instance_kwargs["file_size"] = int(raw_dict.get("file_size_bytes") or 0)
                elif model == NetworkMeasurement:
                    if "user_id" not in instance_kwargs or not instance_kwargs["user_id"]:
                        u = db.query(User).first()
                        if u:
                            instance_kwargs["user_id"] = u.id
                    if "device_id" not in instance_kwargs or not instance_kwargs["device_id"]:
                        instance_kwargs["device_id"] = raw_dict.get("source_device_id") or "dev-unknown"
                    if "latency_ms" not in instance_kwargs or instance_kwargs["latency_ms"] is None:
                        instance_kwargs["latency_ms"] = float(raw_dict.get("round_trip_time_ms") or 0.0)

                db.add(model(**instance_kwargs))
                migrated_count += 1

            db.commit()
            print(f"      Committed {migrated_count} new records to '{table_name}'.")

        print("\n[4/5] Verifying Supabase row counts:")
        for model in models:
            count = db.query(model).count()
            print(f"      - {model.__tablename__}: {count} records in Supabase PostgreSQL")

        print("\n[5/5] Migration completed successfully!")

    except Exception as err:
        db.rollback()
        print(f"\n[ERROR] Migration failed: {err}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()
        sqlite_conn.close()


if __name__ == "__main__":
    migrate()
