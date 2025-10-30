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

// --- 2. NUEVOS ELEMENTOS ---
const searchInput = document.getElementById('search-input');
const noResultsMessage = document.getElementById('no-results-message');

// --- DATOS GLOBALES ---
let allProducts = [];
let allClients = [];
const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
});

// --- 3. NUEVAS VARIABLES GLOBALES para filtros ---
let currentCategory = 'Todos 🌟';
let currentSearchTerm = '';

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
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
        }

        const client = allClients.find(c => {
            let clientPhone = (c.TELEFONO || '').trim().replace(/[\s\-\+\(\)]/g, '');
            return clientPhone === phoneNumber || clientPhone.endsWith(phoneNumber);
        });

        if (client) {
            showCatalog(client);
        } else {
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
            
            allProducts = allProducts.map(product => ({
                ...product,
                categoria: categorizeProduct(product.NOMBRE),
                stock: parseInt(product.STOCK, 10) || 0,
                precio: parseFloat(product.PRECIO) || 0,
                codigo: product.CODIGO || ''
            }))
            .filter(p => p.precio > 0 && p.NOMBRE);
        }

        renderCategories();
        // 5. LLAMAMOS A applyFilters() en lugar de renderProducts()
        applyFilters(); 

    } catch (err) {
        console.error('Error al cargar productos:', err);
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
        if (product.codigo) {
            imageUrl = `images/${product.codigo}.jpg`;
        }
        
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
        `;
        
        if (product.stock <= 0) {
            productCard.classList.add('opacity-50');
        }

        productList.appendChild(productCard);
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

// --- UTILIDADES ---
async function loadCSV(filePath) {
    // (Esta función sigue igual que antes)
    try {
        console.log('Cargando archivo:', filePath);
        const response = await fetch(`${filePath}?v=${new Date().getTime()}`); 

        if (!response.ok) {
            throw new Error(`Error de red! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Archivo cargado, longitud:', text.length);
        return parseCSV(text);
    } catch (error) {
        console.error('Error al cargar CSV:', error);
        throw error;
    }
}

function parseCSV(text) {
    // (Esta función sigue igual que antes)
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
            console.warn('Línea CSV mal formada, se omite:', lines[i]);
        }
    }

    console.log('Datos parseados:', data.length, 'registros');
    return data;
}