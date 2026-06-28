const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  // eslint-disable-next-line no-console
  console.warn("VITE_API_URL não configurada. Copie .env.example para .env e preencha.");
}

const TOKEN_KEY = "sbx_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<any>("/api/auth/me"),

  getCategories: () => request<any[]>("/api/categories"),
  createCategory: (name: string) =>
    request<any>("/api/categories", { method: "POST", body: JSON.stringify({ name }) }),

  getProducts: () => request<any[]>("/api/products"),
  getProduct: (id: string) => request<any>(`/api/products/${id}`),
  getProductSales: (id: string) => request<any[]>(`/api/products/${id}/sales`),
  getProductPrices: (id: string) => request<any[]>(`/api/products/${id}/prices`),
  createProduct: (data: { category_id: string; shopee_url: string; name?: string }) =>
    request<any>("/api/products", { method: "POST", body: JSON.stringify(data) }),

  getAds: (productId: string) => request<any[]>(`/api/ads?product_id=${productId}`),
  generateAd: (productId: string) =>
    request<{ variations: any[] }>("/api/ads/generate", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    }),

  getUsers: () => request<any[]>("/api/users"),
  createUser: (data: { full_name: string; email: string; role: string }) =>
    request<any>("/api/users", { method: "POST", body: JSON.stringify(data) }),
};

export function apiImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}
