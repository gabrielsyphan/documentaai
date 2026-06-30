import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { createHighlighter } from "shiki";
import type { CodeBlockOptions } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import { usePagesStore } from "../../store/pages.store";
import { useUIStore } from "../../store/ui.store";

interface Props {
  pageId: string;
}

const SUPPORTED_LANGUAGES: CodeBlockOptions["supportedLanguages"] = {
  text:       { name: "Texto" },
  javascript: { name: "JavaScript", aliases: ["js"] },
  typescript: { name: "TypeScript", aliases: ["ts"] },
  jsx:        { name: "JSX" },
  tsx:        { name: "TSX" },
  python:     { name: "Python",     aliases: ["py"] },
  rust:       { name: "Rust",       aliases: ["rs"] },
  go:         { name: "Go" },
  java:       { name: "Java" },
  kotlin:     { name: "Kotlin",     aliases: ["kt"] },
  c:          { name: "C" },
  cpp:        { name: "C++",        aliases: ["c++"] },
  html:       { name: "HTML" },
  css:        { name: "CSS" },
  json:       { name: "JSON" },
  yaml:       { name: "YAML",       aliases: ["yml"] },
  toml:       { name: "TOML" },
  bash:       { name: "Bash",       aliases: ["sh", "shell"] },
  sql:        { name: "SQL" },
  markdown:   { name: "Markdown",   aliases: ["md"] },
};

const SHIKI_LANGS = Object.keys(SUPPORTED_LANGUAGES).filter((l) => l !== "text");

// Shiki v4 e @blocknote/core usam versões diferentes de @shikijs/types;
// o cast é seguro pois a interface é estruturalmente compatível em runtime.
const makeHighlighter: CodeBlockOptions["createHighlighter"] = () =>
  createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: SHIKI_LANGS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

export default function Editor({ pageId }: Props) {
  const { pages, updatePage } = usePagesStore();
  const { theme } = useUIStore();
  const page = pages.find((p) => p.id === pageId);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const initialContent = (() => {
    if (!page?.content) return undefined;
    try {
      return JSON.parse(page.content);
    } catch {
      return undefined;
    }
  })();

  const editor = useCreateBlockNote({
    initialContent,
    codeBlock: {
      defaultLanguage: "text",
      supportedLanguages: SUPPORTED_LANGUAGES,
      createHighlighter: makeHighlighter,
    },
  });

  useEffect(() => {
    const unsubscribe = editor.onChange(() => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updatePage(pageId, { content: JSON.stringify(editor.document) });
      }, 500);
    });

    return () => {
      unsubscribe?.();
      clearTimeout(saveTimer.current);
    };
  }, [editor, pageId]);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    updatePage(pageId, { title: e.target.value });
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      editor.focus();
    }
  }

  return (
    <div className="editor-container">
      <input
        className="page-title-input"
        value={page?.title ?? ""}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder="Sem título"
        autoFocus={!page?.title}
      />
      <BlockNoteView editor={editor} theme={theme} />
    </div>
  );
}
