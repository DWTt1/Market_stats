param(
    [ValidateSet('update','dev','build','publish')][string]$Action = 'dev',
    [Parameter(ValueFromRemainingArguments=$true)][string[]]$ImportArguments
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$env:PYTHONIOENCODING = 'utf-8'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Initialize-Python {
    $script:pythonExe = Join-Path $projectRoot '.venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $script:pythonExe)) {
        $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
        if (-not $pythonCommand) { throw 'Python 3.10+ is required. Install Python and enable Add to PATH.' }
        & $pythonCommand.Source -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Unable to create the Python virtual environment.' }
    }
    & $script:pythonExe -c 'import openpyxl, dotenv' 2>$null
    if ($LASTEXITCODE -ne 0) {
        & $script:pythonExe -m pip install -r requirements.txt --cache-dir .cache/pip
        if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
    }
}

function Invoke-NodePackage([string[]]$PackageArguments) {
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($npmCommand) { & $npmCommand.Source @PackageArguments }
    else {
        # An optional project-local npm runtime also supports the current Codex environment.
        $localNpm = Join-Path $projectRoot '.cache\tools\package\bin\npm-cli.js'
        $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
        if (-not $nodeCommand -or -not (Test-Path -LiteralPath $localNpm)) { throw 'Node.js 24 LTS (including npm) is required. Install it and reopen this script.' }
        & $nodeCommand.Source $localNpm @PackageArguments
    }
    if ($LASTEXITCODE -ne 0) { throw "npm command failed (exit $LASTEXITCODE)." }
}

try {
    Initialize-Python
    & $script:pythonExe scripts/import_excel.py @ImportArguments
    $importResult = $LASTEXITCODE
    if ($Action -eq 'update') { exit $importResult }
    if ($importResult -ne 0) {
        if ($Action -ne 'dev' -or -not (Test-Path -LiteralPath 'public/data/index.json')) { throw 'Import failed. Review the log before building or publishing.' }
        Write-Host '[WARNING] Import reported errors; development will use the existing valid data index.' -ForegroundColor Yellow
    }
    if (-not (Test-Path -LiteralPath 'node_modules/vite')) { Invoke-NodePackage @('ci','--cache','.cache/npm') }
    if ($Action -eq 'dev') { Invoke-NodePackage @('run','dev','--','--open'); exit 0 }
    Invoke-NodePackage @('run','build')
    if ($Action -eq 'publish') {
        Write-Host '[OK] Release files are ready in dist/.' -ForegroundColor Green
        Write-Host '[INFO] No remote upload, git push, or production deployment was executed.'
        Write-Host '[INFO] Configure the deployment provider after it has been selected and authorized. See docs/DEPLOYMENT.md.'
        # Future authorized deployment adapter goes here. Keep credentials outside this repository.
    }
    exit 0
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
