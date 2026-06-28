// Salva a URL da API e autentica o usuário, guardando o token localmente
// para ser usado pelo popup.

const apiUrlInput = document.getElementById("apiUrl");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const statusEl = document.getElementById("status");

chrome.storage.local.get(["apiUrl", "email"], (saved) => {
  if (saved.apiUrl) apiUrlInput.value = saved.apiUrl;
  if (saved.email) emailInput.value = saved.email;
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiUrl = apiUrlInput.value.trim().replace(/\/$/, "");
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!apiUrl || !email || !password) {
    statusEl.textContent = "Preencha todos os campos.";
    statusEl.style.color = "#EF4444";
    return;
  }

  statusEl.textContent = "Entrando…";
  statusEl.style.color = "#8B92A3";

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "E-mail ou senha incorretos.";
      statusEl.style.color = "#EF4444";
      return;
    }

    await chrome.storage.local.set({ apiUrl, email, token: data.token, role: data.user.role });

    statusEl.textContent = "Conectado com sucesso. Pode fechar esta aba.";
    statusEl.style.color = "#2ECC71";
  } catch {
    statusEl.textContent = "Não foi possível conectar. Verifique a URL da API.";
    statusEl.style.color = "#EF4444";
  }
});
