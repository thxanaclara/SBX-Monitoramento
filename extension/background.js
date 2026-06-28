// Service worker mínimo — reservado para futuras notificações (ex.: avisar
// quando um produto adicionado pela extensão mudar de status).
chrome.runtime.onInstalled.addListener(() => {
  console.log("SBX Monitoramento — extensão instalada.");
});
