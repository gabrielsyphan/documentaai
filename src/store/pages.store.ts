import { create } from "zustand";
import type { Page, PageWithChildren } from "../types";
import { fetchAllPages, upsertPage, removePage } from "../lib/db";

function buildTree(pages: Page[]): PageWithChildren[] {
  const sorted = [...pages].sort((a, b) => a.order_index - b.order_index);
  const map = new Map<string, PageWithChildren>();
  const roots: PageWithChildren[] = [];

  sorted.forEach((p) => map.set(p.id, { ...p, children: [] }));
  sorted.forEach((p) => {
    const node = map.get(p.id)!;
    if (p.parent_id && map.has(p.parent_id)) {
      map.get(p.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

interface PagesState {
  pages: Page[];
  tree: PageWithChildren[];
  selectedPageId: string | null;
  loading: boolean;
  load: () => Promise<void>;
  createPage: (parentId?: string) => Promise<Page>;
  updatePage: (id: string, updates: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  movePage: (draggedId: string, targetId: string, position: "before" | "after") => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  selectPage: (id: string | null) => void;
}

export const usePagesStore = create<PagesState>((set, get) => ({
  pages: [],
  tree: [],
  selectedPageId: null,
  loading: false,

  load: async () => {
    set({ loading: true });
    const pages = await fetchAllPages();
    set({ pages, tree: buildTree(pages), loading: false });
  },

  createPage: async (parentId) => {
    const now = new Date().toISOString();
    const page: Page = {
      id: crypto.randomUUID(),
      parent_id: parentId ?? null,
      title: "Sem título",
      emoji: null,
      content: null,
      order_index: Date.now(),
      is_favorite: 0,
      created_at: now,
      updated_at: now,
    };
    await upsertPage(page);
    const pages = [...get().pages, page];
    set({ pages, tree: buildTree(pages), selectedPageId: page.id });
    return page;
  },

  updatePage: async (id, updates) => {
    const pages = get().pages.map((p) =>
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    const updated = pages.find((p) => p.id === id)!;
    await upsertPage(updated);
    set({ pages, tree: buildTree(pages) });
  },

  deletePage: async (id) => {
    await removePage(id);
    const pages = get().pages.filter((p) => p.id !== id);
    const { selectedPageId } = get();
    set({
      pages,
      tree: buildTree(pages),
      selectedPageId: selectedPageId === id ? null : selectedPageId,
    });
  },

  movePage: async (draggedId, targetId, position) => {
    const { pages } = get();
    const dragged = pages.find((p) => p.id === draggedId)!;
    const target = pages.find((p) => p.id === targetId)!;

    const siblings = pages
      .filter((p) => p.parent_id === target.parent_id && p.id !== draggedId)
      .sort((a, b) => a.order_index - b.order_index);

    const targetIdx = siblings.findIndex((p) => p.id === targetId);

    let newIndex: number;
    if (position === "before") {
      const prev = siblings[targetIdx - 1];
      newIndex = prev ? (prev.order_index + target.order_index) / 2 : target.order_index - 1;
    } else {
      const next = siblings[targetIdx + 1];
      newIndex = next ? (target.order_index + next.order_index) / 2 : target.order_index + 1;
    }

    const updated = { ...dragged, parent_id: target.parent_id, order_index: newIndex };
    await upsertPage(updated);
    const newPages = pages.map((p) => (p.id === draggedId ? updated : p));
    set({ pages: newPages, tree: buildTree(newPages) });
  },

  toggleFavorite: async (id) => {
    const { pages } = get();
    const page = pages.find((p) => p.id === id)!;
    const updated = { ...page, is_favorite: page.is_favorite ? 0 : 1 };
    await upsertPage(updated);
    const newPages = pages.map((p) => (p.id === id ? updated : p));
    set({ pages: newPages, tree: buildTree(newPages) });
  },

  selectPage: (id) => set({ selectedPageId: id }),
}));
