// --- CONFIGURACIÓN ---
const RUTA_PRODUCTOS_CSV = 'productos.csv';
const RUTA_CLIENTES_CSV = 'clientes.csv';

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

// --- DATOS GLOBALES ---
let allProducts = [];
let allClients = [];
const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
});

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    loginButton.addEventListener('click', handleLogin);
    phoneInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
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
        if (allClients.length === 0) {
            allClients = await loadCSV(RUTA_CLIENTES_CSV);
            console.log('Clientes cargados:', allClients.length);
        }

        // Búsqueda más robusta
        const client = allClients.find(c => {
            let clientPhone = (c.TELEFONO || '').trim().replace(/[\s\-\+\(\)]/g, '');

            // Log para debugging
            console.log('Buscando:', phoneNumber, 'vs Cliente:', clientPhone, 'Nombre:', c.NOMBRE);

            // Comparación exacta o por inclusión
            return clientPhone === phoneNumber ||
                   phoneNumber === clientPhone ||
                   clientPhone.includes(phoneNumber) ||
                   phoneNumber.includes(clientPhone);
        });

        if (client) {
            console.log('✅ Cliente encontrado:', client.NOMBRE, 'Teléfono:', client.TELEFONO);
            showCatalog(client);
        } else {
            console.log('❌ Cliente NO encontrado. Teléfono buscado:', phoneNumber);
            console.log('Clientes disponibles:', allClients.map(c => ({nombre: c.NOMBRE, telefono: c.TELEFONO})));
            showError('Número no reconocido. Contacte a su vendedor.');
        }

    } catch (err) {
        console.error('Error completo:', err);
        showError('Error al verificar. Intente de nuevo.');
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
        if (allProducts.length === 0) {
            allProducts = await loadCSV(RUTA_PRODUCTOS_CSV);
            console.log('Productos cargados:', allProducts.length);
        }

        allProducts = allProducts.map(product => ({
            ...product,
            categoria: categorizeProduct(product.NOMBRE),
            stock: parseInt(product.STOCK, 10) || 0,
            precio: parseFloat(product.PRECIO) || 0,
        }))
        .filter(p => p.precio > 0 && p.NOMBRE);

        renderCategories();
        renderProducts(allProducts);

    } catch (err) {
        console.error('Error al cargar productos:', err);
        productList.innerHTML = '<p class="text-red-500 col-span-full">Error al cargar productos. Por favor, recargue la página.</p>';
    }
}

function categorizeProduct(productName) {
    if (!productName) return 'Varios 📦';
    const name = productName.toLowerCase();

    if (name.includes('alfajor')) return 'Alfajores 🍪';
    if (name.includes('9 de oro') || name.includes('trio') || name.includes('tostadas') || name.includes('pepas') || name.includes('cookies') || name.includes('gallery') || name.includes('salvado') || name.includes('galletita')) return 'Galletitas 🍪';
    if (name.includes('julicroc') || name.includes('papas') || name.includes('palitos') || name.includes('conix') || name.includes('maní') || name.includes('snacks')) return 'Snacks Salados 🥨';
    if (name.includes('baggio') || name.includes('vino') || name.includes('gaseosa') || name.includes('agua') || name.includes('jugo') || name.includes('uvita')) return 'Bebidas 🧃';
    if (name.includes('caramelo') || name.includes('turron') || name.includes('chocolate') || name.includes('chupetin') || name.includes('gomitas') || name.includes('vizzio') || name.includes('rocklets') || name.includes('pastillas')) return 'Golosinas 🍬';
    if (name.includes('aceite') || name.includes('fideos') || name.includes('arroz') || name.includes('puré') || name.includes('polenta') || name.includes('harina')) return 'Almacén 🛒';

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
            filterProducts(category);
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

function filterProducts(category) {
    if (category === 'Todos 🌟') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.categoria === category);
        renderProducts(filtered);
    }
}

function renderProducts(products) {
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = '<p class="text-gray-500 col-span-full text-center">No se encontraron productos en esta categoría.</p>';
        return;
    }

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

        productCard.innerHTML = `
            <div class="p-5">
                ${stockBadge}
                <h3 class="text-base font-semibold text-gray-800 min-h-[3rem] pr-16">${product.NOMBRE}</h3>
                <p class="text-2xl font-black text-blue-600 mt-2 mb-3">${currencyFormatter.format(product.precio)}</p>
                <span class="category-badge-card ${badgeColor}">${categoryName}</span>
            </div>
        `;

        if (product.stock <= 0) {
            productCard.classList.add('opacity-50');
        }

        productList.appendChild(productCard);
    });
}

function getCategoryColor(categoryName) {
    switch (categoryName) {
        case 'Alfajores': return 'bg-yellow-200 text-yellow-800';
        case 'Galletitas': return 'bg-orange-200 text-orange-800';
        case 'Snacks': return 'bg-red-200 text-red-800';
        case 'Bebidas': return 'bg-blue-200 text-blue-800';
        case 'Golosinas': return 'bg-pink-200 text-pink-800';
        case 'Almacén': return 'bg-green-200 text-green-800';
        default: return 'bg-gray-200 text-gray-800';
    }
}

// --- UTILIDADES ---
async function loadCSV(filePath) {
    try {
        console.log('Cargando archivo:', filePath);
        const response = await fetch(`${filePath}?v=${new Date().getTime()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Archivo cargado, longitud:', text.length);
        return parseCSV(text);
    } catch (error) {
        console.error('Error loading CSV:', error);
        throw error;
    }
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    console.log('Líneas en CSV:', lines.length);

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toUpperCase());
    console.log('Headers:', headers);

    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        if (values.length === headers.length) {
            const entry = {};
            for (let j = 0; j < headers.length; j++) {
                let val = values[j].trim().replace(/^"|"$/g, '');
                entry[headers[j]] = val;
            }
            data.push(entry);
        } else if (lines[i].trim()) {
            console.warn('Línea CSV mal formada, omitida:', lines[i]);
        }
    }

    console.log('Datos parseados:', data.length, 'registros');
    return data;
}