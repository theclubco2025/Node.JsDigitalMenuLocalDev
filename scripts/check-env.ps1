$ErrorActionPreference = "SilentlyContinue"

# Read env.example keys
$examplePath = "env.example"
$exampleKeys = @()
if (Test-Path $examplePath) {
  Get-Content $examplePath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
      $key = $line.Split('=')[0]
      if ($key) { $exampleKeys += $key }
    }
  }
}

# Read .env.local if exists (do not print values)
$localPath = ".env.local"
$localKeys = @{}
if (Test-Path $localPath) {
  Get-Content $localPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
      $parts = $line.Split('='); if ($parts.Length -ge 1) { $localKeys[$parts[0]] = $true }
    }
  }
}

$missing = @()
foreach ($k in $exampleKeys) { if (-not $localKeys.ContainsKey($k)) { $missing += $k } }

Write-Host "Environment Check (PowerShell) - informational"
Write-Host "---------------------------------------------"
Write-Host ("Example keys: {0}" -f $exampleKeys.Count)
Write-Host ("Missing in .env.local: {0}" -f ($missing -join ', '))
Write-Host "Note: This script does not print secret values."

exit 0


