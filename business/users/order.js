// Configuración de URLs
const baseUrlApi = "https://elcatrachorestaurantes.somee.com";
const fullApiUrlPedidos = `${baseUrlApi}/api/Pedidos`;
const fullApiUrlDetallesPedido = `${baseUrlApi}/api/DetallesPedido`;

// Función Reutilizable para Fetch (POST, PUT)
const makeRequestPostPutOrder = async (url, method, body) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    // Obtén el token del sessionStorage
    const token = sessionStorage.getItem("authToken");

    // Agrega el token al encabezado Authorization si existe
    if (!token) {
        Swal.fire({
            title: "Error", text: "No se procesaron las solicitudes, vuelve a loguearte.", icon: "error"
        });
        return;
    }

    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = {
        method: method, headers: myHeaders, body: JSON.stringify(body), redirect: "follow"
    };

    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Error en la solicitud.");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

// Función Reutilizable para Fetch (GET, DELETE)
const makeReuestGetDeleteOrder = async (url, method) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const token = sessionStorage.getItem("authToken");
    if (!token) {
        return;
    }
    myHeaders.append("Authorization", `Bearer ${token}`);

    const reuestOptions = {
        method: method, headers: myHeaders, redirect: "follow"
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


// Función para mostrar el modal de confirmación de pedido
const mostrarModal = function () {
    const modalTotal = document.getElementById("modalTotal");
    const modalFechaCreacion = document.getElementById("modalFechaCreacion");
    const modalFechaEntrega = document.getElementById("modalFechaEntrega");

    if (carritoCompras.length === 0) {
        Swal.fire({
            title: "Advertencia",
            text: "El carrito está vacío. Agrega productos antes de confirmar el pedido.",
            icon: "warning"
        });
        return;
    }

    modalTotal.textContent = total.toFixed(2);
    modalFechaCreacion.textContent = new Date().toLocaleDateString();
    modalFechaEntrega.textContent = new Date(Date.now() + 86400000).toLocaleDateString();

    const modal = new bootstrap.Modal(document.getElementById("modalConfirmacion"));
    modal.show();
};


// Función para finalizar el pedido y guardarlo en LocalStorage
const finalizarPedido = function () {
    const direccionEntrega = document.getElementById("direccion").value.trim();
    const indicaciones = document.getElementById("indicaciones").value.trim();
    const fechaEntregaISO = new Date(Date.now() + 86400000).toISOString(); // +1 día en formato ISO

    if (!direccionEntrega || !indicaciones) {
        Swal.fire({
            title: "Advertencia", text: "Ingresa una dirección y número de teléfono para continuar.", icon: "warning"
        });
        return;
    }

    if (carritoCompras.length === 0) {
        Swal.fire({
            title: "Advertencia",
            text: "El carrito está vacío. Agrega productos antes de confirmar el pedido.",
            icon: "warning"
        });
        return;
    }

    const metodo = document.querySelector('input[name="metodoPago"]:checked').value;

    // Validaciones de método de pago
    if (metodo === "Tarjeta") {
        const nombre = document.getElementById("nombreTarjeta").value.trim();
        const numero = document.getElementById("numeroTarjeta").value.replace(/\s/g, "");
        const fecha = document.getElementById("fechaExp").value.trim();
        const cvv = document.getElementById("cvv").value.trim();

        if (!nombre || numero.length !== 16 || !/^\d{2}\/\d{2}$/.test(fecha) || !/^\d{3,4}$/.test(cvv)) {
            Swal.fire({
                icon: "warning",
                title: "Datos inválidos",
                text: "Revisa que los datos de la tarjeta estén completos y correctos."
            });
            return;
        } else {
            Swal.fire({
                title: "Conectando con Cybersource",
                text: "Estamos procesando tu pago...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            setTimeout(() => {
                Swal.fire({
                    icon: "error",
                    title: "No se pudo procesar el pago",
                    html: `No se pudieron conectar con los servicios de <a href="https://neonet.com.gt/e_commerce/cybersource" target="_blank">Cybersource</a>. 
                    Intenta más tarde o utiliza otro método de pago.`,
                });
            }, 4000);
            return;
        }
    }

    if (metodo === "Bitcoin") {
        const wallet = document.getElementById("walletId").value.trim();
        if (!wallet) {
            Swal.fire({
                icon: "warning", title: "Falta Wallet ID", text: "Debes ingresar tu Wallet ID para pagar con Bitcoin."
            });
            return;
        }
    }

    const pedido = {
        numeroPedido: Math.floor(100000 + Math.random() * 900000),
        productos: carritoCompras,
        total: total.toFixed(2),
        fechaCreacion: new Date().toISOString(),  // Siempre usar formato ISO
        fechaEntrega: fechaEntregaISO,             // También ISO
        direccion: direccionEntrega,
        indicaciones: indicaciones || "N/A"
    };

    localStorage.setItem("ultimoPedido", JSON.stringify(pedido));

    if (!localStorage.getItem("ultimoPedido")) {
        Swal.fire({
            title: "Advertencia", text: "No existe ningún pedido, por favor, crea uno para continuar.", icon: "warning"
        });
    }

    orderCreated();
};


// Función para insertar el pedido y sus detalles en una transacción simulada
const orderCreated = async () => {
    const pedidoJson = localStorage.getItem("ultimoPedido");

    if (!pedidoJson) {
        Swal.fire({
            title: "Advertencia", text: "No existe ningún pedido, por favor, crea uno para continuar.", icon: "warning"
        });
        return;
    }

    let pedido;
    try {
        pedido = JSON.parse(pedidoJson);
        if (!pedido || !pedido.numeroPedido || !pedido.fechaEntrega || !pedido.total) {
            Swal.fire({
                title: "Advertencia", text: "El pedido creado es inválido.", icon: "warning"
            });
            return;
        }
    } catch (error) {
        Swal.fire({
            title: "Error", text: error, icon: "error"
        });
        return;
    }

    const encodedUserId = localStorage.getItem("uuid"); // Obtener el ID en base64
    if (!encodedUserId) {
        Swal.fire({
            title: "Advertencia", text: "No se encontró un usuario, por favor, vuelve a loguearte.", icon: "warning"
        });
        return;
    }

    try {
        const idUsuario = parseInt(atob(encodedUserId)); // Convertir a número

        const pedidoBody = {
            idPedido: 0,
            idUsuario: idUsuario,
            numeroPedido: pedido.numeroPedido.toString(),
            estado: "1",
            fechaCreacion: new Date().toISOString(),
            fechaEntregaEstimada: new Date(pedido.fechaEntrega).toISOString(),
            montoTotal: parseFloat(pedido.total),
            direccion: pedido.direccion.toString(),
            indicaciones: pedido.indicaciones.toString()
        };

        const pedidoData = await makeRequestPostPutOrder(fullApiUrlPedidos, "POST", pedidoBody);

        if (!pedidoData.isSuccess) {
            Swal.fire({
                title: "Advertencia", text: "No se pudo crear el pedido, intenta nuevamente.", icon: "warning"
            });
            return;
        }

        const idPedido = pedidoData.id_pedido;

        const detallesExitosos = await insertOrderDetails(pedido, idPedido);

        if (!detallesExitosos) {
            await makeReuestGetDeleteOrder(`${fullApiUrlPedidos}/${idPedido}`, "DELETE", {});
            Swal.fire({
                title: "Advertencia",
                text: "No se pudo crear el detalle del pedido, el pedido fue eliminado.",
                icon: "warning"
            });
            return;
        }

        successModal(pedido.numeroPedido.toString());
    } catch (error) {
        Swal.fire({
            title: "Error", text: error, icon: "error"
        });
    }
};


// Función para insertar los detalles del pedido
const insertOrderDetails = async (pedido, idPedido) => {
    try {
        let allSuccess = true;

        for (const producto of pedido.productos) {
            const detalleBody = {
                idDetalle: 0,
                idPedido: idPedido,
                numeroPedido: pedido.numeroPedido.toString(),
                idProducto: producto.id,
                cantidad: producto.cantidad,
                precioUnitario: parseFloat(producto.precio)
            };

            const detalleData = await makeRequestPostPutOrder(fullApiUrlDetallesPedido, "POST", detalleBody);

            if (!detalleData.isSuccess) {
                console.error("Error insertando detalle:", detalleData.message);
                allSuccess = false;
            }
        }

        return allSuccess;
    } catch (error) {
        Swal.fire({
            title: "Error", text: error, icon: "error"
        });
        return false;
    }
};


//Funcion para confirmar que el pedido fue exitoso
const successModal = function (numeroPedido) {
    // Cerrar modal de confirmación
    const modalConfirmacion = bootstrap.Modal.getInstance(document.getElementById("modalConfirmacion"));
    modalConfirmacion.hide();
    // Mostrar modal de éxito
    document.getElementById("numeroPedido").textContent = numeroPedido;
    const modalExito = new bootstrap.Modal(document.getElementById("modalExito"));
    modalExito.show();
    reset();
}


// Refrescar la pantalla después de finalizar pedido
const reset = function () {
    localStorage.removeItem("ultimoPedido");
    // Reiniciar el carrito
    carritoCompras = [];
    document.getElementById("cart").innerHTML = "";
    total = 0;
    document.getElementById("total").textContent = "0.00";
    document.getElementById("direccion").value = "";
    document.getElementById("indicaciones").value = "";
    actualizarBotonConfirmar();
    actualizarBotonConfirmar();
};