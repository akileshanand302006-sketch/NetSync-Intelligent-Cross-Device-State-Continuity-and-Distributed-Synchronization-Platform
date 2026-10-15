# ADR 0003: Database Schema Ownership and Migration Governance

**Status:** Accepted  
**Date:** October 2026  
**Deciders:** NetSync Core Team  
**Consulted:** Section 3, Section 9.1

---

## Context and Problem Statement

NetSync uses PostgreSQL 16 (in container / managed Neon/Supabase) for durable storage of user identities, paired hardware devices, persistent workspace buffers, transfer session history, and rolling network telemetry.

A frequent source of critical bugs in hybrid Python/TypeScript architectures is **split schema ownership**, where the backend uses an ORM (like SQLAlchemy or Alembic) to create tables, while the frontend or another team uses a separate migration tool (like Prisma or Drizzle), causing schema drift, missing indexes, foreign key violations, and failed production deployments.

---

## Decision Drivers

1. **Non-Negotiable Rule 8:** One source of truth for types; CI fails on drift.
2. **Section 3 & 9.1 Requirement:** *"Drizzle migrations are the single source of truth. Core uses asyncpg or SQLAlchemy Core against that schema, and CI fails on drift."*
3. **Database Performance:** Time-series telemetry tables require explicit indexing and partitioning (raw 24h → 1-min rollups for 30 days → 1-hour for 1 year).

---

## Decision Outcome

Chosen Option: **Unified PostgreSQL Schema Governance with Authoritative Migration Scripts**.

### Architecture:
1. **Single Source of Truth:** Database schemas and migrations are defined centrally in SQL DDL migration files (matching Drizzle migration output).
2. **Backend ORM Alignment:**
   - The Python FastAPI backend uses SQLAlchemy 2.0 ORM models for type safety, query building, and validation.
   - The backend `Base.metadata` mirrors the authoritative SQL schema exactly.
   - Automated startup code does NOT execute unconstrained schema mutations in production; `Base.metadata.create_all()` is reserved strictly for local ephemeral SQLite testing.
3. **Automated Schema Drift Gate:**
   - A CI verification step tests the backend SQLAlchemy metadata against the authoritative migration DDL.
   - If a model field, type, or constraint differs from the SQL migration, CI fails the build before merge.
4. **Partitioned Telemetry Policy:**
   - The `network_metrics` table is partitioned by timestamp.
   - A retention cleanup worker automatically rolls up sub-second ping samples into 1-minute aggregates after 24 hours, keeping database size bounded.

---

## Consequences

### Positive
- Zero risk of schema collision or out-of-sync migrations between services.
- Explicit constraints, foreign keys, and indexes are guaranteed in both testing and production.
- Production deployments run a single deterministic migration runner.

### Negative / Trade-offs
- Modifying a model requires updating both the authoritative migration DDL and the SQLAlchemy model, with CI verification.
