@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Atualizar TurboPonto - GitHub e Lovable

cd /d "%~dp0"

set "REPO_URL=https://github.com/wandersonmonteiro931-byte/turboponto-4d913c22.git"
set "BRANCH=main"
set "LOVABLE_URL=https://lovable.dev/projects/b4f6b092-2e46-440d-a020-7e18d929f17f"
set "PROMPT_FILE=APLICAR_BANCO_NO_LOVABLE.txt"

echo ==================================================
echo        ATUALIZACAO AUTOMATICA - TURBOPONTO
echo                 GITHUB + LOVABLE
echo ==================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERRO: O Git nao esta instalado neste computador.
    echo Instale o Git para Windows e execute novamente:
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [1/2] Enviando os arquivos para o GitHub...

if not exist ".git" (
    git init
    if errorlevel 1 goto :erro_git
)

git config user.name >nul 2>&1
if errorlevel 1 git config user.name "Wanderson Monteiro"

git config user.email >nul 2>&1
if errorlevel 1 git config user.email "wandersonmonteiro931-byte@users.noreply.github.com"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin "%REPO_URL%"
) else (
    git remote set-url origin "%REPO_URL%"
)

git fetch origin "%BRANCH%"
if not errorlevel 1 git reset --mixed "origin/%BRANCH%" >nul 2>&1

git branch -M "%BRANCH%" >nul 2>&1
git add -A
if errorlevel 1 goto :erro_git

git diff --cached --quiet
if not errorlevel 1 (
    echo Nenhuma alteracao nova encontrada. O GitHub ja esta atualizado.
) else (
    set "DATA_HORA=%date% %time:~0,8%"
    git commit -m "Atualizacao automatica - %DATA_HORA%"
    if errorlevel 1 goto :erro_git

    git push -u origin "%BRANCH%"
    if errorlevel 1 goto :erro_git
)

echo.
echo [2/2] Abrindo o projeto no Lovable para aplicar o banco...

if exist "%PROMPT_FILE%" (
    type "%PROMPT_FILE%" | clip
    echo O comando foi copiado para a area de transferencia.
    echo No chat do Lovable, pressione CTRL+V e envie.
) else (
    echo AVISO: O arquivo %PROMPT_FILE% nao foi encontrado.
)

start "" "%LOVABLE_URL%"

echo.
echo ==================================================
echo ARQUIVOS ENVIADOS AO GITHUB.
echo O LOVABLE FOI ABERTO E O COMANDO DO BANCO FOI COPIADO.
echo PRESSIONE CTRL+V NO CHAT DO LOVABLE E ENVIE.
echo ==================================================
echo.
pause
exit /b 0

:erro_git
echo.
echo ERRO: Nao foi possivel enviar os arquivos ao GitHub.
echo Verifique a internet e o login do GitHub e tente novamente.
echo.
pause
exit /b 1
