// Configuración de URLs
const baseUrl = "https://elcatrachorestaurantes.somee.com";
const fullApiUrl = `${baseUrl}/api/Usuarios`;

// Verifica si existe un token y un uuid en el almacenamiento
const isTokenExist = function () {
    const token = sessionStorage.getItem("authToken");
    const userInfo = localStorage.getItem("uuid");

    if (!token || !userInfo) {
        window.location.href = '../../../views/common/login.html';
    }
};

// Cierra sesión y limpia los datos del almacenamiento
const closeSession = function () {
    localStorage.removeItem("uuid");
    sessionStorage.removeItem("authToken");
    window.location.href = "../../../views/common/login.html";
};

// Función genérica para realizar peticiones GET
const makeRequest = async (url, method) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const token = sessionStorage.getItem("authToken");
    if (!token) {
        alert('No se procesó la solicitud, por favor, vuelve a loguearte');
        return;
    }

    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = {
        method: method,
        headers: myHeaders,
        redirect: "follow"
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

// Obtiene los datos del usuario logueado y los muestra
const getProfile = async () => {
    const payload = JSON.parse(atob(localStorage.getItem("uuid")));

    try {
        const data = await makeRequest(fullApiUrl + '/' + payload, "GET");

        if (data.id_usuario) {
            document.getElementById("nombre").value = atob(data.nombre);
            document.getElementById("correo").value = atob(data.correo);
            document.getElementById("telefono").value = atob(data.telefono);
            document.getElementById("direccion").value = atob(data.direccion);
            document.getElementById("rol").value = atob(data.rol);
        }
    } catch (error) {
        Swal.fire({
            title: "Error",
            text: error,
            icon: "error"
        });
    }
};

// Alterna el sidebar del carrito si existe en la vista
function toggleCartSidebar() {
    const sidebar = document.getElementById('cartSidebarNode');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// Inicializa la vista
document.addEventListener("DOMContentLoaded", function () {
    isTokenExist();
    getProfile();

    if (document.getElementById('cartSidebarNode')) {
        toggleCartSidebar();
    }
});