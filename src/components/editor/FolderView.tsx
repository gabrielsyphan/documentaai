import { Folder, FolderOpen, FileText, PenTool, Plus } from "lucide-react";
import type { Page } from "../../types";
import { usePagesStore } from "../../store/pages.store";

interface Props {
  pageId: string;
}

export default function FolderView({ pageId }: Props) {
  const { pages, updatePage, createPage, selectPage } = usePagesStore();
  const folder = pages.find((p) => p.id === pageId);
  const children = pages
    .filter((p) => p.parent_id === pageId)
    .sort((a, b) => a.order_index - b.order_index);

  if (!folder) return null;

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    updatePage(pageId, { title: e.target.value });
  }

  function handleCreate(type: "document" | "canvas" | "folder") {
    createPage(pageId, { title: type === "folder" ? "Nova pasta" : "Sem título", type });
  }

  function childIcon(child: Page) {
    if (child.emoji) return <span style={{ fontSize: 20 }}>{child.emoji}</span>;
    if (child.type === "canvas") return <PenTool size={20} />;
    if (child.type === "folder") return <Folder size={20} />;
    return <FileText size={20} />;
  }

  function childTypeLabel(type: string) {
    if (type === "canvas") return "Canvas";
    if (type === "folder") return "Pasta";
    return "Documento";
  }

  return (
    <div className="folder-view">
      {/* Título — mesma classe e centralização do editor de documento */}
      <input
        className="page-title-input"
        value={folder.title}
        onChange={handleTitleChange}
        placeholder="Sem título"
      />

      {/* Corpo centralizado com o mesmo max-width do editor */}
      <div className="folder-view-body">
        <div className="folder-view-meta">
          <span className="folder-view-type-icon">
            {children.length > 0 ? <FolderOpen size={15} /> : <Folder size={15} />}
          </span>
          <span className="folder-view-type-label">
            Pasta · {children.length} {children.length === 1 ? "item" : "itens"}
          </span>
        </div>

        <div className="folder-view-actions">
          <button className="folder-create-btn" onClick={() => handleCreate("document")}>
            <Plus size={12} /><FileText size={12} /> Documento
          </button>
          <button className="folder-create-btn" onClick={() => handleCreate("canvas")}>
            <Plus size={12} /><PenTool size={12} /> Canvas
          </button>
          <button className="folder-create-btn" onClick={() => handleCreate("folder")}>
            <Plus size={12} /><Folder size={12} /> Pasta
          </button>
        </div>

        {children.length === 0 ? (
          <div className="folder-empty">
            <Folder size={48} />
            <p>Pasta vazia</p>
            <p className="folder-empty-hint">Crie itens acima ou arraste páginas da sidebar para cá</p>
          </div>
        ) : (
          <div className="folder-children-grid">
            {children.map((child) => (
              <button
                key={child.id}
                className="folder-child-card"
                onClick={() => selectPage(child.id)}
              >
                <span className="folder-child-icon">{childIcon(child)}</span>
                <span className="folder-child-title">{child.title || "Sem título"}</span>
                <span className="folder-child-type">{childTypeLabel(child.type)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
