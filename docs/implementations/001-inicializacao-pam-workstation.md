# 001 - [PAM Workstation]: Inicialização da Estrutura Fisiológica e Contratos PascalCase

**Autor:** Eduardo Nascimento (Havenox)
**Data:** 27/07/2026

---

## 🚀 Desafio de Engenharia
Editores de vídeo e pequenas agências perdem horas valiosas realizando downloads manuais de dezenas de gigabytes de arquivos brutos (RAW) em 4K/8K a partir de links externos de clientes. Essa dinâmica gera colapso de armazenamento local, gargalos de banda de rede e desconexão entre o documento de briefing e a linha do tempo da mídia enviada.

## 🧠 Estratégia da Solução
Foi arquitetado o módulo **Media 8 | Workstation**, uma solução PAM (Production Asset Management) leve e desacoplada. O sistema recebe os links externos via API .NET 10, realiza o download e a transcodificação assíncrona para duas camadas otimizadas (*High Fidelity* H.265 e *Proxy Web* 720p) através do padrão `Database-as-a-Queue` (`SKIP LOCKED` no PostgreSQL), e realiza a purga imediata do arquivo RAW original. Para a pré-edição no navegador, foi criada uma SPA em React + Vite com player broadcast frame-accurate por Timecode (`HH:MM:SS:FF`), visualizador de áudio Waveform em Canvas 2D e marcadores de sub-clips.

## 🛠️ Implementação Técnica
- **Convenção de Pastas por Escopo (`media8-NOME`):**
  - Backend segregado em `media8-api/`
  - Frontend SPA segregado em `media8-web/`
  - Workers segregados em `media8-workers/`
  - Suíte de testes segregada em `media8-tests/`
- **Backend (.NET 10 & C# 13):**
  - Configuração do serializador JSON nativo em PascalCase estrito (`PropertyNamingPolicy = null`).
  - Implementação de Clean Architecture (`Domain`, `Application`, `Infrastructure`, `Api`, `Workers`) com C# 13 Primary Constructors.
  - SignalR Hub (`NotificationHub.cs`) para transmissão em tempo real de status de ingestão.
  - Suíte de testes unitários xUnit em `media8-tests/Media8.Workstation.UnitTests`.
- **Fila & Transcodificação (Workers):**
  - Consulta atômica com `SELECT ... FOR UPDATE SKIP LOCKED` no PostgreSQL sem dependência de RabbitMQ/Redis.
  - Orquestração de FFmpeg para geração dual-layer e extração de Waveform JSON.
- **Frontend SPA (React + Vite + Tailwind):**
  - Tipagens TypeScript espelhando 100% os contratos PascalCase da API (`OrderId`, `BriefingText`, `AssetId`).
  - Design System em Vinho Profundo (`#400404`) e Creme Suave (`#FFFBED`).
  - Player Broadcast com atalhos de teclado `J/K/L`, `I/O` e navegação frame a frame.

## 🎯 Impacto e Resultado
* **Eliminação de Dados Mockados**: 100% dos dados trafegados e exibidos são consultados e persistidos no banco de dados PostgreSQL.
* **Otimização de Armazenamento**: Purga do RAW reduz o consumo de disco do servidor em até 85% por projeto.
* **Padronização de Repositório**: Nomenclatura de diretórios uniformizada com o prefixo `media8-NOME`.

---
**Nota do Desenvolvedor:** *A escolha de utilizar a mecânica `SKIP LOCKED` do PostgreSQL em vez de adicionar brokers externos como RabbitMQ na V1 garantiu uma infraestrutura extremamente enxunta e resiliente, permitindo escalar Workers .NET 10 em containers independentes com zero colisão de tarefas.*
