if (!(Get-Command winget -ErrorAction SilentlyContinue)) {
   Write-Host "❌ winget not found. Install App Installer from Microsoft Store."
   exit 1
}

winget install Git.Git -e
winget install Gyan.FFmpeg -e
winget install OpenJS.NodeJS.LTS -e

Write-Host "📦 Enabling Corepack..."
corepack enable
corepack prepare yarn@1.22.22 --activate

Write-Host "📥 Installing dependencies..."
yarn install

Write-Host "🚀 Installing PM2 globally..."
npm install -g pm2

Write-Host "✅ Install complete!"