@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Atualizar TurboPonto no GitHub

cd /d "%~dp0"

set "REPO_URL=https://github.com/wandersonmonteiro931-byte/turboponto-4d913c22.git"
set "BRANCH=main"

echo ==================================================
echo       ATUALIZACAO AUTOMATICA - TURBOPONTO
echo ==================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERRO: O Git nao esta instalado neste computador.
    echo Instale o Git para Windows e execute este arquivo novamente.
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

if not exist ".git" (
    echo Preparando o projeto para o GitHub...
    git init
    if errorlevel 1 goto :erro
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

git branch -M "%BRANCH%" >nul 2>&1

echo Buscando a versao atual do GitHub...
git fetch origin "%BRANCH%" >nul 2>&1
if not errorlevel 1 (
    rem Mantem os arquivos desta pasta e usa o GitHub apenas como base.
    git reset --mixed "origin/%BRANCH%" >nul 2>&1
)

echo Preparando os arquivos...
git add -A
if errorlevel 1 goto :erro

git diff --cached --quiet
if not errorlevel 1 (
    echo.
    echo Nenhuma alteracao encontrada. O GitHub ja esta atualizado.
    echo.
    pause
    exit /b 0
)

set "DATA_HORA=%date% %time:~0,8%"
echo Criando atualizacao...
git commit -m "Atualizacao automatica - %DATA_HORA%"
if errorlevel 1 goto :erro

echo Enviando para o GitHub...
git push -u origin "%BRANCH%"
if errorlevel 1 (
    echo.
    echo ERRO: Nao foi possivel enviar para o GitHub.
    echo Verifique a internet e faca login no GitHub quando solicitado.
    echo Se o repositorio for privado, sua conta precisa ter acesso.
    echo.
    pause
    exit /b 1
)

echo.
echo ==================================================
echo ATUALIZACAO CONCLUIDA COM SUCESSO!
echo Repositorio: %REPO_URL%
echo ==================================================
echo.
pause
exit /b 0

:erro
echo.
echo ERRO: A atualizacao nao foi concluida.
echo Revise as mensagens acima e tente novamente.
echo.
pause
exit /b 1
