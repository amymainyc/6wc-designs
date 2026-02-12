$aepFolder = "C:\Users\amyma\Documents\PhotoShop\6WC\staff-banners\to_be_rendered"
$outputFolder = "C:\Users\amyma\Documents\PhotoShop\6WC\staff-banners\output"
$aerender = "C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\aerender.exe"

# Create output folder if needed
New-Item -ItemType Directory -Force -Path $outputFolder | Out-Null

# Get all .aep files
$aepFiles = Get-ChildItem -Path $aepFolder -Filter "*.aep"

foreach ($file in $aepFiles) {
    $outputFile = Join-Path $outputFolder "$($file.BaseName).mov"
    
    Write-Host "Rendering: $($file.Name)" -ForegroundColor Green
    
    & $aerender -project $file.FullName -comp "main" -output $outputFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "Failed: $($file.Name)" -ForegroundColor Red
    }
}

Write-Host "`nAll renders complete!" -ForegroundColor Cyan