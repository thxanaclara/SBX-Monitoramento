// Detecta se a aba ativa é uma página de produto da Shopee e, se o usuário
// já estiver conectado, permite enviar o produto direto para o
// SBX Monitoramento (cadastro via a mesma API REST usada pelo app web).
//
// Esta extensão é só um ATALHO de cadastro — a sincronização contínua dos
// produtos roda no backend (cron de 10 minutos), independente dela.

const notLoggedInEl = document.getElementById("notLoggedIn");
const notShopeeEl = document.getElementById("notShopee");
const readyToAddEl = document.getElementById("readyToAdd");
const categorySelect = document.getElementById("categorySelect");
const statusEl = document.getElementById("status");

document.getElementById("openOptions")?.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function isShopeeProductUrl(url) {
  return /shopee\.com\.br\/.+/.test(url || "");
}

async function init() {
  const { apiUrl, token, role } = await chrome.storage.local.get(["apiUrl", "token", "role"]);

  if (!apiUrl || !token) {
    notLoggedInEl.classList.remove("hidden");
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!isShopeeProductUrl(tab?.url)) {
    notShopeeEl.classList.remove("hidden");
    return;
  }

  readyToAddEl.classList.remove("hidden");

  if (role !== "admin") {
    statusEl.textContent = "Apenas usuários admin podem cadastrar produtos.";
    statusEl.style.color = "#F5C518";
  }

  const catRes = await fetch(`${apiUrl}/api/categories`, { headers: { Authorization: `Bearer ${token}` } });
  const categories = catRes.ok ? await catRes.json() : [];
  categorySelect.innerHTML = categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");

  document.getElementById("addBtn").addEventListener("click", async () => {
    statusEl.textContent = "Enviando…";
    statusEl.style.color = "#8B92A3";

    const insertRes = await fetch(`${apiUrl}/api/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categorySelect.value,
        shopee_url: tab.url,
        name: tab.title?.slice(0, 200) ?? "Sincronizando…",
      }),
    });

    if (!insertRes.ok) {
      const data = await insertRes.json().catch(() => ({}));
      statusEl.textContent = data.error || "Não foi possível adicionar o produto.";
      statusEl.style.color = "#EF4444";
      return;
    }

    statusEl.textContent = "Produto enviado para o SBX Monitoramento!";
    statusEl.style.color = "#2ECC71";
  });
}

init();
