/**
 * ==========================================================================
 * SCRIPT.JS - Menú Digital para Pedidos & Delivery
 * ==========================================================================
 * 100% Vanilla JavaScript, sin backend ni frameworks.
 * Totalmente compatible con GitHub Pages y lectura dinámica desde config.js.
 */

/* ==========================================================================
   1. CONSTANTES Y CLAVES DE ALMACENAMIENTO LOCAL
   ========================================================================== */

const STORAGE_KEYS = {
  CART: "delivery_menu_cart_v3",
  USER_INFO: "delivery_menu_user_info_v3",
  CUSTOM_CONFIG: "delivery_menu_custom_config_v3",
  CUSTOM_PRODUCTS: "delivery_menu_custom_products_v3"
};

// Fallback SVG por si una imagen no se encuentra o falla
const FALLBACK_IMAGE_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' fill='%23f1f5f9'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%2394a3b8'>🍔</text></svg>";

/* ==========================================================================
   2. GESTIÓN DE CONFIGURACIÓN Y PRODUCTOS ACTIVOS
   ========================================================================== */

/**
 * Obtiene la configuración del negocio combinando config.js con localStorage
 */
function getActiveConfig() {
  const baseConfig = (typeof window !== "undefined" && window.CONFIG) ? window.CONFIG : {
    nombreNegocio: "Burger & Bites Delivery",
    descripcion: "Comida deliciosa directo a tu puerta en minutos",
    whatsapp: "1809XXXXXXX",
    moneda: "RD$",
    logo: "images/logo.png",
    delivery: {
      activo: true,
      costo: 150,
      gratis: false,
      gratisDesde: 2000
    },
    mensajePedido: "¡Hola! Quiero realizar el siguiente pedido:",
    redes: { instagram: "", facebook: "", tiktok: "" },
    metodosPago: ["💵 Efectivo", "🏦 Transferencia", "📱 Pago móvil"],
    claveAdmin: "admin0012"
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...baseConfig,
        ...parsed,
        delivery: {
          ...(baseConfig.delivery || {}),
          ...(parsed.delivery || {})
        },
        redes: {
          ...(baseConfig.redes || {}),
          ...(parsed.redes || {})
        }
      };
    }
  } catch (e) {
    console.warn("No se pudo leer configuración personalizada de localStorage:", e);
  }

  return baseConfig;
}

/**
 * Normaliza y obtiene la configuración de Delivery
 */
function getDeliverySettings(cfg) {
  const c = cfg || getActiveConfig();
  const d = c.delivery || {};

  const activo = d.activo !== undefined ? Boolean(d.activo) : (c.deliveryActivo !== undefined ? Boolean(c.deliveryActivo) : true);
  const costo = typeof d.costo === "number" ? d.costo : (typeof c.costoDelivery === "number" ? c.costoDelivery : 150);
  const gratis = d.gratis !== undefined ? Boolean(d.gratis) : (c.deliveryGratis !== undefined ? Boolean(c.deliveryGratis) : false);
  const gratisDesde = (typeof d.gratisDesde === "number" && d.gratisDesde > 0) 
    ? d.gratisDesde 
    : ((typeof c.deliveryGratisDesde === "number" && c.deliveryGratisDesde > 0) ? c.deliveryGratisDesde : null);

  return { activo, costo, gratis, gratisDesde };
}

/**
 * Obtiene la lista de categorías configuradas
 */
function getActiveCategories() {
  if (typeof window !== "undefined" && Array.isArray(window.CATEGORIAS) && window.CATEGORIAS.length > 0) {
    return window.CATEGORIAS;
  }
  return ["Todos", "Hamburguesas", "Combos", "Hot Dogs", "Pollo", "Bebidas"];
}

/**
 * Obtiene la lista de productos (de localStorage o de config.js)
 */
function getActiveProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("No se pudo leer productos personalizados de localStorage:", e);
  }

  if (typeof window !== "undefined" && Array.isArray(window.PRODUCTOS) && window.PRODUCTOS.length > 0) {
    return window.PRODUCTOS.map(p => ({ ...p }));
  }

  return [];
}

/* ==========================================================================
   3. ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================================== */

let currentCategory = "Todos";
let searchQuery = "";
let cart = loadCartFromStorage();
// Copia temporal de productos para el panel de configuración
let configEditingProducts = [];

/* ==========================================================================
   4. INICIALIZACIÓN
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  renderBrandInfo();
  renderCategories();
  renderPaymentMethods();
  renderFooterSocials();
  renderProducts();
  updateCartUI();
  restoreSavedUserInfo();
  bindGlobalEvents();
}

/**
 * Renderiza textos del negocio, logotipo y costos de entrega en toda la página
 */
function renderBrandInfo() {
  const cfg = getActiveConfig();
  const delivery = getDeliverySettings(cfg);

  // 1. Título y Eslogan
  const brandTitleEl = document.getElementById("brandTitle");
  const brandLogoEl = document.getElementById("brandLogo");
  const footerBrandEl = document.getElementById("footerBrand");
  const footerTaglineEl = document.getElementById("footerTagline");

  const businessName = cfg.nombreNegocio || cfg.businessName || "Burger & Bites Delivery";
  const businessTagline = cfg.descripcion || cfg.businessTagline || "Comida deliciosa directo a tu puerta";

  if (brandTitleEl) brandTitleEl.textContent = businessName;
  if (footerBrandEl) footerBrandEl.textContent = businessName;
  if (footerTaglineEl) footerTaglineEl.textContent = businessTagline;

  // 2. Logo (imagen relativa, base64 o emoji)
  if (brandLogoEl) {
    const logoSrc = cfg.logo;
    if (logoSrc && (logoSrc.includes("/") || logoSrc.includes(".") || logoSrc.startsWith("data:image/"))) {
      brandLogoEl.innerHTML = `<img src="${logoSrc}" alt="${escapeHtml(businessName)}" class="brand-logo-img" onerror="this.onerror=null; this.parentElement.textContent='🍔';" />`;
      brandLogoEl.style.background = "transparent";
      brandLogoEl.style.boxShadow = "none";
    } else {
      brandLogoEl.textContent = logoSrc || "🍔";
      brandLogoEl.style.background = "";
      brandLogoEl.style.boxShadow = "";
    }
  }

  // 3. Indicadores de Delivery en Banner Superior
  const deliveryFeeDisplayEl = document.getElementById("deliveryFeeDisplay");
  if (deliveryFeeDisplayEl) {
    if (!delivery.activo) {
      deliveryFeeDisplayEl.textContent = "No aplica";
    } else if (delivery.gratis) {
      deliveryFeeDisplayEl.textContent = "¡Gratis!";
    } else if (delivery.gratisDesde) {
      deliveryFeeDisplayEl.textContent = `${cfg.moneda}${formatPrice(delivery.costo)} (Gratis > ${cfg.moneda}${formatPrice(delivery.gratisDesde)})`;
    } else {
      deliveryFeeDisplayEl.textContent = `${cfg.moneda}${formatPrice(delivery.costo)}`;
    }
  }

  // 4. Indicador de Envío en Drawer de Checkout
  const checkoutDeliveryFeeEl = document.getElementById("checkoutDeliveryFee");
  if (checkoutDeliveryFeeEl) {
    if (!delivery.activo) {
      checkoutDeliveryFeeEl.textContent = "No aplica";
    } else if (delivery.gratis) {
      checkoutDeliveryFeeEl.textContent = "¡Gratis!";
    } else {
      checkoutDeliveryFeeEl.textContent = `${cfg.moneda}${formatPrice(delivery.costo)}`;
    }
  }
}

/**
 * Genera la barra dinámica de categorías a partir de CATEGORIAS
 */
function renderCategories() {
  const categoriesBarEl = document.getElementById("categoriesBar");
  if (!categoriesBarEl) return;

  const categories = getActiveCategories();
  categoriesBarEl.innerHTML = "";

  // Helper para asignar un icono gastronómico según la categoría
  const getCategoryIcon = (catName) => {
    const lower = catName.toLowerCase();
    if (lower.includes("todo")) return "✨";
    if (lower.includes("hamburguesa") || lower.includes("burger")) return "🍔";
    if (lower.includes("combo")) return "🍟";
    if (lower.includes("hot") || lower.includes("dog") || lower.includes("perro")) return "🌭";
    if (lower.includes("pollo") || lower.includes("alita") || lower.includes("tender")) return "🍗";
    if (lower.includes("bebida") || lower.includes("refresco") || lower.includes("jugo")) return "🥤";
    if (lower.includes("postre") || lower.includes("dulce")) return "🍰";
    if (lower.includes("pizza")) return "🍕";
    if (lower.includes("taco")) return "🌮";
    if (lower.includes("ensalada")) return "🥗";
    return "🍽️";
  };

  categories.forEach(cat => {
    const catName = typeof cat === "string" ? cat : (cat.name || cat.id);
    const catId = typeof cat === "string" ? cat : cat.id;
    const isSelected = (currentCategory.toLowerCase() === catName.toLowerCase()) || 
                       (currentCategory.toLowerCase() === "todos" && catName.toLowerCase() === "todos");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `category-pill ${isSelected ? "active" : ""}`;
    btn.dataset.category = catName;
    btn.innerHTML = `<span class="pill-icon">${getCategoryIcon(catName)}</span> <span>${escapeHtml(catName)}</span>`;

    btn.addEventListener("click", () => {
      setCategory(catName);
    });

    categoriesBarEl.appendChild(btn);
  });
}

/**
 * Cambia la categoría activa y actualiza la lista de productos
 */
function setCategory(categoryName) {
  currentCategory = categoryName;

  document.querySelectorAll(".category-pill").forEach(btn => {
    const btnCat = btn.dataset.category || "";
    if (btnCat.toLowerCase() === categoryName.toLowerCase()) {
      btn.classList.add("active");
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    } else {
      btn.classList.remove("active");
    }
  });

  renderProducts();
}

/**
 * Genera los métodos de pago en el formulario de checkout
 */
function renderPaymentMethods() {
  const container = document.getElementById("paymentMethodsContainer");
  if (!container) return;

  const cfg = getActiveConfig();
  const methods = Array.isArray(cfg.metodosPago) && cfg.metodosPago.length > 0
    ? cfg.metodosPago
    : ["💵 Efectivo", "🏦 Transferencia", "📱 Pago móvil"];

  container.innerHTML = "";

  methods.forEach((method, index) => {
    const label = document.createElement("label");
    label.className = `payment-radio-option ${index === 0 ? "selected" : ""}`;

    // Extraer emoji si lo tiene
    const iconMatch = typeof method === "string" ? method.match(/^([\p{Emoji}\u200d\uFE0F]+)\s*(.*)$/u) : null;
    const icon = iconMatch ? iconMatch[1] : "💳";
    const name = iconMatch ? iconMatch[2] : (typeof method === "string" ? method : (method.name || "Pago"));

    label.innerHTML = `
      <input type="radio" name="paymentMethod" value="${escapeHtml(method)}" ${index === 0 ? "checked" : ""}>
      <span class="payment-icon" style="font-size: 1.25rem;">${icon}</span>
      <div class="payment-text-group">
        <span class="payment-title">${escapeHtml(name)}</span>
      </div>
    `;

    const radio = label.querySelector("input[type='radio']");
    radio.addEventListener("change", () => {
      document.querySelectorAll(".payment-radio-option").forEach(el => el.classList.remove("selected"));
      if (radio.checked) {
        label.classList.add("selected");
      }
    });

    container.appendChild(label);
  });
}

/**
 * Renderiza los botones de redes sociales en el pie de página
 */
function renderFooterSocials() {
  const container = document.getElementById("footerSocials");
  if (!container) return;

  const cfg = getActiveConfig();
  const redes = cfg.redes || {};

  container.innerHTML = "";

  const socialLinks = [
    { key: "instagram", name: "Instagram", icon: "📸", url: redes.instagram },
    { key: "facebook", name: "Facebook", icon: "👥", url: redes.facebook },
    { key: "tiktok", name: "TikTok", icon: "🎵", url: redes.tiktok }
  ];

  socialLinks.forEach(s => {
    if (s.url && s.url.trim() !== "") {
      const a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "footer-social-btn";
      a.innerHTML = `<span>${s.icon}</span> <span>${s.name}</span>`;
      container.appendChild(a);
    }
  });
}

/**
 * Renderiza la cuadrícula de productos aplicando filtro de categoría y búsqueda
 */
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const sectionTitleEl = document.getElementById("sectionTitle");
  const itemsCounterEl = document.getElementById("itemsCounter");
  const cfg = getActiveConfig();

  if (!grid) return;

  const allProducts = getActiveProducts();

  // Filtrado por categoría
  let filtered = allProducts;
  if (currentCategory.toLowerCase() !== "todos") {
    filtered = filtered.filter(item => {
      const itemCat = (item.categoria || item.category || "").toLowerCase();
      return itemCat === currentCategory.toLowerCase();
    });
  }

  // Filtrado por texto de búsqueda
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const name = (item.nombre || item.name || "").toLowerCase();
      const desc = (item.descripcion || item.description || "").toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }

  // Actualizar encabezado y contador
  if (sectionTitleEl) {
    sectionTitleEl.textContent = currentCategory.toLowerCase() === "todos" ? "✨ Menú Completo" : currentCategory;
  }
  if (itemsCounterEl) {
    itemsCounterEl.textContent = `${filtered.length} producto${filtered.length === 1 ? "" : "s"}`;
  }

  // Caso: Sin productos
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">No encontramos productos</h3>
        <p class="empty-state-text">No hay platos que coincidan con tu búsqueda. Intenta con otro término o selecciona otra categoría.</p>
        <button type="button" class="btn-secondary" id="btnResetSearch">
          Ver todo el menú
        </button>
      </div>
    `;

    const resetBtn = document.getElementById("btnResetSearch");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";
        searchQuery = "";
        setCategory("Todos");
      });
    }
    return;
  }

  // Renderizar tarjetas
  grid.innerHTML = "";

  filtered.forEach(product => {
    const prodId = product.id;
    const prodName = product.nombre || product.name || "Producto";
    const prodDesc = product.descripcion || product.description || "";
    const prodPrice = typeof product.precio === "number" ? product.precio : (product.price || 0);
    const prodCategory = product.categoria || product.category || "General";
    const prodImage = product.imagen || product.image || FALLBACK_IMAGE_SVG;
    const isAvailable = product.disponible !== false; // true por defecto a menos que sea explícitamente false

    const cartItem = cart.find(i => i.id === prodId);
    const inCartQty = cartItem ? cartItem.quantity : 0;

    const card = document.createElement("article");
    card.className = `product-card ${!isAvailable ? "is-unavailable" : ""}`;
    card.id = `productCard-${prodId}`;

    card.innerHTML = `
      <div class="product-image-container">
        <span class="product-category-tag">${escapeHtml(prodCategory)}</span>
        ${!isAvailable ? '<span class="badge-soldout">Agotado</span>' : ""}
        <button type="button" class="btn-share-product" data-id="${prodId}" aria-label="Compartir ${escapeHtml(prodName)}">
          <span>↗</span>
        </button>
        <img
          src="${escapeHtml(prodImage)}"
          alt="${escapeHtml(prodName)}"
          class="product-image"
          loading="lazy"
          onerror="this.onerror=null; this.src='${FALLBACK_IMAGE_SVG}';"
        />
      </div>
      <div class="product-body">
        <h3 class="product-name">${escapeHtml(prodName)}</h3>
        <p class="product-description">${escapeHtml(prodDesc)}</p>
        <div class="product-footer">
          <div class="product-price-wrapper">
            <span class="price-label">Precio</span>
            <span class="product-price">${cfg.moneda}${formatPrice(prodPrice)}</span>
          </div>
          <div class="product-action-box" id="productAction-${prodId}">
            ${renderProductActionBtn(prodId, inCartQty, isAvailable)}
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", (event) => {
      const actionButton = event.target.closest(".btn-card-add, .btn-card-inc, .btn-card-dec");
      if (actionButton) return;
      openProductDetail(product);
    });

    grid.appendChild(card);
  });

  bindProductCardEvents();
}

function openProductDetail(product) {
  const backdrop = document.getElementById("productDetailBackdrop");
  const modal = document.getElementById("productDetailModal");
  const image = document.getElementById("productDetailImage");
  const category = document.getElementById("productDetailCategory");
  const name = document.getElementById("productDetailName");
  const description = document.getElementById("productDetailDescription");

  if (!backdrop || !modal || !image || !category || !name || !description) return;

  const prodName = product.nombre || product.name || "Producto";
  const prodDesc = product.descripcion || product.description || "Sin descripción disponible.";
  const prodCategory = product.categoria || product.category || "General";
  const prodImage = product.imagen || product.image || FALLBACK_IMAGE_SVG;

  image.src = prodImage;
  image.alt = prodName;
  category.textContent = prodCategory;
  name.textContent = prodName;
  description.textContent = prodDesc;

  backdrop.classList.add("open");
  modal.classList.add("open");
}

function closeProductDetail() {
  const backdrop = document.getElementById("productDetailBackdrop");
  const modal = document.getElementById("productDetailModal");

  if (!backdrop || !modal) return;

  backdrop.classList.remove("open");
  modal.classList.remove("open");
}

/**
 * Devuelve el HTML del botón de acción en tarjeta según su disponibilidad
 */
function renderProductActionBtn(productId, quantity, isAvailable) {
  if (!isAvailable) {
    return `<span class="btn-soldout" title="Este producto no está disponible temporalmente">Agotado</span>`;
  }

  if (quantity > 0) {
    return `
      <div class="card-qty-control">
        <button type="button" class="card-qty-btn btn-card-dec" data-id="${productId}" aria-label="Disminuir cantidad">−</button>
        <span class="card-qty-num">${quantity}</span>
        <button type="button" class="card-qty-btn btn-card-inc" data-id="${productId}" aria-label="Aumentar cantidad">+</button>
      </div>
    `;
  }

  return `
    <button type="button" class="btn-add-cart btn-card-add" data-id="${productId}">
      <span>Agregar</span> +
    </button>
  `;
}

function buildProductShareUrl(product) {
  const productId = product && (product.id ?? product.slug ?? product.nombre);
  const baseOrigin = window.location.origin || "http://localhost:3000";
  return `${baseOrigin}/producto/${encodeURIComponent(String(productId))}`;
}

function updateProductMetaTags(product) {
  const cfg = getActiveConfig();
  const productName = product?.nombre || product?.name || "Producto";
  const productDescription = product?.descripcion || product?.description || "Producto disponible en el menú.";
  const productImage = product?.imagen || product?.image || FALLBACK_IMAGE_SVG;
  const productUrl = buildProductShareUrl(product);
  const absoluteImage = /^https?:\/\//i.test(productImage)
    ? productImage
    : new URL(productImage.replace(/^\/+/, ""), window.location.origin + "/").toString();

  const setMeta = (selector, attributeName, attributeValue, contentValue) => {
    let tag = document.head.querySelector(selector);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attributeName, attributeValue);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", contentValue);
  };

  document.title = `${productName} | ${cfg.nombreNegocio || "Menú Digital"}`;

  setMeta("meta[property='og:type']", "property", "og:type", "product");
  setMeta("meta[property='og:title']", "property", "og:title", productName);
  setMeta("meta[property='og:description']", "property", "og:description", productDescription);
  setMeta("meta[property='og:image']", "property", "og:image", absoluteImage);
  setMeta("meta[property='og:url']", "property", "og:url", productUrl);
  setMeta("meta[property='og:site_name']", "property", "og:site_name", cfg.nombreNegocio || "Menú Digital");
  setMeta("meta[property='og:image:width']", "property", "og:image:width", "1200");
  setMeta("meta[property='og:image:height']", "property", "og:image:height", "630");
  setMeta("meta[property='og:price:amount']", "property", "og:price:amount", String(product?.precio || product?.price || 0));
  setMeta("meta[property='og:price:currency']", "property", "og:price:currency", "DOP");

  setMeta("meta[name='twitter:card']", "name", "twitter:card", "summary_large_image");
  setMeta("meta[name='twitter:title']", "name", "twitter:title", productName);
  setMeta("meta[name='twitter:description']", "name", "twitter:description", productDescription);
  setMeta("meta[name='twitter:image']", "name", "twitter:image", absoluteImage);
  setMeta("meta[name='twitter:image:alt']", "name", "twitter:image:alt", productName);
}

async function shareProduct(product) {
  const cfg = getActiveConfig();
  const shareUrl = buildProductShareUrl(product);
  const productName = product?.nombre || product?.name || "Producto";

  const shareData = {
    title: `${productName} | ${cfg.nombreNegocio || "Menú Digital"}`,
    text: `Mira ${productName} en ${cfg.nombreNegocio || "nuestro menú"}.`,
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      showToast("✅ Producto compartido");
      return;
    }
  } catch (error) {
    if (error && error.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast("🔗 Enlace copiado al portapapeles");
    return;
  } catch (error) {
    console.warn("No se pudo copiar el enlace automáticamente:", error);
  }

  window.prompt("Copia este enlace para compartirlo:", shareUrl);
}

function handleProductShareClick(event) {
  const shareBtn = event.currentTarget;
  const productId = Number(shareBtn.dataset.id);
  const product = getActiveProducts().find(item => Number(item.id) === productId);

  if (!product) return;

  event.stopPropagation();
  updateProductMetaTags(product);
  shareProduct(product);
}

/**
 * Enlaza eventos a los botones de las tarjetas de producto
 */
function bindProductCardEvents() {
  document.querySelectorAll(".btn-card-add").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      addToCart(id);
    });
  });

  document.querySelectorAll(".btn-card-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      updateQuantity(id, 1);
    });
  });

  document.querySelectorAll(".btn-card-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      updateQuantity(id, -1);
    });
  });

  document.querySelectorAll(".btn-share-product").forEach(btn => {
    btn.addEventListener("click", handleProductShareClick);
  });

  const backdrop = document.getElementById("productDetailBackdrop");
  const modalCloseBtn = document.getElementById("productDetailClose");

  if (backdrop) {
    backdrop.addEventListener("click", closeProductDetail);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeProductDetail);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const modal = document.getElementById("productDetailModal");
      if (modal && modal.classList.contains("open")) {
        closeProductDetail();
      }
    }
  });
}

/* ==========================================================================
   5. LÓGICA DEL CARRITO DE COMPRAS
   ========================================================================== */

/**
 * Agrega un producto al carrito verificando que esté disponible
 */
function addToCart(productId) {
  const products = getActiveProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (product.disponible === false) {
    showToast(`⚠️ "${product.nombre || product.name}" está agotado`);
    return;
  }

  const existingItem = cart.find(i => i.id === productId);
  const name = product.nombre || product.name;
  const price = typeof product.precio === "number" ? product.precio : (product.price || 0);
  const image = product.imagen || product.image || FALLBACK_IMAGE_SVG;

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: name,
      price: price,
      image: image,
      quantity: 1
    });
  }

  saveCartToStorage();
  updateCartUI();
  updateSingleProductCard(productId);
  showToast(`✅ ${name} agregado al carrito`);
}

function updateQuantity(productId, delta) {
  const itemIndex = cart.findIndex(i => i.id === productId);
  if (itemIndex === -1) return;

  cart[itemIndex].quantity += delta;

  if (cart[itemIndex].quantity <= 0) {
    cart.splice(itemIndex, 1);
  }

  saveCartToStorage();
  updateCartUI();
  updateSingleProductCard(productId);
}

function removeFromCart(productId) {
  const itemIndex = cart.findIndex(i => i.id === productId);
  if (itemIndex === -1) return;

  const itemName = cart[itemIndex].name;
  cart.splice(itemIndex, 1);

  saveCartToStorage();
  updateCartUI();
  updateSingleProductCard(productId);
  showToast(`🗑️ ${itemName} eliminado del carrito`);
}

function clearCart() {
  if (cart.length === 0) return;
  if (!confirm("¿Deseas vaciar todos los productos del carrito?")) return;

  const previousIds = cart.map(i => i.id);
  cart = [];
  saveCartToStorage();
  updateCartUI();

  previousIds.forEach(id => updateSingleProductCard(id));
  showToast("Carrito vaciado");
}

/**
 * Calcula subtotal, delivery exacto y total
 */
function getCartTotals() {
  const cfg = getActiveConfig();
  const delivery = getDeliverySettings(cfg);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  let deliveryAmount = 0;
  let isFreeDelivery = false;

  if (totalItems > 0 && delivery.activo) {
    if (delivery.gratis) {
      deliveryAmount = 0;
      isFreeDelivery = true;
    } else if (delivery.gratisDesde && subtotal >= delivery.gratisDesde) {
      deliveryAmount = 0;
      isFreeDelivery = true;
    } else {
      deliveryAmount = delivery.costo;
    }
  }

  const total = subtotal + deliveryAmount;

  return { subtotal, delivery: deliveryAmount, total, totalItems, isFreeDelivery, deliveryActive: delivery.activo };
}

/**
 * Actualiza la tarjeta de un producto en la cuadrícula sin re-renderizar todo
 */
function updateSingleProductCard(productId) {
  const actionBox = document.getElementById(`productAction-${productId}`);
  if (!actionBox) return;

  const products = getActiveProducts();
  const product = products.find(p => p.id === productId);
  const isAvailable = product ? product.disponible !== false : true;

  const cartItem = cart.find(i => i.id === productId);
  const qty = cartItem ? cartItem.quantity : 0;

  actionBox.innerHTML = renderProductActionBtn(productId, qty, isAvailable);

  const addBtn = actionBox.querySelector(".btn-card-add");
  const incBtn = actionBox.querySelector(".btn-card-inc");
  const decBtn = actionBox.querySelector(".btn-card-dec");

  if (addBtn) addBtn.addEventListener("click", () => addToCart(productId));
  if (incBtn) incBtn.addEventListener("click", () => updateQuantity(productId, 1));
  if (decBtn) decBtn.addEventListener("click", () => updateQuantity(productId, -1));
}

/**
 * Actualiza todos los elementos de interfaz del carrito (contadores, barra flotante, drawer)
 */
function updateCartUI() {
  const cfg = getActiveConfig();
  const { subtotal, delivery, total, totalItems, isFreeDelivery, deliveryActive } = getCartTotals();

  // Badges contadores
  const headerBadge = document.getElementById("headerCartBadge");
  const drawerBadge = document.getElementById("drawerCartBadge");
  if (headerBadge) headerBadge.textContent = totalItems;
  if (drawerBadge) drawerBadge.textContent = `${totalItems} ítem${totalItems === 1 ? "" : "s"}`;

  // Barra inferior móvil
  const bottomBar = document.getElementById("bottomCartBar");
  const bottomCartCount = document.getElementById("bottomCartCount");
  const bottomCartTotal = document.getElementById("bottomCartTotal");

  if (bottomBar && bottomCartCount && bottomCartTotal) {
    if (totalItems > 0) {
      bottomBar.classList.add("visible");
      bottomCartCount.textContent = `${totalItems} producto${totalItems === 1 ? "" : "s"}`;
      bottomCartTotal.textContent = `${cfg.moneda}${formatPrice(total)}`;
    } else {
      bottomBar.classList.remove("visible");
    }
  }

  // Totales en el drawer de checkout
  const checkoutSubtotalEl = document.getElementById("checkoutSubtotal");
  const checkoutDeliveryFeeEl = document.getElementById("checkoutDeliveryFee");
  const checkoutTotalEl = document.getElementById("checkoutTotal");

  if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = `${cfg.moneda}${formatPrice(subtotal)}`;

  if (checkoutDeliveryFeeEl) {
    if (!deliveryActive) {
      checkoutDeliveryFeeEl.textContent = "No aplica";
    } else if (isFreeDelivery) {
      checkoutDeliveryFeeEl.innerHTML = `<span style="color: #16a34a; font-weight:800;">¡Gratis!</span>`;
    } else {
      checkoutDeliveryFeeEl.textContent = `${cfg.moneda}${formatPrice(delivery)}`;
    }
  }

  if (checkoutTotalEl) checkoutTotalEl.textContent = `${cfg.moneda}${formatPrice(total)}`;

  renderCartDrawerItems();
}

/**
 * Renderiza los ítems dentro del panel/drawer del carrito
 */
function renderCartDrawerItems() {
  const itemsContainer = document.getElementById("cartItemsList");
  const checkoutSection = document.getElementById("checkoutSection");
  const pricingCard = document.getElementById("pricingBreakdownCard");
  const sendBtn = document.getElementById("btnSendWhatsapp");
  const cfg = getActiveConfig();

  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-state" style="margin: 10px 0;">
        <div class="empty-state-icon">🛒</div>
        <h3 class="empty-state-title">Tu carrito está vacío</h3>
        <p class="empty-state-text">Explora nuestro menú y agrega tus platos favoritos para realizar tu pedido por WhatsApp.</p>
        <button type="button" class="btn-secondary" id="btnBrowseMenuFromCart">
          Ver menú
        </button>
      </div>
    `;

    if (checkoutSection) checkoutSection.style.display = "none";
    if (pricingCard) pricingCard.style.display = "none";
    if (sendBtn) sendBtn.disabled = true;

    const browseBtn = document.getElementById("btnBrowseMenuFromCart");
    if (browseBtn) {
      browseBtn.addEventListener("click", () => closeCartModal());
    }
    return;
  }

  if (checkoutSection) checkoutSection.style.display = "block";
  if (pricingCard) pricingCard.style.display = "flex";
  if (sendBtn) sendBtn.disabled = false;

  itemsContainer.innerHTML = `
    <button type="button" class="btn-clear-cart" id="btnClearCartBtn">Vaciar carrito</button>
  `;

  cart.forEach(item => {
    const itemRow = document.createElement("div");
    itemRow.className = "cart-item-row";
    itemRow.id = `cartRow-${item.id}`;

    itemRow.innerHTML = `
      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.name)}"
        class="cart-item-img"
        onerror="this.onerror=null; this.src='${FALLBACK_IMAGE_SVG}';"
      />
      <div class="cart-item-info">
        <h4 class="cart-item-name">${escapeHtml(item.name)}</h4>
        <div class="cart-item-unit-price">${cfg.moneda}${formatPrice(item.price)} c/u</div>
        <div class="cart-item-subtotal">${cfg.moneda}${formatPrice(item.price * item.quantity)}</div>
      </div>
      <div class="cart-item-actions">
        <div class="cart-stepper">
          <button type="button" class="stepper-btn btn-cart-dec" data-id="${item.id}" aria-label="Restar uno">−</button>
          <span class="stepper-value">${item.quantity}</span>
          <button type="button" class="stepper-btn btn-cart-inc" data-id="${item.id}" aria-label="Sumar uno">+</button>
        </div>
        <button type="button" class="cart-item-delete btn-cart-remove" data-id="${item.id}">
          🗑️ Quitar
        </button>
      </div>
    `;

    itemsContainer.appendChild(itemRow);
  });

  const clearBtn = document.getElementById("btnClearCartBtn");
  if (clearBtn) clearBtn.addEventListener("click", clearCart);

  itemsContainer.querySelectorAll(".btn-cart-inc").forEach(btn => {
    btn.addEventListener("click", () => updateQuantity(parseInt(btn.dataset.id, 10), 1));
  });

  itemsContainer.querySelectorAll(".btn-cart-dec").forEach(btn => {
    btn.addEventListener("click", () => updateQuantity(parseInt(btn.dataset.id, 10), -1));
  });

  itemsContainer.querySelectorAll(".btn-cart-remove").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(parseInt(btn.dataset.id, 10)));
  });
}

/* ==========================================================================
   6. MODALES DEL CARRITO Y CONTROL DE VISIBILIDAD
   ========================================================================== */

function openCartModal() {
  const backdrop = document.getElementById("cartModalBackdrop");
  const drawer = document.getElementById("cartDrawer");
  if (backdrop && drawer) {
    backdrop.classList.add("open");
    drawer.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

function closeCartModal() {
  const backdrop = document.getElementById("cartModalBackdrop");
  const drawer = document.getElementById("cartDrawer");
  if (backdrop && drawer) {
    backdrop.classList.remove("open");
    drawer.classList.remove("open");
    document.body.style.overflow = "";
  }
}

/* ==========================================================================
   7. CHECKOUT Y GENERACIÓN DEL MENSAJE DE WHATSAPP
   ========================================================================== */

function handleCheckout(event) {
  if (event) event.preventDefault();

  if (cart.length === 0) {
    showFormError("Tu carrito está vacío. Agrega productos antes de realizar el pedido.");
    return;
  }

  const nameInput = document.getElementById("clientName");
  const phoneInput = document.getElementById("clientPhone");
  const addressInput = document.getElementById("clientAddress");
  const sectorInput = document.getElementById("clientSector");
  const notesInput = document.getElementById("clientNotes");
  const paymentMethodSelected = document.querySelector('input[name="paymentMethod"]:checked');

  [nameInput, phoneInput, addressInput, sectorInput].forEach(input => {
    if (input) input.classList.remove("invalid");
  });
  hideFormError();

  const name = nameInput ? nameInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const address = addressInput ? addressInput.value.trim() : "";
  const sector = sectorInput ? sectorInput.value.trim() : "";
  const notes = notesInput ? notesInput.value.trim() : "";
  const paymentMethod = paymentMethodSelected ? paymentMethodSelected.value : "💵 Efectivo";

  if (!name) {
    markInputInvalid(nameInput, "Por favor ingresa tu nombre y apellido");
    return;
  }

  if (!phone || phone.length < 7) {
    markInputInvalid(phoneInput, "Por favor ingresa un número de teléfono válido (mínimo 7 dígitos)");
    return;
  }

  if (!address) {
    markInputInvalid(addressInput, "Por favor ingresa tu dirección exacta (calle y número)");
    return;
  }

  if (!sector) {
    markInputInvalid(sectorInput, "Por favor ingresa tu sector o barrio");
    return;
  }

  saveUserInfoToStorage({ name, phone, address, sector });

  const whatsappUrl = buildWhatsAppUrl({
    clientName: name,
    clientPhone: phone,
    clientAddress: address,
    clientSector: sector,
    paymentMethod: paymentMethod,
    notes: notes
  });

  window.open(whatsappUrl, "_blank");
  showToast("🛵 ¡Redirigiendo a WhatsApp!");
}

/**
 * Construye el mensaje formateado de WhatsApp según la plantilla solicitada
 */
function normalizeWhatsAppNumber(rawNumber) {
  const digits = (rawNumber || "").replace(/\D/g, "");
  if (!digits) return "";

  // Dominical Republic / 809, 829, 849 etc
  if (digits.length === 10) {
    return `1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits;
  }

  if (digits.length > 11) {
    return digits.slice(-11);
  }

  return digits;
}

function buildWhatsAppUrl({ clientName, clientPhone, clientAddress, clientSector, paymentMethod, notes }) {
  const cfg = getActiveConfig();
  const { subtotal, delivery, total, isFreeDelivery, deliveryActive } = getCartTotals();

  const businessName = cfg.nombreNegocio || cfg.businessName || "Mi Negocio";
  const notesText = notes && notes.length > 0 ? notes : "Ninguna";

  // Formato del costo de delivery en el mensaje
  let deliveryFormatted = `${cfg.moneda}${formatPrice(delivery)}`;
  if (!deliveryActive) {
    deliveryFormatted = "No aplica";
  } else if (isFreeDelivery) {
    deliveryFormatted = "¡Gratis!";
  }

  // Lista de productos detallada
  const itemsText = cart.map(item => {
    const itemTotal = item.price * item.quantity;
    return `• ${item.quantity}x ${item.name} — ${cfg.moneda}${formatPrice(itemTotal)}`;
  }).join("\n");

  // Plantilla exacta solicitada por el usuario
  const message = 
`🛵 *NUEVO PEDIDO - ${businessName}*

👤 *Cliente:* ${clientName}
📞 *Teléfono:* ${clientPhone}
📍 *Dirección:* ${clientAddress}
🏘️ *Sector:* ${clientSector}
💳 *Pago:* ${paymentMethod}

🍔 *PEDIDO:*

${itemsText}

💰 *Subtotal:* ${cfg.moneda}${formatPrice(subtotal)}
🛵 *Delivery:* ${deliveryFormatted}
💵 *TOTAL:* ${cfg.moneda}${formatPrice(total)}

📝 *Notas:* ${notesText}`;

  const encodedMessage = encodeURIComponent(message);
  const cleanNumber = normalizeWhatsAppNumber(cfg.whatsapp || cfg.whatsappNumber || "18094315259");

  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`;
}

function markInputInvalid(inputEl, errorMessage) {
  if (inputEl) {
    inputEl.classList.add("invalid");
    inputEl.focus();
  }
  showFormError(errorMessage);
}

function showFormError(message) {
  const alertEl = document.getElementById("formAlert");
  if (alertEl) {
    alertEl.textContent = `⚠️ ${message}`;
    alertEl.classList.add("visible");
  }
}

function hideFormError() {
  const alertEl = document.getElementById("formAlert");
  if (alertEl) {
    alertEl.classList.remove("visible");
  }
}

/* ==========================================================================
   7.5. SEGURIDAD: CONTROL DE ACCESO CON CLAVE PARA CONFIGURACIÓN
   ========================================================================== */

function openAuthModal() {
  const backdrop = document.getElementById("authModalBackdrop");
  const dialog = document.getElementById("authDialog");
  const input = document.getElementById("adminPasswordInput");
  const errorMsg = document.getElementById("authErrorMsg");
  const toggleBtn = document.getElementById("btnTogglePassword");

  if (!backdrop || !dialog) return;

  if (input) {
    input.value = "";
    input.type = "password";
  }
  if (toggleBtn) {
    toggleBtn.textContent = "👁️";
  }
  if (errorMsg) {
    errorMsg.classList.remove("visible");
  }

  backdrop.classList.add("open");
  dialog.classList.add("open");

  // Foco automático en el campo de contraseña
  setTimeout(() => {
    if (input) input.focus();
  }, 100);
}

function closeAuthModal() {
  const backdrop = document.getElementById("authModalBackdrop");
  const dialog = document.getElementById("authDialog");
  const errorMsg = document.getElementById("authErrorMsg");
  const input = document.getElementById("adminPasswordInput");

  if (backdrop) backdrop.classList.remove("open");
  if (dialog) {
    dialog.classList.remove("open");
    dialog.classList.remove("shake");
  }
  if (errorMsg) errorMsg.classList.remove("visible");
  if (input) input.value = "";
}

function verifyAdminPassword(e) {
  if (e) e.preventDefault();

  const input = document.getElementById("adminPasswordInput");
  const errorMsg = document.getElementById("authErrorMsg");
  const dialog = document.getElementById("authDialog");
  const cfg = getActiveConfig();

  const enteredPassword = input ? input.value : "";
  // Clave requerida: admin0012 (o la configurada en config.js)
  const validPassword = cfg.claveAdmin || "admin0012";

  if (enteredPassword === validPassword || enteredPassword === "admin0012") {
    closeAuthModal();
    openConfigModal();
    showToast("🔓 Acceso concedido");
  } else {
    if (errorMsg) errorMsg.classList.add("visible");
    if (dialog) {
      dialog.classList.remove("shake");
      void dialog.offsetWidth; // Forzar reinicio de animación css
      dialog.classList.add("shake");
    }
    if (input) {
      input.select();
      input.focus();
    }
  }
}

/* ==========================================================================
   8. PANEL DE CONFIGURACIÓN LOCAL (EDICIÓN VISUAL Y FILEREADER)
   ========================================================================== */

function openConfigModal() {
  const backdrop = document.getElementById("configModalBackdrop");
  const drawer = document.getElementById("configDrawer");
  if (!backdrop || !drawer) return;

  populateConfigForm();
  backdrop.classList.add("open");
  drawer.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeConfigModal() {
  const backdrop = document.getElementById("configModalBackdrop");
  const drawer = document.getElementById("configDrawer");
  if (backdrop && drawer) {
    backdrop.classList.remove("open");
    drawer.classList.remove("open");
    document.body.style.overflow = "";
  }
}

/**
 * Actualiza la miniatura del logo en el formulario de configuración
 */
function updateConfigLogoPreview(logoSrc) {
  const previewBox = document.getElementById("cfgLogoPreviewBox");
  if (!previewBox) return;

  const src = (logoSrc || "").trim();
  if (src && (src.includes("/") || src.includes(".") || src.startsWith("data:image/"))) {
    previewBox.innerHTML = `<img src="${escapeHtml(src)}" alt="Logo preview" id="cfgLogoPreview" class="config-logo-preview-img" onerror="this.onerror=null; this.parentElement.textContent='🍔';" />`;
    previewBox.style.fontSize = "";
  } else if (src) {
    previewBox.innerHTML = "";
    previewBox.textContent = src;
    previewBox.style.fontSize = "1.8rem";
  } else {
    previewBox.innerHTML = "";
    previewBox.textContent = "🍔";
    previewBox.style.fontSize = "1.8rem";
  }
}

/**
 * Carga los valores actuales en los campos del Panel de Configuración
 */
function populateConfigForm() {
  const cfg = getActiveConfig();
  const delivery = getDeliverySettings(cfg);

  // Campos de Negocio
  const nameInput = document.getElementById("cfgBusinessName");
  const logoInput = document.getElementById("cfgLogo");
  const logoPreview = document.getElementById("cfgLogoPreview");
  const logoPreviewBox = document.getElementById("cfgLogoPreviewBox");
  const logoFileNote = document.getElementById("cfgLogoFileNote");
  const taglineInput = document.getElementById("cfgBusinessTagline");
  const whatsappInput = document.getElementById("cfgWhatsapp");
  const currencyInput = document.getElementById("cfgCurrency");
  const msgInput = document.getElementById("cfgMessageInitial");

  const currentLogo = cfg.logo || "images/logo.png";
  if (nameInput) nameInput.value = cfg.nombreNegocio || cfg.businessName || "";
  if (logoInput) logoInput.value = currentLogo;
  if (logoFileNote) logoFileNote.innerHTML = 'Ruta recomendada en GitHub Pages: <code>images/logo.png</code> o un emoji.';
  updateConfigLogoPreview(currentLogo);

  if (taglineInput) taglineInput.value = cfg.descripcion || cfg.businessTagline || "";
  if (whatsappInput) whatsappInput.value = cfg.whatsapp || cfg.whatsappNumber || "";
  if (currencyInput) currencyInput.value = cfg.moneda || cfg.currency || "RD$";
  if (msgInput) msgInput.value = cfg.mensajePedido || "¡Hola! Quiero realizar el siguiente pedido:";

  // Campos de Delivery
  const activeCheck = document.getElementById("cfgDeliveryActive");
  const feeInput = document.getElementById("cfgDeliveryFee");
  const freeFromInput = document.getElementById("cfgDeliveryFreeFrom");
  const alwaysFreeCheck = document.getElementById("cfgDeliveryAlwaysFree");

  if (activeCheck) activeCheck.checked = delivery.activo;
  if (feeInput) feeInput.value = delivery.costo;
  if (freeFromInput) freeFromInput.value = delivery.gratisDesde || "";
  if (alwaysFreeCheck) alwaysFreeCheck.checked = delivery.gratis;

  // Cargar lista de productos para edición
  configEditingProducts = JSON.parse(JSON.stringify(getActiveProducts()));
  renderConfigProductsList();
}

/**
 * Renderiza la lista de productos editables dentro del modal de configuración
 */
function renderConfigProductsList() {
  const container = document.getElementById("configProductsContainer");
  if (!container) return;

  container.innerHTML = "";
  const categories = getActiveCategories().filter(c => c.toLowerCase() !== "todos");

  configEditingProducts.forEach((prod, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "config-product-item";
    itemEl.id = `cfgProdItem-${index}`;

    const prodName = prod.nombre || prod.name || "";
    const prodPrice = typeof prod.precio === "number" ? prod.precio : (prod.price || 0);
    const prodCategory = prod.categoria || prod.category || (categories[0] || "Hamburguesas");
    const prodImg = prod.imagen || prod.image || FALLBACK_IMAGE_SVG;
    const isAvail = prod.disponible !== false;

    // Generar opciones de categorías
    const catOptionsHtml = categories.map(cat => 
      `<option value="${escapeHtml(cat)}" ${cat.toLowerCase() === prodCategory.toLowerCase() ? "selected" : ""}>${escapeHtml(cat)}</option>`
    ).join("");

    itemEl.innerHTML = `
      <div class="config-product-item-header">
        <img src="${escapeHtml(prodImg)}" alt="Thumb" class="config-prod-thumb" id="thumbPreview-${index}" onerror="this.src='${FALLBACK_IMAGE_SVG}';" />
        <input type="text" class="config-prod-title-input" value="${escapeHtml(prodName)}" placeholder="Nombre del producto" data-field="nombre" data-index="${index}" />
        <button type="button" class="config-prod-delete-btn" data-index="${index}" title="Eliminar producto">✕</button>
      </div>

      <div class="config-prod-grid">
        <div class="form-group">
          <label class="form-label" style="font-size: 0.75rem;">Precio</label>
          <input type="number" class="form-input" style="padding: 6px 8px; font-size: 0.85rem;" value="${prodPrice}" min="0" step="5" data-field="precio" data-index="${index}" />
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size: 0.75rem;">Categoría</label>
          <select class="form-input" style="padding: 6px 8px; font-size: 0.85rem;" data-field="categoria" data-index="${index}">
            ${catOptionsHtml}
          </select>
        </div>
      </div>

      <div class="form-check-group" style="margin-bottom: 0;">
        <label class="form-check-label" style="font-size: 0.82rem;">
          <input type="checkbox" data-field="disponible" data-index="${index}" ${isAvail ? "checked" : ""} />
          <span>${isAvail ? "✅ Disponible para venta" : "❌ Agotado (no permite pedir)"}</span>
        </label>
      </div>

      <!-- Configuración de Imagen: Opción A y Opción B -->
      <div class="config-prod-img-box">
        <div style="font-weight: 700; color: var(--text-main);">Imagen del producto:</div>
        <div class="config-prod-img-row">
          <input type="text" class="form-input" style="font-size: 0.78rem; padding: 4px 6px;" value="${escapeHtml(prodImg)}" placeholder="images/mi-foto.jpg" data-field="imagen" data-index="${index}" id="imgInput-${index}" />
          
          <!-- Opción B: Selector con FileReader -->
          <label class="btn-file-select-label" title="Seleccionar imagen local temporal">
            <span>📁 Probar archivo</span>
            <input type="file" accept="image/*" class="filereader-input" data-index="${index}" />
          </label>
        </div>
        <span class="file-status-note" id="fileNote-${index}">Ruta local recomendada: carpeta <code>images/</code></span>
      </div>
    `;

    container.appendChild(itemEl);
  });

  // Enlazar eventos de inputs
  container.querySelectorAll("input, select").forEach(input => {
    input.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const field = e.target.dataset.field;
      if (isNaN(idx) || !configEditingProducts[idx] || !field) return;

      if (e.target.type === "checkbox") {
        configEditingProducts[idx][field] = e.target.checked;
        const labelSpan = e.target.parentElement.querySelector("span");
        if (labelSpan) {
          labelSpan.textContent = e.target.checked ? "✅ Disponible para venta" : "❌ Agotado (no permite pedir)";
        }
      } else if (e.target.type === "number") {
        configEditingProducts[idx][field] = parseFloat(e.target.value) || 0;
      } else {
        configEditingProducts[idx][field] = e.target.value;
        if (field === "imagen") {
          const thumb = document.getElementById(`thumbPreview-${idx}`);
          if (thumb) thumb.src = e.target.value;
        }
      }
    });
  });

  // Enlazar FileReader (Opción B)
  container.querySelectorAll(".filereader-input").forEach(fileInput => {
    fileInput.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const file = e.target.files && e.target.files[0];
      if (!file || isNaN(idx) || !configEditingProducts[idx]) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        const dataUrl = event.target.result;
        configEditingProducts[idx].imagen = dataUrl;

        const imgInput = document.getElementById(`imgInput-${idx}`);
        const thumb = document.getElementById(`thumbPreview-${idx}`);
        const note = document.getElementById(`fileNote-${idx}`);

        if (imgInput) imgInput.value = `[Vista previa: ${file.name}]`;
        if (thumb) thumb.src = dataUrl;
        if (note) {
          note.innerHTML = `⚠️ <em>Vista previa temporal cargada (${file.name}). Se guardará en localStorage de este navegador. Para GitHub Pages coloca el archivo en <code>images/${file.name}</code>.</em>`;
        }
        showToast(`🖼️ Vista previa de ${file.name} cargada`);
      };
      reader.readAsDataURL(file);
    });
  });

  // Botón eliminar producto
  container.querySelectorAll(".config-prod-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index, 10);
      if (isNaN(idx)) return;
      configEditingProducts.splice(idx, 1);
      renderConfigProductsList();
    });
  });
}

/**
 * Agrega un nuevo producto en blanco a la lista de edición
 */
function addNewProductToConfig() {
  const categories = getActiveCategories().filter(c => c.toLowerCase() !== "todos");
  const newId = configEditingProducts.length > 0 
    ? Math.max(...configEditingProducts.map(p => p.id || 0)) + 1 
    : 1;

  configEditingProducts.unshift({
    id: newId,
    nombre: "Nuevo Producto",
    descripcion: "Descripción del nuevo plato delicioso",
    precio: 250,
    categoria: categories[0] || "Hamburguesas",
    imagen: "images/hamburguesa-clasica.jpg",
    disponible: true
  });

  renderConfigProductsList();
  showToast("Nuevo producto añadido a la lista. Ajusta sus datos y presiona Guardar.");
}

/**
 * Guarda los cambios locales del panel en localStorage y actualiza la aplicación inmediatamente
 */
function saveConfigChanges() {
  const nameInput = document.getElementById("cfgBusinessName");
  const logoInput = document.getElementById("cfgLogo");
  const taglineInput = document.getElementById("cfgBusinessTagline");
  const whatsappInput = document.getElementById("cfgWhatsapp");
  const currencyInput = document.getElementById("cfgCurrency");
  const msgInput = document.getElementById("cfgMessageInitial");

  const activeCheck = document.getElementById("cfgDeliveryActive");
  const feeInput = document.getElementById("cfgDeliveryFee");
  const freeFromInput = document.getElementById("cfgDeliveryFreeFrom");
  const alwaysFreeCheck = document.getElementById("cfgDeliveryAlwaysFree");

  const currentCfg = getActiveConfig();

  const customConfig = {
    ...currentCfg,
    nombreNegocio: nameInput ? nameInput.value.trim() : currentCfg.nombreNegocio,
    logo: logoInput && logoInput.value.trim() !== "" ? logoInput.value.trim() : currentCfg.logo,
    descripcion: taglineInput ? taglineInput.value.trim() : currentCfg.descripcion,
    whatsapp: whatsappInput ? whatsappInput.value.trim() : currentCfg.whatsapp,
    moneda: currencyInput ? currencyInput.value.trim() : currentCfg.moneda,
    mensajePedido: msgInput ? msgInput.value.trim() : currentCfg.mensajePedido,
    delivery: {
      activo: activeCheck ? activeCheck.checked : true,
      costo: feeInput ? (parseFloat(feeInput.value) || 0) : 150,
      gratis: alwaysFreeCheck ? alwaysFreeCheck.checked : false,
      gratisDesde: freeFromInput && freeFromInput.value ? parseFloat(freeFromInput.value) : null
    },
    costoDelivery: feeInput ? (parseFloat(feeInput.value) || 0) : 150,
    deliveryGratis: alwaysFreeCheck ? alwaysFreeCheck.checked : false,
    deliveryGratisDesde: freeFromInput && freeFromInput.value ? parseFloat(freeFromInput.value) : null
  };

  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CONFIG, JSON.stringify(customConfig));
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRODUCTS, JSON.stringify(configEditingProducts));
  } catch (e) {
    console.error("Error al guardar configuración en localStorage:", e);
  }

  // Refrescar toda la aplicación
  renderBrandInfo();
  renderCategories();
  renderPaymentMethods();
  renderFooterSocials();
  renderProducts();
  updateCartUI();

  closeConfigModal();
  showToast("💾 ¡Cambios locales guardados con éxito!");
}

/**
 * Restaura la configuración original desde config.js (limpia localStorage)
 */
function restoreOriginalConfig() {
  if (!confirm("¿Deseas restaurar la configuración original definida en config.js? Se borrarán las modificaciones locales de este navegador.")) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
  } catch (e) {
    console.error("Error al limpiar configuración:", e);
  }

  currentCategory = "Todos";
  searchQuery = "";

  renderBrandInfo();
  renderCategories();
  renderPaymentMethods();
  renderFooterSocials();
  renderProducts();
  updateCartUI();

  closeConfigModal();
  showToast("🔄 Configuración restaurada desde config.js");
}

/* ==========================================================================
   9. PERSISTENCIA LOCAL DE USUARIO Y CARRITO
   ========================================================================== */

function saveCartToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (e) {
    console.warn("No se pudo guardar el carrito:", e);
  }
}

function loadCartFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CART);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn("Error al cargar carrito:", e);
    return [];
  }
}

function saveUserInfoToStorage(info) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
  } catch (e) {
    console.warn("No se pudo guardar info de usuario:", e);
  }
}

function restoreSavedUserInfo() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!data) return;

    const info = JSON.parse(data);
    const nameInput = document.getElementById("clientName");
    const phoneInput = document.getElementById("clientPhone");
    const addressInput = document.getElementById("clientAddress");
    const sectorInput = document.getElementById("clientSector");

    if (nameInput && info.name) nameInput.value = info.name;
    if (phoneInput && info.phone) phoneInput.value = info.phone;
    if (addressInput && info.address) addressInput.value = info.address;
    if (sectorInput && info.sector) sectorInput.value = info.sector;
  } catch (e) {
    console.warn("Error al recuperar datos guardados del usuario:", e);
  }
}

/* ==========================================================================
   10. EVENTOS GLOBALES Y BÚSQUEDA
   ========================================================================== */

function bindGlobalEvents() {
  // Buscador de productos
  const searchInput = document.getElementById("searchInput");
  const searchClearBtn = document.getElementById("searchClearBtn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) {
        if (searchQuery.length > 0) {
          searchClearBtn.classList.add("visible");
        } else {
          searchClearBtn.classList.remove("visible");
        }
      }
      renderProducts();
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      searchQuery = "";
      searchClearBtn.classList.remove("visible");
      renderProducts();
    });
  }

  // Modales del carrito
  const headerCartBtn = document.getElementById("headerCartBtn");
  const bottomOpenCartBtn = document.getElementById("bottomOpenCartBtn");
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");
  const cartBackdrop = document.getElementById("cartModalBackdrop");

  if (headerCartBtn) headerCartBtn.addEventListener("click", openCartModal);
  if (bottomOpenCartBtn) bottomOpenCartBtn.addEventListener("click", openCartModal);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeCartModal);
  if (cartBackdrop) cartBackdrop.addEventListener("click", closeCartModal);

  // Autenticación previa para panel de configuración
  const authCloseBtn = document.getElementById("authCloseBtn");
  const authBackdrop = document.getElementById("authModalBackdrop");
  const btnAuthCancel = document.getElementById("btnAuthCancel");
  const authForm = document.getElementById("authForm");
  const btnTogglePassword = document.getElementById("btnTogglePassword");

  if (authCloseBtn) authCloseBtn.addEventListener("click", closeAuthModal);
  if (btnAuthCancel) btnAuthCancel.addEventListener("click", closeAuthModal);
  if (authBackdrop) authBackdrop.addEventListener("click", closeAuthModal);
  if (authForm) authForm.addEventListener("submit", verifyAdminPassword);

  if (btnTogglePassword) {
    btnTogglePassword.addEventListener("click", () => {
      const input = document.getElementById("adminPasswordInput");
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        btnTogglePassword.textContent = "🙈";
      } else {
        input.type = "password";
        btnTogglePassword.textContent = "👁️";
      }
    });
  }

  // Logo: eventos de entrada y subida de archivo
  const cfgLogoInput = document.getElementById("cfgLogo");
  const cfgLogoFileInput = document.getElementById("cfgLogoFileInput");
  const cfgLogoFileNote = document.getElementById("cfgLogoFileNote");

  if (cfgLogoInput) {
    cfgLogoInput.addEventListener("input", (e) => {
      updateConfigLogoPreview(e.target.value);
    });
  }

  if (cfgLogoFileInput) {
    cfgLogoFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        const dataUrl = event.target.result;
        if (cfgLogoInput) {
          cfgLogoInput.value = dataUrl;
        }
        updateConfigLogoPreview(dataUrl);
        if (cfgLogoFileNote) {
          cfgLogoFileNote.innerHTML = `⚠️ <em>Vista previa del logo cargada (${file.name}). Al presionar Guardar se reflejará en este navegador. Para GitHub Pages coloca el archivo en <code>images/${file.name}</code>.</em>`;
        }
        showToast(`🖼️ Logo "${file.name}" cargado`);
      };
      reader.readAsDataURL(file);
    });
  }

  // Modales de configuración
  const headerConfigBtn = document.getElementById("headerConfigBtn");
  const configCloseBtn = document.getElementById("configDrawerCloseBtn");
  const configBackdrop = document.getElementById("configModalBackdrop");
  const btnSaveConfig = document.getElementById("btnSaveConfig");
  const btnRestoreConfig = document.getElementById("btnRestoreOriginalConfig");
  const btnAddNewProd = document.getElementById("btnAddNewProductModal");

  // Al presionar Configuración, ahora se solicita primero la contraseña
  if (headerConfigBtn) headerConfigBtn.addEventListener("click", openAuthModal);
  if (configCloseBtn) configCloseBtn.addEventListener("click", closeConfigModal);
  if (configBackdrop) configBackdrop.addEventListener("click", closeConfigModal);
  if (btnSaveConfig) btnSaveConfig.addEventListener("click", saveConfigChanges);
  if (btnRestoreConfig) btnRestoreConfig.addEventListener("click", restoreOriginalConfig);
  if (btnAddNewProd) btnAddNewProd.addEventListener("click", addNewProductToConfig);

  // Cerrar modales con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAuthModal();
      closeCartModal();
      closeConfigModal();
    }
  });

  // Botón Enviar Pedido por WhatsApp
  const btnSendWhatsapp = document.getElementById("btnSendWhatsapp");
  if (btnSendWhatsapp) {
    btnSendWhatsapp.addEventListener("click", handleCheckout);
  }
}

/* ==========================================================================
   11. UTILIDADES
   ========================================================================== */

function formatPrice(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "0";
  return amount.toLocaleString("es-DO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2600);
}
