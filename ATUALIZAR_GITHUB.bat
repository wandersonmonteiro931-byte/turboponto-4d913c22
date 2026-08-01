@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Atualizar TurboPonto no GitHub

cd /d "%~dp0"

set "REPO_URL=https://github.com/wandersonmonteiro931-byte/turboponto-4d913c22.git"
set "BRANCH=main"

echo ==================================================
echo        ATUALIZACAO AUTOMATICA - TURBOPONTO
echo                      GITHUB
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

echo [1/2] Preparando os arquivos...
git fetch origin "%BRANCH%"
if not errorlevel 1 git reset --mixed "origin/%BRANCH%" >nul 2>&1

git branch -M "%BRANCH%" >nul 2>&1
git add -A
if errorlevel 1 goto :erro_git

echo [2/2] Enviando para o GitHub...
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
echo ==================================================
echo ATUALIZACAO CONCLUIDA COM SUCESSO.
echo O LOVABLE RECEBERA A ALTERACAO PELO GITHUB.
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
