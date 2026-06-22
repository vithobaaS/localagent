# AutoPilot CI/CD Gating Script for Windows PowerShell
# Triggers a test suite and blocks until execution is complete.

param (
    [Parameter(Mandatory=$true)]
    [string]$SuiteId,

    [Parameter(Mandatory=$true)]
    [string]$Token,

    [string]$ServerUrl = "http://localhost:9090",
    [int]$TimeoutSec = 600
)

$ServerUrl = $ServerUrl.TrimEnd('/')

Write-Host "=================================================="
Write-Host "🚀 AutoPilot CI/CD Pipeline Gating"
Write-Host "=================================================="
Write-Host "Server:    $ServerUrl"
Write-Host "Suite ID:  $SuiteId"
Write-Host "Timeout:   $($TimeoutSec)s"
Write-Host "=================================================="

Write-Host "Triggering suite execution..."

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$ServerUrl/api/v1/suites/$SuiteId/trigger" -Method Post -Headers $headers
} catch {
    Write-Error "❌ Error: Failed to trigger execution or connect to AutoPilot server at $ServerUrl"
    Write-Error $_.Exception.Message
    exit 1
}

$executionId = $response.executionId
if (-not $executionId) {
    Write-Error "❌ Error: Failed to parse executionId from server response."
    Write-Host ($response | ConvertTo-Json)
    exit 1
}

Write-Host "✅ Triggered successfully! Execution ID: $executionId"
Write-Host "Polling execution status..."

$startTime = [DateTime]::UtcNow
$prevStatus = ""

while ($true) {
    # Check timeout
    $elapsed = ([DateTime]::UtcNow - $startTime).TotalSeconds
    if ($elapsed -ge $TimeoutSec) {
        Write-Error "❌ Error: Timeout reached ($($TimeoutSec)s). Gating failed."
        exit 1
    }

    try {
        $statusResp = Invoke-RestMethod -Uri "$ServerUrl/api/v1/executions/$executionId/status" -Method Get -Headers $headers
    } catch {
        Write-Warning "⚠️ Warning: Failed to query status. Retrying in 5 seconds..."
        Start-Sleep -Seconds 5
        continue
    }

    $status = $statusResp.status
    $passed = $statusResp.passedCount
    $failed = $statusResp.failedCount
    $total  = $statusResp.totalCount

    $statusLine = "Status: $status (Passed: $passed | Failed: $failed | Total: $total)"
    if ($status -ne $prevStatus) {
        Write-Host "[$(Get-Date -Format HH:mm:ss)] $statusLine"
        $prevStatus = $status
    }

    if ($status -eq "PASSED" -or $status -eq "SUCCESS" -or $status -eq "COMPLETED") {
        Write-Host "=================================================="
        Write-Host "✅ Pipeline Gating: SUCCESS!"
        Write-Host "All tests passed. Proceeding with deployment."
        Write-Host "=================================================="
        exit 0
    } elseif ($status -eq "FAILED") {
        Write-Error "=================================================="
        Write-Error "❌ Pipeline Gating: FAILED!"
        Write-Error "$failed tests failed. Deployment blocked."
        Write-Error "=================================================="
        exit 1
    } elseif ($status -eq "ERROR" -or $status -eq "CANCELLED") {
        Write-Error "=================================================="
        Write-Error "❌ Pipeline Gating: ERROR!"
        Write-Error "Execution finished with status: $status. Deployment blocked."
        Write-Error "=================================================="
        exit 1
    }

    Start-Sleep -Seconds 5
}
