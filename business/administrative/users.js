// Configuración de URLs
const baseUrl = "https://elcatrachorestaurantes.somee.com";
const fullApiUrl = `${baseUrl}/api/Usuarios`;

//Funcion para chequear el token, si no, no permite ver la página
const isTokenExist = function () {
    const token = sessionStorage.getItem("authToken");
    const userInfo = localStorage.getItem("uuid");

    if (!token || !userInfo) {
        window.location.href = '../../../views/common/login.html';
    }
    else {
        return;
    }
}

//Funcion para mostrar menu
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
            adminNav.innerHTML = `
            <ul class="navbar-nav flex-row mx-auto align-items-center justify-content-center">
                <li class="nav-item">
                    <a class="nav-link text-dark mx-3" href="../dashboard.html">
                       <i class="bi bi-house fs-5"></i>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark mx-3" href="usuarios.html">
                       <i class="bi bi-people-fill fs-5"></i>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark mx-3" href="productos.html">
                       <i class="bi bi-box-seam fs-5"></i>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark mx-3" href="pedidos.html">
                       <i class="bi bi-receipt fs-5"></i>
                    </a>
                </li>
                <li class="nav-item">
                    <button class="btn btn-danger mx-3" onclick="closeSession()">
                       <i class="bi bi-box-arrow-left fs-5"></i>
                    </button>
                </li>
            </ul>`;
        } else if (role == 3) {
            adminNav.innerHTML = `
            <ul class="navbar-nav flex-row mx-auto align-items-center justify-content-center">
                <li class="nav-item">
                    <a class="nav-link text-dark mx-3" href="../dashboard.html">
                       <i class="bi bi-house fs-5"></i>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-dark mx-3" href="pedidos.html">
                       <i class="bi bi-receipt fs-5"></i>
                    </a>
                </li>
                <li class="nav-item">
                    <button class="btn btn-danger mx-3" onclick="closeSession()">
                       <i class="bi bi-box-arrow-left fs-5"></i>
                    </button>
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
printMenu();

const makeRequestGetDelete = async (url, method) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const token = sessionStorage.getItem("authToken");
    if (!token) return;
    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = { method, headers: myHeaders, redirect: "follow" };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) throw new Error(await response.text() || "Error en la solicitud.");
        return await response.json();
    } catch (error) {
        throw error;
    }
};

const makeRequestPostPut = async (url, method, body) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const token = sessionStorage.getItem("authToken");
    if (!token) {
        alert('No se procesó la solicitud, por favor, vuelve a loguearte');
        return;
    }
    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = { method, headers: myHeaders, body: JSON.stringify(body), redirect: "follow" };
    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) throw new Error(await response.text() || "Error en la solicitud.");
        return await response.json();
    } catch (error) {
        throw error;
    }
};

const decodificarBase64 = (textoBase64) => {
    try {
        return atob(textoBase64);
    } catch (error) {
        console.error("Error al decodificar base64:", error);
        return textoBase64;
    }
};

const getUsers = async () => {
    try {
        document.getElementById('clave').disabled = false;
        const data = await makeRequestGetDelete(fullApiUrl, "GET");

        if (data) {
            if ($.fn.DataTable.isDataTable("#usuariosTable")) {
                $('#usuariosTable').DataTable().destroy();
            }

            const tbody = document.getElementById("usuariosTabla");
            tbody.innerHTML = "";

            data.forEach((usuario, index) => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${decodificarBase64(usuario.nombre)}</td>
                    <td>${decodificarBase64(usuario.correo)}</td>
                    <td>${decodificarBase64(usuario.rol) == 1 ? 'Administrador' :
                    decodificarBase64(usuario.rol) == 2 ? 'Gerente' :
                        decodificarBase64(usuario.rol) == 3 ? 'Empleado' : 'Cliente'}</td>
                    <td>${decodificarBase64(usuario.telefono)}</td>
                    <td>${decodificarBase64(usuario.direccion)}</td>
                    <td>
                        <button class='btn btn-warning btn-sm' onclick='userEdit(${usuario.id_usuario},
                            "${decodificarBase64(usuario.nombre).replace(/"/g, '&quot;')}",
                            "${decodificarBase64(usuario.correo).replace(/"/g, '&quot;')}",
                            "${decodificarBase64(usuario.rol)}",
                            "${decodificarBase64(usuario.telefono).replace(/"/g, '&quot;')}",
                            "${decodificarBase64(usuario.direccion).replace(/"/g, '&quot;')}")'>Editar</button>
                        <button class='btn btn-danger btn-sm' onclick='userDelete(${usuario.id_usuario})'>Eliminar</button>
                    </td>`;
                tbody.appendChild(fila);
            });

            $('#usuariosTable').DataTable({
                destroy: true,
                responsive: true,
                pageLength: 10,
                lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
                language: {
                    url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
                },
                order: [[0, "asc"]]
            });
        } else {
            console.log("No hay datos de usuarios.");
        }
    } catch (error) {
        alert(error);
    }
};

const userDelete = async (id_usuario) => {
    try {
        const confirmDelete = confirm("¿Estás seguro de que deseas eliminar?");
        if (!confirmDelete) return;
        const data = await makeRequestGetDelete(fullApiUrl + '/' + id_usuario, "DELETE");
        if (data.isSuccess === true) {
            getUsers();
            alert('Usuario eliminado con éxito');
        } else {
            alert('No se pudo eliminar el usuario, verifique nuevamente');
            getUsers();
        }
    } catch (error) {
        alert(error);
    }
};

const userEdit = function (id_usuario, nombre, correo, rol, telefono, direccion) {
    document.getElementById('id_usuario').value = id_usuario;
    document.getElementById('nombre').value = nombre;
    document.getElementById('correo').value = correo;
    document.getElementById('rol').value = rol;
    document.getElementById('telefono').value = telefono;
    document.getElementById('direccion').value = direccion;
    document.getElementById('clave').disabled = true;
}

const userUpdate = async () => {
    const id_usuario = document.getElementById('id_usuario').value;
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const rol = document.getElementById('rol').value;
    const telefono = document.getElementById('telefono').value;
    const direccion = document.getElementById('direccion').value;

    try {
        const body = { id_usuario, nombre, correo, rol, telefono, direccion };
        const data = await makeRequestPostPut(fullApiUrl, "PUT", body);
        if (data.isSuccess === true) {
            getUsers();
            alert('Usuario actualizado con éxito');
            resetData();
        } else {
            alert("No se pudo actualizar, verifique de nuevo");
            getUsers();
        }
    } catch (error) {
        alert(error);
    }
};

const userCreate = async () => {
    const id_usuario = 0;
    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const rol = document.getElementById('rol').value;
    const telefono = document.getElementById('telefono').value;
    const direccion = document.getElementById('direccion').value;
    const clave = document.getElementById('clave').value;

    if (!nombre || !correo || !rol || !telefono || !direccion || !clave) {
        alert('Todos los datos son obligatorios para crear un usuario.');
        return;
    }

    try {
        const body = { id_usuario, nombre, correo, clave, rol, telefono, direccion };
        const data = await makeRequestPostPut(fullApiUrl, "POST", body);
        if (data.isSuccess === true) {
            getUsers();
            alert('Usuario creado con éxito');
            resetData();
        } else {
            alert("No se pudo crear, verifique de nuevo");
            getUsers();
        }
    } catch (error) {
        alert(error);
    }
};

const saveButtonOptions = function () {
    const option = document.getElementById('id_usuario').value;
    const clave = document.getElementById('clave').value;
    try {
        if (option) {
            userUpdate();
            getUsers();
        }
        else {
            if (clave) {
                userCreate();
                getUsers();
            }
        }
    }
    catch (error) {
        alert(error);
    }
}

const resetData = function () {
    document.getElementById('id_usuario').value = "";
    document.getElementById('nombre').value = "";
    document.getElementById('correo').value = "";
    document.getElementById('rol').value = 1;
    document.getElementById('telefono').value = "";
    document.getElementById('direccion').value = "";
    document.getElementById('clave').value = "";
    document.getElementById('clave').disabled = false;
}

document.addEventListener("DOMContentLoaded", function () {
    isTokenExist();
    getUsers();
});