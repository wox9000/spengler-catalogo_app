// --- CONFIGURACIÓN ---

// --- ELEMENTOS DEL DOM ---
const loginScreen = document.getElementById('login-screen');
const phoneInput = document.getElementById('phone-input');
const loginButton = document.getElementById('login-button');
const loginError = document.getElementById('login-error');
const loadingMessage = document.getElementById('loading-message');

const catalogScreen = document.getElementById('catalog-screen');
const welcomeMessage = document.getElementById('welcome-message');
const categoryContainer = document.getElementById('category-container');
const productList = document.getElementById('product-list');

// --- 2. NUEVOS ELEMENTOS ---
const searchInput = document.getElementById('search-input');
const noResultsMessage = document.getElementById('no-results-message');

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

// --- DATOS GLOBALES DEL CARRITO ---
let cart = []; // Almacena los productos en el carrito
const WA_NUMBER = '5493435087823'; // Su número de WhatsApp (código de país sin '+')
let clientName = ''; // Para almacenar el nombre del cliente logueado

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (Código existente de loginButton y phoneInput listeners)
    loginButton.addEventListener('click', handleLogin);
    phoneInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // --- 4. AÑADIMOS EL EVENT LISTENER AL BUSCADOR ---
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase().trim();
        applyFilters();
    });

    // --- NUEVOS LISTENERS DEL CARRITO ---
    document.getElementById('cart-floating-button').addEventListener('click', toggleCartSidebar);
    document.getElementById('close-cart-button').addEventListener('click', toggleCartSidebar);
    document.getElementById('send-whatsapp-button').addEventListener('click', sendOrderViaWhatsApp);

    loadCart(); // Carga el carrito al iniciar la página
});

// --- LÓGICA DE LOGIN ---
async function handleLogin() {
    const phoneNumber = phoneInput.value.trim().replace(/[\s\-\+\(\)]/g, '');

    if (!phoneNumber) {
        showError('Por favor, ingrese un número.');
        return;
    }

    showLoading(true);

    try {
        // Nueva Lógica: Llamar a la API segura de Netlify
        const response = await fetch('/.netlify/functions/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber })
        });
        
        const data = await response.json();

        if (response.ok) {
            // Si la respuesta es 200 OK y el login fue exitoso
            const client = data.client;
            const productsData = data.products;
            clientName = client.NOMBRE;

            // Procesar y almacenar los productos recibidos
            allProducts = productsData.map(product => ({
                ...product,
                categoria: categorizeProduct(product.NOMBRE),
                stock: parseInt(product.STOCK, 10) || 0,
                precio: parseFloat(product.PRECIO) || 0,
                codigo: product.CODIGO || ''
            }))
            .filter(p => p.precio > 0 && p.NOMBRE);

            showCatalog(client);
        } else {
            // Manejar error de autenticación (401) o de servidor (500)
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
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingMessage.classList.remove('hidden');
        loginError.classList.add('hidden');
        loginButton.disabled = true;
    } else {
        loadingMessage.classList.add('hidden');
        loginButton.disabled = false;
    }
}

// --- LÓGICA DE CATÁLOGO ---
async function showCatalog(client) {
    welcomeMessage.textContent = `¡Hola, ${client.NOMBRE}! Este es su catálogo personal.`;

    loginScreen.classList.add('hidden');
    catalogScreen.classList.remove('hidden');
    catalogScreen.classList.add('fade-in');

    try {
        // La carga de allProducts y categorización ya se hizo en handleLogin
        renderCategories();
        applyFilters(); 

    } catch (err) {
        console.error('Error al renderizar catálogo:', err);
        productList.innerHTML = '<p class="text-red-500 col-span-full">Error al cargar productos. Por favor, recargue la página.</p>';
    }
}

// (La función categorizeProduct sigue igual que antes)
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

function renderCategories() {
    const categories = ['Todos 🌟', ...new Set(allProducts.map(p => p.categoria).sort())];
    categoryContainer.innerHTML = '';

    categories.forEach((category) => {
        const button = document.createElement('button');
        button.className = 'category-button px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap bg-blue-100 text-blue-700 hover:bg-blue-200';
        button.textContent = category;

        if (category === 'Todos 🌟') {
            button.classList.add('active', 'bg-blue-600', 'text-white');
        }

        button.addEventListener('click', () => {
            // --- 6. MODIFICAMOS EL CLICK DE CATEGORÍA ---
            currentCategory = category; // Actualiza la categoría global
            applyFilters(); // Aplica ambos filtros
            
            // Actualiza estilos de botones
            document.querySelectorAll('.category-button').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-600', 'text-white');
                btn.classList.add('bg-blue-100', 'text-blue-700');
            });
            button.classList.add('active', 'bg-blue-600', 'text-white');
            button.classList.remove('bg-blue-100', 'text-blue-700');
        });
        categoryContainer.appendChild(button);
    });
}

// --- 7. NUEVA FUNCIÓN CENTRAL DE FILTRADO ---
function applyFilters() {
    let filteredProducts = allProducts;

    // 1. Filtramos por categoría (si no es "Todos")
    if (currentCategory !== 'Todos 🌟') {
        filteredProducts = filteredProducts.filter(p => p.categoria === currentCategory);
    }

    // 2. Filtramos por término de búsqueda (si no está vacío)
    if (currentSearchTerm !== '') {
        filteredProducts = filteredProducts.filter(p => 
            p.NOMBRE.toLowerCase().includes(currentSearchTerm)
        );
    }

    // 3. Renderizamos los productos filtrados
    renderProducts(filteredProducts);
}


// --- MODIFICAMOS renderProducts ---
function renderProducts(products) {
    productList.innerHTML = ''; // Limpiamos la lista

    // --- 8. MANEJO DE MENSAJE "SIN RESULTADOS" ---
    if (products.length === 0) {
        noResultsMessage.classList.remove('hidden'); // Muestra mensaje
        productList.classList.add('hidden'); // Oculta la grilla
    } else {
        noResultsMessage.classList.add('hidden'); // Oculta mensaje
        productList.classList.remove('hidden'); // Muestra la grilla
    }
    // --- FIN DE CAMBIO ---

    const fallbackImage = 'https://placehold.co/400x400/eeeeee/313131?text=Spengler';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-white rounded-xl shadow-lg overflow-hidden relative transform transition-transform duration-300 hover:shadow-xl hover:-translate-y-1';

        let stockBadge = '';
        if (product.stock <= 0) {
            stockBadge = '<span class="absolute top-2 right-2 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full z-10">SIN STOCK</span>';
        } else if (product.stock > 0 && product.stock <= 50) {
            stockBadge = '<span class="absolute top-2 right-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full z-10">POCO STOCK</span>';
        }

        const categoryName = product.categoria.split(' ')[0];
        const badgeColor = getCategoryColor(categoryName);

        let imageUrl = fallbackImage;
        if (product.CODIGO) { 
            imageUrl = `images/${product.CODIGO}.jpg`;
        }

        const disabledClass = product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : '';
        const disabledAttr = product.stock <= 0 ? 'disabled' : '';
        
        productCard.innerHTML = `
            <img 
                src="${imageUrl}" 
                alt="${product.NOMBRE}" 
                class="product-image"
                onerror="this.src='${fallbackImage}'" 
            >
            <div class="p-5">
                ${stockBadge}
                <h3 class="text-base font-semibold text-gray-800 min-h-[3rem]">${product.NOMBRE}</h3>
                <p class="text-2xl font-black text-blue-600 mt-2 mb-3">${currencyFormatter.format(product.precio)}</p>
                <span class="category-badge-card ${badgeColor}">${categoryName}</span>
            </div>
            
            <div class="flex justify-between gap-2 p-5 pt-0">
                <button 
                    data-code="${product.CODIGO}" 
                    data-action="+1" 
                    class="add-to-cart-btn w-1/2 bg-blue-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-blue-700 ${disabledClass}"
                    ${disabledAttr}
                >
                    Añadir (+1)
                </button>
                <button 
                    data-code="${product.CODIGO}" 
                    data-action="10+1" 
                    class="add-to-cart-btn w-1/2 bg-indigo-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-indigo-700 ${disabledClass}"
                    ${disabledAttr}
                >
                    Oferta (10+1)
                </button>
            </div>
        `;
        
        if (product.stock <= 0) {
            productCard.classList.add('opacity-50');
        }

        productList.appendChild(productCard);
    });
    
    // Agregar el listener a todos los nuevos botones
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', handleAddButtonClick);
    });
}


function getCategoryColor(categoryName) {
    // (Esta función sigue igual que antes)
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

// --- FUNCIONES DE PERSISTENCIA ---

function toggleCartSidebar() {
    document.getElementById('cart-sidebar').classList.toggle('translate-x-full');
}

function loadCart() {
    const savedCart = localStorage.getItem('spenglerCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('spenglerCart', JSON.stringify(cart));
    updateCartDisplay();
}

// --- LÓGICA DE AGREGAR PRODUCTOS ---

function addToCart(product, quantity, applyOffer = false) {
    const existingItem = cart.find(item => item.CODIGO === product.CODIGO);

    if (existingItem) {
        // La oferta solo aplica si se agrega con el botón "10+1"
        existingItem.quantity += quantity;
        if (applyOffer) {
             existingItem.offer = true;
        }
    } else {
        cart.push({
            CODIGO: product.CODIGO,
            NOMBRE: product.NOMBRE,
            PRECIO: product.precio, // Usamos 'precio' ya que está parseado en el frontend
            quantity: quantity,
            offer: applyOffer
        });
    }
    
    saveCart();
}

function handleAddButtonClick(event) {
    const code = event.currentTarget.dataset.code;
    // Buscamos en allProducts que ya están cargados y limpios
    const product = allProducts.find(p => p.CODIGO === code); 

    if (!product || product.stock <= 0) return;

    const action = event.currentTarget.dataset.action;

    if (action === '+1') {
        addToCart(product, 1, false);
    } else if (action === '10+1') {
        // 10+1: Añade 11 unidades y marca la oferta
        addToCart(product, 11, true); 
    }
}

// --- LÓGICA DE CÁLCULO Y VISUALIZACIÓN ---

function calculateItemPrice(item) {
    const unitPrice = parseFloat(item.PRECIO);
    let totalItemPrice = item.quantity * unitPrice;
    
    if (item.offer) {
        // Aplicar 10% de descuento a las unidades marcadas con la oferta
        const discountRate = 0.10;
        totalItemPrice = totalItemPrice * (1 - discountRate);
    }
    
    return totalItemPrice;
}

function calculateCartTotal() {
    return cart.reduce((total, item) => total + calculateItemPrice(item), 0);
}

function updateItemQuantity(event) {
    const code = event.currentTarget.dataset.code;
    const change = parseInt(event.currentTarget.dataset.change);
    const itemIndex = cart.findIndex(item => item.CODIGO === code);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;

        // Regla: la cantidad nunca puede ser menor a 1
        if (cart[itemIndex].quantity < 1) {
            cart.splice(itemIndex, 1); // Elimina si llega a cero o menos
        } else {
            // Si la cantidad se ajusta manualmente, se quita la marca de la oferta
            cart[itemIndex].offer = false; 
        }
    }
    saveCart();
}

function removeItem(event) {
    const code = event.currentTarget.dataset.code;
    cart = cart.filter(item => item.CODIGO !== code);
    saveCart();
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cart-items-container');
    const emptyMessage = document.getElementById('empty-cart-message');
    const cartTotalElement = document.getElementById('cart-total');
    const itemCountElement = document.getElementById('cart-item-count');
    const whatsappButton = document.getElementById('send-whatsapp-button');

    if (cart.length === 0) {
        emptyMessage.classList.remove('hidden');
        whatsappButton.disabled = true;
    } else {
        emptyMessage.classList.add('hidden');
        whatsappButton.disabled = false;
    }

    // Cuenta el número de productos diferentes en el carrito
    itemCountElement.textContent = cart.length; 

    // Actualiza el contenido del carrito
    cartContainer.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = calculateItemPrice(item);
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-gray-50 p-3 rounded-lg border';
        
        let offerText = item.offer ? ' (¡OFERTA 10% OFF!)' : '';
        let offerBadge = item.offer 
            ? '<span class="text-xs font-semibold px-2 py-0.5 ml-2 bg-indigo-100 text-indigo-700 rounded-full">10% OFF</span>'
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
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3"></path></svg>
                    </button>
                </div>
            </div>
        `;
        cartContainer.appendChild(itemElement);
    });

    // Añadir listeners para los botones del carrito
    document.querySelectorAll('.update-quantity-btn').forEach(btn => btn.addEventListener('click', updateItemQuantity));
    document.querySelectorAll('.remove-item-btn').forEach(btn => btn.addEventListener('click', removeItem));
    
    // Actualiza el total
    cartTotalElement.textContent = currencyFormatter.format(calculateCartTotal());
}


// --- FUNCIÓN DE ENVÍO POR WHATSAPP ---
function sendOrderViaWhatsApp() {
    if (cart.length === 0) return;

    // 1. Encabezado del mensaje
    let message = `¡Hola! Soy ${clientName} y quiero realizar un pedido desde el Catálogo.\n\n`;
    message += `*Detalle del Pedido:*\n`;
    
    let totalFinal = 0;
    
    // 2. Iterar sobre los productos
    cart.forEach((item, index) => {
        const subtotal = calculateItemPrice(item);
        totalFinal += subtotal;
        
        let offerText = item.offer ? ' (¡OFERTA 10% OFF - 10+1!)' : '';

        // Formato: 1. [Nombre Producto] - Cant: [X] - Total: [Precio]
        message += `${index + 1}. ${item.NOMBRE}\n`;
        message += `   *Cantidad:* ${item.quantity} unidades${offerText}\n`;
        message += `   *Precio/U:* ${currencyFormatter.format(item.PRECIO)}\n`;
        message += `   *Subtotal:* ${currencyFormatter.format(subtotal)}\n\n`;
    });
    
    // 3. Resumen y pie
    message += `*TOTAL ESTIMADO:* ${currencyFormatter.format(totalFinal)}\n\n`;
    message += `El descuento del 10% ya está aplicado en el subtotal de los ítems marcados como OFERTA. Por favor, confírmame el pedido. ¡Gracias!`;

    // 4. Codificar el mensaje para la URL de WhatsApp
    const encodedMessage = encodeURIComponent(message);
    
    // 5. Crear el enlace de WhatsApp
    const whatsappURL = `https://wa.me/${WA_NUMBER}?text=${encodedMessage}`;
    
    // Abrir el enlace en una nueva pestaña
    window.open(whatsappURL, '_blank');
}