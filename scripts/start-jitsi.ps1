<#
.SYNOPSIS
    Start Jitsi Meet self-hosted services for LearnUp Platform

.DESCRIPTION
    This script starts the self-hosted Jitsi Meet infrastructure including:
    - Jitsi Web (frontend)
    - Prosody (XMPP server)
    - Jicofo (conference focus)
    - JVB (video bridge)

.PARAMETER Action
    The action to perform: start, stop, restart, logs, status

.EXAMPLE
    .\start-jitsi.ps1 start
    .\start-jitsi.ps1 stop
    .\start-jitsi.ps1 logs
#>

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "logs", "status", "setup")]
    [string]$Action = "start"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$JitsiDir = Join-Path $ProjectRoot "infrastructure\jitsi"
$EnvFile = Join-Path $JitsiDir ".env.jitsi"
$EnvExample = Join-Path $JitsiDir ".env.jitsi"
$ComposeFile = Join-Path $JitsiDir "docker-compose.jitsi.yml"

function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARN] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

function Get-LocalIP {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
           Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } |
           Select-Object -First 1).IPAddress
    return $ip
}

function Initialize-JitsiEnv {
    Write-Info "Setting up Jitsi environment..."

    if (-not (Test-Path $EnvFile)) {
        Write-Info "Creating .env.jitsi from template..."
        Copy-Item $EnvExample $EnvFile

        # Get local IP and update the env file
        $localIP = Get-LocalIP
        if ($localIP) {
            Write-Info "Detected local IP: $localIP"
            (Get-Content $EnvFile) -replace 'DOCKER_HOST_ADDRESS=127\.0\.0\.1', "DOCKER_HOST_ADDRESS=$localIP" |
                Set-Content $EnvFile
            Write-Success "Updated DOCKER_HOST_ADDRESS to $localIP"
        }
    } else {
        Write-Info ".env.jitsi already exists"
    }

    # Create config directories
    $configDirs = @(
        "config/web",
        "config/web/crontabs",
        "config/transcripts",
        "config/prosody/config",
        "config/prosody/prosody-plugins-custom",
        "config/jicofo",
        "config/jvb"
    )

    foreach ($dir in $configDirs) {
        $fullPath = Join-Path $JitsiDir $dir
        if (-not (Test-Path $fullPath)) {
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
            Write-Info "Created directory: $dir"
        }
    }

    Write-Success "Jitsi environment setup complete!"
}

function Start-Jitsi {
    Write-Info "Starting Jitsi Meet services..."

    # Ensure network exists
    $networkExists = docker network ls --filter "name=learnup-network" --format "{{.Name}}" 2>$null
    if (-not $networkExists) {
        Write-Info "Creating learnup-network..."
        docker network create learnup-network
    }

    # Start services
    Push-Location $ProjectRoot
    try {
        docker-compose -f $ComposeFile --env-file $EnvFile up -d
        Write-Success "Jitsi Meet services started!"
        Write-Host ""
        Write-Info "Access Jitsi Meet at: http://localhost:8443"
        Write-Info "To create a meeting, navigate to: http://localhost:8443/YourRoomName"
    }
    finally {
        Pop-Location
    }
}

function Stop-Jitsi {
    Write-Info "Stopping Jitsi Meet services..."
    Push-Location $ProjectRoot
    try {
        docker-compose -f $ComposeFile --env-file $EnvFile down
        Write-Success "Jitsi Meet services stopped!"
    }
    finally {
        Pop-Location
    }
}

function Restart-Jitsi {
    Stop-Jitsi
    Start-Sleep -Seconds 2
    Start-Jitsi
}

function Get-JitsiLogs {
    Write-Info "Showing Jitsi Meet logs (Ctrl+C to exit)..."
    Push-Location $ProjectRoot
    try {
        docker-compose -f $ComposeFile --env-file $EnvFile logs -f
    }
    finally {
        Pop-Location
    }
}

function Get-JitsiStatus {
    Write-Info "Jitsi Meet services status:"
    Push-Location $ProjectRoot
    try {
        docker-compose -f $ComposeFile --env-file $EnvFile ps
    }
    finally {
        Pop-Location
    }
}

# Main execution
switch ($Action) {
    "setup" {
        Initialize-JitsiEnv
    }
    "start" {
        Initialize-JitsiEnv
        Start-Jitsi
    }
    "stop" {
        Stop-Jitsi
    }
    "restart" {
        Restart-Jitsi
    }
    "logs" {
        Get-JitsiLogs
    }
    "status" {
        Get-JitsiStatus
    }
}
