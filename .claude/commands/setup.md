# setup

Configura o ambiente de desenvolvimento do DocumentaAI do zero.

Verifique o estado atual e guie o usuário pelos passos necessários:

1. Checar se Rust está instalado (`rustc --version`). Se não, instruir a instalar via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` e reiniciar o terminal.

2. Checar se o projeto Tauri foi criado (`ls src-tauri/`). Se não, rodar:
   ```bash
   npm create tauri-app@latest . -- --template react-ts --manager npm --yes
   ```

3. Instalar dependências adicionais:
   ```bash
   npm install @blocknote/react @blocknote/mantine zustand lucide-react
   npm install -D tailwindcss @tailwindcss/vite
   ```

4. Adicionar plugin SQLite ao Tauri:
   ```bash
   npm run tauri add sql
   ```

5. Verificar que `npm run tauri dev` funciona.

Reporte cada passo ao usuário e pare se encontrar erro para investigar antes de continuar.
