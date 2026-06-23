import { create } from 'zustand';
import type {
  CanvasElement,
  ElementType,
  ElementProps,
  ElementInput,
  ScreenGroup,
  PaletteItem,
} from '@wowboard/shared';
import type { ProjectDetail, ScreenWithElements } from '../api/client';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const HISTORY_LIMIT = 50;

interface EditorState {
  projectId: string | null;
  title: string;
  shareToken: string | null;
  defaultWidth: number;
  defaultHeight: number;
  screens: ScreenWithElements[];
  groups: ScreenGroup[];
  activeScreenId: string | null;
  selectedId: string | null;
  saveStatus: SaveStatus;
  /** Bumped on any element mutation; watched by autosave. */
  revision: number;
  /** Undo/redo snapshots of the screens tree. */
  past: ScreenWithElements[][];
  future: ScreenWithElements[][];
  clipboard: CanvasElement | null;

  init: (project: ProjectDetail) => void;
  setTitle: (title: string) => void;
  setShareToken: (token: string | null) => void;
  setActiveScreen: (id: string) => void;
  select: (id: string | null) => void;
  setSaveStatus: (s: SaveStatus) => void;

  addElement: (item: PaletteItem, x: number, y: number) => void;
  addElements: (items: ElementInput[]) => void;
  replaceElements: (items: ElementInput[]) => void;
  patchElementGeom: (
    id: string,
    geom: Partial<Pick<CanvasElement, 'x' | 'y' | 'width' | 'height'>>,
  ) => void;
  patchElementProps: (id: string, props: Partial<ElementProps>) => void;
  removeSelected: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  copySelected: () => void;
  paste: () => void;
  undo: () => void;
  redo: () => void;

  addScreen: (screen: ScreenWithElements) => void;
  removeScreen: (id: string) => void;
  renameScreen: (id: string, name: string) => void;
  setScreenSize: (id: string, size: { width?: number; height?: number }) => void;
  moveScreen: (dragId: string, overId: string) => void;

  // groups
  addGroup: (group: ScreenGroup) => void;
  renameGroup: (id: string, name: string) => void;
  removeGroup: (id: string) => void;
  moveGroup: (dragId: string, overId: string | null) => void;
  setScreenGroup: (screenId: string, groupId: string | null, order: number) => void;

  activeScreen: () => ScreenWithElements | undefined;
}

function newId(): string {
  // crypto.randomUUID() only exists in secure contexts (HTTPS/localhost).
  // The app is also served over plain HTTP (e.g. http://dev.brainsp.com:7100),
  // so fall back to getRandomValues, then Math.random, to stay functional.
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0'));
    return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`;
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneScreens(screens: ScreenWithElements[]): ScreenWithElements[] {
  return screens.map((s) => ({
    ...s,
    elements: s.elements.map((e) => ({ ...e, props: { ...e.props } })),
  }));
}

export const useEditor = create<EditorState>((set, get) => {
  /** Snapshot current screens onto the undo stack (clears redo). */
  function record() {
    const { screens, past } = get();
    const next = [...past, cloneScreens(screens)];
    if (next.length > HISTORY_LIMIT) next.shift();
    set({ past: next, future: [] });
  }

  /** Map elements of the active screen, recording history + bumping revision. */
  function mutateActive(
    map: (elements: CanvasElement[]) => CanvasElement[],
    extra: Partial<EditorState> = {},
  ) {
    record();
    set((st) => ({
      screens: st.screens.map((s) =>
        s.id === st.activeScreenId ? { ...s, elements: map(s.elements) } : s,
      ),
      revision: st.revision + 1,
      ...extra,
    }));
  }

  return {
    projectId: null,
    title: '',
    shareToken: null,
    defaultWidth: 390,
    defaultHeight: 844,
    screens: [],
    groups: [],
    activeScreenId: null,
    selectedId: null,
    saveStatus: 'idle',
    revision: 0,
    past: [],
    future: [],
    clipboard: null,

    init: (project) =>
      set({
        projectId: project.id,
        title: project.title,
        shareToken: project.shareToken ?? null,
        defaultWidth: project.defaultWidth ?? 390,
        defaultHeight: project.defaultHeight ?? 844,
        screens: (project.screens ?? []) as ScreenWithElements[],
        groups: project.groups ?? [],
        activeScreenId: project.screens?.[0]?.id ?? null,
        selectedId: null,
        saveStatus: 'idle',
        revision: 0,
        past: [],
        future: [],
        clipboard: null,
      }),

    setTitle: (title) => set({ title }),
    setShareToken: (token) => set({ shareToken: token }),
    setActiveScreen: (id) => set({ activeScreenId: id, selectedId: null }),
    select: (id) => set({ selectedId: id }),
    setSaveStatus: (s) => set({ saveStatus: s }),

    addElement: (item, x, y) => {
      const screen = get().activeScreen();
      if (!screen) return;
      const maxZ = Math.max(0, ...screen.elements.map((e) => e.zIndex), 0);
      const el: CanvasElement = {
        id: newId(),
        type: item.type as ElementType,
        x: Math.round(x),
        y: Math.round(y),
        width: item.defaultWidth,
        height: item.defaultHeight,
        zIndex: maxZ + 1,
        props: { ...item.defaultProps },
      };
      mutateActive((els) => [...els, el], { selectedId: el.id });
    },

    addElements: (items) => {
      const screen = get().activeScreen();
      if (!screen || items.length === 0) return;
      const baseZ = Math.max(0, ...screen.elements.map((e) => e.zIndex), 0);
      const created: CanvasElement[] = items.map((it, i) => ({
        id: newId(),
        type: it.type as ElementType,
        x: Math.round(it.x),
        y: Math.round(it.y),
        width: it.width,
        height: it.height,
        zIndex: baseZ + i + 1,
        props: { ...it.props },
      }));
      mutateActive((els) => [...els, ...created], { selectedId: null });
    },

    replaceElements: (items) => {
      const screen = get().activeScreen();
      if (!screen) return;
      const created: CanvasElement[] = items.map((it, i) => ({
        id: newId(),
        type: it.type as ElementType,
        x: Math.round(it.x),
        y: Math.round(it.y),
        width: it.width,
        height: it.height,
        zIndex: it.zIndex ?? i + 1,
        props: { ...it.props },
      }));
      mutateActive(() => created, { selectedId: null });
    },

    patchElementGeom: (id, geom) =>
      mutateActive((els) => els.map((e) => (e.id === id ? { ...e, ...geom } : e))),

    patchElementProps: (id, props) =>
      mutateActive((els) =>
        els.map((e) => (e.id === id ? { ...e, props: { ...e.props, ...props } } : e)),
      ),

    removeSelected: () => {
      const { selectedId } = get();
      if (!selectedId) return;
      mutateActive((els) => els.filter((e) => e.id !== selectedId), {
        selectedId: null,
      });
    },

    bringToFront: (id) => {
      const screen = get().activeScreen();
      if (!screen) return;
      const maxZ = Math.max(0, ...screen.elements.map((e) => e.zIndex), 0);
      mutateActive((els) =>
        els.map((e) => (e.id === id ? { ...e, zIndex: maxZ + 1 } : e)),
      );
    },

    sendToBack: (id) => {
      const screen = get().activeScreen();
      if (!screen) return;
      const minZ = Math.min(0, ...screen.elements.map((e) => e.zIndex), 0);
      mutateActive((els) =>
        els.map((e) => (e.id === id ? { ...e, zIndex: minZ - 1 } : e)),
      );
    },

    copySelected: () => {
      const { selectedId } = get();
      const el = get().activeScreen()?.elements.find((e) => e.id === selectedId);
      if (el) set({ clipboard: { ...el, props: { ...el.props } } });
    },

    paste: () => {
      const { clipboard } = get();
      const screen = get().activeScreen();
      if (!clipboard || !screen) return;
      const maxZ = Math.max(0, ...screen.elements.map((e) => e.zIndex), 0);
      const el: CanvasElement = {
        ...clipboard,
        id: newId(),
        x: clipboard.x + 16,
        y: clipboard.y + 16,
        zIndex: maxZ + 1,
        props: { ...clipboard.props },
      };
      mutateActive((els) => [...els, el], { selectedId: el.id });
    },

    undo: () => {
      const { past, future, screens } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        screens: previous,
        past: past.slice(0, -1),
        future: [...future, cloneScreens(screens)],
        selectedId: null,
        revision: get().revision + 1,
      });
    },

    redo: () => {
      const { past, future, screens } = get();
      if (future.length === 0) return;
      const next = future[future.length - 1];
      set({
        screens: next,
        future: future.slice(0, -1),
        past: [...past, cloneScreens(screens)],
        selectedId: null,
        revision: get().revision + 1,
      });
    },

    addScreen: (screen) =>
      set((st) => ({
        screens: [...st.screens, screen],
        activeScreenId: screen.id,
        selectedId: null,
      })),

    removeScreen: (id) =>
      set((st) => {
        const remaining = st.screens.filter((s) => s.id !== id);
        return {
          screens: remaining,
          activeScreenId:
            st.activeScreenId === id ? remaining[0]?.id ?? null : st.activeScreenId,
          selectedId: null,
        };
      }),

    renameScreen: (id, name) =>
      set((st) => ({
        screens: st.screens.map((s) => (s.id === id ? { ...s, name } : s)),
      })),

    setScreenSize: (id, size) =>
      set((st) => ({
        screens: st.screens.map((s) => (s.id === id ? { ...s, ...size } : s)),
      })),

    moveScreen: (dragId, overId) =>
      set((st) => {
        if (dragId === overId) return {};
        const list = [...st.screens];
        const from = list.findIndex((s) => s.id === dragId);
        const to = list.findIndex((s) => s.id === overId);
        if (from < 0 || to < 0) return {};
        const [moved] = list.splice(from, 1);
        list.splice(to, 0, moved);
        return { screens: list.map((s, i) => ({ ...s, order: i })) };
      }),

    // ───────── groups ─────────
    addGroup: (group) =>
      set((st) => ({ groups: [...st.groups, group] })),

    renameGroup: (id, name) =>
      set((st) => ({
        groups: st.groups.map((g) => (g.id === id ? { ...g, name } : g)),
      })),

    removeGroup: (id) =>
      set((st) => ({
        groups: st.groups.filter((g) => g.id !== id),
        // its screens fall back to ungrouped
        screens: st.screens.map((s) => (s.groupId === id ? { ...s, groupId: null } : s)),
      })),

    moveGroup: (dragId, overId) =>
      set((st) => {
        const list = [...st.groups].sort((a, b) => a.order - b.order);
        const from = list.findIndex((g) => g.id === dragId);
        if (from < 0) return {};
        const [moved] = list.splice(from, 1);
        let to = overId ? list.findIndex((g) => g.id === overId) : list.length;
        if (to < 0) to = list.length;
        list.splice(to, 0, moved);
        return { groups: list.map((g, i) => ({ ...g, order: i })) };
      }),

    setScreenGroup: (screenId, groupId, order) =>
      set((st) => ({
        screens: st.screens.map((s) =>
          s.id === screenId ? { ...s, groupId, order } : s,
        ),
      })),

    activeScreen: () => {
      const { screens, activeScreenId } = get();
      return screens.find((s) => s.id === activeScreenId);
    },
  };
});
