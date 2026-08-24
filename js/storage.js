const KEY = 'pf_config_v1';

export const DISPONIBLE_ID = 'bolsillo-disponible';
export const DISPONIBLE_NOMBRE = 'Disponible';

function estadoInicial() {
  return {
    version: 1,
    bolsillos: [{ id: DISPONIBLE_ID, nombre: DISPONIBLE_NOMBRE }],
    bloques: [],
    pagos: []
  };
}

export const CONFIG_VACIO = Object.freeze(estadoInicial());

export function nuevoId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function validarConfig(objeto) {
  if (objeto === null || typeof objeto !== 'object' || Array.isArray(objeto)) return null;
  const bolsillosRaw = Array.isArray(objeto.bolsillos) ? objeto.bolsillos : [];
  const idsBolsillos = new Set();
  const bolsillos = [];
  for (const b of bolsillosRaw) {
    if (!b || typeof b !== 'object') continue;
    if (typeof b.id !== 'string' || !b.id.trim()) continue;
    if (typeof b.nombre !== 'string' || !b.nombre.trim()) continue;
    if (idsBolsillos.has(b.id)) continue;
    idsBolsillos.add(b.id);
    bolsillos.push({ id: b.id, nombre: b.nombre.trim() });
  }
  if (!idsBolsillos.has(DISPONIBLE_ID)) {
    bolsillos.unshift({ id: DISPONIBLE_ID, nombre: DISPONIBLE_NOMBRE });
    idsBolsillos.add(DISPONIBLE_ID);
  }
  const bloques = [];
  if (Array.isArray(objeto.bloques)) {
    for (const b of objeto.bloques) {
      if (!b || typeof b !== 'object') continue;
      if (typeof b.id !== 'string' || !b.id.trim()) continue;
      if (typeof b.nombre !== 'string' || !b.nombre.trim()) continue;
      const pct = Number(b.porcentaje);
      if (!Number.isFinite(pct) || pct <= 0) continue;
      if (typeof b.bolsilloId !== 'string' || !idsBolsillos.has(b.bolsilloId)) continue;
      bloques.push({ id: b.id, nombre: b.nombre.trim(), porcentaje: pct, bolsilloId: b.bolsilloId });
    }
  }
  const pagos = [];
  if (Array.isArray(objeto.pagos)) {
    for (const p of objeto.pagos) {
      if (!p || typeof p !== 'object') continue;
      const nombre = typeof p.nombre === 'string' ? p.nombre.trim() : '';
      const valor = Number(p.valor);
      if (!nombre || !Number.isFinite(valor) || valor <= 0) continue;
      const id = typeof p.id === 'string' && p.id.trim() ? p.id : nuevoId();
      pagos.push({ id, nombre, valor });
    }
  }
  return { version: 1, bolsillos, bloques, pagos };
}

export function cargarConfig() {
  const vacio = estadoInicial();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return vacio;
    return validarConfig(JSON.parse(raw)) ?? estadoInicial();
  } catch {
    return estadoInicial();
  }
}

export function guardarConfig(config) {
  localStorage.setItem(KEY, JSON.stringify(config));
}

export function descargarJSON(config) {
  const contenido = JSON.stringify(config, null, 2);
  const blob = new Blob([contenido], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finanzas-config.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function leerArchivoJSON(file) {
  return file.text().then(texto => {
    const parsed = JSON.parse(texto);
    const valido = validarConfig(parsed);
    if (!valido) throw new Error('Formato no válido');
    return valido;
  });
}

function bytesABase64Url(bytes) {
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlABytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = '='.repeat((4 - (b64.length % 4)) % 4);
  const binario = atob(b64 + relleno);
  return Uint8Array.from(binario, c => c.charCodeAt(0));
}

function codificar(objeto) {
  return bytesABase64Url(new TextEncoder().encode(JSON.stringify(objeto)));
}

function decodificar(texto) {
  const json = new TextDecoder().decode(base64UrlABytes(texto));
  return JSON.parse(json);
}

export function urlDesdeConfig(config) {
  const base = location.origin + location.pathname;
  return `${base}#config=${codificar(config)}`;
}

export function configDesdeURL() {
  const m = location.hash.match(/^#config=(.+)$/);
  if (!m) return null;
  try {
    return validarConfig(decodificar(m[1]));
  } catch {
    return null;
  }
}
