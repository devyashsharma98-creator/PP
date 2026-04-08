# Deployment script for Pragya Pravah to Hostinger
# This script automates the upload of the production build to your Hostinger server.

# 1. Configuration - REPLACE THESE WITH YOUR HOSTINGER DETAILS
$FTP_HOST = "ftp.hostingersite.com" # Check this in Hostinger Control Panel
$FTP_USER = "u123456789"          # Your FTP username
$FTP_PASS = "YOUR_FTP_PASSWORD"   # Your FTP password
$REMOTE_PATH = "/"                # Use "/" or "/public_html/" depending on your Hostinger setup

# 2. Files to upload
$FILES_TO_UPLOAD = @(
    "server.js",
    ".next/standalone",
    ".next/static",
    "public"
)

# 3. Preparation
Write-Host "📦 Preparing Pragya Pravah Deployment..." -ForegroundColor Cyan
if (-not (Test-Path ".next/standalone")) {
    Write-Host "❌ Error: Build files not found. Run 'npm run build' first." -ForegroundColor Red
    exit
}

# 4. Upload via FTP (using standard .NET/PowerShell methods)
# If you have WinSCP installed, use that instead for better performance.
Write-Host "🚀 Starting FTP Upload to $FTP_HOST..." -ForegroundColor Cyan

foreach ($item in $FILES_TO_UPLOAD) {
    # Recursive folder upload or single file upload logic here
    # For a robust deployment, it's highly recommended to use an FTP client or 'scp' if SSH is enabled.
}

Write-Host "✅ Deployment script template created." -ForegroundColor Green
Write-Host "👉 Please update the script with your Hostinger credentials." -ForegroundColor Yellow
