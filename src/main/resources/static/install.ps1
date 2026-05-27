param (
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [string]$InstallDir = "C:\AutoPropel\Agent",
    [string]$CloudUrl = "http://13.232.42.59"
)

Write-Host "🚀 Installing AutoPropel Agent..." -ForegroundColor Cyan
New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
Set-Location -Path $InstallDir

Write-Host "📥 Downloading Agent JAR..." -ForegroundColor Cyan
# In production, this points to the real hosted JAR
Invoke-WebRequest -Uri "$CloudUrl/agent/localagent-java.jar" -OutFile "localagent-java.jar"

Write-Host "⚙️ Configuring Agent..." -ForegroundColor Cyan
$ConfigContent = @"
localagent:
  cloud-url: $CloudUrl
  token: $Token
  polling-enabled: true
"@
Set-Content -Path "application.yml" -Value $ConfigContent

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "To start the agent in the background (as a service), we would register WinSW here."
Write-Host "For now, you can start it manually with:" -ForegroundColor Yellow
Write-Host "  cd $InstallDir"
Write-Host "  java -jar localagent-java.jar"
