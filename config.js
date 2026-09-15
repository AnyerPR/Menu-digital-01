/**
 * ==============================================================================
 * CONFIG.JS - ARCHIVO DE CONFIGURACIÓN DEL MENÚ Y NEGOCIO
 * ==============================================================================
 * ¡Edita este archivo fácilmente sin tocar el código HTML ni JavaScript!
 * 
 * ¿CÓMO HACER CAMBIOS?:
 * 1. Para cambiar textos o precios, solo edita lo que está entre comillas o los números.
 * 2. Para agregar imágenes locales: colócalas en la carpeta "images/" y escribe su ruta aquí (ej: "images/mi-foto.jpg").
 * 3. Guarda el archivo y recarga tu página (o publica en GitHub Pages).
 */

const CONFIG = {
    // 1. INFORMACIÓN DEL NEGOCIO
    nombreNegocio: "Food Truck KimerA",
    descripcion: "Hamburguesas, Chimi Sandwiches, Yaroas y Wraps Burritos con el auténtico sabor de la casa",
    whatsapp: "8094315259", // Número oficial del menú: 809-431-5259
    moneda: "RD$",
    logo: "images/logo.png", // Logo Food Truck KimerA
    claveAdmin: "admin0012", // Clave para ingresar al panel de configuración rápida

    // 2. CONFIGURACIÓN DEL DELIVERY
    delivery: {
        activo: true,            // true = se cobra delivery / false = no se cobra (o solo retiro)
        costo: 0,              // Costo estándar de envío
        gratis: true,           // true = delivery gratis para todos los pedidos
        gratisDesde: 1500        // Monto mínimo para delivery gratis. Pon 0 o null si no aplica
    },

    // Atajos directos para mayor compatibilidad
    costoDelivery: 0,
    deliveryGratis: true,
    deliveryGratisDesde: 1500,

    // 3. MENSAJE INICIAL AL ABRIR WHATSAPP
    mensajePedido: "¡Hola Food Truck KimerA! Quiero realizar el siguiente pedido:",

    // 4. REDES SOCIALES (Si dejas el texto vacío "", no se mostrará el botón)
    redes: {
        instagram: "https://www.instagram.com/kimerafoodtruck?stkn=MXJkdDV3cjJodXdvcQ%3D%3D&utm_source=qr",
        facebook: "",
        tiktok: ""
    },

    // 5. MÉTODOS DE PAGO
    metodosPago: [
        "💵 Efectivo",
        "🏦 Transferencia",
        "📱 Pago móvil"
    ]
};

// 6. CATEGORÍAS DEL MENÚ FÍSICO
const CATEGORIAS = [
    "Todos",
    "Hamburguesas",
    "Chimi Sandwich",
    "Yaroa",
    "Wraps Burritos"
];

// 7. PRODUCTOS EXTRAÍDOS FIELMENTE DEL MENÚ FÍSICO
const PRODUCTOS = [
    // --- CATEGORÍA: HAMBURGUESAS ---
    {
        id: 1,
        nombre: "La Campesina",
        descripcion: "Doble carne, queso gouda, huevo, tocineta y salsa de hongos. Acompañado de papas fritas.",
        precio: 475,
        categoria: "Hamburguesas",
        imagen: "images/la-campesina.jpg",
        disponible: true
    },
    {
        id: 2,
        nombre: "La Sureña",
        descripcion: "Doble carne, queso americano, coleslaw, tocineta y salsa BBQ. Acompañado de papas fritas.",
        precio: 500,
        categoria: "Hamburguesas",
        imagen: "images/la-surena.jpg",
        disponible: true
    },
    {
        id: 3,
        nombre: "Smash Burguer",
        descripcion: "Doble carne, queso americano, lechuga, tomate, cebolla roja y salsa rosada de la casa. Acompañado de papas fritas.",
        precio: 350,
        categoria: "Hamburguesas",
        imagen: "images/smash-burguer.jpg",
        disponible: true
    },

    // --- CATEGORÍA: CHIMI SANDWICH ---
    {
        id: 4,
        nombre: "Chimi De Pollo",
        descripcion: "Pollo 8oz, coleslaw, tomate, cebolla roja y salsa rosada de la casa en pan de agua. Acompañado de papas fritas.",
        precio: 300,
        categoria: "Chimi Sandwich",
        imagen: "images/chimi-de-pollo.jpg",
        disponible: true
    },
    {
        id: 5,
        nombre: "Chimi Original",
        descripcion: "Carne de chimi artesanal, coleslaw, lechuga, tomate, cebolla roja y salsa rosada de la casa en pan de agua. Acompañado de papas fritas.",
        precio: 300,
        categoria: "Chimi Sandwich",
        imagen: "images/chimi-original.jpg",
        disponible: true
    },
    {
        id: 6,
        nombre: "Club Sandwich",
        descripcion: "Carne de res 4oz o pollo 5oz, queso cheddar, lechuga, tomate, cebolla roja y salsa rosada de la casa. Acompañado de papas fritas.",
        precio: 500,
        categoria: "Chimi Sandwich",
        imagen: "images/club-sandwich.jpg",
        disponible: true
    },

    // --- CATEGORÍA: YAROA ---
    {
        id: 7,
        nombre: "Yaroa Grande",
        descripcion: "Pollo 1 libra, queso gouda, mayonesa, ketchup y queso fundido sobre cama de papas fritas.",
        precio: 550,
        categoria: "Yaroa",
        imagen: "images/yaroa.jpg",
        disponible: true
    },
    {
        id: 8,
        nombre: "Yaroa Medina",
        descripcion: "Pollo 10 oz, queso gouda, mayonesa, ketchup y queso fundido sobre cama de papas fritas.",
        precio: 450,
        categoria: "Yaroa",
        imagen: "images/yaroa.jpg",
        disponible: true
    },
    {
        id: 9,
        nombre: "Yaroa Pequeña",
        descripcion: "Pollo 1/2 libra, queso gouda, mayonesa, ketchup y queso fundido sobre cama de papas fritas.",
        precio: 350,
        categoria: "Yaroa",
        imagen: "images/yaroa.jpg",
        disponible: true
    },

    // --- CATEGORÍA: WRAPS BURRITOS ---
    {
        id: 10,
        nombre: "Wrap De Pollo",
        descripcion: "Pollo 8oz, queso gouda, lechuga, tomate, cebolla roja y salsa rosada de la casa en tortilla tostada. Acompañado de papas fritas.",
        precio: 350,
        categoria: "Wraps Burritos",
        imagen: "images/wrap-pollo.jpg",
        disponible: true
    },
    {
        id: 11,
        nombre: "Wrap De Res",
        descripcion: "Carne de res 6oz, queso americano, lechuga, tomate, cebolla roja y salsa rosada de la casa en tortilla tostada. Acompañado de papas fritas.",
        precio: 350,
        categoria: "Wraps Burritos",
        imagen: "images/wrap-res.jpg",
        disponible: true
    },
    {
        id: 12,
        nombre: "Wrap Slow",
        descripcion: "Carne de res 4oz, pollo 5oz, queso americano, coleslaw, lechuga, tomate, cebolla roja y salsa rosada de la casa. Acompañado de papas fritas.",
        precio: 450,
        categoria: "Wraps Burritos",
        imagen: "images/wrap-slow.jpg",
        disponible: true
    }
];

// Hacer variables accesibles en window para navegadores estándar
if (typeof window !== "undefined") {
    window.CONFIG = CONFIG;
    window.CATEGORIAS = CATEGORIAS;
    window.PRODUCTOS = PRODUCTOS;
}
