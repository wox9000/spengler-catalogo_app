# 🛍️ Catálogo Digital - Spengler Distribuciones

Catálogo digital de productos desarrollado para Spengler Distribuciones, permitiendo a los clientes el acceso a una lista de productos personalizada y la generación de pedidos a través de WhatsApp.

---

## 🚀 Despliegue y Ejecución Local

⚠️ **NOTA IMPORTANTE SOBRE EL ENTORNO DE DESARROLLO** ⚠️

Esta aplicación **NO FUNCIONARÁ** si se intenta abrir directamente con un servidor local simple (como el "Live Server" de VSCode) o navegando el archivo `index.html`.

Esto se debe a que la lógica principal de la aplicación (`handleLogin` en `app.js`) depende de una **Función Serverless de Netlify** (`/.netlify/functions/catalog`) para la autenticación del cliente y la carga de los datos.

Para ejecutar la aplicación localmente, debes simular el entorno de Netlify utilizando la CLI:

### Requisitos

1. **Node.js** y **npm** instalados.
2. **Netlify CLI** instalado globalmente: `npm install -g netlify-cli`.

### Pasos para Ejecutar

1. **Instalar dependencias de la función:**
    * Navega a la carpeta de la función: `cd netlify/functions`
    * Instala las dependencias necesarias: `npm install`
    * Vuelve al directorio raíz: `cd ../..`
2. **Ejecutar Netlify Dev:**
    * En la raíz del proyecto, ejecuta: `netlify dev`

Esto iniciará un servidor local (típicamente en `http://localhost:8888`) que manejará las funciones *serverless*, permitiendo que el login funcione correctamente.

---

## 💡 Funcionamiento de la Aplicación

### 1. Sistema de Acceso

El acceso al catálogo se realiza a través de una **autenticación por número de teléfono**.

1. El cliente ingresa su número de teléfono en la pantalla de inicio.
2. La aplicación llama a la **Función Serverless `catalog.js`** con el número de teléfono como cuerpo de la petición (`POST / .netlify/functions/catalog`).
3. La función consulta el archivo `clientes.csv` para validar el número y obtener el nombre del cliente.
4. Si el cliente es válido, se devuelve su información y la lista completa de productos (`productos.csv`) al frontend.

### 2. Navegación y Filtros

Una vez dentro, los productos se muestran en un diseño de cuadrícula y se pueden filtrar mediante tres criterios principales:

* **Categoría:** Filtrado por tipo de producto (e.g., Alfajores 🍪, Golosinas 🍬, Bebidas 🧃).
* **Marca:** Filtrado por marca (e.g., Arcor, Baggio, Juli Croc).
* **Búsqueda:** Búsqueda en tiempo real por el nombre del producto.
* **Ordenación:** Los productos con **stock disponible** se muestran siempre primero en la lista.

### 3. Carrito y Pedidos

* **Añadir Producto:** Los productos se pueden añadir de forma individual (`+1`) o con la **oferta `10+1`**, que aplica un **10% de descuento** al subtotal de ese ítem en el carrito.
* **Persistencia:** El contenido del carrito se guarda en el navegador (usando `localStorage`) para persistir entre sesiones.
* **Cálculo:** El carrito calcula el **total estimado** y aplica el descuento del 10% a los productos marcados con la oferta 10+1.
* **Envío por WhatsApp:** Al finalizar, el cliente presiona el botón **"Enviar Pedido por WhatsApp"**. Esto genera un mensaje prellenado que incluye el nombre del cliente, un detalle de cada producto (incluyendo si se aplicó el 10% de descuento), y el total estimado, y abre la conversación de WhatsApp con el vendedor `3435087823`.

---

## 🛠️ Estructura del Código

* `index.html`: Estructura principal, incluye Tailwind CSS y la lógica de la UI del catálogo y carrito.
* `app.js`: Contiene toda la lógica del *frontend*: login, filtros, renderizado de productos, manejo del carrito (agregar, eliminar, calcular total), persistencia con `localStorage`, y generación del mensaje de WhatsApp.
* `netlify/functions/catalog.js`: La función *serverless* de Node.js que maneja la lógica de *backend*: lee los CSVs, autentica al cliente por teléfono y devuelve los datos de productos y cliente.
* `netlify/functions/data/clientes.csv`: Base de datos de clientes con números de teléfono para la autenticación.
* `netlify/functions/data/productos.csv`: Base de datos de productos con códigos, stock, precios, y nombres.
* `netlify.toml`: Archivo de configuración de Netlify que asegura que la carpeta `data` (con los CSVs) sea incluida en el *bundle* de la función *serverless*.

## 🧭 Guía Breve de Ramas de Desarrollo

| Rama | Propósito | Tipo de Tarea | Estado/Riesgo |
| :--- | :--- | :--- | :--- |
| **`develop`** | Rama base de integración y pruebas. | Integración Continua. | Estable. |
| **`feature/update-images`** | Actualización de archivos multimedia (imágenes, logos) en el directorio `/images`. | Contenido/Assets. | Bajo (cambio visual). |
| **`feature/user-login`** | Modificación y mejora de la lógica de autenticación en `app.js` y `catalog.js`. | Backend/Autenticación. | Medio (lógica crítica). |
| **`feature/ui-mobile`** | Refactorización de estilos y HTML para optimizar la experiencia de usuario en dispositivos móviles (responsividad). | Frontend/UX. | Medio (CSS/HTML). |
| **`feature/stock-logic`** | Implementación de la lógica de validación de `STOCK` al agregar productos al carrito. | Lógica de Negocio. | Alto (prevención de errores de venta). |
| **`bugfix/parse-csv`** | **CRÍTICA:** Corregir el fallo en la función `parseCSV` para que admita comas dentro de campos entre comillas. | Backend/Estabilidad. | **Alta (bloquea el acceso)**. |

Aquí tienes el flujo de trabajo semanal en formato Markdown, listo para que lo copies en tu `README.md` o lo uses como tu guía de referencia.

## 🔄 Flujo de Trabajo Semanal de Actualización de FUNCIONALIDAD (SUBIR A DEVELOP)

1. Cámbiate a la rama 'develop'
git checkout develop

2. Asegúrate de que 'develop' esté actualizada (buena práctica)
git pull origin develop

3. Fusiona los cambios de 'MI-RAMA-DE-TRABAJO' *DENTRO* de 'develop'
git merge MI-RAMA-DE-TRABAJO

## 🔄 Flujo de Trabajo Semanal de Actualización de IMÁGENES

### 1. Cámbiate a la rama 'main' y actualízala

```bash
git checkout main
git pull
git checkout feature/update-images
git pull origin feature/update-images
```

### 2. Actualiza las imágenes en la carpeta `/images`

Reemplaza las imágenes viejas por las nuevas en la carpeta `/images`.

### 3. Confirma los cambios (commit)

```bash
git add images/
git commit -m "chore(images): Actualización de imágenes - "
```

### 4. Testea localmente

netlify dev

### 5. Vuelve a la rama principal y trae los cambios

```bash
git checkout main
git checkout feature/update-images -- images/
```

### 6. Confirma los cambios en 'main'

```bash     
git add images/
git commit -m "chore(images): Actualización de imágenes - Semana X"
```

### 7. Sube 'main' a producción. Netlify desplegará los cambios

```bash
git push origin main
```

---

## 🔄 Flujo de Trabajo Semanal de Actualización de DATOS (CSV)

Guía paso a paso para la actualización semanal de los archivos `clientes.csv` y `productos.csv`, asegurando un testeo local antes de desplegar a producción (`main`).

### Paso 1: Sincronizar la rama `main`

Asegúrate de que tu rama `main` local esté idéntica a la versión remota (la que está en la nube).

```bash
# 1. Cámbiate a tu rama principal
git checkout main

# 2. Descarga cualquier cambio que esté en la nube
git pull origin main
````

### Paso 2: Preparar tu rama `actualizar-datos`

Actualiza tu rama de datos (`actualizar-datos`) para que esté basada en la última versión de `main`.

```bash
# 3. Cámbiate a tu rama de datos
# (Si no existe, créala la primera vez con: git checkout -b actualizar-datos)
git checkout actualizar-datos

# 4. Trae los cambios de 'main' a esta rama.
# (Esto asegura que trabajas sobre la última versión del código)
git merge main
```

### Paso 3: Actualizar los Archivos (Tu Tarea Manual)

Este es el paso donde reemplazas los archivos viejos por los nuevos en tu PC.

1. Navega a la carpeta: **`netlify/functions/data/`**
2. Borra los archivos `clientes.csv` y `productos.csv` antiguos.
3. Copia y pega tus **nuevos** archivos `clientes.csv` y `productos.csv` en esa misma carpeta.

### Paso 4: Confirmar los Cambios (Commit)

"Guarda" estos nuevos archivos en el historial de Git.

```bash
# 5. Agrega ambos archivos CSV al "área de preparación"
git add netlify/functions/data/clientes.csv netlify/functions/data/productos.csv

# 6. Crea un "commit" (un punto de guardado) con un mensaje claro
# (Puedes cambiar "Semana 45" por la fecha o número de semana)
git commit -m "chore(data): Actualización de stock y clientes - Semana x"
```

### Paso 5: Testear Localmente (Validación)

Este es el paso de seguridad más importante.

```bash
# 7. Inicia el entorno de prueba de Netlify
netlify dev
```

1. Abre tu navegador en `http://localhost:8888` (o el puerto que te indique la terminal).
2. **Prueba el login** con un teléfono de un cliente **nuevo** y uno **antiguo**.
3. **Verifica el stock** de un producto que sepas que cambió.
4. Si todo funciona como esperas, detén el servidor (Ctrl+C en la terminal).

### Paso 6: Fusionar a `main` y Desplegar

Si las pruebas locales fueron exitosas, es hora de enviar los cambios a la rama principal (`main`) para que Netlify los despliegue.

### Paso 7: Vuelve a la rama principal

```bash
git checkout main
```

### 8. Trae (cherry-pick) SOLO el archivo de clientes desde 'actualizar-datos'

```bash
git checkout actualizar-datos -- netlify/functions/data/clientes.csv
```

### 9. Trae (cherry-pick) SOLO el archivo de productos desde 'actualizar-datos'

```bash
git checkout actualizar-datos -- netlify/functions/data/productos.csv
```

### 10. Confirma AMBOS archivos CSV en 'main'

```bash
git commit -m "chore(data): Despliegue de nuevo stock y clientes (Semana X)"
```

### 11. Sube 'main' a producción. Netlify desplegará los cambios

```bash
git push origin main
```
