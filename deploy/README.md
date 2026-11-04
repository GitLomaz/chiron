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

## 3. Deploy

From the repository root, after `gcloud auth login` has selected an account with project-owner or equivalent deployment permissions, run the Bash script:

```bash
bash deploy/deploy-gcp.sh
```

The equivalent PowerShell script is available at `deploy/deploy-gcp.ps1` if you need it. If `gcloud` reports that Python is missing, repair or reinstall the Google Cloud CLI, then open a new terminal before running the deployment.

The script runs Prisma migrations in a Cloud Run job before deploying the API. It builds the student app after the API URL exists, then builds the teacher app after the student URL exists. It finally sets the API CORS allowlist to the two generated Cloud Run URLs.

## POC constraints

- The API is deliberately restricted to one Cloud Run instance with one warm instance. Moderated and homework session state exists only in memory, so it will still be lost whenever the API is revised, restarted, or otherwise replaced.
- All three services are public and the teacher APIs have no authentication. This is appropriate only for an isolated proof of concept.
- For a custom domain later, map the domain to the corresponding Cloud Run service, rebuild both frontend images with the new API/student URLs, and update `CLIENT_ORIGIN` on `trivia-api`.
