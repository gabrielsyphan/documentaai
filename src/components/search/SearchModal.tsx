import { useEffect, useRef, useState } from "react";
import { Search, FileText } from "lucide-react";
import { usePagesStore } from "../../store/pages.store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const { pages, selectPage } = usePagesStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // ⌘K ou Esc fecham o modal
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = query.trim()
    ? pages.filter((p) =>
        (p.title || "Sem título").toLowerCase().includes(query.toLowerCase())
      )
    : pages.slice(0, 10);

  function handleSelect(id: string) {
    selectPage(id);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        className="search-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Buscar páginas"
      >
        <div className="search-input-row">
          <Search size={15} className="search-icon" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Buscar páginas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="search-kbd">Esc</kbd>
        </div>

        <div className="search-results">
          {results.length === 0 ? (
            <p className="search-empty">Nenhuma página encontrada</p>
          ) : (
            results.map((page) => (
              <button
                key={page.id}
                className="search-result-item"
                onClick={() => handleSelect(page.id)}
              >
                <FileText size={14} />
                <span>{page.title || "Sem título"}</span>
              </button>
            ))
          )}
        </div>

        {!query && pages.length > 0 && (
          <div className="search-hint">Todas as páginas</div>
        )}
      </div>
    </div>
  );
}
