# EduMatch Frontend

Angular standalone frontend for EduMatch, generated from the backend OpenAPI contract.

## Stack

- Angular CLI 21
- Standalone components + routing
- SCSS
- Generated API client via `@openapitools/openapi-generator-cli`
- Auth token storage + bearer interceptor

## Project Structure

- `src/app/core`: auth session, token storage, guards, interceptors, API error state
- `src/app/shared`: shared view types
- `src/app/features`: page-level standalone components
- `src/app/generated`: OpenAPI-generated Angular client
- `src/app/data-access`: DTO unwrap + frontend view-model mapping

## Run Backend

From `D:\datn\edu-match\backend\EduMatch`:

```powershell
dotnet run --launch-profile https
```

Expected local URLs from launch settings:

- `https://localhost:7001`
- `http://localhost:5001`

Swagger priority URL:

- `https://localhost:7001/swagger/v1/swagger.json`

If local HTTPS cert is not usable in your shell, the frontend download script falls back to `http://localhost:5001/swagger/v1/swagger.json`.

## Run Frontend

From `D:\datn\edu-match\frontend`:

```powershell
npm install
npm run start
```

Open the app at `https://localhost:4200`.

Angular dev server will use a local self-signed certificate for HTTPS in development.

## Regenerate API Client

```powershell
npm run api:download
npm run api:generate
```

Notes:

- `api:download` prefers live Swagger from backend and falls back to local `swagger.json` / `swagger-check.json` if present.
- `api:generate` writes the Angular client into `src/app/generated`.

## Auth / Admin Flow

- Login page: `/auth/login`
- Seed admin credentials expected by this frontend:
  - `admin@gmail.com`
  - `123456`
- Admin payments page: `/admin/payments`

The login flow stores the access token in `localStorage`, and the HTTP interceptor attaches `Authorization: Bearer <token>` automatically.

## Implemented Real API Flows

- Tutors list via generated `TutorsApi.getTutors()`
- Tutor requests list via generated `TutorRequestsApi.getTutorRequests()`
- Admin payments via generated `AdminApi.getAllPayments()`

Each page handles:

- loading state
- empty state
- error state
- frontend-side DTO to view-model mapping
