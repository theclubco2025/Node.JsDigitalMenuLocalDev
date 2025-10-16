param(
  [Parameter(Mandatory=$true)][string]$Base,
  [Parameter(Mandatory=$true)][string]$Token,
  [Parameter(Mandatory=$true)][string]$Slug,
  [Parameter(Mandatory=$true)][string]$Draft
)

$ErrorActionPreference = 'Stop'

function PostJson([string]$uri, $obj) {
  $json = $obj | ConvertTo-Json -Depth 100
  Invoke-RestMethod -Method Post -Uri $uri -Headers @{ 'X-Admin-Token' = $Token } -ContentType 'application/json' -Body $json
}

function ReadJsonFile([string]$path) {
  if (Test-Path $path) {
    return (Get-Content -Raw $path | ConvertFrom-Json)
  }
  return $null
}

$baseDir = Join-Path (Get-Location) ("data/tenants/" + $Draft)

$brand  = ReadJsonFile (Join-Path $baseDir 'brand.json')
$images = ReadJsonFile (Join-Path $baseDir 'images.json')
$style  = ReadJsonFile (Join-Path $baseDir 'style.json')
$copy   = ReadJsonFile (Join-Path $baseDir 'copy.json')
$themeRaw = Get-Content -Raw (Join-Path $baseDir 'theme.json')
$menu   = ReadJsonFile (Join-Path $baseDir 'menu.json')

# 1) Config (brand/images/style/copy)
$configBody = [PSCustomObject]@{ brand = $brand; images = $images; style = $style; copy = $copy }
PostJson "$Base/api/tenant/config?tenant=$Slug" $configBody | Out-Null

# 2) Theme (raw JSON string)
Invoke-RestMethod -Method Post -Uri "$Base/api/theme?tenant=$Slug" -Headers @{ 'X-Admin-Token' = $Token } -ContentType 'application/json' -Body $themeRaw | Out-Null

# 3) Menu
$menuPayload = [PSCustomObject]@{ tenant = $Slug; menu = $menu }
PostJson "$Base/api/tenant/import" $menuPayload | Out-Null

# 4) Verify
$verify = Invoke-RestMethod -Method Get -Uri "$Base/api/menu?tenant=$Slug"
$catCount = ($verify.categories | Measure-Object).Count
Write-Output ("VERIFY_CATEGORIES=" + $catCount)


