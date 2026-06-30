import { useCallback, useEffect, useState } from "react";
import { FileText, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import { usePagesStore } from "../../store/pages.store";
import { useUIStore } from "../../store/ui.store";
import Sidebar from "../sidebar/Sidebar";
import Editor from "../editor/Editor";
import CanvasEditor from "../editor/CanvasEditor";
import FolderView from "../editor/FolderView";
import SearchModal from "../search/SearchModal";
import TemplateGallery from "../templates/TemplateGallery";
import UpdateBanner from "./UpdateBanner";

const IS_MAC = /Mac/.test(navigator.platform);
const QUICK_CAPTURE_SHORTCUT = IS_MAC ? "⌘⇧Space" : "Ctrl+Shift+Space";

export default function AppShell() {
  const { selectedPageId, pages, createPage, navBack, navForward, navHistory, navIndex } = usePagesStore();
  const canGoBack = navIndex > 0;
  const canGoForward = navIndex < navHistory.length - 1;
  const { focusMode, toggleFocusMode } = useUIStore();
  const selectedPage = pages.find((p) => p.id === selectedPageId);
  const [searchOpen, setSearchOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K → busca
      if (mod && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }

      // ⌘N → nova página
      if (mod && e.key === "n") {
        e.preventDefault();
        createPage();
        return;
      }

      // ⌘⇧F → modo foco
      if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFocusMode();
        return;
      }

      // ⌘[ → voltar, ⌘] → avançar
      if (mod && e.key === "[") { e.preventDefault(); navBack(); return; }
      if (mod && e.key === "]") { e.preventDefault(); navForward(); return; }

      // Escape → sair do modo foco
      if (e.key === "Escape" && focusMode) {
        toggleFocusMode();
        return;
      }
    },
    [createPage, focusMode, toggleFocusMode, navBack, navForward]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`app-shell${focusMode ? " focus-mode" : ""}`}>
      {!focusMode && (
        <Sidebar onSearch={() => setSearchOpen(true)} onTemplates={() => setTemplatesOpen(true)} />
      )}

      <main className="editor-area">
        {focusMode && (
          <button
            className="focus-exit-btn"
            onClick={toggleFocusMode}
            title="Sair do modo foco (Esc)"
          >
            <Minimize2 size={13} />
          </button>
        )}

        {(canGoBack || canGoForward) && (
          <div className="nav-history-btns">
            <button
              className="nav-history-btn"
              onClick={navBack}
              disabled={!canGoBack}
              title="Voltar (⌘[)"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="nav-history-btn"
              onClick={navForward}
              disabled={!canGoForward}
              title="Avançar (⌘])"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {selectedPageId && selectedPage?.type === "canvas" ? (
          <CanvasEditor key={selectedPageId} pageId={selectedPageId} />
        ) : selectedPageId && selectedPage?.type === "folder" ? (
          <FolderView key={selectedPageId} pageId={selectedPageId} />
        ) : selectedPageId ? (
          <Editor key={selectedPageId} pageId={selectedPageId} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={22} />
            </div>
            <p>Selecione ou crie uma página</p>
            <p className="empty-hint">⌘N nova página · ⌘K buscar</p>
          </div>
        )}
      </main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TemplateGallery open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      <UpdateBanner />
    </div>
  );
}
