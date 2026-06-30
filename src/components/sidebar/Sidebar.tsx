import { Plus, Sun, Moon, Search, Star, FileText } from "lucide-react";
import { usePagesStore } from "../../store/pages.store";
import { useUIStore } from "../../store/ui.store";
import PageItem from "./PageItem";
import { DragProvider } from "./DragContext";

interface Props {
  onSearch: () => void;
}

export default function Sidebar({ onSearch }: Props) {
  const { pages, tree, createPage, selectPage, selectedPageId } = usePagesStore();
  const { theme, toggleTheme } = useUIStore();
  const favorites = pages.filter((p) => p.is_favorite);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>DocumentaAI</span>
      </div>

      <div className="sidebar-actions">
        <button className="sidebar-new-btn" onClick={onSearch}>
          <Search size={13} />
          Buscar
          <kbd className="sidebar-kbd">⌘K</kbd>
        </button>
        <button className="sidebar-new-btn primary" onClick={() => createPage()}>
          <Plus size={13} />
          Nova página
          <kbd className="sidebar-kbd">⌘N</kbd>
        </button>
      </div>

      {favorites.length > 0 && (
        <>
          <div className="sidebar-section-label">Favoritos</div>
          <div className="favorites-list">
            {favorites.map((page) => (
              <button
                key={page.id}
                className={`favorite-item ${selectedPageId === page.id ? "active" : ""}`}
                onClick={() => selectPage(page.id)}
              >
                <span className="favorite-item-icon">
                  {page.emoji ?? <FileText size={13} />}
                </span>
                <span className="favorite-item-title">{page.title || "Sem título"}</span>
                <Star size={11} className="favorite-star" fill="currentColor" />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="sidebar-section-label">Páginas</div>

      <nav className="page-tree">
        <DragProvider>
          {tree.length === 0 ? (
            <p className="sidebar-empty">Nenhuma página ainda</p>
          ) : (
            tree.map((page) => <PageItem key={page.id} page={page} depth={0} />)
          )}
        </DragProvider>
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme} title="Alternar tema">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </aside>
  );
}
