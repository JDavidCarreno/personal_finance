import {
  cargarConfig,
  guardarConfig,
  descargarJSON,
  leerArchivoJSON,
  urlDesdeConfig,
  configDesdeURL,
  nuevoId,
  DISPONIBLE_ID
} from './storage.js';
import { parseNumero, formatPorcentaje, sumaPorcentajes } from './calc.js';
import {
  renderTodo,
  renderResultados,
  toast,
  mostrarError,
  limpiarErrores,
  abrirDialogoBolsillo,
  abrirDialogoBloque,
  abrirDialogoPago
} from './ui.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

let estado = cargarConfig();
let textoMonto = '';

function persistir() {
  guardarConfig(estado);
  renderTodo(estado, textoMonto);
}

function cambiarVista(nombre) {
  for (const seccion of $$('.vista')) seccion.classList.remove('activa');
  for (const boton of $$('.nav-inferior button')) boton.classList.remove('activo');
  $(`#vista-${nombre}`).classList.add('activa');
  $(`.nav-inferior button[data-vista="${nombre}"]`).classList.add('activo');
}

function configurarNavegacion() {
  $('.nav-inferior').addEventListener('click', e => {
    const boton = e.target.closest('button[data-vista]');
    if (boton) cambiarVista(boton.dataset.vista);
  });
  document.addEventListener('click', e => {
    const salto = e.target.closest('[data-saltar]');
    if (!salto) return;
    const destino = salto.dataset.saltar;
    if (['calcular', 'bolsillos', 'bloques', 'pagos'].includes(destino)) {
      cambiarVista(destino);
    }
  });
}

function configurarCalculadora() {
  $('#monto').addEventListener('input', e => {
    textoMonto = e.target.value;
    renderResultados(estado, textoMonto);
  });
}

function nombreLimpio(valor) {
  const limpio = valor.trim().replace(/\s+/g, ' ');
  return limpio || null;
}

function configurarBolsillos() {
  $('#btn-nuevo-bolsillo').addEventListener('click', () => abrirDialogoBolsillo(estado));

  $('#lista-bolsillos').addEventListener('click', e => {
    const editar = e.target.closest('[data-editar-bolsillo]');
    if (editar) {
      if (editar.dataset.editarBolsillo !== DISPONIBLE_ID) {
        abrirDialogoBolsillo(estado, editar.dataset.editarBolsillo);
      }
      return;
    }
    const borrar = e.target.closest('[data-borrar-bolsillo]');
    if (borrar) borrarBolsillo(borrar.dataset.borrarBolsillo);
  });

  $('#form-bolsillo').addEventListener('submit', e => {
    e.preventDefault();
    limpiarErrores();
    const nombre = nombreLimpio($('#bolsillo-nombre').value);
    if (!nombre) {
      mostrarError('#error-bolsillo', 'El nombre no puede estar vacío.');
      return;
    }
    const idEditando = $('#bolsillo-editando-id').value;
    if (idEditando) {
      const bolsillo = estado.bolsillos.find(b => b.id === idEditando);
      if (bolsillo) bolsillo.nombre = nombre;
      toast('Bolsillo actualizado');
    } else {
      estado.bolsillos.push({ id: nuevoId(), nombre });
      toast('Bolsillo creado');
    }
    $('#dialog-bolsillo').close();
    persistir();
  });
}

function borrarBolsillo(id) {
  if (id === DISPONIBLE_ID) return;
  const bolsillo = estado.bolsillos.find(b => b.id === id);
  if (!bolsillo) return;
  const asociados = estado.bloques.filter(b => b.bolsilloId === id);
  const mensaje = asociados.length > 0
    ? `¿Eliminar "${bolsillo.nombre}"?\n\nTambién se eliminarán sus ${asociados.length} bloque(s) asociado(s).`
    : `¿Eliminar el bolsillo "${bolsillo.nombre}"?`;
  if (!confirm(mensaje)) return;
  estado.bolsillos = estado.bolsillos.filter(b => b.id !== id);
  estado.bloques = estado.bloques.filter(b => b.bolsilloId !== id);
  persistir();
  toast('Bolsillo eliminado');
}

function configurarBloques() {
  $('#btn-nuevo-bloque').addEventListener('click', () => {
    if (estado.bolsillos.length === 0) {
      toast('Primero crea un bolsillo', 'error');
      cambiarVista('bolsillos');
      return;
    }
    abrirDialogoBloque(estado);
  });

  $('#lista-bloques').addEventListener('click', e => {
    const editar = e.target.closest('[data-editar-bloque]');
    if (editar) {
      abrirDialogoBloque(estado, editar.dataset.editarBloque);
      return;
    }
    const borrar = e.target.closest('[data-borrar-bloque]');
    if (borrar) borrarBloque(borrar.dataset.borrarBloque);
  });

  $('#form-bloque').addEventListener('submit', e => {
    e.preventDefault();
    limpiarErrores();

    const nombre = nombreLimpio($('#bloque-nombre').value);
    if (!nombre) {
      mostrarError('#error-bloque', 'El nombre no puede estar vacío.');
      return;
    }

    const porcentaje = parseNumero($('#bloque-porcentaje').value);
    if (!Number.isFinite(porcentaje) || porcentaje <= 0) {
      mostrarError('#error-bloque', 'Ingresa un porcentaje válido mayor que cero.');
      return;
    }

    const idEditando = $('#bloque-editando-id').value;
    const otros = sumaPorcentajes(estado.bloques, idEditando || null);
    const disponible = 100 - otros;

    if (porcentaje > disponible + 1e-9) {
      mostrarError(
        '#error-bloque',
        disponible <= 0
          ? 'Ya asignaste el 100%. No queda porcentaje libre.'
          : `Solo tienes ${formatPorcentaje(Math.round(disponible * 100) / 100)} libres para este bloque.`
      );
      return;
    }

    const bolsilloId = $('#bloque-bolsillo').value;
    if (!bolsilloId) {
      mostrarError('#error-bloque', 'Selecciona un bolsillo destino.');
      return;
    }

    if (idEditando) {
      const bloque = estado.bloques.find(b => b.id === idEditando);
      if (bloque) Object.assign(bloque, { nombre, porcentaje, bolsilloId });
      toast('Bloque actualizado');
    } else {
      estado.bloques.push({ id: nuevoId(), nombre, porcentaje, bolsilloId });
      toast('Bloque creado');
    }
    $('#dialog-bloque').close();
    persistir();
  });
}

function configurarPagos() {
  $('#btn-nuevo-pago').addEventListener('click', () => abrirDialogoPago(estado));

  $('#lista-pagos').addEventListener('click', e => {
    const editar = e.target.closest('[data-editar-pago]');
    if (editar) {
      abrirDialogoPago(estado, editar.dataset.editarPago);
      return;
    }
    const borrar = e.target.closest('[data-borrar-pago]');
    if (borrar) borrarPago(borrar.dataset.borrarPago);
  });

  $('#form-pago').addEventListener('submit', e => {
    e.preventDefault();
    limpiarErrores();

    const nombre = nombreLimpio($('#pago-nombre').value);
    if (!nombre) {
      mostrarError('#error-pago', 'El nombre no puede estar vacío.');
      return;
    }

    const valor = parseNumero($('#pago-valor').value);
    if (!Number.isFinite(valor) || valor <= 0) {
      mostrarError('#error-pago', 'Ingresa un valor válido mayor que cero.');
      return;
    }

    const idEditando = $('#pago-editando-id').value;
    if (idEditando) {
      const pago = estado.pagos.find(p => p.id === idEditando);
      if (pago) Object.assign(pago, { nombre, valor });
      toast('Pago actualizado');
    } else {
      estado.pagos.push({ id: nuevoId(), nombre, valor });
      toast('Pago agregado');
    }
    $('#dialog-pago').close();
    persistir();
  });
}

function borrarPago(id) {
  const pago = estado.pagos.find(p => p.id === id);
  if (!pago) return;
  if (!confirm(`¿Eliminar el pago "${pago.nombre}"?`)) return;
  estado.pagos = estado.pagos.filter(p => p.id !== id);
  persistir();
  toast('Pago eliminado');
}

function borrarBloque(id) {
  const bloque = estado.bloques.find(b => b.id === id);
  if (!bloque) return;
  if (!confirm(`¿Eliminar el bloque "${bloque.nombre}"?`)) return;
  estado.bloques = estado.bloques.filter(b => b.id !== id);
  persistir();
  toast('Bloque eliminado');
}

function configurarDialogos() {
  for (const dialogo of $$('dialog')) {
    dialogo.addEventListener('click', e => {
      if (e.target === dialogo) dialogo.close();
    });
    const botonCerrar = dialogo.querySelector('[data-cerrar-dialogo]');
    if (botonCerrar) botonCerrar.addEventListener('click', () => dialogo.close());
  }
}

function configurarRespaldo() {
  $('#btn-exportar').addEventListener('click', () => {
    descargarJSON(estado);
    toast('Respaldo descargado');
  });

  $('#btn-importar').addEventListener('click', () => $('#input-importar').click());

  $('#input-importar').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const nueva = await leerArchivoJSON(file);
      const hayDatos = estado.bolsillos.length > 0 || estado.bloques.length > 0;
      if (hayDatos && !confirm('Esto reemplazará tu configuración actual. ¿Continuar?')) return;
      estado = nueva;
      persistir();
      toast('Configuración importada');
    } catch {
      toast('Archivo no válido', 'error');
    }
  });

  $('#btn-compartir').addEventListener('click', async () => {
    const url = urlDesdeConfig(estado);
    try {
      await navigator.clipboard.writeText(url);
      toast('Enlace copiado. Ábrelo en otro dispositivo');
    } catch {
      prompt('Copia este enlace:', url);
    }
  });
}

function procesarEnlaceCompartido() {
  const compartida = configDesdeURL();
  if (!compartida) return;
  history.replaceState(null, '', location.pathname + location.search);
  const hayDatos = estado.bolsillos.length > 0 || estado.bloques.length > 0;
  const aplicar = () => {
    estado = compartida;
    guardarConfig(estado);
    renderTodo(estado, textoMonto);
    toast('Configuración cargada desde el enlace');
  };
  if (hayDatos) {
    if (confirm('Este enlace trae una configuración compartida y reemplazará la actual. ¿Cargarla?')) {
      aplicar();
    }
  } else {
    aplicar();
  }
}

configurarNavegacion();
configurarCalculadora();
configurarBolsillos();
configurarBloques();
configurarPagos();
configurarDialogos();
configurarRespaldo();
procesarEnlaceCompartido();
renderTodo(estado, textoMonto);

if ('serviceWorker' in navigator) {
  const seguro = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if (seguro) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
