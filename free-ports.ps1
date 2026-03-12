# Free all ports used by AmandaChatbot before starting services
$ports = @(5000, 8765)

foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port\s"
    $pids = $connections | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Sort-Object -Unique

    foreach ($pid in $pids) {
        if ($pid -match '^\d+$' -and $pid -ne '0') {
            try {
                $proc = Get-Process -Id $pid -ErrorAction Stop
                Write-Host "Killing $($proc.Name) (PID $pid) on port $port"
                Stop-Process -Id $pid -Force
            } catch {
                Write-Host "Port $port - PID $pid already gone"
            }
        }
    }
}

Write-Host "All ports freed. You can now start the services."
