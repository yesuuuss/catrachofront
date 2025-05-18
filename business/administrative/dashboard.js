// Función para chequear el token, si no, no permite ver la página
const isTokenExist = function () {
    const token = sessionStorage.getItem("authToken");
    const userInfo = localStorage.getItem("uuid");

    if (!token || !userInfo) {
        window.location.href = '../../../views/common/login.html';
    }
}

//FUNCION PARA MOSTRAR EL MENÚ EN BASE A LOS ROLES
const printMenu = function () {
    // Obtiene el token
    const token = sessionStorage.getItem("authToken");

    // Decodificar el token para obtener el rol
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;
    const adminNav = document.getElementById('adminNav');

    try {
        if (!role) {
            alert('No se pudo obtener el rol, por favor verifique.');
        }

        if (role == 1) {
            adminNav.innerHTML = `<ul class="navbar-nav ms-auto align-items-center">
                <li class="nav-item">
                    <a class="nav-link text-dark ms-3 me-3" href="dashboard.html"><i class="bi bi-house fs-5"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark ms-3 me-3" href="modules/usuarios.html"><i class="bi bi-people-fill fs-5"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark ms-3 me-3" href="modules/productos.html"><i class="bi bi-box-seam fs-5"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark ms-3 me-3" href="modules/pedidos.html"><i class="bi bi-receipt fs-5"></i></a>
                </li>
                <li class="nav-item">
                    <a class="btn btn-danger ms-3 me-3" onclick="closeSession()">
                        <i class="bi bi-box-arrow-left fs-5"></i>
                    </a>
                </li>
            </ul>`;
        }
        else if (role == 3) {
            adminNav.innerHTML = `<ul class="navbar-nav ms-auto align-items-center">
                <li class="nav-item">
                    <a class="nav-link text-dark ms-3 me-3" href="dashboard.html"><i class="bi bi-house fs-5"></i></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark ms-3 me-3" href="modules/pedidos.html"><i class="bi bi-receipt fs-5"></i></a>
                </li>
                <li class="nav-item">
                    <a class="btn btn-danger ms-3 me-3" onclick="closeSession()">
                        <i class="bi bi-box-arrow-left fs-5"></i>
                    </a>
                </li>
            </ul>`;
        }
        else {
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('uuid');
            window.location.href = '../../../views/common/login.html';
        }
    } catch (error) {
        alert('Surgió un error inesperado: ' + error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    isTokenExist();
    printMenu();
});