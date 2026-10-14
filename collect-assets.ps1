$ErrorActionPreference = 'Stop'
$assetRoot = Join-Path $PSScriptRoot 'dist/assets'
$pages = @(Get-Content -LiteralPath (Join-Path $PSScriptRoot 'source-telegram.html') -Raw)
foreach ($pageNumber in @(1025,1005,978)) {
  $pages += (Invoke-WebRequest -Uri "https://t.me/s/kosova_studio?before=$pageNumber").Content
}
$photoMap = @{}
foreach ($html in $pages) {
  foreach ($tag in [regex]::Matches($html, '<a\b[^>]*class="[^"]*tgme_widget_message_photo_wrap[^>]*>')) {
    $imageUrl = [regex]::Match($tag.Value, "background-image:url\('([^']+)'\)").Groups[1].Value
    $postId = [regex]::Match($tag.Value, 'kosova_studio/(\d+)\?single').Groups[1].Value
    if ($imageUrl -and $postId) { $photoMap[$postId] = $imageUrl }
  }
}
$photoMap.GetEnumerator() | ForEach-Object -Parallel {
  $targetRoot = $using:assetRoot
  $imageTarget = Join-Path $targetRoot "post-$($_.Key).jpg"
  if (-not (Test-Path -LiteralPath $imageTarget)) {
    for ($attempt=0; $attempt -lt 3; $attempt++) {
      try { Invoke-WebRequest -Uri $_.Value -OutFile $imageTarget -TimeoutSec 25; break }
      catch { if ($attempt -eq 2) { Write-Output "Unavailable image: $($_.Key)" } }
    }
  }
} -ThrottleLimit 3
$sources = $photoMap.Keys | Sort-Object {[int]$_} | ForEach-Object { @{ id=$_; path="assets/post-$_.jpg"; source="https://t.me/kosova_studio/$_" } }
$sources | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'asset-sources.json') -Encoding utf8
$fontCss = (Invoke-WebRequest -Uri 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Golos+Text:wght@400;500;600&display=swap' -UserAgent 'Mozilla/5.0').Content
$fontUrls = [regex]::Matches($fontCss,'url\((https:[^)]+)\)') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
$fontIndex = 0
foreach ($fontUrl in $fontUrls) {
  $extension = [IO.Path]::GetExtension(([Uri]$fontUrl).AbsolutePath)
  $fontName = "font-$fontIndex$extension"
  Invoke-WebRequest -Uri $fontUrl -OutFile (Join-Path $assetRoot $fontName)
  $fontCss = $fontCss.Replace($fontUrl,"./$fontName")
  $fontIndex++
}
Set-Content -LiteralPath (Join-Path $assetRoot 'fonts.css') -Value $fontCss -Encoding utf8
Write-Output "Downloaded $($photoMap.Count) photographs and $fontIndex font files."
