# GCP Cloud Run deployment

This deployment uses three public Cloud Run services in `us-east1`:

- `trivia-api` (NestJS and Prisma)
- `trivia-teacher` (the teacher Vite app, served by Nginx)
- `trivia-student` (the student Vite app, served by Nginx)

Images are stored in the `trivia` Artifact Registry Docker repository. The PowerShell script creates the repository, runtime service account, Cloud Run migration job, and services when they do not exist.

## 1. Create the Supabase project

Create a Supabase project in a region close to `us-east1` and wait until it is fully provisioned. In Supabase **Connect**, copy the PostgreSQL connection URI intended for a persistent server application. It needs the database password you chose when creating the project.

Use the direct connection URI when available. If your Supabase project only exposes the transaction pooler, use its URI with Prisma's documented PgBouncer configuration. Do not commit the URI or paste it into any `.env` file used by the build.

## 2. Create the database secret

In Google Cloud Console, open **Security > Secret Manager** for `static-lens-268201`.

1. Create a secret named `trivia-database-url`.
2. Paste the complete Supabase PostgreSQL URI as its first secret version.
3. Leave automatic replication selected.

The deployment script grants only the API/migration runtime service account permission to read it.

## 3. Configure Google sign-in

In the Google Cloud project that will own sign-in:

1. Open **Google Auth Platform** and complete **Branding** (app name, support email, and audience). For a private Workspace deployment, choose **Internal**; for external teachers, use **External** and add test users until you publish the app.
2. Open **Clients**, create an OAuth client of type **Web application**, and copy its client ID (the value ending in `.apps.googleusercontent.com`). This app uses the Google Identity Services JavaScript callback, so it does **not** need an authorized redirect URI.
3. Add the teacher app origin to **Authorized JavaScript origins** — for example `https://trivia-teacher-…run.app`. Also add `http://localhost:5173` for local development. Add custom-domain origins too, if used.
4. Keep the client ID handy. It is public configuration, not a client secret. The deploy scripts set it as `GOOGLE_CLIENT_ID` on the API and bake it into the teacher frontend as `VITE_GOOGLE_CLIENT_ID`.

The first successful login creates a row in `User`. To make a user able to view every quiz, set their flag directly in Postgres:

```sql
UPDATE "User" SET "canViewAllQuizzes" = true WHERE email = 'admin@example.com';
```

Existing records intentionally have no owner after this migration, so they are not exposed to ordinary users. Assign an owner explicitly if you need to retain them.

## 4. Deploy

From the repository root, after `gcloud auth login` has selected an account with project-owner or equivalent deployment permissions, run the Bash script:

```bash
GOOGLE_CLIENT_ID='your-client-id.apps.googleusercontent.com' bash deploy/deploy-gcp.sh
```

The scripts automatically read `GOOGLE_CLIENT_ID` from `apps/api/.env` when it is not provided through the shell or `-GoogleClientId`. The equivalent PowerShell command is simply `./deploy/deploy-gcp.ps1`. If `gcloud` reports that Python is missing, repair or reinstall the Google Cloud CLI, then open a new terminal before running the deployment.

The script runs Prisma migrations in a Cloud Run job before deploying the API. It builds the student app after the API URL exists, then builds the teacher app after the student URL exists. It finally sets the API CORS allowlist to the two generated Cloud Run URLs.

## POC constraints

- The API is deliberately restricted to one Cloud Run instance and has no warm-instance minimum, so Cloud Run can scale it to zero after it becomes idle. The first request after that has a cold-start delay. Moderated and homework session state exists only in memory, so it is lost if the API is scaled to zero, revised, restarted, or otherwise replaced. Active browser polling normally keeps a live test active, but Cloud Run cannot distinguish a live test from other traffic; do not leave a live test completely idle.
- Student join/play endpoints remain public. Teacher library, dataset, quiz-creation, and run-list APIs require a Google ID token and are owner-scoped; the Google client ID is also verified server-side.
- For a custom domain later, map the domain to the corresponding Cloud Run service, rebuild both frontend images with the new API/student URLs, and update `CLIENT_ORIGIN` on `trivia-api`.
