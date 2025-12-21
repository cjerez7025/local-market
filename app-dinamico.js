/* ============================================
   LIQUIDACIÓN TOTAL - APP DINÁMICO
   Sistema flexible para cargar productos desde diferentes fuentes
   ============================================ */

// ============================================
// CONFIGURACIÓN - Elige tu método de datos
// ============================================
const CONFIG = {
    // Opciones: 'local', 'csv', 'google-sheets', 'json-remoto'
    dataSource: 'google-sheets',
    
    // URLs de fuentes de datos remotas
    googleSheetsURL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRKBUF62AqdhPNNmI_vv4aqaQsDCv0p4EHrBObytWDcs2_GPyHjJ3bbnaOpv53JBQ7dZtq6luYCl2yJ/pub?gid=0&single=true&output=csv',
    jsonURL: 'https://tu-servidor.com/productos.json',
    csvURL: 'productos.csv',
    
    // Configuración de imágenes
    imageBase: 'https://lh3.googleusercontent.com/d/', // Servidor alternativo de Google
    // imageBase: 'https://drive.google.com/uc?export=view&id=', // Original
    // imageBase: 'https://tu-cdn.com/images/', // Para CDN personalizado
    // imageBase: 'assets/products/', // Para imágenes locales
};

// ============================================
// DATOS LOCALES (Backup o modo offline)
// ============================================
const productosLocal = [
    {
        id: 1,
        nombre: "Sofá Seccional Gris",
        precio: 250000,
        categoria: "muebles",
        estado: "como nuevo",
        descripcionCorta: "Sofá esquinero de 5 puestos en excelente estado",
        descripcionLarga: "Sofá seccional en forma de L, tapizado en tela gris de alta calidad. Muy cómodo y espacioso, perfecto para living grandes. Incluye cojines decorativos. Sin manchas ni desgaste visible.",
        // Para Google Drive: usa IDs de archivo
        imagenes: [
            "1ABC123xyz", // Reemplaza con tu ID de Google Drive
            "2DEF456uvw"
        ],
        // O URLs completas
        // imagenes: [
        //     "https://drive.google.com/uc?export=view&id=1ABC123xyz",
        //     "https://i.imgur.com/imagen.jpg"
        // ],
        ubicacion: "Ñuñoa, RM",
        entrega: "Solo retiro en domicilio",
        disponibilidad: "disponible",
        fechaPublicacion: "2024-12-15",
        destacado: true
    },
    // ... más productos
];

// ============================================
// VARIABLE GLOBAL DE PRODUCTOS
// ============================================
let productos = [];

// ============================================
// CARGAR PRODUCTOS SEGÚN CONFIGURACIÓN
// ============================================
async function cargarProductos() {
    try {
        switch(CONFIG.dataSource) {
            case 'google-sheets':
                productos = await cargarDesdeGoogleSheets();
                break;
            case 'csv':
                productos = await cargarDesdeCSV();
                break;
            case 'json-remoto':
                productos = await cargarDesdeJSONRemoto();
                break;
            case 'local':
            default:
                productos = productosLocal;
        }
        
        console.log(`✅ ${productos.length} productos cargados desde: ${CONFIG.dataSource}`);
        return productos;
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        // Fallback a datos locales
        productos = productosLocal;
        return productos;
    }
}

// ============================================
// CARGAR DESDE GOOGLE SHEETS
// ============================================
async function cargarDesdeGoogleSheets() {
    const response = await fetch(CONFIG.googleSheetsURL);
    const csv = await response.text();
    return parseCSVToProducts(csv);
}

// ============================================
// CARGAR DESDE CSV LOCAL
// ============================================
async function cargarDesdeCSV() {
    const response = await fetch(CONFIG.csvURL);
    const csv = await response.text();
    return parseCSVToProducts(csv);
}

// ============================================
// CARGAR DESDE JSON REMOTO
// ============================================
async function cargarDesdeJSONRemoto() {
    const response = await fetch(CONFIG.jsonURL);
    const data = await response.json();
    return data.productos || data;
}

// ============================================
// PARSER CSV A PRODUCTOS
// ============================================
function parseCSVToProducts(csv) {
    const lines = csv.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        const producto = { id: index + 1 };
        
        headers.forEach((header, i) => {
            const value = values[i]?.trim() || '';
            
            // Conversión de tipos
            switch(header.toLowerCase()) {
                case 'precio':
                    producto.precio = parseFloat(value) || 0;
                    break;
                case 'imagenes':
                    // Espera IDs separados por pipe: "id1|id2|id3"
                    producto.imagenes = value.split('|').map(id => id.trim()).filter(Boolean);
                    break;
                case 'destacado':
                    producto.destacado = value.toLowerCase() === 'true' || value === '1';
                    break;
                default:
                    producto[header.toLowerCase().replace(/\s+/g, '')] = value;
            }
        });
        
        return producto;
    });
}

// Parse CSV considerando comillas
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result.map(val => val.replace(/^"|"$/g, ''));
}

// ============================================
// PROCESAR URLs DE IMÁGENES
// ============================================
function getImageURL(imagen) {
    // Si ya es una URL completa, retornarla
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
        return imagen;
    }
    
    // Si es un ID de Google Drive
    if (CONFIG.imageBase.includes('drive.google.com')) {
        return `${CONFIG.imageBase}${imagen}`;
    }
    
    // Para rutas locales o CDN
    return `${CONFIG.imageBase}${imagen}`;
}

// ============================================
// FUNCIONES AUXILIARES (sin cambios)
// ============================================
function formatPrice(price) {
    return `$${price.toLocaleString('es-CL')}`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatWhatsApp(numero) {
    // Convierte 56942229660 a +56 9 4222 9660
    if (!numero) return '';
    const num = numero.toString();
    if (num.startsWith('56') && num.length === 11) {
        return `+56 ${num.substring(2, 3)} ${num.substring(3, 7)} ${num.substring(7)}`;
    }
    return `+${num}`;
}

function generateWhatsAppMessage(producto) {
    const mensaje = `Hola, me interesa: *${producto.nombre}* (${formatPrice(producto.precio)}). ¿Sigue disponible?`;
    // Usar WhatsApp del vendedor si existe, sino usar el general
    const whatsapp = producto.whatsappvendedor || producto.whatsapp_vendedor || '56942229660';
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

function getStatusBadgeHTML(producto) {
    const badges = [];
    
    if (producto.disponibilidad === 'vendido') {
        badges.push('<span class="badge-status badge-vendido">Vendido</span>');
    } else if (producto.disponibilidad === 'reservado') {
        badges.push('<span class="badge-status badge-reservado">Reservado</span>');
    }
    
    const estadoMap = {
        'nuevo': 'badge-nuevo',
        'como nuevo': 'badge-como-nuevo',
        'usado': 'badge-usado'
    };
    
    badges.push(`<span class="badge-status ${estadoMap[producto.estado]}">${capitalize(producto.estado)}</span>`);
    
    return badges.join('');
}

// ============================================
// CREAR CARD DE PRODUCTO (Actualizado)
// ============================================
function createProductCard(producto) {
    const imagenPrincipal = producto.imagenes && producto.imagenes.length > 0 
        ? getImageURL(producto.imagenes[0]) 
        : 'https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto';
    
    const disponible = producto.disponibilidad === 'disponible';
    const numImagenes = producto.imagenes ? producto.imagenes.length : 0;
    
    return `
        <div class="col-md-6 col-lg-4" data-aos="fade-up">
            <div class="product-card">
                <div class="product-image-wrapper">
                    <img src="${imagenPrincipal}" 
                         alt="${producto.nombre}" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.src='https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto'">
                    <div class="product-badges">
                        ${getStatusBadgeHTML(producto)}
                    </div>
                    ${numImagenes > 1 ? `
                    <div class="photo-count-badge">
                        <i class="bi bi-images"></i> ${numImagenes} fotos
                    </div>
                    ` : ''}
                </div>
                <div class="product-body">
                    <div class="product-category">${capitalize(producto.categoria)}</div>
                    <h3 class="product-title">${producto.nombre}</h3>
                    <p class="product-description">${producto.descripcionCorta}</p>
                    ${producto.vendedor ? `
                    <div class="product-seller-info">
                        <div class="seller-name">
                            <i class="bi bi-person-circle"></i> ${producto.vendedor}
                        </div>
                        <a href="${generateWhatsAppMessage(producto)}" 
                           class="seller-whatsapp" 
                           target="_blank"
                           onclick="event.stopPropagation();">
                            <i class="bi bi-whatsapp"></i> ${formatWhatsApp(producto.whatsappvendedor || producto.whatsapp_vendedor || '56942229660')}
                        </a>
                    </div>
                    ` : ''}
                    <div class="product-meta">
                        <span><i class="bi bi-geo-alt"></i> ${producto.comuna}${producto.region ? `, ${producto.region}` : ''}</span>
                        <span><i class="bi bi-truck"></i> ${producto.entrega}</span>
                    </div>
                    <div class="product-footer">
                        <div class="product-price">${formatPrice(producto.precio)}</div>
                        <div class="product-actions">
                            <button class="btn btn-primary btn-sm" 
                                    onclick="openProductModal(${producto.id})"
                                    ${!disponible ? 'disabled' : ''}>
                                Ver Detalle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// MODAL DE PRODUCTO (Actualizado)
// ============================================
function openProductModal(productId) {
    const producto = productos.find(p => p.id === productId);
    if (!producto) return;
    
    const carouselInner = document.getElementById('modalCarouselInner');
    const numImagenes = producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes.length : 0;
    
    // Crear slides del carrusel
    const imagenesHTML = numImagenes > 0 
        ? producto.imagenes.map((img, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img src="${getImageURL(img)}" 
                     alt="${producto.nombre}" 
                     onerror="this.src='https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto'">
            </div>
        `).join('')
        : `
            <div class="carousel-item active">
                <img src="https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto" alt="${producto.nombre}">
            </div>
        `;
    
    carouselInner.innerHTML = imagenesHTML;
    
    // Mostrar/ocultar controles del carrusel según número de imágenes
    const carouselControls = document.querySelectorAll('#modalCarousel .carousel-control-prev, #modalCarousel .carousel-control-next');
    carouselControls.forEach(control => {
        if (numImagenes <= 1) {
            control.style.display = 'none';
        } else {
            control.style.display = 'flex';
        }
    });
    
    // Crear indicadores (dots) si hay más de 1 imagen
    const carouselElement = document.getElementById('modalCarousel');
    let indicatorsHTML = '';
    
    if (numImagenes > 1) {
        const indicators = producto.imagenes.map((_, index) => `
            <button type="button" 
                    data-bs-target="#modalCarousel" 
                    data-bs-slide-to="${index}" 
                    ${index === 0 ? 'class="active" aria-current="true"' : ''}
                    aria-label="Imagen ${index + 1}">
            </button>
        `).join('');
        
        indicatorsHTML = `<div class="carousel-indicators">${indicators}</div>`;
    }
    
    // Insertar indicadores si no existen
    const existingIndicators = carouselElement.querySelector('.carousel-indicators');
    if (existingIndicators) {
        existingIndicators.remove();
    }
    if (indicatorsHTML) {
        carouselInner.insertAdjacentHTML('beforebegin', indicatorsHTML);
    }
    
    // Actualizar información del producto
    document.getElementById('modalBadge').innerHTML = getStatusBadgeHTML(producto);
    document.getElementById('modalTitle').textContent = producto.nombre;
    document.getElementById('modalPrice').textContent = formatPrice(producto.precio);
    document.getElementById('modalCategoria').textContent = capitalize(producto.categoria);
    document.getElementById('modalEstado').textContent = capitalize(producto.estado);
    document.getElementById('modalUbicacion').textContent = producto.ubicacion;
    document.getElementById('modalEntrega').textContent = producto.entrega;
    document.getElementById('modalDescripcion').textContent = producto.descripcionLarga || producto.descripcionCorta;
    
    // Actualizar vendedor si existe el elemento en el DOM
    const vendedorElement = document.getElementById('modalVendedor');
    if (vendedorElement) {
        vendedorElement.textContent = producto.vendedor || 'Local Market';
    }
    
    // Agregar contador de fotos en el modal
    const modalPriceSection = document.querySelector('.modal-price-section');
    const existingPhotoCount = modalPriceSection ? modalPriceSection.querySelector('.modal-photo-count') : null;
    if (existingPhotoCount) {
        existingPhotoCount.remove();
    }
    if (numImagenes > 1 && modalPriceSection) {
        modalPriceSection.insertAdjacentHTML('afterend', `
            <div class="modal-photo-count">
                <i class="bi bi-images"></i> ${numImagenes} fotografías disponibles
            </div>
        `);
    }
    
    // Actualizar botón de WhatsApp
    const whatsappBtn = document.getElementById('modalWhatsApp');
    whatsappBtn.href = generateWhatsAppMessage(producto);
    
    if (producto.disponibilidad !== 'disponible') {
        whatsappBtn.classList.add('disabled');
        whatsappBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>No Disponible';
    } else {
        whatsappBtn.classList.remove('disabled');
        whatsappBtn.innerHTML = '<i class="bi bi-whatsapp me-2"></i>Contactar por WhatsApp';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// ============================================
// FILTRADO Y BÚSQUEDA (sin cambios)
// ============================================
let filteredProducts = [];

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoria = document.getElementById('categoryFilter')?.value || '';
    const estado = document.getElementById('estadoFilter')?.value || '';
    const region = document.getElementById('regionFilter')?.value || '';
    const comuna = document.getElementById('comunaFilter')?.value || '';
    const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
    const hideSold = document.getElementById('hideSold')?.checked || false;
    
    filteredProducts = productos.filter(producto => {
        const matchesSearch = searchTerm === '' || 
            producto.nombre.toLowerCase().includes(searchTerm) ||
            (producto.descripcionCorta || '').toLowerCase().includes(searchTerm) ||
            (producto.descripcionLarga || '').toLowerCase().includes(searchTerm);
        
        const matchesCategory = categoria === '' || producto.categoria === categoria;
        const matchesEstado = estado === '' || producto.estado === estado;
        const matchesRegion = region === '' || producto.region === region;
        const matchesComuna = comuna === '' || producto.comuna === comuna;
        const matchesPrice = producto.precio >= minPrice && producto.precio <= maxPrice;
        const matchesAvailability = !hideSold || producto.disponibilidad !== 'vendido';
        
        return matchesSearch && matchesCategory && matchesEstado && matchesRegion && matchesComuna && matchesPrice && matchesAvailability;
    });
    
    applySorting();
    renderProducts();
    updateComunaFilter(); // Actualizar comunas disponibles según región
}

function applySorting() {
    const sortBy = document.getElementById('sortBy')?.value || 'fecha-desc';
    
    filteredProducts.sort((a, b) => {
        // PRIORIDAD 1: Productos destacados primero
        const aDestacado = a.destacado === true || a.destacado === 'true' || a.destacado === 'TRUE';
        const bDestacado = b.destacado === true || b.destacado === 'true' || b.destacado === 'TRUE';
        
        if (aDestacado && !bDestacado) return -1;
        if (!aDestacado && bDestacado) return 1;
        
        // PRIORIDAD 2: Criterio de ordenamiento seleccionado
        switch(sortBy) {
            case 'precio-asc':
                return a.precio - b.precio;
            case 'precio-desc':
                return b.precio - a.precio;
            case 'nombre':
                return a.nombre.localeCompare(b.nombre);
            case 'fecha-desc':
            default:
                return new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0);
        }
    });
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const resultCount = document.getElementById('resultCount');
    
    if (!grid) return;
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.classList.remove('d-none');
        if (resultCount) resultCount.textContent = 'Sin resultados';
    } else {
        grid.innerHTML = filteredProducts.map(p => createProductCard(p)).join('');
        if (noResults) noResults.classList.add('d-none');
        if (resultCount) {
            resultCount.textContent = `${filteredProducts.length} artículo${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`;
        }
    }
    
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

function clearFilters() {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('categoryFilter')) document.getElementById('categoryFilter').value = '';
    if (document.getElementById('estadoFilter')) document.getElementById('estadoFilter').value = '';
    if (document.getElementById('regionFilter')) document.getElementById('regionFilter').value = '';
    if (document.getElementById('comunaFilter')) document.getElementById('comunaFilter').value = '';
    if (document.getElementById('minPrice')) document.getElementById('minPrice').value = '';
    if (document.getElementById('maxPrice')) document.getElementById('maxPrice').value = '';
    if (document.getElementById('sortBy')) document.getElementById('sortBy').value = 'fecha-desc';
    if (document.getElementById('hideSold')) document.getElementById('hideSold').checked = true;
    
    applyFilters();
}

// ============================================
// ACTUALIZAR COMUNAS SEGÚN REGIÓN
// ============================================
function updateComunaFilter() {
    const regionFilter = document.getElementById('regionFilter');
    const comunaFilter = document.getElementById('comunaFilter');
    
    if (!regionFilter || !comunaFilter) return;
    
    const selectedRegion = regionFilter.value;
    
    // Obtener comunas únicas de la región seleccionada (o todas si no hay filtro)
    const comunas = [...new Set(
        productos
            .filter(p => selectedRegion === '' || p.region === selectedRegion)
            .map(p => p.comuna)
            .filter(c => c) // Filtrar valores undefined/null
            .sort()
    )];
    
    // Actualizar opciones del select de comunas
    comunaFilter.innerHTML = '<option value="">Todas las comunas</option>' +
        comunas.map(comuna => `<option value="${comuna}">${comuna}</option>`).join('');
}

// ============================================
// CARRUSEL DE PRODUCTOS DESTACADOS
// ============================================
function loadFeaturedProducts() {
    const container = document.getElementById('featuredProductsContainer');
    const indicators = document.getElementById('featuredIndicators');
    
    if (!container) return; // Solo cargar si estamos en la página principal
    
    // Filtrar productos destacados
    const featured = productos.filter(p => 
        p.destacado === true || 
        p.destacado === 'true' || 
        p.destacado === 'TRUE'
    );
    
    if (featured.length === 0) {
        // Si no hay destacados, mostrar mensaje
        container.innerHTML = `
            <div class="carousel-item active">
                <div class="text-center py-5">
                    <i class="bi bi-star" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="mt-3 text-muted">No hay productos destacados disponibles</p>
                </div>
            </div>
        `;
        if (indicators) indicators.innerHTML = '';
        return;
    }
    
    // Agrupar productos de 3 en 3 para el carrusel (responsive)
    const itemsPerSlide = window.innerWidth < 768 ? 1 : (window.innerWidth < 992 ? 2 : 3);
    const slides = [];
    
    for (let i = 0; i < featured.length; i += itemsPerSlide) {
        slides.push(featured.slice(i, i + itemsPerSlide));
    }
    
    // Crear slides del carrusel
    container.innerHTML = slides.map((slideProducts, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <div class="row g-4 px-3">
                ${slideProducts.map(producto => createFeaturedCard(producto)).join('')}
            </div>
        </div>
    `).join('');
    
    // Crear indicadores
    if (indicators && slides.length > 1) {
        indicators.innerHTML = slides.map((_, index) => `
            <button type="button" 
                    data-bs-target="#featuredCarousel" 
                    data-bs-slide-to="${index}" 
                    ${index === 0 ? 'class="active" aria-current="true"' : ''}
                    aria-label="Slide ${index + 1}">
            </button>
        `).join('');
    }
}

function createFeaturedCard(producto) {
    const imagenPrincipal = producto.imagenes && producto.imagenes.length > 0 
        ? getImageURL(producto.imagenes[0]) 
        : 'https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto';
    
    const disponible = producto.disponibilidad === 'disponible';
    const numImagenes = producto.imagenes ? producto.imagenes.length : 0;
    
    return `
        <div class="col-md-6 col-lg-4">
            <div class="featured-product-card">
                <div class="featured-badge">
                    <i class="bi bi-star-fill"></i> DESTACADO
                </div>
                <div class="featured-image-wrapper">
                    <img src="${imagenPrincipal}" 
                         alt="${producto.nombre}" 
                         class="featured-image"
                         onerror="this.src='https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto'">
                    ${numImagenes > 1 ? `
                    <div class="photo-count-badge">
                        <i class="bi bi-images"></i> ${numImagenes} fotos
                    </div>
                    ` : ''}
                </div>
                <div class="featured-body">
                    <div class="featured-category">${capitalize(producto.categoria)}</div>
                    <h3 class="featured-title">${producto.nombre}</h3>
                    <p class="featured-description">${producto.descripcionCorta || ''}</p>
                    ${producto.vendedor ? `
                    <div class="featured-seller">
                        <i class="bi bi-person-circle"></i> ${producto.vendedor}
                    </div>
                    ` : ''}
                    <div class="featured-price">${formatPrice(producto.precio)}</div>
                    <div class="featured-actions">
                        <button class="btn btn-primary w-100" 
                                onclick="openProductModal(${producto.id})"
                                ${!disponible ? 'disabled' : ''}>
                            <i class="bi bi-eye me-2"></i>Ver Detalle
                        </button>
                        ${disponible && producto.vendedor ? `
                        <a href="${generateWhatsAppMessage(producto)}" 
                           class="btn btn-success w-100 mt-2" 
                           target="_blank">
                            <i class="bi bi-whatsapp me-2"></i>Contactar
                        </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// INICIALIZACIÓN
// ============================================
async function initCatalog() {
    if (!document.getElementById('productsGrid')) return;
    
    // Mostrar loading
    const grid = document.getElementById('productsGrid');
    if (grid) {
        grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-3">Cargando productos...</p></div>';
    }
    
    // Cargar productos
    await cargarProductos();
    
    // Aplicar filtro de categoría si viene por URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaParam = urlParams.get('categoria');
    if (categoriaParam && document.getElementById('categoryFilter')) {
        document.getElementById('categoryFilter').value = categoriaParam;
    }
    
    // Event listeners
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const estadoFilter = document.getElementById('estadoFilter');
    const regionFilter = document.getElementById('regionFilter');
    const comunaFilter = document.getElementById('comunaFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const sortBy = document.getElementById('sortBy');
    const hideSold = document.getElementById('hideSold');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (estadoFilter) estadoFilter.addEventListener('change', applyFilters);
    if (regionFilter) regionFilter.addEventListener('change', applyFilters);
    if (comunaFilter) comunaFilter.addEventListener('change', applyFilters);
    if (minPrice) minPrice.addEventListener('input', debounce(applyFilters, 500));
    if (maxPrice) maxPrice.addEventListener('input', debounce(applyFilters, 500));
    if (sortBy) sortBy.addEventListener('change', applyFilters);
    if (hideSold) hideSold.addEventListener('change', applyFilters);
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Renderizar
    applyFilters();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// CARGAR AL INICIO
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar productos globalmente
    await cargarProductos();
    
    // Cargar productos destacados en home (carrusel)
    const featuredContainer = document.getElementById('featuredProductsContainer');
    if (featuredContainer) {
        loadFeaturedProducts();
    }
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});