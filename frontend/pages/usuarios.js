const toast = document.getElementById('toast');

function mostrarToast(mensaje, tipo = 'success') {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('invent_token');
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Error');
  }
  return data;
}

function obtenerRolTexto(rol) {
  return rol === 1 ? 'Administrador' : 'Vendedor';
}

async function cargarUsuarios() {
  try {
    const usuarios = await apiCall('/usuarios');
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) return;

    if (!usuarios.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios</td></tr>';
      return;
    }

    tbody.innerHTML = usuarios.map(usuario => `
      <tr>
        <td>${usuario.usuario}</td>
        <td>${usuario.nombre}</td>
        <td>${usuario.correo}</td>
        <td>${obtenerRolTexto(usuario.rol)}</td>
        <td>${usuario.activo ? 'Activo' : 'Inactivo'}</td>
        <td>
          <button class="btn btn-small btn-danger" onclick="desactivarUsuario(${usuario.id})">Desactivar</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    mostrarToast(`❌ ${error.message}`, 'error');
  }
}

window.desactivarUsuario = async function(id) {
  try {
    await apiCall(`/usuarios/${id}`, { method: 'DELETE' });
    mostrarToast('✅ Usuario desactivado');
    await cargarUsuarios();
  } catch (error) {
    mostrarToast(`❌ ${error.message}`, 'error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('invent_user') || 'null');
  if (!currentUser || parseInt(currentUser.rol) !== 1) {
    window.location.href = '/login';
    return;
  }

  const form = document.getElementById('formUsuario');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await apiCall('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          usuario: document.getElementById('usuario').value.trim(),
          nombre: document.getElementById('nombre').value.trim(),
          correo: document.getElementById('correo').value.trim(),
          password: document.getElementById('password').value,
          rol: parseInt(document.getElementById('rol').value),
          activo: document.getElementById('activo').value === 'true'
        })
      });

      form.reset();
      mostrarToast('✅ Usuario creado');
      await cargarUsuarios();
    } catch (error) {
      mostrarToast(`❌ ${error.message}`, 'error');
    }
  });

  cargarUsuarios();
});
