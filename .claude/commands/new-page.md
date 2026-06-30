# new-page

Adiciona uma nova feature ou componente ao DocumentaAI.

Ao receber este comando, pergunte ao usuário:
- O que deve ser adicionado (componente, feature, correção)?
- Algum contexto extra?

Depois leia o CLAUDE.md para entender a arquitetura atual e implemente seguindo os padrões do projeto:
- Componentes em `src/components/`
- Lógica de estado em `src/store/`
- Acesso ao banco em `src/lib/db.ts`
- Comandos Tauri (Rust) em `src-tauri/src/commands.rs`

Sempre que adicionar um comando Rust novo, lembre de registrá-lo no `main.rs`.
