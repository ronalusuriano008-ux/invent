const toast = document.getElementById('toast');

function mostrarToast(mensaje, tipo = 'success') {
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

async function apiCall(endpoint, options = {}) {
  return window.inventApi.call(endpoint, options);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLogin');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await apiCall('/usuarios/login', {
        method: 'POST',
        body: JSON.stringify({ usuario, password })
      });

      localStorage.setItem('invent_user', JSON.stringify(response.usuario));
      localStorage.setItem('invent_token', response.token);
      mostrarToast('Acceso concedido', 'success');

      window.location.href = response.usuario.rol === 1 ? '/' : '/pos';
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  });
});
