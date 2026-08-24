export function formatearEntradaMonto(texto) {
  if (typeof texto !== 'string') return '';
  const limpio = texto.replace(/[^\d,]/g, '');
  const iComa = limpio.indexOf(',');
  let entero = iComa === -1 ? limpio : limpio.slice(0, iComa);
  entero = entero.replace(/^0+(?=\d)/, '');
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (iComa === -1) return conMiles;
  const decimales = limpio.slice(iComa + 1).replace(/\D/g, '').slice(0, 2);
  return `${conMiles},${decimales}`;
}

export function parseNumero(texto) {
  if (typeof texto !== 'string') return NaN;
  let t = texto.replace(/[^\d.,-]/g, '');
  const negativo = t.startsWith('-');
  t = t.replace(/-/g, '');
  const lastDot = t.lastIndexOf('.');
  const lastComma = t.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    const decSep = lastDot > lastComma ? '.' : ',';
    const thouSep = decSep === '.' ? ',' : '.';
    t = t.split(thouSep).join('');
    const partes = t.split(decSep);
    t = partes[0] + '.' + partes.slice(1).join('');
  } else if (lastComma !== -1) {
    const partes = t.split(',');
    if (partes.length === 2 && partes[1].length <= 2) {
      t = partes[0] + '.' + partes[1];
    } else {
      t = partes.join('');
    }
  } else if (lastDot !== -1) {
    const partes = t.split('.');
    if (partes.length === 2 && partes[1].length <= 2) {
      return parseFloat(t) || 0;
    }
    t = partes.join('');
  }
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return NaN;
  return negativo ? -n : n;
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatCOP(valor) {
  return formatoCOP.format(valor);
}

export function formatPorcentaje(valor) {
  const texto = Number.isInteger(valor)
    ? String(valor)
    : valor.toLocaleString('es-CO', { maximumFractionDigits: 2 });
  return `${texto}%`;
}

export function sumaPorcentajes(bloques, excluirId = null) {
  return bloques.reduce(
    (suma, b) => suma + (excluirId !== null && b.id === excluirId ? 0 : (Number(b.porcentaje) || 0)),
    0
  );
}

function redondear2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function distribuir(monto, bloques, bolsillos) {
  const porId = new Map(bolsillos.map(b => [b.id, b]));
  const grupos = [];
  for (const bolsillo of bolsillos) {
    const suyos = bloques.filter(b => b.bolsilloId === bolsillo.id);
    if (suyos.length === 0) continue;
    const detalle = suyos.map(b => ({
      id: b.id,
      nombre: b.nombre,
      porcentaje: b.porcentaje,
      valor: redondear2((monto * b.porcentaje) / 100)
    }));
    grupos.push({
      bolsillo,
      total: redondear2(detalle.reduce((s, d) => s + d.valor, 0)),
      detalle
    });
  }
  const huerfanos = bloques.filter(b => !porId.has(b.bolsilloId));
  const totalAsignado = redondear2(grupos.reduce((s, g) => s + g.total, 0));
  const sinAsignarPorBloques = huerfanos.length > 0
    ? redondear2(huerfanos.reduce((s, b) => s + (monto * b.porcentaje) / 100, 0))
    : 0;
  return {
    grupos,
    huerfanos,
    totalAsignado,
    sinAsignar: redondear2(monto - totalAsignado - sinAsignarPorBloques)
  };
}

export function calcularPagos(totalDisponible, pagos) {
  const totalPagos = redondear2(pagos.reduce((s, p) => s + (Number(p.valor) || 0), 0));
  const queda = redondear2(totalDisponible - totalPagos);
  return {
    totalPagos,
    queda,
    porSemana: redondear2((Math.max(queda, 0) * 7) / 31)
  };
}
