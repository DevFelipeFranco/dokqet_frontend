/**
 * Utilidades matemáticas y algorítmicas de origami para el símbolo animado de Dokqet.
 * Basado en la animación oficial de Dokqet (7 piezas en rombo que se pliegan en 3 etapas).
 */

export type Pt = [number, number];
export type Poly = Pt[];

const NS = 'http://www.w3.org/2000/svg';

// Piezas del símbolo oficial en viewBox 0 0 122 116
export const BIRD: Poly[] = [
  [[74.8, 8.5], [110.3, 9.8], [74.8, 43.8]],
  [[72.1, 10.6], [72.1, 45.6], [39.2, 45.6]],
  [[113.1, 16.8], [96.5, 26.6], [108.4, 15.1]],
  [[26.5, 19], [43.3, 37.5], [35.4, 45.6], [19.1, 45.6], [19.1, 19]],
  [[16.6, 28.25], [8.35, 28.25], [16.6, 20.6]],
  [[71.8, 48.1], [57.45, 86.6], [21, 48.1]],
  [[72.1, 108], [55.6, 99], [72.1, 54.2]],
];

const CX = 61;
const CY = 58;
const R = 52;
const N = 8;

// Rojo de marca oficial de la plataforma (#ec1319) y su revés de papel más oscuro
const RED = [236, 19, 25];
const DARK = [140, 0, 6];

// Intensidad y grosor de líneas de pliegue sobre papel rojo
const CREASE = 0.7;
const CREASE_WIDTH = '0.25';
const CORNERS: Pt[] = [
  [CX, CY - R],
  [CX + R, CY],
  [CX, CY + R],
  [CX - R, CY],
];

export const centroid = (p: Poly): Pt => {
  let x = 0;
  let y = 0;
  p.forEach((q) => {
    x += q[0];
    y += q[1];
  });
  return [x / p.length, y / p.length];
};

export const angle = (c: Pt): number =>
  (Math.atan2(c[1] - CY, c[0] - CX) + Math.PI / 2 + 4 * Math.PI) % (2 * Math.PI);

export const onDiamond = (t: number): Pt => {
  const s = (((t % 1) + 1) % 1) * 4;
  const i = Math.floor(s);
  const f = s - i;
  const a = CORNERS[i];
  const b = CORNERS[(i + 1) % 4];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
};

/**
 * Añade puntos intermedios en la misma recta hasta tener n vértices: la forma no cambia.
 */
export function pad(poly: Poly, n: number): Poly {
  const out = poly.map((q) => [q[0], q[1]] as Pt);
  while (out.length < n) {
    let best = 0;
    let len = -1;
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      const b = out[(i + 1) % out.length];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d > len) {
        len = d;
        best = i;
      }
    }
    const p = out[best];
    const q = out[(best + 1) % out.length];
    out.splice(best + 1, 0, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
  }
  return out;
}

/**
 * Ordena los vértices de la hoja para que cada uno viaje al vértice más cercano del pájaro.
 */
export function match(from: Poly, to: Poly): Poly {
  let best = from;
  let cost = Infinity;
  [from, from.slice().reverse()].forEach((cand) => {
    for (let s = 0; s < cand.length; s++) {
      const rot = cand.slice(s).concat(cand.slice(0, s));
      let c = 0;
      for (let i = 0; i < rot.length; i++) {
        c += (rot[i][0] - to[i][0]) ** 2 + (rot[i][1] - to[i][1]) ** 2;
      }
      if (c < cost) {
        cost = c;
        best = rot;
      }
    }
  });
  return best;
}

// Etapa 3: pájaro final. Etapa 0: hoja repartida en cuñas en el mismo orden angular que las piezas
const finalStages = BIRD.map((p) => pad(p, N));
const order = BIRD.map((_, i) => i).sort(
  (a, b) => angle(centroid(BIRD[a])) - angle(centroid(BIRD[b]))
);

const sheet: Poly[] = [];
order.forEach((pi, k) => {
  const t0 = k / 7;
  const t1 = (k + 1) / 7;
  const pts: Poly = [[CX, CY], onDiamond(t0)];
  for (let c = 1; c < 4; c++) {
    if (c / 4 > t0 && c / 4 < t1) {
      pts.push([CORNERS[c][0], CORNERS[c][1]]);
    }
  }
  pts.push(onDiamond(t1));
  sheet[pi] = match(pad(pts, N), finalStages[pi]);
});

// Etapa 1: mitad de arriba doblada sobre la de abajo. Etapa 2: derecha sobre izquierda
const fold1 = sheet.map((p) =>
  p.map((q): Pt => [q[0], q[1] < CY ? 2 * CY - q[1] : q[1]])
);
const fold2 = fold1.map((p) =>
  p.map((q): Pt => [q[0] > CX ? 2 * CX - q[0] : q[0], q[1]])
);

export const STAGES = [sheet, fold1, fold2, finalStages];

// Las piezas dobladas muestran el revés del papel, más oscuro
export const SHADE = sheet.map((p, i) => {
  const s1 = centroid(p)[1] < CY ? 0.42 : 0;
  const s2 = Math.min(0.7, s1 + (centroid(fold1[i])[0] > CX ? 0.28 : 0));
  return [0, s1, s2, 0];
});

export const ease = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Crea las 7 piezas dentro del <svg> y retorna la función render(p) con p en [0, 3].
 */
export function createOrigami(svg: SVGSVGElement): (p: number) => void {
  svg.setAttribute('viewBox', '0 0 122 116');
  svg.replaceChildren();
  const paths = BIRD.map(() => {
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('stroke-width', CREASE_WIDTH);
    svg.appendChild(el);
    return el;
  });
  let layer = -1;

  return function render(value: number) {
    const p = Math.max(0, Math.min(3, value));
    const k = Math.min(2, Math.floor(p));
    const t = ease(Math.min(1, p - k));

    // Las piezas dobladas quedan encima de las demás durante el plegado
    const lk = p > 0.5 && p < 2.6 ? Math.min(2, Math.round(p)) : 0;
    if (lk !== layer) {
      layer = lk;
      paths
        .map((_, i) => i)
        .sort((a, b) => SHADE[a][lk] - SHADE[b][lk] || a - b)
        .forEach((i) => svg.appendChild(paths[i]));
    }

    // Las marcas de pliegue se desvanecen al formarse el pájaro
    const crease = p < 2 ? CREASE : CREASE * (3 - p);
    paths.forEach((el, i) => {
      const a = STAGES[k][i];
      const b = STAGES[k + 1][i];
      el.setAttribute(
        'd',
        'M' +
          a
            .map(
              (q, j) =>
                `${mix(q[0], b[j][0], t).toFixed(2)} ${mix(q[1], b[j][1], t).toFixed(2)}`
            )
            .join('L') +
          'Z'
      );
      const s = mix(SHADE[i][k], SHADE[i][k + 1], t);
      el.setAttribute(
        'fill',
        `rgb(${RED.map((c, j) => Math.round(mix(c, DARK[j], s))).join(',')})`
      );
      el.setAttribute('stroke', `rgba(0,0,0,${crease.toFixed(2)})`);
    });
  };
}

// Configuración de los 48 triángulos del mosaico de fondo
export const MOSAIC_WIDTH = 50;
export const MOSAIC_HEIGHT = 43;
export const NOVEDAD_INDEX = 21;

export interface MosaicTriangle {
  index: number;
  columna: number;
  puntos: string;
  isNovedad: boolean;
}

export function generateMosaicTriangles(): MosaicTriangle[] {
  return Array.from({ length: 48 }, (_, i) => {
    const r = Math.floor(i / 8);
    const c = i % 8;
    const x = (c * MOSAIC_WIDTH) / 2;
    const y = r * MOSAIC_HEIGHT;
    const arriba = (c + r) % 2 === 0;
    const pts = arriba
      ? [
          [x + MOSAIC_WIDTH / 2, y],
          [x + MOSAIC_WIDTH, y + MOSAIC_HEIGHT],
          [x, y + MOSAIC_HEIGHT],
        ]
      : [
          [x, y],
          [x + MOSAIC_WIDTH, y],
          [x + MOSAIC_WIDTH / 2, y + MOSAIC_HEIGHT],
        ];
    return {
      index: i,
      columna: c,
      puntos: pts.map((p) => p.join(',')).join(' '),
      isNovedad: i === NOVEDAD_INDEX,
    };
  });
}

export interface BrandFeature {
  titulo: string;
  texto: string;
}

export const BRAND_FEATURES: BrandFeature[] = [
  {
    titulo: 'Vigila tus procesos por ti',
    texto: 'Cada proceso, todos los días, sin consultar uno por uno.',
  },
  {
    titulo: 'Te avisa al instante',
    texto: 'Actuaciones, estados y documentos en tu correo.',
  },
  {
    titulo: 'Tu firma y tu equipo, en un solo lugar',
    texto: 'Responsables, procesos y expedientes organizados.',
  },
];
