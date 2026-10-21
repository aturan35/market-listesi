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
