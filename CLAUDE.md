# DocumentaAI — CLAUDE.md

Ferramenta de documentação pessoal estilo Notion, desktop-first, com planejamento de sync futuro para mobile/web.

## Stack

| Camada | Tecnologia |
|---|---|
| Desktop runtime | Tauri v2 (Rust) |
| Frontend | React 19 + TypeScript + Vite |
| Editor | BlockNote (editor bloco estilo Notion) |
| Styling | Tailwind CSS v4 |
| Estado | Zustand |
| Storage local | SQLite via `tauri-plugin-sql` |
| Ícones | Lucide React |

## Estrutura de pastas

```
documentaai/
├── src/                        # Frontend React
│   ├── components/
│   │   ├── editor/             # BlockNote + extensões
│   │   ├── sidebar/            # Árvore de páginas
│   │   ├── layout/             # Shell do app (AppShell, titlebar)
│   │   └── ui/                 # Componentes base reutilizáveis
│   ├── store/                  # Estado global Zustand
│   │   ├── pages.store.ts      # Árvore de páginas
│   │   └── ui.store.ts         # Sidebar aberta, tema, etc
│   ├── hooks/                  # Custom hooks React
│   ├── lib/
│   │   └── db.ts               # Camada de acesso ao SQLite
│   ├── types/
│   │   └── index.ts            # Tipos compartilhados
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                  # Backend Rust (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   └── commands.rs         # Comandos Tauri expostos ao frontend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
├── public/
├── .claude/
│   └── commands/               # Skills deste projeto
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Modelo de dados (SQLite)

```sql
CREATE TABLE pages (
  id          TEXT PRIMARY KEY,       -- UUID
  parent_id   TEXT REFERENCES pages(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Sem título',
  emoji       TEXT,
  content     TEXT,                   -- JSON BlockNote blocks
  order_index REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

Não há tabela separada de blocos — o conteúdo do BlockNote é salvo como JSON na coluna `content` da página.

## Comandos de desenvolvimento

```bash
# Instalar dependências (após setup inicial)
npm install

# Desenvolvimento (abre o app Tauri em modo dev)
npm run tauri dev

# Build para produção
npm run tauri build

# Somente frontend (sem Tauri, para testar no browser)
npm run dev
```

## Pré-requisitos do ambiente

- Node.js >= 18 (instalado: v25.2.1)
- Rust + Cargo (via rustup) — **ainda não instalado**
- Tauri CLI v2 (`cargo install tauri-cli`)
- Em macOS: Xcode Command Line Tools (`xcode-select --install`)

## Arquitetura de comunicação Frontend ↔ Tauri

O React chama comandos Rust via `invoke()`:

```typescript
import { invoke } from '@tauri-apps/api/core';

// Exemplo
const pages = await invoke<Page[]>('get_pages');
await invoke('save_page', { page });
```

Os comandos Rust ficam em `src-tauri/src/commands.rs` e são registrados no `main.rs`.

## Decisões de arquitetura

- **Conteúdo como JSON**: O BlockNote serializa blocos em JSON. Guardamos isso direto no SQLite. Simples e sem overhead.
- **IDs como UUID**: Facilita sync futuro — IDs não dependem de auto-increment do banco.
- **Zustand para estado**: Leve, sem boilerplate (Redux seria overkill aqui).
- **Tauri v2**: API mais limpa que v1, melhor modelo de permissões (capabilities).
- **Sem ORM**: Queries SQL diretas via `tauri-plugin-sql` — o schema é simples demais pra justificar ORM.

## Roadmap

### Fase 1 — MVP Desktop ✅ concluída
- [x] Setup do projeto (Tauri + React + Vite + Tailwind)
- [x] Layout base: sidebar + área de edição
- [x] CRUD de páginas (criar, renomear, deletar)
- [x] Hierarquia de páginas (subpáginas estilo Notion)
- [x] Editor BlockNote funcional (com syntax highlighting via Shiki)
- [x] Persistência SQLite
- [x] Tema claro/escuro

### Fase 2 — Qualidade de vida (atual)
- [x] Busca por páginas (⌘K)
- [x] Atalhos de teclado (⌘N, ⌘K)
- [ ] Drag-and-drop para reordenar páginas
- [ ] Favoritos/estrelas

### Fase 3 — Sync (futuro)
- [ ] Backend (Fastify ou Hono + PostgreSQL)
- [ ] Auth (Clerk ou similar)
- [ ] Sync em tempo real
- [ ] App mobile (React Native ou PWA)

## Contexto para novas conversas

O usuário não domina Tauri nem React — explique conceitos novos brevemente ao introduzi-los. Prefira código completo a fragmentos. Sempre considere que o app deve funcionar offline-first e que haverá sync futuro.
