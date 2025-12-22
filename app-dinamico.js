/* ============================================
   LOCAL MARKET - APP DINÁMICO CORREGIDO
   Versión: 2.0 - Diciembre 2024
   ============================================ */

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    dataSource: 'google-sheets', // Opciones: 'local', 'csv', 'google-sheets', 'json-remoto'
    
    // URLs de fuentes de datos remotas
    googleSheetsURL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRKBUF62AqdhPNNmI_vv4aqaQsDCv0p4EHrBObytWDcs2_GPyHjJ3bbnaOpv53JBQ7dZtq6luYCl2yJ/pub?gid=0&single=true&output=csv',
    jsonURL: 'productos.json',
    csvURL: 'productos.csv',
    
    // Configuración de imágenes
    imageBase: 'https://lh3.googleusercontent.com/d/',
};

// ============================================
// DATOS LOCALES (Datos de respaldo)
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
        imagenes: [
            "https://placehold.co/800x600/5B7B5A/FFFFFF?text=Sofa+1",
            "https://placehold.co/800x600/5B7B5A/FFFFFF?text=Sofa+2"
        ],
        ubicacion: "Ñuñoa - RM",
        comuna: "Ñuñoa",
        region: "Metropolitana",
        entrega: "Solo retiro en domicilio",
        disponibilidad: "disponible",
        fechaPublicacion: "2024-12-15",
        destacado: true,
        vendedor: "María González",
        whatsappvendedor: "56942229660"
    },
    {
        id: 2,
        nombre: "Notebook HP i5 8GB RAM",
        precio: 350000,
        categoria: "electronica",
        estado: "como nuevo",
        descripcionCorta: "Laptop HP Pavilion 15 con procesador Intel i5",
        descripcionLarga: "Notebook HP Pavilion 15 pulgadas, procesador Intel Core i5 de 11va generación, 8GB RAM, 256GB SSD. Incluye cargador original y bolso de transporte.",
        imagenes: [
            "https://placehold.co/800x600/2196F3/FFFFFF?text=Notebook+1",
            "https://placehold.co/800x600/2196F3/FFFFFF?text=Notebook+2",
            "https://placehold.co/800x600/2196F3/FFFFFF?text=Notebook+3"
        ],
        ubicacion: "Providencia - RM",
        comuna: "Providencia",
        region: "Metropolitana",
        entrega: "Retiro o despacho (costo aparte)",
        disponibilidad: "disponible",
        fechaPublicacion: "2024-12-16",
        destacado: true,
        vendedor: "Carlos Muñoz",
        whatsappvendedor: "56943344556"
    },
    {
        id: 3,
        nombre: "Espejo Decorativo Dorado 120cm",
        precio: 85000,
        categoria: "decoracion",
        estado: "nuevo",
        descripcionCorta: "Espejo redondo con marco dorado de 120cm",
        descripcionLarga: "Espejo decorativo circular con elegante marco dorado envejecado. Diámetro 120cm. Perfecto para living o dormitorio.",
        imagenes: [
            "https://placehold.co/800x600/E91E63/FFFFFF?text=Espejo"
        ],
        ubicacion: "Pirque - RM",
        comuna: "Pirque",
        region: "Metropolitana",
        entrega: "Solo retiro en domicilio",
        disponibilidad: "disponible",
        fechaPublicacion: "2024-12-17",
        destacado: true,
        vendedor: "Local Market",
        whatsappvendedor: "56942229660"
    }
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
            
            switch(header.toLowerCase()) {
                case 'precio':
                    producto.precio = parseFloat(value) || 0;
                    break;
                case 'imagenes':
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
    if (!imagen) return 'https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto';
    
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
        return imagen;
    }
    
    if (CONFIG.imageBase.includes('drive.google.com')) {
        return `${CONFIG.imageBase}${imagen}`;
    }
    
    return `${CONFIG.imageBase}${imagen}`;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function formatPrice(price) {
    return `$${price.toLocaleString('es-CL')}`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatWhatsApp(numero) {
    if (!numero) return '';
    const num = numero.toString();
    if (num.startsWith('56') && num.length === 11) {
        return `+56 ${num.substring(2, 3)} ${num.substring(3, 7)} ${num.substring(7)}`;
    }
    return `+${num}`;
}

function generateWhatsAppMessage(producto) {
    const mensaje = `Hola, me interesa: *${producto.nombre}* (${formatPrice(producto.precio)}). ¿Sigue disponible?`;
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
    
    badges.push(`<span class="badge-status ${estadoMap[producto.estado] || 'badge-usado'}">${capitalize(producto.estado)}</span>`);
    
    return badges.join('');
}

// ============================================
// CREAR CARD DE PRODUCTO
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
                    <p class="product-description">${producto.descripcionCorta || ''}</p>
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
                        <span><i class="bi bi-geo-alt"></i> ${producto.comuna || producto.ubicacion}</span>
                        <span><i class="bi bi-truck"></i> ${producto.entrega}</span>
                    </div>
                    <div class="product-footer">
                        <div class="product-price">${formatPrice(producto.precio)}</div>
                        <div class="product-actions">
                            <button class="btn btn-primary btn-sm" 
                                    onclick="openProductModal('${producto.id}')"
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
// MODAL DE PRODUCTO - VERSIÓN CORREGIDA
// ============================================
function openProductModal(productId) {
    // Comparación flexible: los IDs de Google Sheets vienen como strings
    const producto = productos.find(p => p.id == productId || p.id === String(productId));
    if (!producto) {
        console.error('Producto no encontrado:', productId);
        console.log('IDs disponibles:', productos.map(p => p.id));
        return;
    }
    
    // Configurar carrusel de imágenes
    const carouselInner = document.getElementById('modalCarouselInner');
    const carouselIndicators = document.getElementById('modalCarouselIndicators');
    const numImagenes = producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes.length : 0;
    
    // Crear slides del carrusel
    if (numImagenes > 0) {
        carouselInner.innerHTML = producto.imagenes.map((img, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img src="${getImageURL(img)}" 
                     alt="${producto.nombre} - Imagen ${index + 1}" 
                     onerror="this.src='https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto'">
            </div>
        `).join('');
    } else {
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <img src="https://placehold.co/600x450/e8e8e8/666666?text=Sin+Foto" alt="${producto.nombre}">
            </div>
        `;
    }

    // Mostrar/ocultar controles del carrusel
    const carouselControls = document.querySelectorAll('#modalCarousel .carousel-control-prev, #modalCarousel .carousel-control-next');
    carouselControls.forEach(control => {
        control.style.display = (numImagenes > 1) ? 'flex' : 'none';
    });

    // Indicadores del carrusel
    if (carouselIndicators) {
        if (numImagenes > 1) {
            carouselIndicators.innerHTML = producto.imagenes.map((_, index) => `
                <button type="button"
                        data-bs-target="#modalCarousel"
                        data-bs-slide-to="${index}"
                        ${index === 0 ? 'class="active" aria-current="true"' : ''}
                        aria-label="Imagen ${index + 1}">
                </button>
            `).join('');
            carouselIndicators.style.display = '';
        } else {
            carouselIndicators.innerHTML = '';
            carouselIndicators.style.display = 'none';
        }
    }

    // Miniaturas
    const thumbsContainer = document.getElementById('modalThumbs');
    if (thumbsContainer) {
        if (numImagenes > 1) {
            thumbsContainer.innerHTML = producto.imagenes.map((img, index) => `
                <button type="button" 
                        class="thumb-btn ${index === 0 ? 'active' : ''}" 
                        data-index="${index}" 
                        aria-label="Ver imagen ${index + 1}">
                    <img class="thumb-img" 
                         src="${getImageURL(img)}" 
                         alt="${producto.nombre} ${index + 1}"
                         onerror="this.src='https://placehold.co/140x105/e8e8e8/666666?text=Sin+Foto'">
                </button>
            `).join('');
            thumbsContainer.classList.remove('d-none');
            
            // Bind click de miniaturas solo si no está ya bound
            if (!thumbsContainer.dataset.bound) {
                thumbsContainer.addEventListener('click', (e) => {
                    const btn = e.target.closest('.thumb-btn');
                    if (!btn) return;
                    
                    const idx = parseInt(btn.dataset.index, 10);
                    const carouselEl = document.getElementById('modalCarousel');
                    if (!carouselEl) return;
                    
                    const carousel = bootstrap.Carousel.getOrCreateInstance(carouselEl);
                    carousel.to(idx);
                });
                thumbsContainer.dataset.bound = '1';
            }
        } else {
            thumbsContainer.innerHTML = '';
            thumbsContainer.classList.add('d-none');
        }
    }

    // Reiniciar carrusel
    const carouselElement = document.getElementById('modalCarousel');
    if (carouselElement) {
        const carousel = bootstrap.Carousel.getOrCreateInstance(carouselElement, { 
            interval: false, 
            ride: false, 
            touch: true, 
            wrap: true 
        });
        carousel.to(0);

        // Sincronizar miniaturas al cambiar de imagen
        if (carouselElement._lmSlideHandler) {
            carouselElement.removeEventListener('slid.bs.carousel', carouselElement._lmSlideHandler);
        }
        
        carouselElement._lmSlideHandler = (ev) => {
            const activeIndex = (typeof ev.to === 'number') ? ev.to : 0;

            // Sync indicadores
            const ind = document.getElementById('modalCarouselIndicators');
            if (ind) {
                const buttons = ind.querySelectorAll('button[data-bs-slide-to]');
                buttons.forEach((b) => b.classList.remove('active'));
                const current = ind.querySelector(`button[data-bs-slide-to="${activeIndex}"]`);
                if (current) current.classList.add('active');
            }

            // Sync miniaturas
            const thumbs = document.getElementById('modalThumbs');
            if (thumbs) {
                const btns = thumbs.querySelectorAll('.thumb-btn');
                btns.forEach((b) => b.classList.remove('active'));
                if (btns[activeIndex]) btns[activeIndex].classList.add('active');
            }
        };
        
        carouselElement.addEventListener('slid.bs.carousel', carouselElement._lmSlideHandler);
    }

    // ============================================
    // ACTUALIZAR INFORMACIÓN DEL PRODUCTO
    // ============================================
    
    // Título
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = producto.nombre;

    // Precio
    const modalPrice = document.getElementById('modalPrice');
    if (modalPrice) modalPrice.textContent = formatPrice(producto.precio);

    // Meta información
    const modalMeta = document.getElementById('modalMeta');
    if (modalMeta) {
        modalMeta.innerHTML = `
            <div class="meta-item">
                <i class="bi bi-tag"></i>
                <span>${capitalize(producto.categoria)}</span>
            </div>
            <div class="meta-item">
                <i class="bi bi-star"></i>
                <span>${capitalize(producto.estado)}</span>
            </div>
            <div class="meta-item">
                <i class="bi bi-geo-alt"></i>
                <span>${producto.comuna || producto.ubicacion}${producto.region ? ', ' + producto.region : ''}</span>
            </div>
            <div class="meta-item">
                <i class="bi bi-truck"></i>
                <span>${producto.entrega}</span>
            </div>
        `;
    }

    // Descripción
    const modalDescription = document.getElementById('modalDescription');
    if (modalDescription) {
        modalDescription.textContent = producto.descripcionLarga || producto.descripcionCorta || '';
    }

    // Información del vendedor
    const modalVendor = document.getElementById('modalVendor');
    if (modalVendor && producto.vendedor) {
        modalVendor.innerHTML = `
            <h5 class="mb-3"><i class="bi bi-person-circle me-2"></i>Información del Vendedor</h5>
            <div class="contact-info">
                <div class="contact-item">
                    <i class="bi bi-person-fill"></i>
                    <span>${producto.vendedor}</span>
                </div>
                ${producto.whatsappvendedor || producto.whatsapp_vendedor ? `
                <div class="contact-item">
                    <i class="bi bi-whatsapp"></i>
                    <span>${formatWhatsApp(producto.whatsappvendedor || producto.whatsapp_vendedor)}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Acciones (botón WhatsApp)
    const modalActions = document.getElementById('modalActions');
    if (modalActions) {
        if (producto.disponibilidad === 'disponible') {
            modalActions.innerHTML = `
                <a href="${generateWhatsAppMessage(producto)}" 
                   class="btn btn-whatsapp btn-lg w-100" 
                   target="_blank">
                    <i class="bi bi-whatsapp me-2"></i>Contactar por WhatsApp
                </a>
            `;
        } else {
            modalActions.innerHTML = `
                <button class="btn btn-secondary btn-lg w-100" disabled>
                    Producto ${producto.disponibilidad}
                </button>
            `;
        }
    }

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// ============================================
// FILTRADO Y BÚSQUEDA
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
    const hideSold = document.getElementById('hideSold')?.checked !== false;
    
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
        
        return matchesSearch && matchesCategory && matchesEstado && matchesRegion && 
               matchesComuna && matchesPrice && matchesAvailability;
    });
    
    applySorting();
    renderProducts();
    updateComunaFilter();
}

function applySorting() {
    const sortBy = document.getElementById('sortBy')?.value || 'fecha-desc';
    
    filteredProducts.sort((a, b) => {
        // PRIORIDAD 1: Productos destacados primero
        const aDestacado = a.destacado === true || a.destacado === 'true' || a.destacado === 'TRUE';
        const bDestacado = b.destacado === true || b.destacado === 'true' || b.destacado === 'TRUE';
        
        if (aDestacado && !bDestacado) return -1;
        if (!aDestacado && bDestacado) return 1;
        
        // PRIORIDAD 2: Criterio de ordenamiento
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
    
    const comunas = [...new Set(
        productos
            .filter(p => selectedRegion === '' || p.region === selectedRegion)
            .map(p => p.comuna)
            .filter(c => c)
            .sort()
    )];
    
    comunaFilter.innerHTML = '<option value="">Todas las comunas</option>' +
        comunas.map(comuna => `<option value="${comuna}">${comuna}</option>`).join('');
}

// ============================================
// CARRUSEL DE PRODUCTOS DESTACADOS
// ============================================
function loadFeaturedProducts() {
    const container = document.getElementById('featuredProductsContainer');
    const indicators = document.getElementById('featuredIndicators');
    
    if (!container) return;
    
    const featured = productos.filter(p => 
        p.destacado === true || 
        p.destacado === 'true' || 
        p.destacado === 'TRUE'
    );
    
    if (featured.length === 0) {
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
    
    const itemsPerSlide = window.innerWidth < 768 ? 1 : (window.innerWidth < 992 ? 2 : 3);
    const slides = [];
    
    for (let i = 0; i < featured.length; i += itemsPerSlide) {
        slides.push(featured.slice(i, i + itemsPerSlide));
    }
    
    container.innerHTML = slides.map((slideProducts, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <div class="row g-4 px-3">
                ${slideProducts.map(producto => createFeaturedCard(producto)).join('')}
            </div>
        </div>
    `).join('');
    
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
                                onclick="openProductModal('${producto.id}')"
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
// INICIALIZACIÓN DEL CATÁLOGO
// ============================================
async function initCatalog() {
    if (!document.getElementById('productsGrid')) return;
    
    const grid = document.getElementById('productsGrid');
    if (grid) {
        grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-3">Cargando productos...</p></div>';
    }
    
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
// INICIALIZACIÓN GLOBAL
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    await cargarProductos();
    
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