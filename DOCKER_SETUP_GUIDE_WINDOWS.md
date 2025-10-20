# Docker Setup Guide for Windows
**Your Complete Guide to Running nexus-analyzer-new with Docker**

---

## What is Docker? (5-Minute Intro)

Think of Docker as **virtual computers in boxes**. Instead of installing PostgreSQL, Redis, and Python directly on your Windows machine (which can be messy), Docker runs each service in its own isolated "container."

**Benefits:**
- ✅ No conflicts with other software
- ✅ Easy to start/stop all services at once
- ✅ Same environment on every computer (no "works on my machine" problems)
- ✅ Easy to reset if something breaks

**The Stack:**
```
┌─────────────────────────────────────────┐
│  Your Windows Machine                   │
│  ┌───────────────────────────────────┐  │
│  │ Docker Desktop                    │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ Container 1: PostgreSQL     │  │  │ ← Database
│  │  ├─────────────────────────────┤  │  │
│  │  │ Container 2: Redis          │  │  │ ← Cache
│  │  ├─────────────────────────────┤  │  │
│  │  │ Container 3: MinIO          │  │  │ ← File Storage
│  │  ├─────────────────────────────┤  │  │
│  │  │ Container 4: Backend API    │  │  │ ← FastAPI (Python)
│  │  ├─────────────────────────────┤  │  │
│  │  │ Container 5: Celery Worker  │  │  │ ← Background Jobs
│  │  ├─────────────────────────────┤  │  │
│  │  │ Container 6: Frontend       │  │  │ ← Next.js (React)
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Prerequisites

**You already have:**
- ✅ Docker Desktop installed at `C:\ProgramData\Microsoft\Windows\Start Menu\Docker Desktop.lnk`

**You need:**
- [ ] Git Bash or PowerShell (already on Windows)
- [ ] nexus-analyzer-new repository cloned to your machine
- [ ] Your proprietary state data in `D:\SALT\State Information_October\`
- [ ] Your historical tax data in `D:\Nexus Threshold Research\...\split_20250723_212859\`

---

## Step 1: Launch Docker Desktop (2 minutes)

1. **Find Docker Desktop:**
   - Press `Windows Key` and type "Docker Desktop"
   - Or navigate to: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Docker\Docker Desktop`

2. **Start Docker Desktop:**
   - Click the Docker Desktop icon
   - Wait for it to start (30-60 seconds)
   - **Green whale icon** in system tray = Docker is running ✅
   - **Gray/white whale** = Docker is still starting ⏳

3. **Verify Docker is running:**
   - Open PowerShell or Git Bash
   - Run:
     ```powershell
     docker --version
     docker compose version
     ```
   - Expected output:
     ```
     Docker version 24.0.x
     Docker Compose version v2.23.x
     ```

**Troubleshooting:**
- If Docker won't start: Enable WSL 2 (Windows Subsystem for Linux)
  - Run in PowerShell as Administrator: `wsl --install`
  - Restart your computer
  - Try launching Docker Desktop again

---

## Step 2: Prepare the Project (5 minutes)

### 2.1 Clone or Update Repository

**If you don't have it locally yet:**
```powershell
cd D:\
git clone https://github.com/markmiedema/nexus-analyzer-new.git
cd nexus-analyzer-new
```

**If you already have it:**
```powershell
cd D:\nexus-analyzer-new
git pull origin main
```

### 2.2 Create Environment File

Docker containers need configuration. Create a `.env` file in the root directory:

```powershell
cd D:\nexus-analyzer-new
cp .env.example .env
```

**Edit the `.env` file** (use Notepad++ or VS Code):

```env
# Database
POSTGRES_USER=nexus_user
POSTGRES_PASSWORD=your_secure_password_here  # ← Change this!
POSTGRES_DB=nexus_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO (S3-compatible storage)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123  # ← Change this!
MINIO_ENDPOINT=minio:9000
MINIO_BUCKET=nexus-uploads

# Backend API
API_SECRET_KEY=your_super_secret_key_change_this_in_production  # ← Change this!
API_DEBUG=True
API_HOST=0.0.0.0
API_PORT=8000

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** Change the passwords! Use strong, unique passwords.

---

## Step 3: Start the Services (10 minutes)

### 3.1 Start Core Services First

Start the database and supporting services:

```powershell
cd D:\nexus-analyzer-new
docker compose up -d postgres redis minio
```

**What this does:**
- `docker compose` = Docker tool for multi-container apps
- `up` = Start containers
- `-d` = Detached mode (runs in background)
- `postgres redis minio` = Which services to start

**Wait 30 seconds** for services to initialize.

**Verify they're running:**
```powershell
docker compose ps
```

Expected output:
```
NAME                          STATUS
nexus-analyzer-new-postgres-1  running
nexus-analyzer-new-redis-1     running
nexus-analyzer-new-minio-1     running
```

### 3.2 Create Database Schema

Now that PostgreSQL is running, create the database tables:

```powershell
# Run database migrations
docker compose run --rm backend alembic upgrade head
```

**What this does:**
- `docker compose run` = Run a one-time command in a container
- `--rm` = Remove container after command finishes
- `backend` = Run command in the backend service
- `alembic upgrade head` = Apply database migrations (create tables)

**Expected output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade -> 001_initial, Initial schema
INFO  [alembic.runtime.migration] Running upgrade 001_initial -> head
```

---

## Step 4: Load Your Proprietary Data (15 minutes)

This is where your competitive advantage comes in! Load your lawyer-grade state research.

### 4.1 Mount Your Data Directories

First, we need to make your Windows directories accessible to Docker containers.

**Edit `docker-compose.yml`** and add volume mounts to the `backend` service:

```yaml
backend:
  build: ./backend
  # ... existing config ...
  volumes:
    - ./backend:/app
    - D:\SALT\State Information_October:/mnt/state_data  # ← Add this
    - D:\Nexus Threshold Research\historical_data\split_20250723_212859:/mnt/tax_data  # ← Add this (adjust path)
```

**Important:** Adjust the paths to match your actual directory structure!

**Restart backend container** to apply volume mounts:
```powershell
docker compose down backend
docker compose up -d backend
```

### 4.2 Load State Nexus Rules

Load your 8 state JSON files (Texas, Alabama, New York, etc.):

```powershell
docker compose exec backend python seeds/load_proprietary_state_rules.py --data-dir /mnt/state_data --replace
```

**What this does:**
- `exec backend` = Execute command in running backend container
- `python seeds/load_proprietary_state_rules.py` = Run our custom seed script
- `--data-dir /mnt/state_data` = Where to find your JSON files
- `--replace` = Replace any existing rules (optional)

**Expected output:**
```
INFO: Loading state data from: /mnt/state_data/Alabama.txt
INFO:   Added AL rule: $250000.0 sales, N/A txns, effective 2018-10-01
INFO:   Added AL rule: $250000.0 sales, N/A txns, effective 2024-01-01
INFO: Successfully committed 2 rules for AL

INFO: Loading state data from: /mnt/state_data/Texas.txt
INFO:   Added TX rule: $500000.0 sales, N/A txns, effective 2019-10-01
INFO:   Added TX rule: $500000.0 sales, N/A txns, effective 2020-01-01
INFO: Successfully committed 2 rules for TX

... (continues for all 8 states)

============================================================
SUMMARY
============================================================
  Alabama              :   2 rules
  New York             :   3 rules
  Texas                :   2 rules
  ... (etc.)
============================================================
  TOTAL:                  18 rules
============================================================
```

### 4.3 Load Historical Tax Rates

Load your 78 CSV files with ZIP-level tax rate data:

```powershell
docker compose exec backend python seeds/load_historical_tax_rates.py --csv-dir /mnt/tax_data --replace
```

**Expected output:**
```
INFO: Found 78 CSV files to process
INFO:   Loaded chunk_1.csv: 125,432 rows
INFO:   Loaded chunk_2.csv: 118,903 rows
... (continues for all chunks)

INFO: Combined dataset: 9,235,421 rows
INFO: Using most recent data: 2025-07

INFO: Aggregating data by state...
INFO: Aggregated data for 51 states

INFO: Inserting into database...
INFO:   Added AL: 4.00% state, 3.25% avg local (12,543 ZIP codes)
INFO:   Added AZ: 5.60% state, 2.45% avg local (8,932 ZIP codes)
... (continues for all states)

INFO: Successfully committed 51 state tax configs

============================================================
SUMMARY
============================================================
  States loaded:   51
  States skipped:   0
  Total states:    51
============================================================
```

### 4.4 Verify Data Loaded

Check that data is in the database:

```powershell
# Connect to PostgreSQL
docker compose exec postgres psql -U nexus_user -d nexus_db

# Run SQL queries
\dt  -- List tables

SELECT COUNT(*) FROM nexus_rules;  -- Should show 18+ rules

SELECT state_code, state_name, state_tax_rate, avg_local_tax_rate
FROM state_tax_config
ORDER BY state_code
LIMIT 10;

\q  -- Quit psql
```

---

## Step 5: Start All Services (5 minutes)

Now that the database is populated, start the full application:

```powershell
docker compose up -d
```

This starts **all 6 containers:**
1. `postgres` - Database (already running)
2. `redis` - Cache (already running)
3. `minio` - File storage (already running)
4. `backend` - FastAPI application
5. `celery-worker` - Background job processor
6. `frontend` - Next.js application

**Verify all services are healthy:**
```powershell
docker compose ps
```

Expected output (all should show "running"):
```
NAME                               STATUS
nexus-analyzer-new-postgres-1       running
nexus-analyzer-new-redis-1          running
nexus-analyzer-new-minio-1          running
nexus-analyzer-new-backend-1        running
nexus-analyzer-new-celery-worker-1  running
nexus-analyzer-new-frontend-1       running
```

---

## Step 6: Access the Application (2 minutes)

Open your browser and navigate to:

### Backend API (FastAPI)
**URL:** http://localhost:8000/docs

This is the **interactive API documentation** (Swagger UI). You can:
- Browse all API endpoints
- Test endpoints directly in the browser
- See request/response schemas

**Try it:**
1. Expand `GET /api/v1/nexus/rules`
2. Click "Try it out"
3. Click "Execute"
4. See your loaded nexus rules in the response

### Frontend (Next.js)
**URL:** http://localhost:3000

This is the web application. Currently minimal, but this is where you'll build the user interface.

### MinIO Console (File Storage)
**URL:** http://localhost:9001

Login:
- **Username:** `minioadmin`
- **Password:** `minioadmin123` (or whatever you set in `.env`)

This is where uploaded CSV files are stored.

---

## Step 7: Create a Demo User (Optional)

Create a test user account:

```powershell
docker compose exec backend python seeds/create_demo_user.py
```

This creates:
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** Admin

You can use this to test authentication endpoints.

---

## Common Docker Commands

### View Logs
```powershell
# All services
docker compose logs

# Specific service (e.g., backend)
docker compose logs backend

# Follow logs in real-time
docker compose logs -f backend

# Last 50 lines
docker compose logs --tail=50 backend
```

### Restart Services
```powershell
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
```

### Stop Services
```powershell
# Stop all services (keeps data)
docker compose down

# Stop and remove all data (CAUTION!)
docker compose down -v
```

### View Running Containers
```powershell
docker compose ps
```

### Execute Commands in Containers
```powershell
# Python shell in backend
docker compose exec backend python

# Bash shell in backend
docker compose exec backend bash

# PostgreSQL shell
docker compose exec postgres psql -U nexus_user -d nexus_db
```

### Rebuild Containers (after code changes)
```powershell
# Rebuild and restart
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build backend
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Bind for 0.0.0.0:8000 failed: port is already allocated`

**Fix:** Another application is using that port.

```powershell
# Find what's using the port
netstat -ano | findstr :8000

# Kill the process (replace <PID> with the process ID)
taskkill /PID <PID> /F

# Or change the port in docker-compose.yml
ports:
  - "8001:8000"  # Change left side (host port)
```

### Container Won't Start

**Check logs:**
```powershell
docker compose logs backend
```

Common issues:
- **Missing environment variables:** Check `.env` file
- **Database connection failed:** Postgres not running? Check `docker compose ps`
- **Port conflicts:** See "Port Already in Use" above

### Database Connection Refused

**Symptoms:** Backend can't connect to PostgreSQL

**Fix:**
```powershell
# Ensure postgres is running
docker compose up -d postgres

# Wait 10 seconds, then restart backend
docker compose restart backend
```

### Reset Everything (Nuclear Option)

**CAUTION:** This deletes all data!

```powershell
# Stop and remove all containers and volumes
docker compose down -v

# Remove all images
docker compose down --rmi all

# Start fresh
docker compose up -d
```

Then re-run Step 3 (migrations) and Step 4 (load data).

### Out of Disk Space

Docker images can consume significant disk space.

**Check disk usage:**
```powershell
docker system df
```

**Clean up unused containers/images:**
```powershell
docker system prune -a
```

---

## Understanding the Architecture

### Data Flow: CSV Upload → Results

```
1. User uploads CSV (Frontend)
   ↓
2. File sent to Backend API
   ↓
3. File stored in MinIO (S3)
   ↓
4. Celery background job created
   ↓
5. Celery worker processes CSV
   ↓
6. CSV parsed, transactions inserted into PostgreSQL
   ↓
7. Nexus engine calculates thresholds
   ↓
8. Results stored in database
   ↓
9. Frontend polls for results
   ↓
10. User sees nexus determination
```

### Database Tables (12 total)

Created by Alembic migrations:

- `tenants` - Multi-tenant organizations
- `users` - User accounts with RBAC
- `business_profiles` - Client companies being analyzed
- `nexus_rules` - **Your proprietary state threshold data**
- `state_tax_config` - **Your historical tax rate data**
- `physical_locations` - Physical presence tracking
- `analyses` - Analysis workflow state
- `transactions` - Sales data from uploaded CSVs
- `nexus_results` - Determination results
- `liability_estimates` - Tax liability calculations
- `reports` - Generated PDF reports
- `audit_logs` - Complete audit trail

---

## Next Steps: Enhance the Application

Now that the infrastructure is running with your proprietary data, you can:

### Week 1: Basic Frontend ✅ (You are here!)
- [x] Docker running
- [x] Database populated with your state rules
- [x] Tax rate data loaded
- [ ] Test file upload via API
- [ ] Create basic Next.js dashboard

### Week 2: Shadcn/ui Components
- [ ] Copy 28 UI components from `nexus-check` repository
- [ ] Build professional results table
- [ ] Add multi-company selector
- [ ] Implement dashboard layout

### Week 3: Rolling 12-Month Algorithm
- [ ] Extract calculation logic from `nexus-calculator-app`
- [ ] Port TypeScript → Python
- [ ] Enhance `backend/services/nexus_engine.py`
- [ ] Add comprehensive tests

### Week 4: PDF Export
- [ ] Review PDF generator from `nexus-calculator-app`
- [ ] Enhance `backend/services/report_generator.py`
- [ ] Add charts and visualizations
- [ ] Professional branding

### Week 5: Authentication
- [ ] Configure JWT authentication (already scaffolded)
- [ ] Implement user registration flow
- [ ] Test multi-tenant isolation
- [ ] Add Admin/Analyst/Viewer role permissions

### Week 6: Testing & Deployment
- [ ] Write tests (pytest for backend, Jest for frontend)
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Performance test with 100K row CSV
- [ ] Deploy to production (Render.com or Railway.app)

---

## Docker Cheat Sheet

```powershell
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f backend

# Restart a service
docker compose restart backend

# Rebuild after code changes
docker compose up -d --build

# Run database migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Access PostgreSQL shell
docker compose exec postgres psql -U nexus_user -d nexus_db

# Access Python shell
docker compose exec backend python

# Access bash shell in container
docker compose exec backend bash

# View running containers
docker compose ps

# View container resource usage
docker stats

# Clean up unused Docker resources
docker system prune -a
```

---

## Deployment to Production

When ready to deploy, consider:

### Render.com (Recommended)
- Free tier available
- Built-in PostgreSQL and Redis
- Easy Docker deployment
- Auto-deploys from Git

**Steps:**
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Render auto-detects `docker-compose.yml`
5. Add PostgreSQL and Redis services
6. Set environment variables
7. Deploy!

### Railway.app (Alternative)
- Similar to Render
- Generous free tier
- One-click PostgreSQL/Redis
- Great DX (developer experience)

### Self-Hosted (Advanced)
- AWS EC2 + RDS
- DigitalOcean Droplet + Managed Database
- Google Cloud Run
- Azure Container Instances

---

## Security Checklist (Before Production)

- [ ] Change all default passwords in `.env`
- [ ] Use strong `API_SECRET_KEY` (generate with `openssl rand -hex 32`)
- [ ] Set `API_DEBUG=False` in production
- [ ] Use HTTPS (not HTTP)
- [ ] Configure CORS properly in `backend/main.py`
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Use managed Redis/PostgreSQL (not Docker) in production
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Implement IP whitelisting for admin endpoints
- [ ] Regular security updates for dependencies

---

## Getting Help

**Docker Issues:**
- Docker Desktop documentation: https://docs.docker.com/desktop/
- Docker Compose reference: https://docs.docker.com/compose/

**Application Issues:**
- Check logs: `docker compose logs backend`
- FastAPI docs: http://localhost:8000/docs
- Database: `docker compose exec postgres psql -U nexus_user -d nexus_db`

**Your Repositories:**
- nexus-analyzer-new: https://github.com/markmiedema/nexus-analyzer-new
- nexus-calculator-app: https://github.com/markmiedema/nexus-calculator-app
- nexus-check: https://github.com/markmiedema/nexus-check

---

## Summary

**What You've Accomplished:**
1. ✅ Launched Docker Desktop
2. ✅ Started 6 containerized services
3. ✅ Created database schema (12 tables)
4. ✅ Loaded your proprietary state nexus rules (8 states)
5. ✅ Loaded historical tax rate data (78 CSV files, 51 states)
6. ✅ Verified API is accessible at http://localhost:8000/docs
7. ✅ Ready to build frontend and integrate other repositories

**Your Competitive Advantage:**
Your database now contains lawyer-grade state research with legal citations, historical periods, marketplace rules, and QA test vectors. This is **significantly superior** to competitors' hardcoded thresholds. This is your moat.

**Next Immediate Step:**
Test the API by uploading a CSV file and running a nexus analysis. Then begin integrating the Shadcn/ui components from nexus-check to build a professional frontend.

---

*Docker is now your development environment. All changes to backend code are automatically reflected (hot reload). Frontend changes also hot reload. Enjoy the power of containerization!*
