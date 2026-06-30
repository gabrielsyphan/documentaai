import { useState, useEffect, useRef, useCallback } from "react";
// NOTE: webkitSpeechRecognition exists in WKWebView but crashes the native process on macOS
// when triggered without proper entitlements. Mic feature pending Rust/SFSpeechRecognizer impl.
import Database from "@tauri-apps/plugin-sql";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Calendar, Paperclip, X } from "lucide-react";
import type React from "react";

type Status = "idle" | "saving" | "saved" | "error";

interface ImageAttachment {
  id: string;
  dataUrl: string;
}

const WIN = getCurrentWindow();

const IS_MAC = /Mac/.test(navigator.platform);

// Formats today as YYYY-MM-DD in local time
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function makeParagraphBlock(text: string) {
  return {
    id: crypto.randomUUID(),
    type: "paragraph",
    props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
    content: [{ type: "text", text, styles: {} }],
    children: [],
  };
}

function makeImageBlock(url: string) {
  return {
    id: crypto.randomUUID(),
    type: "image",
    props: { url, caption: "", width: 512, textAlignment: "left", backgroundColor: "default" },
    content: [],
    children: [],
  };
}

export default function QuickCaptureApp() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset and focus whenever the window gains focus (shortcut re-opened it)
  useEffect(() => {
    const unlisten = WIN.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        setContent("");
        setStatus("idle");
        setImages([]);
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  const addImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImages(prev => [...prev, { id: crypto.randomUUID(), dataUrl: reader.result as string }]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClose = useCallback(async () => {
    setContent("");
    setStatus("idle");
    setImages([]);
    await invoke("close_quick_capture");
  }, []);

  const handleSave = useCallback(async () => {
    const text = content.trim();
    if (!text && images.length === 0) { await handleClose(); return; }

    setStatus("saving");
    try {
      const db = await Database.load("sqlite:documentaai.db");
      const today = todayISO();

      const rows = await db.select<Array<{ id: string; content: string | null }>>(
        "SELECT id, content FROM pages WHERE type='daily' AND title=?",
        [today]
      );

      const newBlocks: object[] = [];
      if (text) newBlocks.push(makeParagraphBlock(text));
      images.forEach(img => newBlocks.push(makeImageBlock(img.dataUrl)));

      if (rows.length > 0) {
        const existing = rows[0];
        let blocks: object[] = [];
        try { blocks = JSON.parse(existing.content ?? "[]"); } catch { /* ignore */ }
        blocks.push(...newBlocks);
        await db.execute(
          "UPDATE pages SET content=?, updated_at=? WHERE id=?",
          [JSON.stringify(blocks), new Date().toISOString(), existing.id]
        );
      } else {
        const now = new Date().toISOString();
        await db.execute(
          `INSERT INTO pages
             (id, parent_id, title, emoji, content, order_index, is_favorite, type, tags, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), null, today, "📅", JSON.stringify(newBlocks), 0, 0, "daily", "[]", now, now]
        );
      }

      setStatus("saved");
      setTimeout(() => handleClose(), 700);
    } catch (err) {
      console.error("Quick capture error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [content, images, handleClose]);

  // Intercept image paste inside the textarea — text paste falls through normally
  const onTextareaPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItems = Array.from(e.clipboardData.items).filter(i => i.type.startsWith("image/"));
    if (imageItems.length > 0) {
      e.preventDefault();
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (file) addImageFile(file);
      });
    }
  }, [addImageFile]);

  // Drag-and-drop image files onto the window
  const onDragOver = useCallback((e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.items).some(i => i.type.startsWith("image/"))) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, []);
  const onDragLeave = useCallback(() => setIsDragOver(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    Array.from(e.dataTransfer.files)
      .filter(f => f.type.startsWith("image/"))
      .forEach(addImageFile);
  }, [addImageFile]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, handleSave]);

  const btnLabel =
    status === "saving" ? "Salvando…"
    : status === "saved"  ? "Salvo ✓"
    : status === "error"  ? "Erro — tentar de novo"
    : "Salvar";

  return (
    <div
      style={{ ...styles.root, ...(isDragOver ? styles.rootDragOver : {}) }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header — drag para mover a janela */}
      <div
        style={styles.header}
        onMouseDown={(e) => {
          if (e.button === 0) WIN.startDragging();
        }}
      >
        <span style={styles.headerLabel}>Captura Rápida</span>
        <span style={styles.headerHint}>⌘↵ salvar · Esc cancelar</span>
      </div>

      <textarea
        ref={textareaRef}
        autoFocus
        style={styles.textarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={onTextareaPaste}
        placeholder={images.length > 0 ? "Adicione um texto (opcional)…" : "Anote algo rapidamente… ou cole uma imagem com ⌘V"}
        spellCheck
      />

      {/* Image thumbnails strip */}
      {images.length > 0 && (
        <div style={styles.imageStrip}>
          {images.map(img => (
            <div key={img.id} style={styles.thumbWrap}>
              <img src={img.dataUrl} style={styles.thumb} alt="" />
              <button
                style={styles.thumbRemove}
                onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                title="Remover imagem"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.footer}>
        <span style={styles.dest}>
          <Calendar size={12} style={{ marginRight: 5 }} />Daily Note de hoje
        </span>
        <div style={styles.actions}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              Array.from(e.target.files ?? []).forEach(addImageFile);
              e.target.value = "";
            }}
          />
          <button
            style={styles.iconBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Anexar imagem"
          >
            <Paperclip size={13} />
          </button>
          <button style={styles.cancelBtn} onClick={handleClose}>Cancelar</button>
          <button
            style={{ ...styles.saveBtn, opacity: status === "saving" ? 0.7 : 1 }}
            onClick={handleSave}
            disabled={status === "saving" || status === "saved"}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline styles ──────────────────────────────────────────────────────────────

const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    background: "#1c1c1e",
    color: "#e8e8e6",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    overflow: "hidden",
    transition: "outline 0.1s",
    ...(!IS_MAC && {
      borderRadius: "12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
    }),
  },

  rootDragOver: {
    outline: "2px solid #9480f5",
    outlineOffset: "-2px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px 8px",
    background: "#252527",
    borderBottom: "1px solid #333",
    cursor: "default",
    userSelect: "none" as const,
    flexShrink: 0,
  },

  headerLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#a0a0a0",
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
  },

  headerHint: {
    fontSize: 11,
    color: "#555",
    fontFamily: "ui-monospace, monospace",
  },

  textarea: {
    flex: 1,
    width: "100%",
    padding: "14px 16px",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e8e8e6",
    fontSize: 15,
    lineHeight: 1.65,
    resize: "none" as const,
    fontFamily: "inherit",
  },

  imageStrip: {
    display: "flex",
    flexDirection: "row" as const,
    gap: 8,
    padding: "6px 14px 8px",
    overflowX: "auto" as const,
    overflowY: "hidden" as const,
    flexShrink: 0,
    borderTop: "1px solid #2a2a2a",
  },

  thumbWrap: {
    position: "relative" as const,
    flexShrink: 0,
    width: 72,
    height: 72,
    borderRadius: 6,
    overflow: "hidden",
    border: "1px solid #3a3a3a",
    background: "#111",
  },

  thumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  thumbRemove: {
    position: "absolute" as const,
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 4,
    background: "rgba(0,0,0,0.7)",
    border: "none",
    color: "#ccc",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px 10px",
    borderTop: "1px solid #2d2d2d",
    background: "#1c1c1e",
    flexShrink: 0,
  },

  dest: {
    fontSize: 12,
    color: "#666",
    display: "flex",
    alignItems: "center",
  },

  actions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    border: "1px solid #3a3a3a",
    borderRadius: 7,
    background: "transparent",
    color: "#888",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  cancelBtn: {
    padding: "5px 14px",
    border: "1px solid #3a3a3a",
    borderRadius: 7,
    background: "transparent",
    color: "#888",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  saveBtn: {
    padding: "5px 16px",
    border: "none",
    borderRadius: 7,
    background: "#9480f5",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.15s",
  },
} satisfies Record<string, React.CSSProperties>;
