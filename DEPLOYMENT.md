# NetSync Ultra — Deployment Guide
## Frontend on Vercel & Backend on Railway (with 24/7 Supabase PostgreSQL)

---

### Part 1: Deploy Backend on Render (Recommended)

#### Option A: Using Render Blueprint (Automatic 1-Click)
1. Go to [dashboard.render.com](https://dashboard.render.com) and log in.
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `NetSync-Intelligent Cross-Device State Continuity and Distributed Synchronization Platform`.
4. Render will detect [`render.yaml`](file:///c:/My%20Projects/NetSync-Intelligent%20Cross-Device%20State%20Continuity%20and%20Distributed%20Synchronization%20Platform/render.yaml) automatically with all environment variables pre-configured!
5. Click **Apply**. Render will build and deploy the service.

#### Option B: Manual Web Service Setup on Render
1. Click **New +** -> **Web Service**.
2. Select your repository.
3. Configure the following fields:
   - **Name**: `netsync-backend`
   - **Root Directory**: `services/api`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://postgres.rdozpxwznkilkfyzkuaz:F1TrhbPpXnFASsQR@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` |
   | `SUPABASE_PROJECT_REF` | `rdozpxwznkilkfyzkuaz` |
   | `SUPABASE_URL` | `https://rdozpxwznkilkfyzkuaz.supabase.co` |
   | `SUPABASE_KEY` | `sb_publishable_f7fJxZerBEsVFZ16LbxjGQ_Wsl-WBye` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your_supabase_secret_key_here` (from Supabase Project Settings -> API) |

   | `SECRET_KEY` | `netsync-production-secret-key-2026-distributed` |
   | `PYTHON_VERSION` | `3.11.9` |
5. Click **Deploy Web Service**.
6. When deployment finishes, copy your Render service URL (e.g. `https://netsync-backend.onrender.com`).
7. Test the healthcheck: `https://netsync-backend.onrender.com/health` -> returns `{"status":"healthy","service":"NetSync API","version":"1.0.0"}`.

---

### Part 2: Deploy Backend on Railway (Alternative)

1. **Create Project on Railway**:
   - Go to [railway.app](https://railway.app) and sign in with GitHub.
   - Click **New Project** -> **Deploy from GitHub repo**.
   - Select the `NetSync` repository.

2. **Configure Service Settings**:
   - Set **Root Directory** to `services/api`.
   - Go to the service **Variables** tab and add the same environment variables as above.
3. **Generate Public Domain**:
   - Go to **Settings** -> **Networking** -> click **Generate Domain** (e.g. `https://netsync-api.up.railway.app`).

---

### Part 3: Deploy Frontend on Vercel

1. **Import Project on Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub.
   - Click **Add New...** -> **Project**.
   - Import your GitHub repository.

2. **Configure Build Settings**:
   - **Root Directory**: Click **Edit** and choose `apps/web`.
   - **Framework Preset**: Vite (automatically detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Set Environment Variables**:
   - Under **Environment Variables**, add:
     - **Name**: `VITE_API_URL`
     - **Value**: Your Render URL (e.g. `https://netsync-backend.onrender.com`) or Railway URL (without trailing slash).

4. **Deploy**:
   - Click **Deploy**.
   - Vercel will build and launch your frontend with live edge CDN routing.
   - All SPA routes (`/workspaces`, `/telemetry`, `/devices`, `/clipboard`, `/transfer`) work out-of-the-box via the included [`vercel.json`](file:///c:/My%20Projects/NetSync-Intelligent%20Cross-Device%20State%20Continuity%20and%20Distributed%20Synchronization%20Platform/apps/web/vercel.json) rewrites!


---

### Part 3: Architecture Overview

```
                      [ User Browser ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Vercel CDN / Edge ]            [ Railway Cloud Backend ]
      apps/web (Vite/React)             services/api (FastAPI)
            │                                 │
            │ HTTPS API & WebSockets          │ Connection Pooler (Port 5432)
            └────────────────────────────────►│
                                              ▼
                                 [ Supabase Cloud 24/7 ]
                                    PostgreSQL Database
                                 (rdozpxwznkilkfyzkuaz)
```
