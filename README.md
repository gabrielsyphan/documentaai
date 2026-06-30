# DocumentaAI

Ferramenta de documentação pessoal estilo Notion, feita para uso desktop com armazenamento local. Leve, offline-first e sem assinatura.

## Funcionalidades

- Editor de blocos estilo Notion (textos, títulos, listas, tabelas, código, etc.)
- Hierarquia de páginas com subpáginas ilimitadas
- Auto-save automático (500ms após última edição)
- Armazenamento local em SQLite — seus dados ficam na sua máquina
- Tema claro e escuro
- Criar, renomear e deletar páginas

## Tech stack

| Camada | Tecnologia |
|---|---|
| Desktop | [Tauri v2](https://tauri.app) (Rust) |
| Frontend | React 19 + TypeScript + Vite |
| Editor | [BlockNote](https://www.blocknotejs.org) |
| Estilo | Tailwind CSS v4 |
| Estado | Zustand |
| Banco de dados | SQLite via tauri-plugin-sql |

## Pré-requisitos

- **Node.js** >= 18 — [nodejs.org](https://nodejs.org)
- **Rust** — instale via [rustup.rs](https://rustup.rs):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```
- **Xcode Command Line Tools** (macOS):
  ```bash
  xcode-select --install
  ```

## Instalação

```bash
# 1. Clone ou baixe o projeto
cd documentaai

# 2. Instale as dependências JavaScript
npm install

# 3. Adicione o Rust ao PATH (se recém instalado)
source "$HOME/.cargo/env"
```

## Rodando em modo desenvolvimento

```bash
npm run tauri dev
```

Na primeira vez, o Cargo vai compilar o backend Rust — isso demora alguns minutos. As execuções seguintes são muito mais rápidas graças ao cache incremental.

## Build para produção

```bash
npm run tauri build
```

O instalador é gerado em `src-tauri/target/release/bundle/`.

## Estrutura do projeto

```
documentaai/
├── src/                    # Frontend React
│   ├── components/
│   │   ├── editor/         # Editor BlockNote
│   │   ├── sidebar/        # Árvore de páginas
│   │   └── layout/         # Shell do app
│   ├── store/              # Estado global (Zustand)
│   ├── lib/db.ts           # Camada SQLite
│   └── types/              # Tipos TypeScript
├── src-tauri/              # Backend Rust (Tauri)
│   ├── src/
│   ├── Cargo.toml
│   └── tauri.conf.json
└── CLAUDE.md               # Contexto para desenvolvimento com IA
```

## Dados locais

O banco SQLite é salvo automaticamente em:

| Sistema | Caminho |
|---|---|
| macOS | `~/Library/Application Support/com.documentaai.app/documentaai.db` |
| Linux | `~/.local/share/com.documentaai.app/documentaai.db` |
| Windows | `%APPDATA%\com.documentaai.app\documentaai.db` |
