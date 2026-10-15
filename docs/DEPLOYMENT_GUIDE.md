# NetSync Ultra — Deployment & Operations Guide

**System:** NetSync Ultra — Cross-Device State Continuity & Network Intelligence Platform  
**Architecture:** Microservice / Monorepo (FastAPI Python Back End + Vite/React Front End + Networking Socket Engine)  
**Version:** 1.0.0

---

## 1. Quick Start (Development & Local Evaluation)

### 1.1 Prerequisites
- **Python:** 3.10+ (tested on Python 3.14.6)
- **Node.js:** 20+ (tested on Node v20.18.0)
- **Git**

### 1.2 Starting the FastAPI Backend
```bash
# From workspace root
cd services/api

# Install dependencies
pip install -r requirements.txt

# Run database migrations / initialization
# Tables are automatically created if absent
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Runtime Capability Matrix: `http://localhost:8000/api/v1/system/capabilities`
- Prometheus Metrics: `http://localhost:8000/api/v1/metrics`

### 1.3 Starting the Vite React Frontend
```bash
# From workspace root
cd apps/web

# Install dependencies
npm install

# Start development dev-server
npm run dev
```
- Front End URL: `http://localhost:5173`
- Vite proxy routes `/api` directly to `http://localhost:8000`

---

## 2. Production Deployment Architecture

```
                  Internet / LAN Clients
                           │
                           ▼
                 ┌───────────────────┐
                 │ Nginx / Cloudflare│ (TLS Termination, Reverse Proxy)
                 └─────────┬─────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌───────────────────┐     ┌───────────────────┐
    │  Static SPA Web   │     │  FastAPI Backend  │
    │ (Vite /dist Nginx)│     │  (Gunicorn/Uvicorn│
    └───────────────────┘     └─────────┬─────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                ┌──────────────────┐          ┌──────────────────┐
                │ SQLite / Postgres│          │ Networking Engine│
                │     Database     │          │  LAN Peer Sockets│
                └──────────────────┘          └──────────────────┘
```

### 2.1 Production Containerization (Docker)

#### Backend Dockerfile (`services/api/Dockerfile`)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### Frontend Dockerfile (`apps/web/Dockerfile`)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Database Maintenance & Backup

### 3.1 SQLite Backup
```bash
# Safe live backup using SQLite online backup API
sqlite3 services/api/netsync.db ".backup 'services/api/netsync_backup_$(date +%Y%m%d).db'"
```

### 3.2 Automated TTL Purge Routine
The backend automatically executes TTL expiration on sensitive encrypted clipboard records:
- Endpoint: `POST /api/v1/clipboard/purge`
- Can be scheduled as a systemd timer or cron job every 5 minutes:
```bash
*/5 * * * * curl -X POST http://localhost:8000/api/v1/clipboard/purge >/dev/null 2>&1
```

---

## 4. Monitoring & Observability

- **Prometheus Metrics:** `GET /api/v1/metrics`
  - `netsync_http_requests_total{method, endpoint, status_code}`
  - `netsync_http_request_duration_seconds{endpoint}`
  - `netsync_p2p_transfer_bytes_total{protocol}`
  - `netsync_active_connections{type}`
- **Structured JSON Logs:** All backend events are emitted in JSON format containing timestamp, log level, event name, client IP, and correlation ID for seamless ingestion into Grafana Loki, Datadog, or Elasticsearch.
