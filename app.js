// --- CONFIGURACIÓN ---

// --- ELEMENTOS DEL DOM (Definidos como 'let' para ser asignados post-carga) ---
let loginScreen, phoneInput, loginButton, loginError, loadingMessage;
let catalogScreen, welcomeMessage, categoryContainer, productList;
let searchInput, noResultsMessage;
let cartContainer, emptyMessage, cartTotalElement, itemCountElement, whatsappButton, cartSidebar;

// --- DATOS GLOBALES ---
let allProducts = [];

const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
});

// --- 3. NUEVAS VARIABLES GLOBALES para filtros ---
let currentCategory = 'Todos 🌟';
let currentSearchTerm = '';
let currentBrand = 'Todas 🏷️';

// --- DATOS GLOBALES DEL CARRITO ---
// 
// --- FIX IMPORTANTE (Tu diagnóstico): ---
// Inicializamos 'cart' como un array vacío AHORA.
// Esto asegura que 'cart' NUNCA sea 'undefined'.
//
let cart = []; 
const WA_NUMBER = '5493435087823'; 
let clientName = ''; 

// --- INICIALIZACIÓN ---
// Usamos DOMContentLoaded para ASIGNAR los elementos del DOM después de que existan.
document.addEventListener('DOMContentLoaded', () => {
    
    // Asignación de elementos del DOM
    loginScreen = document.getElementById('login-screen');
    phoneInput = document.getElementById('phone-input');
    loginButton = document.getElementById('login-button');
    loginError = document.getElementById('login-error');
    loadingMessage = document.getElementById('loading-message');
    catalogScreen = document.getElementById('catalog-screen');
    welcomeMessage = document.getElementById('welcome-message');
    categoryContainer = document.getElementById('category-container');
    productList = document.getElementById('product-list');
    searchInput = document.getElementById('search-input');
    noResultsMessage = document.getElementById('no-results-message');
    cartContainer = document.getElementById('cart-items-container');
    emptyMessage = document.getElementById('empty-cart-message');
    cartTotalElement = document.getElementById('cart-total');
    itemCountElement = document.getElementById('cart-item-count');
    whatsappButton = document.getElementById('send-whatsapp-button');
    cartSidebar = document.getElementById('cart-sidebar');

    // Listeners de Login
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }
    if (phoneInput) {
        phoneInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }

    // Listener de Búsqueda
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase().trim();
            applyFilters();
        });
    }

    // --- FIX DEFINITIVO: DELEGACIÓN DE EVENTOS GLOBAL ---
    // Adjuntamos un único listener al 'body' del documento.
    document.body.addEventListener('click', handleGlobalClick);

    // Cargamos el carrito al inicio. Si no hay nada, 'cart' seguirá siendo []
    loadCart(); 
});


// --- NUEVA FUNCIÓN DELEGADA GLOBAL ---
// Esta función captura todos los clics y los dirige.
function handleGlobalClick(event) {
    
    // 1. Manejador para los botones de AÑADIR (+1 y 10+1)
    const addBtn = event.target.closest('.add-to-cart-btn');
    if (addBtn && !addBtn.disabled) {
        const code = addBtn.dataset.code;
        const product = allProducts.find(p => p.CODIGO === code); 
        if (!product || product.stock <= 0) return;

        const action = addBtn.dataset.action;
        if (action === '+1') {
            addToCart(product, 1, false);
        } else if (action === '10+1') {
            addToCart(product, 11, true); 
        }
        return; // Clic manejado
    }

    // 2. Manejador para los botones del CARRITO (+ y -)
    const updateBtn = event.target.closest('.update-quantity-btn');
    if (updateBtn) {
        // Pasamos los datos a la función que actualiza el modelo
        updateItemQuantity(updateBtn.dataset.code, parseInt(updateBtn.dataset.change, 10));
        return; // Clic manejado
    }

    // 3. Manejador para ELIMINAR del carrito (basura)
    const removeBtn = event.target.closest('.remove-item-btn');
    if (removeBtn) {
        removeItem(removeBtn.dataset.code);
        return; // Clic manejado
    }
    
    // 4. Manejador para ABRIR/CERRAR el carrito
    if (event.target.closest('#cart-floating-button') || event.target.closest('#close-cart-button')) {
        toggleCartSidebar();
        return; // Clic manejado
    }
    
    // 5. Manejador para ENVIAR por WhatsApp
    if (event.target.closest('#send-whatsapp-button')) {
        sendOrderViaWhatsApp();
        return; // Clic manejado
    }
}


// --- LÓGICA DE LOGIN ---
async function handleLogin() {
    const phoneNumber = phoneInput.value.trim().replace(/[\s\-\+\(\)]/g, '');

    if (!phoneNumber) {
        showError('Por favor, ingrese un número.');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/.netlify/functions/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber })
        });
        
        const data = await response.json();

        if (response.ok) {
            const client = data.client;
            const productsData = data.products;
            clientName = client.NOMBRE;

            allProducts = productsData.map(product => ({
                ...product,
                categoria: categorizeProduct(product.NOMBRE),
                marca: determineBrand(product.NOMBRE, product.MARCA), 
                stock: parseInt(product.STOCK, 10) || 0,
                precio: parseFloat(product.PRECIO) || 0,
                codigo: product.CODIGO || ''
            }))
            .filter(p => p.precio > 0 && p.NOMBRE);

            showCatalog(client);
        } else {
            showError(data.error || 'Error de conexión. Intente de nuevo.');
        }

    } catch (err) {
        console.error('Error al intentar acceder al catálogo:', err);
        showError('Error de red. Por favor, compruebe su conexión.');
    } finally {
        showLoading(false);
    }
}

function showError(message) {
    if (loginError) loginError.textContent = message;
    if (loginError) loginError.classList.remove('hidden');
}

function showLoading(isLoading) {
    if (isLoading) {
        if (loadingMessage) loadingMessage.classList.remove('hidden');
        if (loginError) loginError.classList.add('hidden');
        if (loginButton) loginButton.disabled = true;
    } else {
        if (loadingMessage) loadingMessage.classList.add('hidden');
        if (loginButton) loginButton.disabled = false;
    }
}

// --- LÓGICA DE CLASIFICACIÓN (Mantenida) ---

function categorizeProduct(productName) {
    if (!productName) return 'Varios 📦';
    const name = productName.toLowerCase();

    if (name.includes('alfajor')) return 'Alfajores 🍪';
    if (name.includes('9 de oro') || name.includes('trio') || name.includes('tostadas') || name.includes('pepas') || name.includes('cookies') || name.includes('gallery') || name.includes('salvado') || name.includes('galletita') || name.includes('oreo') || name.includes('sonrisas') || name.includes('mellizas') || name.includes('rumba') || name.includes('mana') || name.includes('pitusas') || name.includes('chocolina') || name.includes('polvorita') || name.includes('traviata') || name.includes('merengadas')) return 'Galletitas 🍪';
    if (name.includes('julicroc') || name.includes('papas') || name.includes('palitos') || name.includes('conix') || name.includes('maní') || name.includes('snacks') || name.includes('saladix') || name.includes('takis') || name.includes('chisitos') || name.includes('tutucas')) return 'Snacks Salados 🥨';
    if (name.includes('baggio') || name.includes('vino') || name.includes('gaseosa') || name.includes('agua') || name.includes('jugo') || name.includes('uvita') || name.includes('speed') || name.includes('tang') || name.includes('clight') || name.includes('dodi')) return 'Bebidas 🧃';
    if (name.includes('caramelo') || name.includes('turron') || name.includes('chocolate') || name.includes('chupetin') || name.includes('gomitas') || name.includes('vizzio') || name.includes('rocklets') || name.includes('pastillas') || name.includes('bonobon') || name.includes('marroc') || name.includes('block') || name.includes('kinder') || name.includes('tita') || name.includes('rhodesia') || name.includes('flynn paff') || name.includes('mentos') || name.includes('sugus') || name.includes('lipo')) return 'Golosinas 🍬';
    if (name.includes('aceite') || name.includes('fideos') || name.includes('arroz') || name.includes('puré') || name.includes('polenta') || name.includes('harina') || name.includes('lata') || name.includes('tomate') || name.includes('mayonesa') || name.includes('ketchup') || name.includes('azucar') || name.includes('yerba') || name.includes('café') || name.includes('malta')) return 'Almacén 🛒';
    if (name.includes('budin') || name.includes('magdalena') || name.includes('pan dulce') || name.includes('vainillas')) return 'Panificados 🍞';
    if (name.includes('repelente') || name.includes('insecticida') || name.includes('off') || name.includes('fuyi') || name.includes('pilas') || name.includes('encendedor') || name.includes('vela') || name.includes('fósforos') || name.includes('raid') || name.includes('espirales')) return 'Varios 📦';


    return 'Varios 📦';
}

function determineBrand(productName, productMarca) {
    if (productMarca && productMarca !== '0' && productMarca !== 'LISTA' && productMarca.trim() !== '') {
        return productMarca.trim(); 
    }
    
    const name = productName.toLowerCase();
    if (name.includes('fantoche')) return 'Fantoche';
    if (name.includes('milka')) return 'Milka';
    if (name.includes('oreo')) return 'Oreo';
    if (name.includes('guaymallen')) return 'Guaymallen';
    if (name.includes('terrabusi')) return 'Terrabusi';
    if (name.includes('mogy')) return 'Mogy';
    if (name.includes('lulemuu')) return 'Lulemuu';
    if (name.includes('pepitos') || name.includes('pepay')) return 'Pepitos/Pepay';
    if (name.includes('riquito')) return 'Riquito';
    if (name.includes('vauquita')) return 'Vauquita';
    if (name.includes('capitan') || name.includes('capitán')) return 'Capitan del Espacio';
    if (name.includes('rasta')) return 'Rasta';
    if (name.includes('barcelona')) return 'Barcelona';
    if (name.includes('escolar')) return 'Escolar/Vimar';
    if (name.includes('marley')) return 'Marley';
    if (name.includes('julicroc')) return 'Juli Croc';
    if (name.includes('candy loka') || name.includes('candy port')) return 'Candy Loka/Port';
    if (name.includes('arc') || name.includes('bonobon') || name.includes('rhodesia') || name.includes('tita') || name.includes('cofler') || name.includes('rocklets')) return 'Arcor';
    if (name.includes('hersheys')) return 'Hershey\'s';
    if (name.includes('ferrero') || name.includes('nutella')) return 'Ferrero';
    if (name.includes('bonafide')) return 'Bonafide';
    if (name.includes('don satur')) return 'Don Satur';
    if (name.includes('tinka')) return 'Tinka';
    if (name.includes('solitas')) return 'Solitas';
    if (name.includes('trio')) return 'Trio';
    if (name.includes('baggio') || name.includes('fresh') || name.includes('latte')) return 'Baggio';
    if (name.includes('dodi')) return 'Dodi';
    if (name.includes('tang')) return 'Tang';
    if (name.includes('alka')) return 'Alka';
    if (name.includes('topline')) return 'Topline';
    
    return 'Otras Marcas 🏷️'; 
}

// --- LÓGICA DE CATÁLOGO (Mantenida) ---
async function showCatalog(client) {
    welcomeMessage.textContent = `¡Hola, ${client.NOMBRE}! Este es su catálogo personal.`;

    loginScreen.classList.add('hidden');
    catalogScreen.classList.remove('hidden');
    catalogScreen.classList.add('fade-in');

    try {
        renderFilters();
        applyFilters(); 

    } catch (err) {
        console.error('Error al renderizar catálogo:', err);
        productList.innerHTML = '<p class="text-red-500 col-span-full">Error al cargar productos. Por favor, recargue la página.</p>';
    }
}

// Lógica para crear un botón de filtro
function createFilterButton(name, currentFilter, type) {
    const button = document.createElement('button');
    button.className = 'filter-button px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200';
    
    button.textContent = name;

    let activeClass = 'bg-blue-600 text-white active';
    let inactiveClass = 'bg-gray-200 text-gray-700 hover:bg-gray-300';
    
    if (name === currentFilter) {
        button.classList.add(...activeClass.split(' '));
    } else {
        button.classList.add(...inactiveClass.split(' '));
    }

    button.addEventListener('click', () => {
        if (type === 'category') {
            currentCategory = name;
        } else if (type === 'brand') {
            currentBrand = name;
        }
        renderFilters();
        applyFilters();
    });
    return button;
}

// Nueva función para renderizar ambos filtros
function renderFilters() {
    categoryContainer.innerHTML = '';

    // 2. Categorías
    const categories = ['Todos 🌟', ...new Set(allProducts.map(p => p.categoria).sort())];
    
    let categoryTitle = document.createElement('h3');
    categoryTitle.textContent = 'Categorías:';
    categoryTitle.className = 'text-base font-bold text-gray-700 w-full mb-1 mt-2';
    categoryContainer.appendChild(categoryTitle);

    const categoryButtonsContainer = document.createElement('div');
    categoryButtonsContainer.className = 'flex space-x-3 overflow-x-auto whitespace-nowrap pb-2';
    categories.forEach((category) => {
        categoryButtonsContainer.appendChild(createFilterButton(category, currentCategory, 'category'));
    });
    categoryContainer.appendChild(categoryButtonsContainer);
    
    // 3. Marcas
    const allBrands = allProducts.map(p => p.marca);
    let brands = [...new Set(allBrands.filter(m => m !== 'Otras Marcas 🏷️'))].sort();
    brands = ['Todas 🏷️', ...brands, 'Otras Marcas 🏷️'];

    let brandTitle = document.createElement('h3');
    brandTitle.textContent = 'Marcas:';
    brandTitle.className = 'text-base font-bold text-gray-700 w-full mb-1 mt-2 border-t pt-2';
    categoryContainer.appendChild(brandTitle); 

    const brandButtonsContainer = document.createElement('div');
    brandButtonsContainer.className = 'flex space-x-3 overflow-x-auto whitespace-nowrap pb-2';
    brands.forEach((brand) => {
        brandButtonsContainer.appendChild(createFilterButton(brand, currentBrand, 'brand'));
    });
    categoryContainer.appendChild(brandButtonsContainer);
}


// --- FUNCIÓN CENTRAL DE FILTRADO Y ORDENACIÓN ---
function applyFilters() {
    let filteredProducts = allProducts;

    if (currentCategory !== 'Todos 🌟') {
        filteredProducts = filteredProducts.filter(p => p.categoria === currentCategory);
    }
    
    if (currentBrand !== 'Todas 🏷️') {
        filteredProducts = filteredProducts.filter(p => p.marca === currentBrand);
    }

    if (currentSearchTerm !== '') {
        filteredProducts = filteredProducts.filter(p => 
            p.NOMBRE.toLowerCase().includes(currentSearchTerm)
        );
    }
    
    // Ordenación: con stock primero, luego por nombre
    filteredProducts.sort((a, b) => {
        const aHasStock = a.stock > 0;
        const bHasStock = b.stock > 0;

        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;

        return a.NOMBRE.localeCompare(b.NOMBRE);
    });

    renderProducts(filteredProducts);
}


// --- MODIFICAMOS renderProducts (FIX PISADO DE TÍTULO) ---
function renderProducts(products) {
    productList.innerHTML = ''; 

    if (products.length === 0) {
        noResultsMessage.classList.remove('hidden'); 
        productList.classList.add('hidden'); 
    } else {
        noResultsMessage.classList.add('hidden'); 
        productList.classList.remove('hidden');
    }

    const fallbackImage = 'https://placehold.co/400x400/eeeeee/313131?text=Spengler';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-white rounded-xl shadow-lg relative transform transition-transform duration-300 hover:shadow-xl hover:-translate-y-1';

        let stockBadgeHTML = '';
        let sinStockBannerHTML = '';
        let paddingForContent = 'p-5'; 
        
        const stock = product.stock;
        
        if (stock <= 0) {
            sinStockBannerHTML = '<div class="absolute top-0 left-0 w-full bg-red-600 text-white text-xs font-bold py-1 text-center z-20 rounded-t-xl">SIN STOCK</div>';
            paddingForContent = 'p-5 pt-8'; 
        } else if (stock >= 1 && stock <= 10) {
            stockBadgeHTML = '<span class="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full z-10">ÚLTIMOS DISPONIBLES</span>';
        } 
        
        const categoryName = product.categoria.split(' ')[0];
        const badgeColor = getCategoryColor(categoryName);
        const brandName = product.marca;
        
        let imageUrl = fallbackImage;
        if (product.CODIGO) { 
            imageUrl = `images/${product.CODIGO}.jpg`; 
        }

        const disabledClass = product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : '';
        const disabledAttr = product.stock <= 0 ? 'disabled' : '';

        productCard.innerHTML = `
            ${sinStockBannerHTML}
            
            <div class="relative"> ${stockBadgeHTML}
                <img 
                    src="${imageUrl}" 
                    alt="${product.NOMBRE}" 
                    class="product-image"
                    onerror="this.src='${fallbackImage}'" 
                >
            </div>
            
            <div class="${paddingForContent} relative">
                <h3 class="text-base font-semibold text-gray-800 min-h-[3rem]">${product.NOMBRE}</h3>
                <p class="text-2xl font-black text-blue-600 mt-2 mb-3">${currencyFormatter.format(product.precio)}</p>
                
                <div class="flex flex-wrap gap-2 mb-4 pt-1">
                    <span class="category-badge ${badgeColor}">${categoryName}</span>
                    <span class="brand-badge bg-teal-200 text-teal-800 text-xs font-bold px-2 py-0.5 rounded-full">${brandName}</span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 p-5 pt-0">
                <button 
                    data-code="${product.CODIGO}" 
                    data-action="+1" 
                    class="add-to-cart-btn w-full bg-blue-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-blue-700 ${disabledClass}"
                    ${disabledAttr}
                >
                    Añadir (+1)
                </button>
                <button 
                    data-code="${product.CODIGO}" 
                    data-action="10+1" 
                    class="add-to-cart-btn w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700 ${disabledClass}"
                    ${disabledAttr}
                >
                    10+1 Descuento 10%
                </button>
            </div>
        `;
        
        if (product.stock <= 0) {
            productCard.classList.add('opacity-50');
        }

        productList.appendChild(productCard);
    });
    
    // NOTA: Todos los listeners ahora se manejan en handleGlobalClick
}


function getCategoryColor(categoryName) {
    switch (categoryName) {
        case 'Alfajores': return 'bg-yellow-200 text-yellow-800';
        case 'Galletitas': return 'bg-orange-200 text-orange-800';
        case 'Snacks': return 'bg-red-200 text-red-800';
        case 'Bebidas': return 'bg-blue-200 text-blue-800';
        case 'Golosinas': return 'bg-pink-200 text-pink-800';
        case 'Almacén': return 'bg-green-200 text-green-800';
        case 'Panificados': return 'bg-yellow-300 text-yellow-900';
        default: return 'bg-gray-200 text-gray-800';
    }
}

// --- FUNCIONES DE PERSISTENCIA (Mantenida la corrección de parseo) ---

function toggleCartSidebar() {
    // Aseguramos que el elemento exista antes de usarlo
    if (cartSidebar) {
        cartSidebar.classList.toggle('translate-x-full');
    } else {
        console.error("Error: Elemento #cart-sidebar no encontrado.");
    }
}

function loadCart() {
    const savedCart = localStorage.getItem('spenglerCart');
    if (savedCart) {
        try {
            let loadedCart = JSON.parse(savedCart);
            // Asegura que quantity sea un número (la corrección clave)
            cart = loadedCart.map(item => ({
                ...item,
                quantity: parseInt(item.quantity, 10) || 0
            })).filter(item => item.quantity > 0); 
        } catch (e) {
            console.error("Error al cargar carrito desde localStorage, iniciando carrito vacío.", e);
            localStorage.removeItem('spenglerCart');
            cart = []; // Si hay error, reinicia a array vacío
        }
    }
    // Si savedCart es null (no existe), cart conserva su valor
    // inicial de '[]' (gracias a la línea 43).
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('spenglerCart', JSON.stringify(cart));
    updateCartDisplay();
}

// --- LÓGICA DE AGREGAR PRODUCTOS (Mantenida) ---

function addToCart(product, quantity, applyOffer = false) {
    const existingItem = cart.find(item => item.CODIGO === product.CODIGO);

    if (existingItem) {
        existingItem.quantity = existingItem.quantity + quantity; 
        if (applyOffer) {
             existingItem.offer = true;
        }
    } else {
        // 'cart' está garantizado de ser un array gracias a la línea 43
        cart.push({
            CODIGO: product.CODIGO,
            NOMBRE: product.NOMBRE,
            PRECIO: product.precio,
            quantity: quantity,
            offer: applyOffer
        });
    }
    
    saveCart();
}

// --- LÓGICA DE CÁLCULO Y VISUALIZACIÓN ---

function calculateItemPrice(item) {
    const unitPrice = parseFloat(item.PRECIO);
    let totalItemPrice = item.quantity * unitPrice;
    
    if (item.offer) {
        const discountRate = 0.10;
        totalItemPrice = totalItemPrice * (1 - discountRate);
    }
    
    return totalItemPrice;
}

function calculateCartTotal() {
    return cart.reduce((total, item) => total + calculateItemPrice(item), 0);
}

// MODIFICADA: Ahora recibe 'code' y 'change' desde el handler global
function updateItemQuantity(code, change) {
    const itemIndex = cart.findIndex(item => item.CODIGO === code);

    if (itemIndex > -1) {
        let currentQuantity = parseInt(cart[itemIndex].quantity, 10); 
        currentQuantity = currentQuantity + change;

        if (currentQuantity < 1) {
            cart.splice(itemIndex, 1); 
        } else {
            cart[itemIndex].quantity = currentQuantity;
            cart[itemIndex].offer = false; 
        }
    }
    saveCart();
}

// MODIFICADA: Ahora recibe 'code' desde el handler global
function removeItem(code) {
    cart = cart.filter(item => item.CODIGO !== code);
    saveCart();
}

// 
// --- FUNCIÓN CRÍTICA CON SAFEGUARD ---
// 
function updateCartDisplay() {
    
    // ✅ SAFEGUARD: Si los elementos no existen (porque el script corrió muy rápido),
    // no hacer nada y salir de la función para evitar el crash.
    if (!cartContainer || !emptyMessage || !cartTotalElement || !itemCountElement || !whatsappButton) {
        console.warn('⚠️ updateCartDisplay() llamado pero los elementos del DOM del carrito no están listos.');
        return; 
    }

    // Mostrar / ocultar mensaje de carrito vacío
    if (cart.length === 0) {
        emptyMessage.classList.remove('hidden');
        whatsappButton.disabled = true;
    } else {
        emptyMessage.classList.add('hidden');
        whatsappButton.disabled = false;
    }

    // --- 💡 ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    // Calcula la cantidad total de UNIDADES, no solo de productos distintos.
    const totalUnits = cart.reduce((total, item) => total + item.quantity, 0);
    itemCountElement.textContent = totalUnits; 
    // --- FIN DE LA CORRECCIÓN ---

    cartContainer.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = calculateItemPrice(item);
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-gray-50 p-3 rounded-lg border';
        
        let offerBadge = item.offer 
            ? '<span class="text-xs font-semibold px-2 py-0.5 ml-2 bg-indigo-100 text-indigo-700 rounded-full">OFERTA 10% OFF</span>'
            : '';
            
        itemElement.innerHTML = `
            <div class="flex justify-between items-center">
                <h4 class="font-semibold text-gray-800">${item.NOMBRE} ${offerBadge}</h4>
                <div class="font-bold">${currencyFormatter.format(itemTotal)}</div>
            </div>
            <div class="flex justify-between items-center text-sm text-gray-600 mt-1">
                <span>Cant: ${item.quantity} unidades</span>
                <div class="flex items-center space-x-2">
                    <button data-code="${item.CODIGO}" data-change="-1" class="update-quantity-btn text-red-500 hover:text-red-700 font-bold p-1">-</button>
                    <span>${item.quantity}</span>
                    <button data-code="${item.CODIGO}" data-change="+1" class="update-quantity-btn text-green-500 hover:text-green-700 font-bold p-1">+</button>
                    <button data-code="${item.CODIGO}" data-remove="true" class="remove-item-btn text-gray-400 hover:text-red-500 p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        cartContainer.appendChild(itemElement);
    });
    
    // Actualiza el total
    cartTotalElement.textContent = currencyFormatter.format(calculateCartTotal());
}


// --- FUNCIÓN DE ENVÍO POR WHATSAPP (Mantenida) ---
function sendOrderViaWhatsApp() {
    if (cart.length === 0) return;

    let message = `¡Hola! Soy ${clientName} y quiero realizar un pedido desde el Catálogo.\n\n`;
    message += `*Detalle del Pedido:*\n`;
    
    let totalFinal = 0;
    
    cart.forEach((item, index) => {
        const subtotal = calculateItemPrice(item);
        totalFinal += subtotal;
        
        let offerText = item.offer ? ' (¡OFERTA 10% OFF - 10+1!)' : '';

        message += `${index + 1}. ${item.NOMBRE}\n`;
        message += `   *Cantidad:* ${item.quantity} unidades${offerText}\n`;
        message += `   *Precio/U (sin oferta):* ${currencyFormatter.format(item.PRECIO)}\n`;
        message += `   *Subtotal:* ${currencyFormatter.format(subtotal)}\n\n`;
    });
    
    message += `*TOTAL ESTIMADO:* ${currencyFormatter.format(totalFinal)}\n\n`;
    message += `El descuento del 10% ya está aplicado en el subtotal de los ítems marcados como OFERTA. Por favor, confírmame el pedido. ¡Gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WA_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}