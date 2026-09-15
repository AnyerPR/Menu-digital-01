import express from 'express';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

function safeReadConfig() {
  try {
    const source = fs.readFileSync(path.join(ROOT_DIR, 'config.js'), 'utf8');
    const sandbox = { window: {}, globalThis: {} };
    vm.runInNewContext(`${source}; this.CONFIG = CONFIG; this.PRODUCTOS = PRODUCTOS; this.CATEGORIAS = CATEGORIAS;`, sandbox);
    return {
      CONFIG: sandbox.CONFIG || {},
      PRODUCTOS: sandbox.PRODUCTOS || [],
      CATEGORIAS: sandbox.CATEGORIAS || []
    };
  } catch (error) {
    console.warn('No se pudo leer config.js desde el servidor:', error.message);
    return { CONFIG: {}, PRODUCTOS: [], CATEGORIAS: [] };
  }
}

function normalizeProduct(product) {
  if (!product) return null;
  return {
    ...product,
    id: Number(product.id ?? 0),
    nombre: product.nombre || product.name || 'Producto',
    descripcion: product.descripcion || product.description || 'Producto disponible en el menú.',
    precio: Number(product.precio ?? product.price ?? 0),
    categoria: product.categoria || product.category || 'General',
    imagen: product.imagen || product.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80'
  };
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function getProducts() {
  const { PRODUCTOS } = safeReadConfig();
  return (PRODUCTOS || []).map(normalizeProduct).filter(Boolean);
}

function findProductById(productId) {
  const value = decodeURIComponent(String(productId || '')).trim();
  const products = getProducts();
  if (!products.length) return null;

  const numericId = Number(value);
  return products.find(product => {
    if (!Number.isNaN(numericId) && Number(product.id) === numericId) return true;
    if (String(product.id) === value) return true;
    if (slugify(product.nombre) === slugify(value)) return true;
    if (product.slug && slugify(product.slug) === slugify(value)) return true;
    return false;
  }) || null;
}

function toAbsoluteUrl(baseUrl, imagePath) {
  if (!imagePath) return baseUrl;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith('data:image/')) return imagePath;
  return new URL(imagePath.replace(/^\/+/, ''), `${baseUrl}/`).toString();
}

function renderProductPageHTML(product, baseUrl) {
  const name = product.nombre;
  const description = product.descripcion;
  const image = toAbsoluteUrl(baseUrl, product.imagen);
  const productUrl = `${baseUrl}/producto/${encodeURIComponent(String(product.id))}`;
  const storeName = 'Food Truck KimerA';
  const priceText = `RD$${Number(product.precio || 0).toLocaleString('es-DO')}`;

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name} | ${storeName}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${name}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${productUrl}" />
    <meta property="og:site_name" content="${storeName}" />
    <meta property="product:price:amount" content="${Number(product.precio || 0)}" />
    <meta property="product:price:currency" content="DOP" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${name}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${name}" />
    <link rel="canonical" href="${productUrl}" />
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #111827;
        color: #f8fafc;
      }
      .page {
        max-width: 960px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      .card {
        background: #1f2937;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 18px 40px rgba(0,0,0,0.25);
      }
      img {
        display: block;
        width: 100%;
        max-height: 480px;
        object-fit: cover;
      }
      .content {
        padding: 24px;
      }
      .tag {
        display: inline-block;
        background: #f97316;
        color: white;
        padding: 6px 10px;
        border-radius: 999px;
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 12px;
      }
      h1 {
        margin: 0 0 10px;
        font-size: clamp(2rem, 5vw, 3rem);
      }
      .price {
        font-size: 1.5rem;
        font-weight: 800;
        color: #fbbf24;
        margin: 12px 0;
      }
      p {
        color: #d1d5db;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="card">
        <img src="${image}" alt="${name}" />
        <div class="content">
          <div class="tag">${product.categoria}</div>
          <h1>${name}</h1>
          <div class="price">${priceText}</div>
          <p>${description}</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

const staticRoot = fs.existsSync(path.join(ROOT_DIR, 'dist')) ? path.join(ROOT_DIR, 'dist') : ROOT_DIR;

app.use(express.static(staticRoot, { index: false }));

app.get('/producto/:productId', (req, res) => {
  const product = findProductById(req.params.productId);
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  if (!product) {
    return res.status(404).send('Producto no encontrado');
  }

  return res.send(renderProductPageHTML(product, baseUrl));
});

app.get('*', (req, res, next) => {
  const requestPath = req.path || '/';
  if (requestPath.startsWith('/@') || requestPath.startsWith('/node_modules') || requestPath.startsWith('/src')) {
    return next();
  }

  const indexPath = path.join(staticRoot, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
