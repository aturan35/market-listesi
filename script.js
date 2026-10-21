const CATEGORY_ORDER = ["Meyve & Sebze", "Süt Ürünleri", "Et & Tavuk", "Fırın", "İçecek", "Temizlik", "Diğer"];

function groupByCategory(items) {
  const groups = new Map();
  items.forEach((item) => {
    const cat = item.category || "Diğer";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(item);
  });

  return [...groups.entries()].sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? CATEGORY_ORDER.length : ai) - (bi === -1 ? CATEGORY_ORDER.length : bi);
  });
}

function loadItems(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

// --- Tabs ---

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-view").forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`${btn.dataset.tab}-view`).classList.add("active");
  });
});

// --- Market listesi (checkbox + remove) ---

const STORAGE_KEY = "market-list-items";
const form = document.getElementById("add-form");
const itemInput = document.getElementById("item-input");
const qtyInput = document.getElementById("qty-input");
const categoryInput = document.getElementById("category-input");
const list = document.getElementById("list");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear-btn");

let items = loadItems(STORAGE_KEY);

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  pushSync();
}

function render() {
  list.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-msg";
    empty.textContent = "Liste boş. Yukarıdan ürün ekleyebilirsin.";
    list.appendChild(empty);
  }

  groupByCategory(items).forEach(([category, groupItems]) => {
    const header = document.createElement("li");
    header.className = "category-header";
    header.textContent = category;
    list.appendChild(header);

    groupItems.forEach((item) => {
      const li = document.createElement("li");
      li.className = "item" + (item.checked ? " checked" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.checked;
      checkbox.addEventListener("change", () => {
        item.checked = checkbox.checked;
        saveItems();
        render();
      });

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = item.name;

      const qty = document.createElement("span");
      qty.className = "qty";
      qty.textContent = `x${item.qty}`;

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.type = "button";
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        items = items.filter((i) => i.id !== item.id);
        saveItems();
        render();
      });

      li.append(checkbox, name, qty, removeBtn);
      list.appendChild(li);
    });
  });

  const total = items.length;
  const done = items.filter((i) => i.checked).length;
  countEl.textContent = `${total} ürün${total > 0 ? ` (${done} alındı)` : ""}`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = itemInput.value.trim();
  const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
  if (!name) return;

  const category = categoryInput.value;
  items.push({ id: Date.now(), name, qty, category, checked: false });
  saveItems();
  render();

  itemInput.value = "";
  qtyInput.value = "1";
  itemInput.focus();
});

clearBtn.addEventListener("click", () => {
  if (items.length === 0) return;
  if (confirm("Tüm liste silinsin mi?")) {
    items = [];
    saveItems();
    render();
  }
});

render();

// --- Evdekiler (stok takibi: +/- ile adet güncelleme) ---

const PANTRY_STORAGE_KEY = "pantry-items";
const pantryForm = document.getElementById("pantry-add-form");
const pantryItemInput = document.getElementById("pantry-item-input");
const pantryQtyInput = document.getElementById("pantry-qty-input");
const pantryCategoryInput = document.getElementById("pantry-category-input");
const pantryList = document.getElementById("pantry-list");
const pantryCountEl = document.getElementById("pantry-count");
const pantryClearBtn = document.getElementById("pantry-clear-btn");

let pantryItems = loadItems(PANTRY_STORAGE_KEY);

function savePantryItems() {
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(pantryItems));
  pushSync();
}

function renderPantry() {
  pantryList.innerHTML = "";

  if (pantryItems.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-msg";
    empty.textContent = "Evde takip edilen ürün yok. Yukarıdan ekleyebilirsin.";
    pantryList.appendChild(empty);
  }

  groupByCategory(pantryItems).forEach(([category, groupItems]) => {
    const header = document.createElement("li");
    header.className = "category-header";
    header.textContent = category;
    pantryList.appendChild(header);

    groupItems.forEach((item) => {
      const li = document.createElement("li");
      li.className = "item" + (item.qty <= 0 ? " out-of-stock" : "");

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = item.name;

      const controls = document.createElement("div");
      controls.className = "stock-controls";

      const decBtn = document.createElement("button");
      decBtn.className = "stock-btn";
      decBtn.type = "button";
      decBtn.textContent = "−";
      decBtn.addEventListener("click", () => {
        item.qty = Math.max(0, item.qty - 1);
        savePantryItems();
        renderPantry();
      });

      const qty = document.createElement("span");
      qty.className = "stock-qty";
      qty.textContent = item.qty;

      const incBtn = document.createElement("button");
      incBtn.className = "stock-btn";
      incBtn.type = "button";
      incBtn.textContent = "+";
      incBtn.addEventListener("click", () => {
        item.qty += 1;
        savePantryItems();
        renderPantry();
      });

      controls.append(decBtn, qty, incBtn);

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.type = "button";
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        pantryItems = pantryItems.filter((i) => i.id !== item.id);
        savePantryItems();
        renderPantry();
      });

      li.append(name, controls, removeBtn);
      pantryList.appendChild(li);
    });
  });

  const total = pantryItems.length;
  const out = pantryItems.filter((i) => i.qty <= 0).length;
  pantryCountEl.textContent = `${total} ürün${out > 0 ? ` (${out} tükendi)` : ""}`;
}

pantryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = pantryItemInput.value.trim();
  const qty = Math.max(0, parseInt(pantryQtyInput.value, 10) || 0);
  if (!name) return;

  const category = pantryCategoryInput.value;
  pantryItems.push({ id: Date.now(), name, qty, category });
  savePantryItems();
  renderPantry();

  pantryItemInput.value = "";
  pantryQtyInput.value = "1";
  pantryItemInput.focus();
});

pantryClearBtn.addEventListener("click", () => {
  if (pantryItems.length === 0) return;
  if (confirm("Evdekiler listesi tamamen silinsin mi?")) {
    pantryItems = [];
    savePantryItems();
    renderPantry();
  }
});

renderPantry();

// --- Senkronizasyon (jsonblob.com üzerinden, hesap gerektirmez) ---

const SYNC_CODE_KEY = "market-sync-code";
const BLOB_API = "https://jsonblob.com/api/jsonBlob";

const syncCodeInput = document.getElementById("sync-code-input");
const syncJoinBtn = document.getElementById("sync-join-btn");
const syncCreateBtn = document.getElementById("sync-create-btn");
const syncOffEl = document.getElementById("sync-off");
const syncOnEl = document.getElementById("sync-on");
const syncCodeDisplay = document.getElementById("sync-code-display");
const syncCopyBtn = document.getElementById("sync-copy-btn");
const syncLeaveBtn = document.getElementById("sync-leave-btn");
const syncStatusEl = document.getElementById("sync-status");

let syncCode = localStorage.getItem(SYNC_CODE_KEY) || null;
let lastRemoteUpdatedAt = 0;
let syncPollTimer = null;
let pushDebounceTimer = null;

function setSyncStatus(text, isError) {
  syncStatusEl.textContent = text;
  syncStatusEl.classList.toggle("error", !!isError);
}

function updateSyncUI() {
  if (syncCode) {
    syncOffEl.style.display = "none";
    syncOnEl.style.display = "flex";
    syncCodeDisplay.textContent = syncCode;
  } else {
    syncOffEl.style.display = "flex";
    syncOnEl.style.display = "none";
  }
}

function getSyncPayload() {
  return { items, pantryItems, updatedAt: Date.now() };
}

function applyRemoteData(data) {
  items = Array.isArray(data.items) ? data.items : [];
  pantryItems = Array.isArray(data.pantryItems) ? data.pantryItems : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(pantryItems));
  render();
  renderPantry();
}

async function createSyncCode() {
  setSyncStatus("Kod oluşturuluyor...");
  try {
    const res = await fetch(BLOB_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getSyncPayload()),
    });
    const location = res.headers.get("Location");
    if (!res.ok || !location) throw new Error("no-location");
    syncCode = location.split("/").pop();
    lastRemoteUpdatedAt = Date.now();
    localStorage.setItem(SYNC_CODE_KEY, syncCode);
    updateSyncUI();
    setSyncStatus("Kod oluşturuldu. Bu kodu diğer telefona gir.");
    startPolling();
  } catch (err) {
    setSyncStatus("Kod oluşturulamadı. Bağlantıyı kontrol edip tekrar dene.", true);
  }
}

async function joinSyncCode(id) {
  if (!id) return;
  setSyncStatus("Katılınıyor...");
  try {
    const res = await fetch(`${BLOB_API}/${id}`);
    if (!res.ok) throw new Error("not-found");
    const data = await res.json();
    applyRemoteData(data);
    lastRemoteUpdatedAt = data.updatedAt || Date.now();
    syncCode = id;
    localStorage.setItem(SYNC_CODE_KEY, syncCode);
    updateSyncUI();
    setSyncStatus("Katılındı, senkronize ediliyor.");
    startPolling();
  } catch (err) {
    setSyncStatus("Bu kod bulunamadı. Kodu kontrol et.", true);
  }
}

function leaveSyncCode() {
  syncCode = null;
  localStorage.removeItem(SYNC_CODE_KEY);
  stopPolling();
  updateSyncUI();
  setSyncStatus("Senkronizasyondan ayrıldın.");
}

function pushSync() {
  if (!syncCode) return;
  clearTimeout(pushDebounceTimer);
  pushDebounceTimer = setTimeout(async () => {
    try {
      const payload = getSyncPayload();
      const res = await fetch(`${BLOB_API}/${syncCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("push-failed");
      lastRemoteUpdatedAt = payload.updatedAt;
      setSyncStatus(`Senkronize edildi (${new Date(payload.updatedAt).toLocaleTimeString("tr-TR")})`);
    } catch (err) {
      setSyncStatus("Senkron hatası, bağlantı yok.", true);
    }
  }, 400);
}

async function pullSync() {
  if (!syncCode) return;
  try {
    const res = await fetch(`${BLOB_API}/${syncCode}`);
    if (!res.ok) throw new Error("pull-failed");
    const data = await res.json();
    if (data.updatedAt && data.updatedAt > lastRemoteUpdatedAt) {
      applyRemoteData(data);
      lastRemoteUpdatedAt = data.updatedAt;
      setSyncStatus(`Güncellendi (${new Date(data.updatedAt).toLocaleTimeString("tr-TR")})`);
    }
  } catch (err) {
    setSyncStatus("Senkron hatası, bağlantı yok.", true);
  }
}

function startPolling() {
  stopPolling();
  syncPollTimer = setInterval(pullSync, 6000);
}

function stopPolling() {
  if (syncPollTimer) clearInterval(syncPollTimer);
  syncPollTimer = null;
}

syncCreateBtn.addEventListener("click", createSyncCode);

syncJoinBtn.addEventListener("click", () => {
  const id = syncCodeInput.value.trim();
  joinSyncCode(id);
});

syncCopyBtn.addEventListener("click", () => {
  navigator.clipboard?.writeText(syncCode).then(() => setSyncStatus("Kod kopyalandı."));
});

syncLeaveBtn.addEventListener("click", () => {
  if (confirm("Senkronizasyondan ayrılmak istiyor musun? (Veriler bu cihazda kalır.)")) {
    leaveSyncCode();
  }
});

updateSyncUI();
if (syncCode) {
  setSyncStatus("Senkronize ediliyor...");
  startPolling();
}
