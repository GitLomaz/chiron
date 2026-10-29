[CmdletBinding()]
param(
  [string]$ProjectId = 'static-lens-268201',
  [string]$Region = 'us-east1',
  [string]$Repository = 'trivia',
  [string]$DatabaseSecret = 'trivia-database-url'
)

$ErrorActionPreference = 'Stop'

function Invoke-Gcloud {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
  & gcloud @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "gcloud $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
}

function Get-RunUrl {
  param([string]$Service)
  (& gcloud run services describe $Service --project=$ProjectId --region=$Region --format='value(status.url)').Trim()
}

Invoke-Gcloud config set project $ProjectId
Invoke-Gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

& gcloud artifacts repositories describe $Repository --project=$ProjectId --location=$Region *> $null
if ($LASTEXITCODE -ne 0) {
  Invoke-Gcloud artifacts repositories create $Repository --project=$ProjectId --location=$Region --repository-format=docker --description='Trivia application images'
}

& gcloud secrets describe $DatabaseSecret --project=$ProjectId *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Create the Secret Manager secret '$DatabaseSecret' first. It must contain the Supabase DATABASE_URL. See deploy/README.md."
}

$projectNumber = (& gcloud projects describe $ProjectId --format='value(projectNumber)').Trim()
if (-not $projectNumber) { throw 'Could not determine the GCP project number.' }
$runtimeServiceAccount = "trivia-runtime@$ProjectId.iam.gserviceaccount.com"

& gcloud iam service-accounts describe $runtimeServiceAccount --project=$ProjectId *> $null
if ($LASTEXITCODE -ne 0) {
  Invoke-Gcloud iam service-accounts create trivia-runtime --project=$ProjectId --display-name='Trivia Cloud Run runtime'
}
Invoke-Gcloud secrets add-iam-policy-binding $DatabaseSecret --project=$ProjectId --member="serviceAccount:$runtimeServiceAccount" --role='roles/secretmanager.secretAccessor'

$tag = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss')
$registry = "$Region-docker.pkg.dev/$ProjectId/$Repository"
$apiImage = "$registry/trivia-api:$tag"
$studentImage = "$registry/trivia-student:$tag"
$teacherImage = "$registry/trivia-teacher:$tag"

Invoke-Gcloud builds submit --project=$ProjectId --config=deploy/cloudbuild.api.yaml --substitutions="_IMAGE=$apiImage"

& gcloud run jobs describe trivia-migrate --project=$ProjectId --region=$Region *> $null
if ($LASTEXITCODE -eq 0) {
  Invoke-Gcloud run jobs update trivia-migrate --project=$ProjectId --region=$Region --image=$apiImage --service-account=$runtimeServiceAccount --set-secrets="DATABASE_URL=$DatabaseSecret:latest" --command=npx --args=prisma,migrate,deploy,--schema=apps/api/prisma/schema.prisma
} else {
  Invoke-Gcloud run jobs create trivia-migrate --project=$ProjectId --region=$Region --image=$apiImage --service-account=$runtimeServiceAccount --set-secrets="DATABASE_URL=$DatabaseSecret:latest" --command=npx --args=prisma,migrate,deploy,--schema=apps/api/prisma/schema.prisma
}
Invoke-Gcloud run jobs execute trivia-migrate --project=$ProjectId --region=$Region --wait

Invoke-Gcloud run deploy trivia-api --project=$ProjectId --region=$Region --image=$apiImage --service-account=$runtimeServiceAccount --set-secrets="DATABASE_URL=$DatabaseSecret:latest" --set-env-vars='CLIENT_ORIGIN=https://placeholder.invalid' --min-instances=1 --max-instances=1 --allow-unauthenticated
$apiUrl = Get-RunUrl 'trivia-api'

Invoke-Gcloud builds submit --project=$ProjectId --config=deploy/cloudbuild.frontend.yaml --substitutions="_IMAGE=$studentImage,_APP=student,_VITE_API_URL=$apiUrl,_VITE_STUDENT_APP_URL=https://placeholder.invalid"
Invoke-Gcloud run deploy trivia-student --project=$ProjectId --region=$Region --image=$studentImage --allow-unauthenticated
$studentUrl = Get-RunUrl 'trivia-student'

Invoke-Gcloud builds submit --project=$ProjectId --config=deploy/cloudbuild.frontend.yaml --substitutions="_IMAGE=$teacherImage,_APP=web,_VITE_API_URL=$apiUrl,_VITE_STUDENT_APP_URL=$studentUrl"
Invoke-Gcloud run deploy trivia-teacher --project=$ProjectId --region=$Region --image=$teacherImage --allow-unauthenticated
$teacherUrl = Get-RunUrl 'trivia-teacher'

# Use @ as the gcloud list delimiter because the CORS value itself contains a comma.
Invoke-Gcloud run services update trivia-api --project=$ProjectId --region=$Region --update-env-vars="^@^CLIENT_ORIGIN=$teacherUrl,$studentUrl"

Write-Host ''
Write-Host 'Deployment complete:' -ForegroundColor Green
Write-Host "  API:     $apiUrl/health"
Write-Host "  Teacher: $teacherUrl"
Write-Host "  Student: $studentUrl"
