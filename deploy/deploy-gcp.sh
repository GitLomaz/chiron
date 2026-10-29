#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-static-lens-268201}"
REGION="${REGION:-us-east1}"
REPOSITORY="${REPOSITORY:-trivia}"
DATABASE_SECRET="${DATABASE_SECRET:-trivia-database-url}"

run() {
  gcloud "$@"
}

service_url() {
  gcloud run services describe "$1" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --format='value(status.url)'
}

run config set project "$PROJECT_ID"
run services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

if ! gcloud artifacts repositories describe "$REPOSITORY" --project="$PROJECT_ID" --location="$REGION" >/dev/null 2>&1; then
  run artifacts repositories create "$REPOSITORY" \
    --project="$PROJECT_ID" \
    --location="$REGION" \
    --repository-format=docker \
    --description='Trivia application images'
fi

if ! gcloud secrets describe "$DATABASE_SECRET" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "Create the Secret Manager secret '$DATABASE_SECRET' first; it must contain the Supabase DATABASE_URL." >&2
  exit 1
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SERVICE_ACCOUNT="trivia-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$RUNTIME_SERVICE_ACCOUNT" --project="$PROJECT_ID" >/dev/null 2>&1; then
  run iam service-accounts create trivia-runtime \
    --project="$PROJECT_ID" \
    --display-name='Trivia Cloud Run runtime'
fi
run secrets add-iam-policy-binding "$DATABASE_SECRET" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
  --role='roles/secretmanager.secretAccessor'

TAG="$(date -u +%Y%m%d%H%M%S)"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}"
API_IMAGE="${REGISTRY}/trivia-api:${TAG}"
STUDENT_IMAGE="${REGISTRY}/trivia-student:${TAG}"
TEACHER_IMAGE="${REGISTRY}/trivia-teacher:${TAG}"

run builds submit --project="$PROJECT_ID" --config=deploy/cloudbuild.api.yaml --substitutions="_IMAGE=${API_IMAGE}"

MIGRATION_ARGS=(
  run jobs create trivia-migrate
  --project="$PROJECT_ID"
  --region="$REGION"
)
if gcloud run jobs describe trivia-migrate --project="$PROJECT_ID" --region="$REGION" >/dev/null 2>&1; then
  MIGRATION_ARGS[2]='update'
fi
run "${MIGRATION_ARGS[@]}" \
  --image="$API_IMAGE" \
  --service-account="$RUNTIME_SERVICE_ACCOUNT" \
  --set-secrets="DATABASE_URL=${DATABASE_SECRET}:latest" \
  --command=npx \
  --args=prisma,migrate,deploy,--schema=apps/api/prisma/schema.prisma
run run jobs execute trivia-migrate --project="$PROJECT_ID" --region="$REGION" --wait

run run deploy trivia-api \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$API_IMAGE" \
  --service-account="$RUNTIME_SERVICE_ACCOUNT" \
  --set-secrets="DATABASE_URL=${DATABASE_SECRET}:latest" \
  --set-env-vars='CLIENT_ORIGIN=https://placeholder.invalid' \
  --min-instances=1 \
  --max-instances=1 \
  --allow-unauthenticated
API_URL="$(service_url trivia-api)"

run builds submit \
  --project="$PROJECT_ID" \
  --config=deploy/cloudbuild.frontend.yaml \
  --substitutions="_IMAGE=${STUDENT_IMAGE},_APP=student,_VITE_API_URL=${API_URL},_VITE_STUDENT_APP_URL=https://placeholder.invalid"
run run deploy trivia-student --project="$PROJECT_ID" --region="$REGION" --image="$STUDENT_IMAGE" --allow-unauthenticated
STUDENT_URL="$(service_url trivia-student)"

run builds submit \
  --project="$PROJECT_ID" \
  --config=deploy/cloudbuild.frontend.yaml \
  --substitutions="_IMAGE=${TEACHER_IMAGE},_APP=web,_VITE_API_URL=${API_URL},_VITE_STUDENT_APP_URL=${STUDENT_URL}"
run run deploy trivia-teacher --project="$PROJECT_ID" --region="$REGION" --image="$TEACHER_IMAGE" --allow-unauthenticated
TEACHER_URL="$(service_url trivia-teacher)"

# @ avoids gcloud interpreting the CORS comma as the separator between flags.
run run services update trivia-api \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --update-env-vars="^@^CLIENT_ORIGIN=${TEACHER_URL},${STUDENT_URL}"

printf '\nDeployment complete:\n  API:     %s/health\n  Teacher: %s\n  Student: %s\n' "$API_URL" "$TEACHER_URL" "$STUDENT_URL"
