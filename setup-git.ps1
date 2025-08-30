# Script de Configuração Git para ND Express
# Execute este script no PowerShell para configurar o repositório

Write-Host "🚀 Configurando repositório ND Express..." -ForegroundColor Green

# Verificar se Git está instalado
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não encontrado. Instale o Git primeiro: https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Verificar se já é um repositório Git
if (Test-Path ".git") {
    Write-Host "📁 Repositório Git já existe. Atualizando configuração..." -ForegroundColor Yellow
} else {
    Write-Host "📁 Inicializando repositório Git..." -ForegroundColor Cyan
    git init
}

# Configurar informações do usuário (se não estiverem configuradas)
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    $inputName = Read-Host "Digite seu nome para o Git"
    git config user.name "$inputName"
    Write-Host "✅ Nome configurado: $inputName" -ForegroundColor Green
}

if (-not $userEmail) {
    $inputEmail = Read-Host "Digite seu email para o Git"
    git config user.email "$inputEmail"
    Write-Host "✅ Email configurado: $inputEmail" -ForegroundColor Green
}

# Configurar branch principal
Write-Host "🌿 Configurando branch principal..." -ForegroundColor Cyan
git branch -M main

# Adicionar remote origin (se não existir)
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
    Write-Host "🔗 Adicionando remote origin..." -ForegroundColor Cyan
    git remote add origin https://github.com/ramonpmendesx3012/ND.git
    Write-Host "✅ Remote origin adicionado" -ForegroundColor Green
} else {
    Write-Host "🔗 Remote origin já existe: $remoteUrl" -ForegroundColor Yellow
    # Atualizar URL se necessário
    git remote set-url origin https://github.com/ramonpmendesx3012/ND.git
    Write-Host "✅ Remote origin atualizado" -ForegroundColor Green
}

# Adicionar todos os arquivos
Write-Host "📦 Adicionando arquivos ao staging..." -ForegroundColor Cyan
git add .

# Verificar status
Write-Host "📊 Status do repositório:" -ForegroundColor Cyan
git status --short

# Fazer commit inicial (se houver mudanças)
$changes = git diff --cached --name-only
if ($changes) {
    Write-Host "💾 Fazendo commit inicial..." -ForegroundColor Cyan
    git commit -m "feat: initial commit with complete ND Express system`n`n- Sistema completo de gestão de notas de despesa`n- Integração com OpenAI para análise de comprovantes`n- Persistência em tempo real com Supabase`n- Exportação profissional para Excel`n- PWA com funcionalidade offline`n- CI/CD configurado para Vercel`n- Documentação completa e profissional"
    Write-Host "✅ Commit inicial realizado" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Nenhuma mudança para commit" -ForegroundColor Yellow
}

# Verificar se o repositório remoto existe
Write-Host "🔍 Verificando repositório remoto..." -ForegroundColor Cyan
$remoteCheck = git ls-remote origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Repositório remoto encontrado" -ForegroundColor Green
    
    # Fazer push
    Write-Host "⬆️ Fazendo push para o repositório remoto..." -ForegroundColor Cyan
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 Push realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Erro no push. Verifique suas credenciais." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Repositório remoto não encontrado ou sem acesso" -ForegroundColor Red
    Write-Host "📝 Instruções:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://github.com/ramonpmendesx3012/ND" -ForegroundColor White
    Write-Host "   2. Verifique se o repositório existe" -ForegroundColor White
    Write-Host "   3. Verifique suas credenciais do GitHub" -ForegroundColor White
    Write-Host "   4. Execute: git push -u origin main" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Configuração concluída!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verifique o repositório: https://github.com/ramonpmendesx3012/ND" -ForegroundColor White
Write-Host "   2. Configure o Vercel para deploy automático" -ForegroundColor White
Write-Host "   3. Adicione as variáveis de ambiente no Vercel" -ForegroundColor White
Write-Host "   4. Configure os secrets do GitHub Actions" -ForegroundColor White
Write-Host ""
Write-Host "🚀 ND Express está pronto para deploy!" -ForegroundColor Green