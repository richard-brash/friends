@echo off
echo Resetting database...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/reset' -Method Post; Write-Host 'Database reset successful:' $response.message } catch { Write-Host 'Error:' $_.Exception.Message }"
pause