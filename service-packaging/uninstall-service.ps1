# AutoPropel LocalAgent Windows Service Uninstaller Script
# Must be run as Administrator

Write-Host "Uninstalling AutoPropel LocalAgent Service..." -ForegroundColor Cyan

# 1. Elevate check
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Please run this PowerShell script as Administrator!"
    Exit
}

$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $serviceDir

$winSwPath = "$serviceDir\localagent-service.exe"
if (Test-Path $winSwPath) {
    Write-Host "Stopping service..." -ForegroundColor Yellow
    .\localagent-service.exe stop
    
    Write-Host "Uninstalling service..." -ForegroundColor Yellow
    .\localagent-service.exe uninstall
    
    Write-Host "Service unregistered successfully." -ForegroundColor Green
} else {
    Write-Warning "localagent-service.exe not found. Service might not be installed."
}
