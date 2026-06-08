# Recommendation API

This service is a separate FastAPI app for tutor recommendation.

## Why this lives here

Keep it in a dedicated folder separate from the main .NET API and Angular app:

- `backend/` stays focused on the .NET API.
- `frontend/` stays focused on Angular.
- GitHub Actions can deploy this service independently on every commit under `backend/recommendation_service/**`.

Repo path:

```text
backend/recommendation_service
```

## Local run

```powershell
cd backend/recommendation_service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

## Azure App Service setup

Create a new Azure App Service for Linux:

- Name: `edumatch-recommendation`
- Runtime stack: `Python 3.11` or `Python 3.12`
- OS: `Linux`
- Region: same region as your other services

Set these App Settings in Azure:

```text
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

Set this startup command in:

```text
App Service -> Configuration -> General settings -> Startup Command
```

Startup command:

```text
gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 app.main:app
```

## GitHub Actions deployment

This repo includes a dedicated workflow:

```text
.github/workflows/main_edumatch-recommendation.yml
```

Create this GitHub Actions secret in the repo:

```text
AZURE_RECOMMENDATION_WEBAPP_PUBLISH_PROFILE
```

Put the Azure publish profile XML for `edumatch-recommendation` in that secret.

After that, every push to `main` that changes `backend/recommendation_service/**` will trigger deployment.
