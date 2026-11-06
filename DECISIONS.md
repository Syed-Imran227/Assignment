# Architecture and Design Decisions (DECISIONS.md)

### 1. Database: SQLite + PostgreSQL Flexibility (No Docker Requirement)
- **Decision**: Use SQLAlchemy 2.0 with asynchronous driver support (`sqlite+aiosqlite:///./rootline.db` by default; automatically switches to `postgresql+asyncpg://...` or standard PostgreSQL when `DATABASE_URL` is set).
- **Rationale**: The user specifically requested not to use Docker. SQLite requires zero container overhead, zero external dependencies, stores all state cleanly in the project directory, and supports full JSON fields and asynchronous execution via SQLAlchemy 2.0. If a PostgreSQL instance is provided in production, changing `DATABASE_URL` in `.env` is all that is needed.

### 2. Groq LLM Models Selection
- **Reasoning Model**: `llama-3.3-70b-versatile`
  - Selected for deep pharmaceutical causal reasoning, 5 Whys deduction, 6M Fishbone categorization, and CAPA formulation.
- **Fast Model**: `llama-3.1-8b-instant`
  - Selected for low-latency document classification, fast field extraction, quote verification, and gap checking.
- **Fallback**: Automatic fallback and retry with exponential backoff on 429 rate limit or 5xx server errors.

### 3. Guidelines & Skills Integration
- **Andrej Karpathy Guidelines (`CLAUDE.md`)**:
  - Think Before Coding: State assumptions, surface tradeoffs, never invent unverified data.
  - Simplicity First: Clean, targeted implementations without bloat or speculative abstractions.
  - Surgical Changes: Touch only necessary files; maintain strict type safety and modularity.
  - Goal-Driven Execution: Verifiable steps with concrete acceptance checks for each phase.

### 4. PowerShell Environment & Virtual Environment
- **Command Syntax**: Use `;` for command chaining in PowerShell. Never use `&&`.
- **Backend Environment**: Always activate `.venv\Scripts\activate` before running python/uvicorn/pip commands.
- **Project Boundary**: All dependencies, source code, data, and uploads remain strictly inside `c:\Users\syedi\OneDrive\Desktop\Projects\Assignment`.

