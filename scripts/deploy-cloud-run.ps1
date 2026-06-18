# Deploy CarbonWise to Google Cloud Run
# Prerequisites: billing enabled on the GCP project, gcloud CLI authenticated
#
# Usage (from repo root):
#   .\scripts\deploy-cloud-run.ps1
#
# Or with custom service name / region:
#   .\scripts\deploy-cloud-run.ps1 -ServiceName carbonwise -Region us-central1

param(
    [string]$ProjectId = "gen-lang-client-0027231059",
    [string]$ServiceName = "carbonwise",
    [string]$Region = "us-central1",
    [string]$EnvFile = "backend\.env"
)

$ErrorActionPreference = "Continue"

Write-Host "==> Setting GCP project to $ProjectId"
gcloud config set project $ProjectId

Write-Host "==> Checking billing status..."
$billing = gcloud billing projects describe $ProjectId --format="value(billingEnabled)" 2>$null
if ($billing -ne "True") {
    Write-Host ""
    Write-Host "ERROR: Billing is not enabled on project '$ProjectId'." -ForegroundColor Red
    Write-Host "Enable billing at: https://console.cloud.google.com/billing/linkedaccount?project=$ProjectId"
    Write-Host "Then re-run this script."
    exit 1
}

Write-Host "==> Enabling required APIs..."
gcloud services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    secretmanager.googleapis.com `
    --quiet

if (-not (Test-Path $EnvFile)) {
    Write-Host "ERROR: Missing $EnvFile - create it with GEMINI_API_KEY and USE_GEMINI=true" -ForegroundColor Red
    exit 1
}

$geminiKey = $null
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^GEMINI_API_KEY=(.+)$') { $geminiKey = $Matches[1].Trim() }
}

if (-not $geminiKey) {
    Write-Host "ERROR: GEMINI_API_KEY not found in $EnvFile" -ForegroundColor Red
    exit 1
}

$secretName = "gemini-api-key"
Write-Host "==> Storing Gemini API key in Secret Manager ($secretName)..."
$oldErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$secretExists = gcloud secrets describe $secretName --format="value(name)" 2>$null
$lastExit = $LASTEXITCODE
$ErrorActionPreference = $oldErrorAction

if ($lastExit -ne 0) {
    $geminiKey | gcloud secrets create $secretName --data-file=- --replication-policy=automatic --quiet
} else {
    $geminiKey | gcloud secrets versions add $secretName --data-file=- --quiet
}

$projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$runtimeSa = "${projectNumber}-compute@developer.gserviceaccount.com"

Write-Host "==> Granting Secret Manager access to $runtimeSa"
gcloud secrets add-iam-policy-binding $secretName `
    --member="serviceAccount:$runtimeSa" `
    --role="roles/secretmanager.secretAccessor" `
    --quiet 2>$null

Write-Host "==> Deploying to Cloud Run (this may take several minutes)..."
gcloud run deploy $ServiceName `
    --source . `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --memory 512Mi `
    --cpu 1 `
    --timeout 120 `
    --min-instances 0 `
    --max-instances 3 `
    --set-env-vars "NODE_ENV=production,USE_GEMINI=true,PROJECT_ID=$ProjectId" `
    --set-secrets "GEMINI_API_KEY=${secretName}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploy failed." -ForegroundColor Red
    exit 1
}

$url = gcloud run services describe $ServiceName --region $Region --format="value(status.url)"
Write-Host ""
Write-Host "Deploy complete!" -ForegroundColor Green
Write-Host "URL: $url"
Write-Host ""
Write-Host "Verify Gemini:"
Write-Host ('  curl ' + $url + '/api/health')
Write-Host ""
