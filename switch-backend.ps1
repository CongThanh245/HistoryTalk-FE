#!/usr/bin/env pwsh
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("spring", "nodejs")]
    [string]$Backend
)

$envFile = ".env.$Backend"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: $envFile not found!" -ForegroundColor Red
    exit 1
}

Copy-Item $envFile ".env.local" -Force
Write-Host "Switched to $Backend backend" -ForegroundColor Green
Write-Host "API: $((Get-Content $envFile | Select-String "NEXT_PUBLIC_API_BASE_URL").Line)" -ForegroundColor Cyan
