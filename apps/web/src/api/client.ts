import type {
  CanvasElement,
  ElementInput,
  Project,
  Screen,
  User,
  AiProviderKind,
} from '@wowboard/shared';

export interface AiCredentialInfo {
  provider: AiProviderKind;
  hasKey: boolean;
  baseUrl: string | null;
  model: string | null;
}
export interface AiScreenResult {
  width: number;
  height: number;
  elements: ElementInput[];
}

export interface UserTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: ElementInput[];
  createdAt: string;
}

// API runs on port 7000 on the SAME host the web is served from. This makes
// the app work whether opened as localhost or via a remote domain
// (e.g. http://dev.brainsp.com:7100 → API at http://dev.brainsp.com:7000),
// while keeping cookies same-site. Override with VITE_API_BASE_URL if needed.
const API_PORT = 7000;
export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:${API_PORT}`
    : `http://localhost:${API_PORT}`);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface ProjectListItem extends Project {
  _count?: { screens: number };
}

export type ProjectDetail = Project & { screens: Screen[] };
export type ScreenWithElements = Screen & { elements: CanvasElement[] };

export const api = {
  // auth
  me: () => request<User>('/auth/me'),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  loginUrl: (provider: string) => `${API_BASE}/auth/${provider}`,
  guestLogin: () => request<User>('/auth/guest', { method: 'POST' }),

  // projects
  listProjects: () => request<ProjectListItem[]>('/projects'),
  createProject: (
    title: string,
    opts?: { description?: string; width?: number; height?: number },
  ) =>
    request<ProjectDetail>('/projects', {
      method: 'POST',
      body: JSON.stringify({ title, ...opts }),
    }),
  getProject: (id: string) => request<ProjectDetail>(`/projects/${id}`),
  updateProject: (id: string, data: Partial<Pick<Project, 'title' | 'description'>>) =>
    request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<{ ok: boolean }>(`/projects/${id}`, { method: 'DELETE' }),

  // screens
  createScreen: (projectId: string, name?: string) =>
    request<ScreenWithElements>(`/projects/${projectId}/screens`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateScreen: (id: string, data: Partial<Pick<Screen, 'name' | 'order' | 'width' | 'height'>>) =>
    request<Screen>(`/screens/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteScreen: (id: string) =>
    request<{ ok: boolean }>(`/screens/${id}`, { method: 'DELETE' }),
  putElements: (screenId: string, elements: Omit<CanvasElement, 'id'>[]) =>
    request<ScreenWithElements>(`/screens/${screenId}/elements`, {
      method: 'PUT',
      body: JSON.stringify({ elements }),
    }),

  // share
  enableShare: (projectId: string) =>
    request<{ shareToken: string }>(`/projects/${projectId}/share`, {
      method: 'POST',
    }),
  disableShare: (projectId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/share`, {
      method: 'DELETE',
    }),
  getShared: (token: string) =>
    request<ProjectDetail>(`/share/${token}`),

  // user templates
  getTemplates: () => request<UserTemplate[]>('/templates'),
  createTemplate: (data: {
    name: string;
    width: number;
    height: number;
    elements: ElementInput[];
  }) =>
    request<UserTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplate: (id: string, name: string) =>
    request<UserTemplate>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  deleteTemplate: (id: string) =>
    request<{ ok: boolean }>(`/templates/${id}`, { method: 'DELETE' }),
  shareTemplate: (id: string) =>
    request<{ shareToken: string }>(`/templates/${id}/share`, { method: 'POST' }),
  unshareTemplate: (id: string) =>
    request<{ ok: boolean }>(`/templates/${id}/share`, { method: 'DELETE' }),
  getSharedTemplate: (token: string) =>
    request<{ name: string; width: number; height: number; elements: ElementInput[] }>(
      `/templates/shared/${token}`,
    ),
  importTemplate: (token: string) =>
    request<UserTemplate>(`/templates/import/${token}`, { method: 'POST' }),

  // ai
  getAiProviders: () => request<AiProviderKind[]>('/ai/providers'),
  getAiCredentials: () => request<AiCredentialInfo[]>('/ai/credentials'),
  putAiCredential: (
    provider: AiProviderKind,
    data: { apiKey?: string; baseUrl?: string; model?: string },
  ) =>
    request<{ ok: boolean }>(`/ai/credentials/${provider}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAiCredential: (provider: AiProviderKind) =>
    request<{ ok: boolean }>(`/ai/credentials/${provider}`, { method: 'DELETE' }),
  aiGenerate: (
    provider: AiProviderKind,
    prompt: string,
    opts?: {
      width?: number;
      height?: number;
      mode?: 'add' | 'edit';
      current?: ElementInput[];
      imageBase64?: string;
      mime?: string;
    },
  ) =>
    request<AiScreenResult>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ provider, prompt, ...opts }),
    }),
  aiFromImage: (
    provider: AiProviderKind,
    imageBase64: string,
    mime: string,
    size?: { width: number; height: number },
  ) =>
    request<AiScreenResult>('/ai/from-image', {
      method: 'POST',
      body: JSON.stringify({ provider, imageBase64, mime, ...size }),
    }),
};
