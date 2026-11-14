param(
  [ValidateRange(1, 65535)]
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

Write-Host ""
Write-Host "  RED VAN DAREDEVIL - local server" -ForegroundColor Red
Write-Host "  Open: http://localhost:$Port"
Write-Host "  Stop: Ctrl+C"
Write-Host ""

if (Get-Command py -ErrorAction SilentlyContinue) {
  & py -m http.server $Port
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  & python -m http.server $Port
} else {
  Write-Host "Python 3 was not found." -ForegroundColor Yellow
  Write-Host "Install it with:"
  Write-Host "  winget install -e --id Python.Python.3.12"
  Write-Host "Then reopen PowerShell and run this script again."
  exit 1
}
