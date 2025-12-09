# Verify the password format

Write-Host "Checking .env file contents..."
Write-Host ""

$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Check POSTGRES_PRISMA_URL
    if ($content -match 'POSTGRES_PRISMA_URL=(.+)') {
        $url = $matches[1].Trim()
        Write-Host "POSTGRES_PRISMA_URL found:"
        Write-Host "  Length: $($url.Length)"
        
        # Extract password
        if ($url -match ':([^@]+)@') {
            $password = $matches[1]
            Write-Host "  Password part: $($password.Substring(0, [Math]::Min(20, $password.Length)))..."
            Write-Host "  Contains %24 (encoded $): $(if ($password -match '%24') { 'YES' } else { 'NO' })"
            Write-Host "  Contains %21 (encoded !): $(if ($password -match '%21') { 'YES' } else { 'NO' })"
            Write-Host "  Contains raw $: $(if ($password -match '\$') { 'YES - PROBLEM!' } else { 'NO' })"
            Write-Host "  Contains raw !: $(if ($password -match '!') { 'YES - PROBLEM!' } else { 'NO' })"
        }
    } else {
        Write-Host "POSTGRES_PRISMA_URL not found in .env"
    }
    
    Write-Host ""
    Write-Host "If password contains raw $ or ! (not %24 or %21), that's the problem!"
}
