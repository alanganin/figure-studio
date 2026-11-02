param([ValidateRange(1024,65535)][int]$Port = 8080)
$ErrorActionPreference = 'Stop'
$studioRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Figure Studio: http://127.0.0.1:$Port/"
Write-Host 'Open that address in Chrome or Edge. Press Ctrl+C here to stop.'
try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 5000
            $stream = $client.GetStream()
            $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
            $request = $reader.ReadLine()
            if (-not $request) { continue }
            while ($reader.ReadLine()) { }
            $parts = $request.Split(' ')
            $requestPath = [Uri]::UnescapeDataString(($parts[1] -split '\?')[0]).Replace('/', [IO.Path]::DirectorySeparatorChar)
            if ($requestPath -eq [string][IO.Path]::DirectorySeparatorChar) { $requestPath = 'index.html' }
            $filePath = [IO.Path]::GetFullPath((Join-Path $studioRoot $requestPath.TrimStart([IO.Path]::DirectorySeparatorChar)))
            $status = '200 OK'
            $mime = 'application/octet-stream'
            if ($parts[0] -ne 'GET' -or -not $filePath.StartsWith($studioRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
                $status = '403 Forbidden'; $body = [Text.Encoding]::UTF8.GetBytes('Forbidden')
            } elseif (-not [IO.File]::Exists($filePath)) {
                $status = '404 Not Found'; $body = [Text.Encoding]::UTF8.GetBytes('Not found')
            } else {
                $body = [IO.File]::ReadAllBytes($filePath)
                $mime = switch ([IO.Path]::GetExtension($filePath)) {
                    '.html' { 'text/html; charset=utf-8' }
                    '.js' { 'text/javascript; charset=utf-8' }
                    '.css' { 'text/css; charset=utf-8' }
                    '.json' { 'application/json; charset=utf-8' }
                    '.md' { 'text/plain; charset=utf-8' }
                    default { 'application/octet-stream' }
                }
            }
            $header = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $mime`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n")
            $stream.Write($header,0,$header.Length)
            $stream.Write($body,0,$body.Length)
            $stream.Flush()
        } catch { Write-Warning $_.Exception.Message }
        finally { $client.Dispose() }
    }
} finally { $listener.Stop() }
