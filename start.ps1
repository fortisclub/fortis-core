Get-Content .env | ForEach-Object {
    if ($_ -match "^\s*#") { return }
    if ($_ -match "^\s*$") { return }

    $parts = $_ -split "=", 2
    $name = $parts[0].Trim()
    $value = $parts[1].Trim()

    [System.Environment]::SetEnvironmentVariable($name, $value)
}

Write-Host "ENV carregado com sucesso"
npm run dev