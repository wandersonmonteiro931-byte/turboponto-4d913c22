# Turbo Ponto Hub

Crie um aplicativo web chamado “Turbo Ponto” para a empresa Turbo Lanches.



O sistema será usado para controle de ponto online, funcionários, jornada de trabalho, benefícios e holerites.



Nesta primeira etapa, crie apenas a estrutura base do sistema, autenticação, layout principal e separação entre área da empresa e área do funcionário.



IDENTIDADE DO SISTEMA



Nome do sistema: Turbo Ponto

Empresa: Turbo Lanches

Segmento: hamburgueria e pizzaria

Cores principais:

- Preto

- Amarelo

- Branco

- Cinza claro



O visual deve ser moderno, profissional, simples e fácil de usar no celular, tablet e computador.



PERFIS DE USUÁRIO



Criar 3 perfis:



1. Administrador / Empresa

- Acesso completo ao sistema

- Pode cadastrar empresa

- Pode cadastrar funcionários

- Pode controlar ponto

- Pode editar ponto

- Pode fechar mês

- Pode controlar benefícios

- Pode liberar holerite



2. Gerente

- Pode visualizar funcionários

- Pode visualizar registros de ponto

- Pode corrigir ponto com justificativa

- Não pode alterar dados principais da empresa

- Não pode excluir dados importantes



3. Funcionário

- Pode bater ponto

- Pode ver seus próprios registros

- Pode ver seu cartão de ponto

- Pode ver seus benefícios

- Pode ver holerites liberados

- Não pode editar ponto

- Não pode ver dados de outros funcionários



TELAS INICIAIS



Criar as seguintes telas:



1. Tela de login

- Campo de e-mail, CPF ou usuário

- Campo de senha

- Botão Entrar

- Link “Esqueci minha senha”

- Visual profissional com marca Turbo Ponto



2. Tela inicial da empresa

Dashboard administrativo com cards:

- Total de funcionários

- Funcionários ativos

- Funcionários que bateram ponto hoje

- Funcionários ausentes hoje

- Pendências de ponto

- Mês atual em aberto



3. Tela inicial do funcionário

Painel simples com:

- Nome do funcionário

- Data atual

- Hora atual

- Próximo ponto a registrar

- Botão “Bater Ponto”

- Registros do dia

- Atalhos para Cartão de Ponto, Benefícios e Holerite



MENU DA ÁREA DA EMPRESA



Criar menu lateral com:

- Dashboard

- Empresa

- Funcionários

- Jornadas

- Registros de Ponto

- Cartão de Ponto

- Fechamento Mensal

- Benefícios

- Holerites

- Relatórios

- Configurações



MENU DA ÁREA DO FUNCIONÁRIO



Criar menu simples com:

- Início

- Bater Ponto

- Meus Registros

- Cartão de Ponto

- Meus Benefícios

- Holerites

- Avisos

- Meu Perfil



BANCO DE DADOS INICIAL



Criar tabelas básicas:



empresas:

- id

- nome_fantasia

- razao_social

- cnpj

- telefone

- email

- endereco

- logo_url

- responsavel

- created_at

- updated_at



usuarios:

- id

- empresa_id

- nome

- email

- cpf

- senha_hash

- perfil

- status

- created_at

- updated_at



funcionarios:

- id

- empresa_id

- usuario_id

- nome

- cpf

- rg

- data_nascimento

- telefone

- email

- endereco

- cargo

- salario

- data_admissao

- status

- foto_url

- created_at

- updated_at



REQUISITOS DE SEGURANÇA



- Login seguro

- Senhas criptografadas

- Separar dados por empresa

- Funcionário só pode ver os próprios dados

- Administrador vê todos os dados da empresa

- Gerente tem permissão limitada

- Criar controle de permissões por perfil



IMPORTANTE



Nesta etapa, não implemente ainda cálculo de ponto, benefícios, holerite ou relatórios avançados. Apenas crie a base sólida do sistema, login, layout, perfis, menus e banco inicial.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://turboponto.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b4f6b092-2e46-440d-a020-7e18d929f17f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
