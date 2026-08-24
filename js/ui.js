import { formatCOP, formatPorcentaje, distribuir, sumaPorcentajes, parseNumero, calcularPagos } from './calc.js';
import { DISPONIBLE_ID } from './storage.js';

const PALETA = [
  '#059669', '#2563eb', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#db2777', '#65a30d'
];

function colorDeBolsillo(estado, id) {
  const i = estado.bolsillos.findIndex(b => b.id === id);
  return i === -1 ? PALETA[0] : PALETA[i % PALETA.length];
}

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = String(texto);
  return div.innerHTML;
}

const $ = selector => document.querySelector(selector);

export function toast(mensaje, tipo = '') {
  const contenedor = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast${tipo ? ' ' + tipo : ''}`;
  el.textContent = mensaje;
  contenedor.appendChild(el);
  setTimeout(() => {
    el.classList.add('saliendo');
    setTimeout(() => el.remove(), 260);
  }, 2400);
}

export function mostrarError(id, texto) {
  const el = $(id);
  el.textContent = texto;
  el.hidden = false;
}

export function limpiarErrores() {
  for (const id of ['#error-bolsillo', '#error-bloque']) {
    const el = $(id);
    el.hidden = true;
    el.textContent = '';
  }
}

export function renderTodo(estado, textoMonto) {
  renderBolsillos(estado);
  renderBloques(estado);
  renderPagos(estado);
  renderResultados(estado, textoMonto);
}

export function renderBolsillos(estado) {
  const lista = $('#lista-bolsillos');
  if (estado.bolsillos.length === 0) {
    lista.innerHTML = `
      <li class="aviso-vacio">
        Aún no tienes bolsillos.<br>Crea el primero para empezar a distribuir tu dinero.
        <br><button class="boton-primario" data-saltar="bolsillos">+ Crear bolsillo</button>
      </li>`;
    return;
  }
  lista.innerHTML = estado.bolsillos.map(b => {
    const nBloques = estado.bloques.filter(x => x.bolsilloId === b.id).length;
    const subtitulo = nBloques === 1 ? '1 bloque' : `${nBloques} bloques`;
    const esFijo = b.id === DISPONIBLE_ID;
    const acciones = esFijo ? '' : `
        <div class="item-acciones">
          <button class="boton-accion" data-editar-bolsillo="${b.id}" aria-label="Editar ${escapar(b.nombre)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="boton-accion peligro" data-borrar-bolsillo="${b.id}" aria-label="Eliminar ${escapar(b.nombre)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>`;
    return `
      <li class="item-lista">
        <span class="punto-color" style="background:${colorDeBolsillo(estado, b.id)}"></span>
        <div class="item-info">
          <div class="item-titulo">${escapar(b.nombre)}${esFijo ? ' <span class="badge-fijo">por defecto</span>' : ''}</div>
          <div class="item-subtitulo">${esFijo ? 'Bolsillo por defecto · ' : ''}${subtitulo}</div>
        </div>${acciones}
      </li>`;
  }).join('');
}

export function renderBloques(estado) {
  const lista = $('#lista-bloques');
  const nombres = new Map(estado.bolsillos.map(b => [b.id, b.nombre]));
  if (estado.bloques.length === 0) {
    let aviso;
    if (estado.bolsillos.length === 0) {
      aviso = `Primero crea un bolsillo en su pestaña.<br><button class="boton-primario" data-saltar="bolsillos">Ir a Bolsillos</button>`;
    } else {
      aviso = `Aún no tienes bloques.<br><button class="boton-primario" data-saltar="bloques">+ Crear bloque</button>`;
    }
    lista.innerHTML = `<li class="aviso-vacio">${aviso}</li>`;
  } else {
    lista.innerHTML = estado.bloques.map(b => `
      <li class="item-lista">
        <div class="item-info">
          <div class="item-titulo">${escapar(b.nombre)}</div>
          <div class="item-subtitulo">
            <span>→</span>${escapar(nombres.get(b.bolsilloId) ?? '?')}
          </div>
        </div>
        <div class="item-valor">${formatPorcentaje(b.porcentaje)}</div>
        <div class="item-acciones">
          <button class="boton-accion" data-editar-bloque="${b.id}" aria-label="Editar ${escapar(b.nombre)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="boton-accion peligro" data-borrar-bloque="${b.id}" aria-label="Eliminar ${escapar(b.nombre)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </li>`).join('');
  }
  const total = sumaPorcentajes(estado.bloques);
  const relleno = $('#barra-relleno');
  relleno.style.width = `${Math.min(total, 100)}%`;
  relleno.classList.toggle('lleno', total >= 99.999);
  $('#texto-progreso').textContent = total > 0
    ? `Asignado: ${formatPorcentaje(Math.round(total * 100) / 100)} · Libre: ${formatPorcentaje(Math.round((100 - total) * 100) / 100)}`
    : 'Asignado: 0% · Libre: 100%';
}

export function renderPagos(estado) {
  const lista = $('#lista-pagos');
  if (estado.pagos.length === 0) {
    lista.innerHTML = `
      <li class="aviso-vacio">
        Aún no hay pagos registrados.<br>
        <button class="boton-primario" data-saltar="pagos">+ Agregar pago</button>
      </li>`;
    return;
  }
  lista.innerHTML = estado.pagos.map(p => `
    <li class="item-lista">
      <div class="item-info">
        <div class="item-titulo">${escapar(p.nombre)}</div>
      </div>
      <div class="item-valor">${formatCOP(p.valor)}</div>
      <div class="item-acciones">
        <button class="boton-accion" data-editar-pago="${p.id}" aria-label="Editar ${escapar(p.nombre)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
        <button class="boton-accion peligro" data-borrar-pago="${p.id}" aria-label="Eliminar ${escapar(p.nombre)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    </li>`).join('');
}

export function renderResultados(estado, textoMonto) {
  const resultados = $('#resultados');
  const aviso = $('#aviso-config');

  if (estado.bolsillos.length === 0 || estado.bloques.length === 0) {
    resultados.innerHTML = '';
    aviso.innerHTML = `
      <div class="tarjeta aviso-vacio">
        ${estado.bolsillos.length === 0
          ? 'Configura tus bolsillos para empezar.'
          : 'Crea al menos un bloque con su porcentaje.'}
        <br><button class="boton-primario" data-saltar="${estado.bolsillos.length === 0 ? 'bolsillos' : 'bloques'}">Configurar</button>
      </div>`;
    return;
  }

  aviso.innerHTML = '';

  const monto = textoMonto ? parseNumero(textoMonto) : NaN;

  if (!Number.isFinite(monto) || monto <= 0) {
    resultados.innerHTML = `
      <div class="tarjeta aviso-vacio">Ingresa un monto para ver cuánto va a cada bolsillo.</div>`;
    return;
  }

  const { grupos, huerfanos, totalAsignado, sinAsignar } = distribuir(monto, estado.bloques, estado.bolsillos);

  if (grupos.length === 0 && huerfanos.length === 0) {
    resultados.innerHTML = `
      <div class="tarjeta aviso-vacio">No hay bloques válidos configurados.</div>`;
    return;
  }

  const tarjetas = grupos.map(g => `
    <section class="grupo-bolsillo tarjeta">
      <header>
        <h3><span class="punto-color" style="background:${colorDeBolsillo(estado, g.bolsillo.id)}"></span>${escapar(g.bolsillo.nombre)}</h3>
        <strong class="total">${formatCOP(g.total)}</strong>
      </header>
      <ul class="detalle-bloque">
        ${g.detalle.map(d => `
          <li>
            <span>${escapar(d.nombre)}</span>
            <span><span class="porcentaje">${formatPorcentaje(d.porcentaje)}</span> ${formatCOP(d.valor)}</span>
          </li>`).join('')}
      </ul>
    </section>`).join('');

  const filaSinAsignar = sinAsignar > 0
    ? `<div class="resumen-final tarjeta">
         <span>Sin asignar</span><strong>${formatCOP(sinAsignar)}</strong>
       </div>`
    : `<div class="resumen-final tarjeta">
         <span>Distribución completa ✓</span><strong>${formatCOP(0)}</strong>
       </div>`;

  let seccionPagos = '';
  if (estado.pagos.length > 0) {
    const totalDisponible = grupos.find(g => g.bolsillo.id === DISPONIBLE_ID)?.total ?? 0;
    const { totalPagos, queda, porSemana } = calcularPagos(totalDisponible, estado.pagos);
    const enNegativo = queda < 0;
    seccionPagos = `
    <section class="grupo-bolsillo tarjeta tarjeta-pagos">
      <header>
        <h3>Pagos del mes</h3>
        <strong class="total">${formatCOP(totalPagos)}</strong>
      </header>
      <ul class="detalle-bloque">
        ${estado.pagos.map(p => `
          <li><span>${escapar(p.nombre)}</span><span>${formatCOP(p.valor)}</span></li>`).join('')}
      </ul>
    </section>
    <div class="resumen-final tarjeta${enNegativo ? ' negativo' : ''}">
      <span>${enNegativo ? 'Los pagos superan lo disponible' : 'Queda en Disponible'}</span>
      <strong>${formatCOP(queda)}</strong>
    </div>
    ${!enNegativo ? `
    <div class="resumen-final sub tarjeta">
      <span>Por semana</span><strong>${formatCOP(porSemana)}</strong>
    </div>` : ''}`;
  }

  resultados.innerHTML = tarjetas + `
    <div class="resumen-final tarjeta">
      <span>Total asignado</span><strong>${formatCOP(totalAsignado)}</strong>
    </div>
    ${filaSinAsignar}
    ${seccionPagos}`;
}

export function abrirDialogoBolsillo(estado, id = null) {
  limpiarErrores();
  const dialogo = $('#dialog-bolsillo');
  const esEdicion = Boolean(id);
  $('#titulo-dialog-bolsillo').textContent = esEdicion ? 'Editar bolsillo' : 'Nuevo bolsillo';
  $('#bolsillo-nombre').value = esEdicion
    ? estado.bolsillos.find(b => b.id === id)?.nombre ?? ''
    : '';
  $('#bolsillo-editando-id').value = esEdicion ? id : '';
  dialogo.showModal();
  $('#bolsillo-nombre').focus();
}

export function abrirDialogoBloque(estado, id = null) {
  limpiarErrores();
  const dialogo = $('#dialog-bloque');
  const select = $('#bloque-bolsillo');
  select.innerHTML = estado.bolsillos
    .map(b => `<option value="${b.id}">${escapar(b.nombre)}</option>`)
    .join('');
  const esEdicion = Boolean(id);
  const actual = esEdicion ? estado.bloques.find(b => b.id === id) : null;
  $('#titulo-dialog-bloque').textContent = esEdicion ? 'Editar bloque' : 'Nuevo bloque';
  $('#bloque-nombre').value = actual?.nombre ?? '';
  $('#bloque-porcentaje').value = actual != null ? String(actual.porcentaje).replace('.', ',') : '';
  if (actual) select.value = actual.bolsilloId;
  else select.selectedIndex = 0;
  $('#bloque-editando-id').value = esEdicion ? id : '';
  dialogo.showModal();
  $('#bloque-nombre').focus();
}

export function abrirDialogoPago(estado, id = null) {
  limpiarErrores();
  const dialogo = $('#dialog-pago');
  const esEdicion = Boolean(id);
  const actual = esEdicion ? estado.pagos.find(p => p.id === id) : null;
  $('#titulo-dialog-pago').textContent = esEdicion ? 'Editar pago' : 'Nuevo pago';
  $('#pago-nombre').value = actual?.nombre ?? '';
  $('#pago-valor').value = actual != null ? String(actual.valor).replace('.', ',') : '';
  $('#pago-editando-id').value = esEdicion ? id : '';
  dialogo.showModal();
  $('#pago-nombre').focus();
}
