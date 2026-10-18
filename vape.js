const starterProducts = [
  { id: 1, code: "DRK-001", brand: "Vapor Luxe", name: "Mango", price: 45, stock: 20 },
  { id: 2, code: "DRK-002", brand: "Cloud Burst", name: "Strawberry", price: 50, stock: 15 },
  { id: 3, code: "DRK-003", brand: "Mist & Co.", name: "Blueberry", price: 55, stock: 8 },
  { id: 4, code: "DRK-004", brand: "Drift Vape", name: "Watermelon", price: 45, stock: 3 },
  { id: 5, code: "DRK-005", brand: "Night Smoke", name: "Grape", price: 50, stock: 0 }
];

const productTable = document.getElementById("productTable");
const productForm = document.getElementById("productForm");
const money = amount => Number(amount).toLocaleString("en-PH", {
  style: "currency",
  currency: "PHP"
});

function loadProducts() {
  try {
    const saved = localStorage.getItem("flavorProducts");
    const fallback = structuredClone(starterProducts);
    if (saved === null) return fallback;

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(product => ({
      ...product,
      brand: product.brand || "Generic",
      name: product.name || "Unnamed flavor"
    })) : fallback;
  } catch (error) {
    console.error("Unable to load saved flavor stock.", error);
    alert("Saved flavor stock could not be loaded. The starter list will be shown.");
    return structuredClone(starterProducts);
  }
}

let products = loadProducts();

function saveProducts() {
  try {
    localStorage.setItem("flavorProducts", JSON.stringify(products));
    return true;
  } catch (error) {
    console.error("Unable to save flavor stock.", error);
    alert("Your changes could not be saved in this browser.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderProducts() {
  productTable.innerHTML = products.length
    ? products.map(product => {
        const outOfStock = product.stock === 0;
        const brand = product.brand || "Generic";
        return `<tr>
          <td>${escapeHTML(brand)}</td>
          <td>${escapeHTML(product.name)}</td>
          <td class="price">
            <div class="price-editor">
              <input class="price-input" type="number" min="0.01" step="0.01"
                value="${escapeHTML(product.price)}" aria-label="Price for ${escapeHTML(product.brand || "Generic")} ${escapeHTML(product.name)}">
              <button type="button" data-action="update-price" data-id="${product.id}">Save</button>
            </div>
          </td>
          <td>${product.stock}</td>
          <td><span class="status${outOfStock ? " out" : ""}">${
            outOfStock ? "Out of stock" : "Available"
          }</span></td>
          <td>
            <div class="stock-actions">
              <button type="button" data-action="decrease" data-id="${product.id}"
                aria-label="Remove one ${escapeHTML(product.name)} from stock" ${outOfStock ? "disabled" : ""}>−</button>
              <button type="button" data-action="increase" data-id="${product.id}"
                aria-label="Add one ${escapeHTML(product.name)} to stock">+</button>
            </div>
          </td>
          <td><button type="button" class="remove" data-action="remove" data-id="${product.id}"
            aria-label="Remove ${escapeHTML(product.name)}">Remove</button></td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="7" class="empty">No flavors added yet.</td></tr>`;
}

productForm.addEventListener("submit", event => {
  event.preventDefault();

  const brand = document.getElementById("productBrand").value.trim();
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productQty").value);

  if (!brand || !name || !Number.isFinite(price) || price <= 0 ||
      !Number.isSafeInteger(stock) || stock < 0) {
    alert("Enter a brand, a flavor, a price greater than zero, and a whole stock quantity of zero or more.");
    return;
  }

  if (products.some(product =>
    (product.brand || "").toLowerCase() === brand.toLowerCase() &&
    (product.name || "").toLowerCase() === name.toLowerCase())) {
    alert("That flavor and brand combination is already on the list.");
    return;
  }

  const nextId = products.reduce((max, product) => Math.max(max, Number(product.id) || 0), 0) + 1;
  products.push({ id: nextId, brand, name, price: Math.round(price * 100) / 100, stock });

  if (saveProducts()) {
    productForm.reset();
    document.getElementById("productQty").value = 0;
    renderProducts();
  } else {
    products.pop();
  }
});

productTable.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const productIndex = products.findIndex(product => product.id === Number(button.dataset.id));
  if (productIndex === -1) return;

  const product = products[productIndex];
  const action = button.dataset.action;

  if (action === "update-price") {
    const priceInput = button.parentElement.querySelector(".price-input");
    const price = Number(priceInput.value);
    if (!Number.isFinite(price) || price <= 0) {
      alert("Enter a price greater than zero.");
      priceInput.focus();
      return;
    }

    const previousPrice = product.price;
    product.price = Math.round(price * 100) / 100;
    if (!saveProducts()) {
      product.price = previousPrice;
      return;
    }
  } else if (action === "remove") {
    if (!confirm(`Remove ${product.name} from the flavor list?`)) return;
    products.splice(productIndex, 1);
  } else if (action === "increase") {
    if (product.stock >= Number.MAX_SAFE_INTEGER) {
      alert("Stock quantity cannot be increased any further.");
      return;
    }
    product.stock += 1;
  } else if (action === "decrease" && product.stock > 0) {
    product.stock -= 1;
  } else {
    return;
  }

  if (!saveProducts()) {
    if (action === "remove") {
      products.splice(productIndex, 0, product);
    } else {
      product.stock += action === "increase" ? -1 : 1;
    }
    return;
  }
  renderProducts();
});

renderProducts();
