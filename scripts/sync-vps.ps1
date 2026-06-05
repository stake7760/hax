param(
  [switch]$Full
)

$ErrorActionPreference = "Stop"

$vpsUser = $env:VPS_USER
$vpsHost = $env:VPS_HOST
$vpsKey = $env:VPS_KEY

if ([string]::IsNullOrWhiteSpace($vpsUser) -or [string]::IsNullOrWhiteSpace($vpsHost)) {
  throw "Configure VPS_USER e VPS_HOST no terminal antes de executar npm run sync."
}

$archiveName = "vincere-sync-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()).tar.gz"
$archivePath = Join-Path $env:TEMP $archiveName
$remoteArchive = "/tmp/$archiveName"
$remoteDir = "/home/$vpsUser/vincere"
$remote = "$vpsUser@$vpsHost"
$usePutty = -not [string]::IsNullOrWhiteSpace($vpsKey) -and [IO.Path]::GetExtension($vpsKey) -ieq ".ppk"

if (-not [string]::IsNullOrWhiteSpace($vpsKey) -and -not (Test-Path -LiteralPath $vpsKey)) {
  throw "A chave configurada em VPS_KEY nao foi encontrada: $vpsKey"
}

function Copy-ToVps([string]$source, [string]$destination) {
  if ($usePutty) {
    & pscp -batch -i $vpsKey $source "${remote}:$destination"
  } elseif (-not [string]::IsNullOrWhiteSpace($vpsKey)) {
    & scp -i $vpsKey $source "${remote}:$destination"
  } else {
    & scp $source "${remote}:$destination"
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao enviar pacote para a VPS."
  }
}

function Invoke-OnVps([string]$command) {
  if ($usePutty) {
    & plink -batch -i $vpsKey $remote $command
  } elseif (-not [string]::IsNullOrWhiteSpace($vpsKey)) {
    & ssh -i $vpsKey $remote $command
  } else {
    & ssh $remote $command
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao executar comando na VPS."
  }
}

try {
  tar `
    --exclude="./node_modules" `
    --exclude="./.git" `
    --exclude="./clips" `
    --exclude="./data.db*" `
    --exclude="./.env" `
    --exclude="./.env.example" `
    --exclude="./README.md" `
    --exclude="./dist" `
    -czf $archivePath `
    .

  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao criar pacote de sincronizacao."
  }

  Copy-ToVps $archivePath $remoteArchive

  Invoke-OnVps "mkdir -p '$remoteDir' && tar -xzf '$remoteArchive' -C '$remoteDir' && rm -f '$remoteArchive'"

  Write-Host "OK Codigo sincronizado em ${remote}:$remoteDir"

  if ($Full) {
    Invoke-OnVps "cd '$remoteDir' && npm install"

    Invoke-OnVps "if command -v pm2 >/dev/null 2>&1; then pm2 restart all; else echo 'AVISO pm2 nao instalado; reinicie manualmente o processo na sessao tmux.'; fi"

    Write-Host "OK Dependencias instaladas"
  }
} finally {
  if (Test-Path $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }
}
