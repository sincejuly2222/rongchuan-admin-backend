<# Database initialization helper: reads schema.sql from the same folder, replaces the target DB name, and pipes it into the mysql client. #>
param(
    [string]$DbHost = $env:DB_HOST,
    [string]$DbPort = $env:DB_PORT,
    [string]$DbUser = $env:DB_USER,
    [string]$DbPassword = $env:DB_PASSWORD,
    [string]$DbName = $env:DB_NAME
)

if ([string]::IsNullOrWhiteSpace($DbHost)) { $DbHost = "127.0.0.1" }
if ([string]::IsNullOrWhiteSpace($DbPort)) { $DbPort = "3306" }
if ([string]::IsNullOrWhiteSpace($DbUser)) { $DbUser = "root" }
if ([string]::IsNullOrWhiteSpace($DbName)) { $DbName = "rongchuan_admin" }

if ($DbName -notmatch '^[A-Za-z0-9_]+$') {
    Write-Error "Invalid DB_NAME. Use only letters, numbers, and underscores."
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$schemaPath = Join-Path $scriptDir "schema.sql"

if (-not (Test-Path -LiteralPath $schemaPath)) {
    Write-Error "Schema file not found: $schemaPath"
    exit 1
}

$mysqlCommand = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlCommand) {
    Write-Error "MySQL client not found. Please install MySQL and ensure 'mysql' is available in PATH."
    exit 1
}

$sql = Get-Content -LiteralPath $schemaPath -Raw
$sql = $sql.Replace("__DB_NAME__", $DbName)

$arguments = @(
    "-h", $DbHost,
    "-P", $DbPort,
    "-u", $DbUser
)

if (-not [string]::IsNullOrEmpty($DbPassword)) {
    $arguments += "-p$DbPassword"
}

$sql | & $mysqlCommand.Source @arguments
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Error "Database initialization failed."
    exit $exitCode
}

Write-Host "Database schema initialized successfully."
