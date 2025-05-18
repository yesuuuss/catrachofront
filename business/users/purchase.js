// Configuración de URLs
const baseUrl = "https://elcatrachorestaurantes.somee.com";
const fullApiUrlProductos = `${baseUrl}/api/Productos`;

// Variable global para el total
let total = 0;
let carritoCompras = [];

//Funcion para ver el token, si no, no permite ver la página
const isTokenExist = function () {
    const token = sessionStorage.getItem("authToken");
    const userInfo = localStorage.getItem("uuid");

    if (!token || !userInfo) {
        window.location.href = '../../../views/common/login.html';
    }
}

//Funcion para cerrar sesión
const closeSession = function () {
    localStorage.removeItem("uuid");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("ultimoPedido");

    carritoCompras = [];
    document.getElementById("cart").innerHTML = "";
    total = 0;
    document.getElementById("total").textContent = "0.00";
    window.location.href = "../../../views/common/login.html";
}

// Función Reutilizable para Fetch (GET, DELETE)
const makeReuestGetDelete = async (url, method) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const token = sessionStorage.getItem("authToken");
    if (!token) {
        return;
    }
    myHeaders.append("Authorization", `Bearer ${token}`);

    const reuestOptions = {
        method: method,
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        const response = await fetch(url, reuestOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error en la solicitud.");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

// Función para obtener productos y cargarlos en la interfaz
const cargarProductos = async () => {
    const productList = document.getElementById("product-list");
    try {
        const productos = await makeReuestGetDelete(fullApiUrlProductos, "GET");

        if (productos.length > 0) {
            productList.innerHTML = "";

            const categorias = {};
            productos.forEach(p => {
                if (!categorias[p.categoria]) {
                    categorias[p.categoria] = [];
                }
                categorias[p.categoria].push(p);
            });

            for (const categoria in categorias) {
                const titulo = document.createElement("h4");
                titulo.classList.add("category-title");
                titulo.textContent = `Nuestros ${categoria}`;
                productList.appendChild(titulo);

                const fila = document.createElement("div");
                fila.classList.add("row", "mb-4");

                categorias[categoria].forEach(producto => {
                    const card = document.createElement("div");
                    card.classList.add("col-md-4", "mb-3");
                    card.innerHTML = `
                        <div class="card product-card shadow-sm w-100" style="border-radius: 12px; overflow: hidden; font-size: 0.9rem;">
                            <img src="${producto.imagenUrl || '../../../assets/common/img/placeholder-image.png'}" 
                                 class="card-img-top product-image" 
                                 alt="${producto.nombre}" 
                                 onerror="this.onerror=null;this.src='../../../assets/common/img/placeholder-image.png';"
                                 style="height: 160px; object-fit: cover;">
                            <div class="card-body p-2 d-flex flex-column">
                                <div class="text-truncate fw-semibold mb-1" style="font-size: 0.95rem;">${producto.nombre}</div>
                                <div class="text-dark fw-bold mb-2" style="font-size: 0.95rem;">Q${producto.precio.toFixed(2)}</div>
                                <button class="btn btn-sm btn-secondary mt-auto rounded-pill" 
                                        onclick="agregarAlCarrito(${producto.idProducto}, '${producto.nombre}', ${producto.precio})">
                                    <i class="bi bi-cart-plus me-1"></i> Agregar
                                </button>
                            </div>
                        </div>
                    `;
                    fila.appendChild(card);
                });

                productList.appendChild(fila);
            }

        } else {
            productList.innerHTML = "";
            const card = document.createElement("div");
            card.classList.add("col-12", "mb-3");
            card.innerHTML = `
                <div class="card p-2 text-center">
                    <h6 class="mt-2">-- NO HAY PRODUCTOS DISPONIBLES --</h6>
                    <p class="text-muted">Vuelve pronto, gracias por confiar en Donde El Catracho</p>
                </div>
            `;
            productList.appendChild(card);
        }
    } catch (error) {
        Swal.fire({
            title: "Error",
            text: error,
            icon: "error"
        });
    }
};

const agregarAlCarrito = function (id, nombre, precio) {
    const cart = document.getElementById("cart");
    const totalElement = document.getElementById("total");

    const productoExistente = carritoCompras.find(item => item.id === id);

    if (productoExistente) {
        productoExistente.cantidad += 1;

        const itemDOM = document.getElementById(`item-${id}`);
        itemDOM.querySelector(".cantidad").textContent = `x${productoExistente.cantidad}`;
        itemDOM.querySelector(".subtotal").textContent = `Subtotal: Q${(productoExistente.precio * productoExistente.cantidad).toFixed(2)}`;
    } else {
        const nuevoProducto = { id, nombre, precio, cantidad: 1 };
        carritoCompras.push(nuevoProducto);

        const item = document.createElement("li");
        item.classList.add("list-group-item");
        item.id = `item-${id}`;
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div>${nombre} <span class="badge bg-secondary rounded-pill cantidad">x1</span></div>
                    <div class="text-muted small">
                        Q${precio.toFixed(2)} c/u | <span class="subtotal">Subtotal: Q${precio.toFixed(2)}</span>
                    </div>
                </div>
                <div class="btn-group btn-group-sm ms-2 mt-2" role="group">
                    <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${id}, -1)">–</button>
                    <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${id}, 1)">+</button>
                </div>
            </div>
        `;
        cart.appendChild(item);
    }

    total += precio;
    totalElement.textContent = `${total.toFixed(2)}`;
    actualizarBotonConfirmar();

    // Mostrar el carrito por unos segundos si pantalla es menor a 1000px
    if (window.innerWidth < 1000) {
        const carritoSidebar = document.getElementById("cartSidebarNode");

        carritoSidebar.classList.add("show");

        clearTimeout(carritoSidebar.timeoutId); // Limpiar timeout anterior si lo hay
        carritoSidebar.timeoutId = setTimeout(() => {
            carritoSidebar.classList.remove("show");
        }, 2000);
    }

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Producto agregado al carrito',
        showConfirmButton: false,
        timer: 1200
    });
};


const resetMetodoPago = function () {
    document.getElementById("pagoEfectivo").checked = true;
    document.getElementById("infoTarjeta").classList.add("d-none");
    document.getElementById("infoBitcoin").classList.add("d-none");
    document.querySelector('#infoTarjeta input').value = "";
    document.querySelector('#infoBitcoin input').value = "";
    document.getElementById("nombreTarjeta").value = "";
    document.getElementById("numeroTarjeta").value = "";
    document.getElementById("fechaExp").value = "";
    document.getElementById("cvv").value = "";
};

const cambiarCantidad = function (id, cambio) {
    const totalElement = document.getElementById("total");

    const producto = carritoCompras.find(p => p.id === id);
    if (!producto) return;

    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        carritoCompras = carritoCompras.filter(p => p.id !== id);
        document.getElementById(`item-${id}`).remove();
    } else {
        const itemDOM = document.getElementById(`item-${id}`);
        itemDOM.querySelector(".cantidad").textContent = `x${producto.cantidad}`;
        itemDOM.querySelector(".subtotal").textContent = `Subtotal: Q${(producto.precio * producto.cantidad).toFixed(2)}`;
    }

    total = carritoCompras.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    totalElement.textContent = `${total.toFixed(2)}`;
    actualizarBotonConfirmar();
};

const actualizarBotonConfirmar = function () {
    const btn = document.getElementById("btnConfirmar");
    btn.disabled = carritoCompras.length === 0;
};

function toggleCartSidebar() {
    document.getElementById('cartSidebarNode').classList.toggle('show');
}

document.addEventListener("DOMContentLoaded", function () {
    isTokenExist();
    cargarProductos();
    actualizarBotonConfirmar();

    const metodoPagoInputs = document.querySelectorAll('input[name="metodoPago"]');
    const infoTarjeta = document.getElementById("infoTarjeta");
    const infoBitcoin = document.getElementById("infoBitcoin");

    metodoPagoInputs.forEach(input => {
        input.addEventListener("change", () => {
            infoTarjeta.classList.add("d-none");
            infoBitcoin.classList.add("d-none");

            if (input.value === "Tarjeta") {
                infoTarjeta.classList.remove("d-none");
            } else if (input.value === "Bitcoin") {
                infoBitcoin.classList.remove("d-none");
            }
        });
    });

    const modal = document.getElementById('modalConfirmacion');
    modal.addEventListener('shown.bs.modal', function () {
        const numeroTarjetaInput = document.getElementById('numeroTarjeta');
        if (numeroTarjetaInput) {
            numeroTarjetaInput.addEventListener('input', function (e) {
                let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = '';
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) {
                        formattedValue += ' ';
                    }
                    formattedValue += value[i];
                }
                e.target.value = formattedValue.trim();
            });
        }

        const fechaExpInput = document.getElementById('fechaExp');
        if (fechaExpInput) {
            fechaExpInput.addEventListener('input', function (e) {
                let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                if (value.length > 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }

        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', function () {
                this.value = this.value.replace(/\D/g, '').slice(0, 4);
            });
        }
    });
});