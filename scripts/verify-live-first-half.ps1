param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$Email = "admin@pragyapravah.local",
  [string]$Password = "Pragya@12345"
)

$ErrorActionPreference = "Stop"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$results = New-Object System.Collections.Generic.List[object]

function Trim-Body([string]$content) {
  if ([string]::IsNullOrEmpty($content)) { return "" }
  $single = ($content -replace "[\r\n]+", " ")
  if ($single.Length -gt 240) { return $single.Substring(0, 240) + "...(truncated)" }
  return $single
}

function Invoke-Case(
  [string]$Name,
  [string]$Method,
  [string]$Path,
  $Body = $null,
  [int[]]$ExpectedStatusCodes = @()
) {
  $url = "$BaseUrl$Path"

  function Test-ExpectedStatus([int]$StatusCode, [int[]]$ExpectedCodes) {
    if ($ExpectedCodes.Count -gt 0) {
      return ($ExpectedCodes -contains $StatusCode)
    }
    return ($StatusCode -ge 200 -and $StatusCode -lt 300)
  }

  try {
    if ($null -ne $Body) {
      $resp = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $url -WebSession $session -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 8) -TimeoutSec 45
    } else {
      $resp = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $url -WebSession $session -TimeoutSec 45
    }
    $statusCode = [int]$resp.StatusCode
    $isPass = Test-ExpectedStatus -StatusCode $statusCode -ExpectedCodes $ExpectedStatusCodes
    $results.Add([pscustomobject]@{
      Name = $Name
      Method = $Method
      Path = $Path
      Status = $statusCode
      Pass = $isPass
      Sample = (Trim-Body $resp.Content)
    }) | Out-Null
    return @{ Status = $statusCode; Body = $resp.Content }
  } catch {
    if ($_.Exception.Response) {
      $r = $_.Exception.Response
      $sr = New-Object IO.StreamReader($r.GetResponseStream())
      $content = $sr.ReadToEnd()
      $statusCode = [int]$r.StatusCode
      $isPass = Test-ExpectedStatus -StatusCode $statusCode -ExpectedCodes $ExpectedStatusCodes
      $results.Add([pscustomobject]@{
        Name = $Name
        Method = $Method
        Path = $Path
        Status = $statusCode
        Pass = $isPass
        Sample = (Trim-Body $content)
      }) | Out-Null
      return @{ Status = $statusCode; Body = $content }
    }
    $results.Add([pscustomobject]@{
      Name = $Name
      Method = $Method
      Path = $Path
      Status = -1
      Pass = $false
      Sample = $_.ToString()
    }) | Out-Null
    return @{ Status = -1; Body = $_.ToString() }
  }
}

Write-Output "== Pragya Pravah Local Backend Verification =="
Write-Output "Base URL: $BaseUrl"

# Auth
$login = Invoke-Case -Name "Auth login" -Method "POST" -Path "/api/auth/login" -Body @{ email = $Email; password = $Password }
$me = Invoke-Case -Name "Auth me" -Method "GET" -Path "/api/auth/me"

$eventId = $null
$pollId = $null
$articleId = $null

# Roles / Users
Invoke-Case -Name "Roles list" -Method "GET" -Path "/api/v1/roles" | Out-Null
Invoke-Case -Name "Users list" -Method "GET" -Path "/api/v1/users" -ExpectedStatusCodes @(200, 403) | Out-Null

# Events (CRUD + workflow + checklist + polls)
$eventCreate = Invoke-Case -Name "Event create" -Method "POST" -Path "/api/v1/events" -Body @{
  title = "Live API Test Event $(Get-Date -Format 'yyyyMMddHHmmss')"
  description = "Live verification event"
  startsAt = (Get-Date).AddDays(2).ToUniversalTime().ToString("o")
  endsAt = (Get-Date).AddDays(2).AddHours(2).ToUniversalTime().ToString("o")
}

if ($eventCreate.Status -ge 200 -and $eventCreate.Status -lt 300) {
  try {
    $eventJson = $eventCreate.Body | ConvertFrom-Json
    $eventId = $eventJson.data.id
  } catch {}
}

if (-not $eventId) {
  $eventsList = Invoke-Case -Name "Events list" -Method "GET" -Path "/api/v1/events"
  try {
    $eventsJson = $eventsList.Body | ConvertFrom-Json
    if ($eventsJson.data -and $eventsJson.data.Count -gt 0) {
      $eventId = $eventsJson.data[0].id
    }
  } catch {}
}

if ($eventId) {
  Invoke-Case -Name "Event get" -Method "GET" -Path "/api/v1/events/$eventId" | Out-Null
  Invoke-Case -Name "Event update" -Method "PATCH" -Path "/api/v1/events/$eventId" -Body @{ description = "Live verification event updated" } | Out-Null
  Invoke-Case -Name "Event workflow" -Method "POST" -Path "/api/v1/events/$eventId/workflow" -Body @{ toStatus = "submitted_by_unit"; notes = "Live API verify" } | Out-Null
  Invoke-Case -Name "Event checklist get" -Method "GET" -Path "/api/v1/events/$eventId/checklist" | Out-Null
  Invoke-Case -Name "Event checklist patch" -Method "PATCH" -Path "/api/v1/events/$eventId/checklist" -Body @{ designing = $true; seating = $true } | Out-Null
  Invoke-Case -Name "Event polls list" -Method "GET" -Path "/api/v1/events/$eventId/polls" | Out-Null

  $pollCreate = Invoke-Case -Name "Event poll create" -Method "POST" -Path "/api/v1/events/$eventId/polls" -Body @{
    question = "Live API poll?"
    pollType = "general"
    options = @(
      @{ label = "Yes" },
      @{ label = "No" }
    )
  }

  if ($pollCreate.Status -ge 200 -and $pollCreate.Status -lt 300) {
    try {
      $pollJson = $pollCreate.Body | ConvertFrom-Json
      $pollId = $pollJson.data.id
    } catch {}
  }

  if ($pollId) {
    Invoke-Case -Name "Event poll vote/finalize" -Method "POST" -Path "/api/v1/events/$eventId/polls/$pollId" -Body @{ action = "vote"; optionId = $null; selectedOptionIds = @() } | Out-Null
  }

  Invoke-Case -Name "Event registrations list" -Method "GET" -Path "/api/v1/events/$eventId/registrations" | Out-Null
}

# Articles / Aalekh (CRUD + workflow + reviews)
$articleCreate = Invoke-Case -Name "Article create" -Method "POST" -Path "/api/v1/articles" -Body @{
  title = "Live API Test Aalekh $(Get-Date -Format 'yyyyMMddHHmmss')"
  summary = "Live verification summary"
  content = "Live verification content body"
  category = "vimarsh"
}

if ($articleCreate.Status -ge 200 -and $articleCreate.Status -lt 300) {
  try {
    $articleJson = $articleCreate.Body | ConvertFrom-Json
    $articleId = $articleJson.data.id
  } catch {}
}

if (-not $articleId) {
  $articlesList = Invoke-Case -Name "Articles list" -Method "GET" -Path "/api/v1/articles"
  try {
    $articlesJson = $articlesList.Body | ConvertFrom-Json
    if ($articlesJson.data -and $articlesJson.data.Count -gt 0) {
      $articleId = $articlesJson.data[0].id
    }
  } catch {}
}

if ($articleId) {
  Invoke-Case -Name "Article get" -Method "GET" -Path "/api/v1/articles/$articleId" | Out-Null
  Invoke-Case -Name "Article update" -Method "PATCH" -Path "/api/v1/articles/$articleId" -Body @{ summary = "Live verification summary updated" } | Out-Null
  Invoke-Case -Name "Article workflow" -Method "POST" -Path "/api/v1/articles/$articleId/workflow" -Body @{
    toStatus = "pending_unit_head_review"
    valuesChecklist = @{
      rashtraPratham = $true
      culturallyGrounded = $true
      balancedTone = $true
      noDivisiveContent = $true
    }
  } | Out-Null
  Invoke-Case -Name "Article reviews list" -Method "GET" -Path "/api/v1/articles/$articleId/reviews" | Out-Null
  Invoke-Case -Name "Article review create" -Method "POST" -Path "/api/v1/articles/$articleId/reviews" -Body @{
    decision = "approved"
    reviewNotes = "Live verification review note"
  } | Out-Null
}

# Logout at end
Invoke-Case -Name "Auth logout" -Method "POST" -Path "/api/auth/logout" | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = "live-verify-$timestamp.json"
$results | ConvertTo-Json -Depth 6 | Out-File -Encoding utf8 $outFile

Write-Output ""
Write-Output "== Results =="
$results | Format-Table Name,Method,Path,Status,Pass -AutoSize
Write-Output ""
Write-Output "Saved JSON report: $outFile"
