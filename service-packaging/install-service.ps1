# AutoPropel LocalAgent Windows Service Installer Script
# Must be run as Administrator

Write-Host "Installing AutoPropel LocalAgent Service..." -ForegroundColor Cyan

# 1. Elevate check
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Please run this PowerShell script as Administrator!"
    Exit
}

$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $serviceDir

# 2. Compile/copy the latest JAR from target
$jarSource = "$serviceDir\..\localagent-java\localagent-java\target\localagent-java-0.0.1-SNAPSHOT.jar"
if (-not (Test-Path $jarSource)) {
    Write-Host "JAR not found in target folder. Building project first..." -ForegroundColor Yellow
    cd "$serviceDir\.."
    .\mvnw.cmd clean package -DskipTests
    cd $serviceDir
}

if (Test-Path $jarSource) {
    Copy-Item $jarSource "$serviceDir\localagent-java-0.0.1-SNAPSHOT.jar" -Force
    Write-Host "Copied latest JAR to service directory." -ForegroundColor Green
} else {
    Write-Error "Failed to locate compiled JAR file!"
    Exit
}

# 3. Download WinSW if not present
$winSwPath = "$serviceDir\localagent-service.exe"
if (-not (Test-Path $winSwPath)) {
    Write-Host "Downloading Windows Service Wrapper (WinSW)..." -ForegroundColor Yellow
    $url = "https://github.com/winsw/winsw/releases/download/v2.12.0/WinSW-x64.exe"
    Invoke-WebRequest -Uri $url -OutFile $winSwPath
    Write-Host "WinSW downloaded successfully." -ForegroundColor Green
}

# 4. Install the service
Write-Host "Registering service..." -ForegroundColor Yellow
.\localagent-service.exe install

# 5. Start the service
Write-Host "Starting service..." -ForegroundColor Yellow
.\localagent-service.exe start

Write-Host "AutoPropel LocalAgent Service successfully registered and started!" -ForegroundColor Green
