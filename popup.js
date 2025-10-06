// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message && message.text) {
//     try {
//       console.log("Page content:", message.text);
//       document.body.insertAdjacentHTML(
//         "beforeend",
//         `<p><b>Captured:</b> ${message.text.substring(0, 200)}...</p>`
//       );
//     } catch (err) {
//       console.warn("Failed to render message in popup:", err);
//     }
//   }
// });

// Popup script: save/load API key and offer a debug capture

const apiKeyInput = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKey");
const clearKeyBtn = document.getElementById("clearKey");

function loadKey() {
  chrome.storage.local.get(["api_key"], (res) => {
    if (res && res.api_key) apiKeyInput.value = res.api_key;
  });
}

saveKeyBtn.addEventListener("click", () => {
  const v = apiKeyInput.value && apiKeyInput.value.trim();
  if (!v) return alert("Please paste your API key");
  chrome.storage.local.set({ api_key: v }, () => {
    alert("API key saved");
  });
});

clearKeyBtn.addEventListener("click", () => {
  chrome.storage.local.remove(["api_key"], () => {
    apiKeyInput.value = "";
    alert("API key cleared");
  });
});

loadKey();
