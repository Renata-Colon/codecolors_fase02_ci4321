// geometria del juego con coordenadas de textura

// suelo con uvs para repetir textura
export function crearSuelo() {
  const posiciones = new Float32Array([
    -15.0, 0.0,  15.0,   15.0, 0.0,  15.0,   15.0, 0.0, -15.0,
    -15.0, 0.0,  15.0,   15.0, 0.0, -15.0,  -15.0, 0.0, -15.0
  ])
  const uvs = new Float32Array([
    0, 0,   10, 0,   10, 10,
    0, 0,   10, 10,  0, 10
  ])
  const indices = new Uint16Array([0, 1, 2, 3, 4, 5])
  return { posiciones, uvs, indices, numIndices: indices.length }
}

// rueda con eje en x para que gire al rodar
export function crearRueda(radio: number = 0.35, ancho: number = 0.25, segmentos: number = 16) {
  const posiciones: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2
    const y = Math.cos(theta) * radio
    const z = Math.sin(theta) * radio
    const u = i / segmentos
    posiciones.push(-ancho/2, y, z, ancho/2, y, z)
    uvs.push(u, 0, u, 1)
  }
  for (let i = 0; i < segmentos; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3
    indices.push(a, b, c, b, d, c)
  }
  const leftCenter = posiciones.length / 3
  posiciones.push(-ancho/2, 0, 0)
  uvs.push(0.5, 0.5)
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2
    posiciones.push(-ancho/2, Math.cos(theta) * radio, Math.sin(theta) * radio)
    uvs.push(Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5)
  }
  for (let i = 0; i < segmentos; i++) indices.push(leftCenter, leftCenter + 1 + i, leftCenter + 2 + i)
  const rightCenter = posiciones.length / 3
  posiciones.push(ancho/2, 0, 0)
  uvs.push(0.5, 0.5)
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2
    posiciones.push(ancho/2, Math.cos(theta) * radio, Math.sin(theta) * radio)
    uvs.push(Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5)
  }
  for (let i = 0; i < segmentos; i++) indices.push(rightCenter, rightCenter + 2 + i, rightCenter + 1 + i)
  return { posiciones: new Float32Array(posiciones), uvs: new Float32Array(uvs), indices: new Uint16Array(indices), numIndices: indices.length }
}

// caparazon media esfera achatada
export function crearCaparazon(radio: number = 1.2, segmentos: number = 20) {
  const posiciones: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const altoCaparazon = 0.6
  for (let lat = 0; lat <= segmentos / 2; lat++) {
    const theta = (lat / (segmentos / 2)) * (Math.PI / 2)
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)
    for (let lon = 0; lon <= segmentos; lon++) {
      const phi = (lon / segmentos) * Math.PI * 2
      const sinPhi = Math.sin(phi)
      const cosPhi = Math.cos(phi)
      posiciones.push(cosPhi * sinTheta * radio, cosTheta * altoCaparazon, sinPhi * sinTheta * radio)
      uvs.push(lon / segmentos, lat / (segmentos / 2))
    }
  }
  for (let lat = 0; lat < segmentos / 2; lat++) {
    for (let lon = 0; lon < segmentos; lon++) {
      const first = (lat * (segmentos + 1)) + lon
      const second = first + segmentos + 1
      indices.push(first, second, first + 1, second, second + 1, first + 1)
    }
  }
  return { posiciones: new Float32Array(posiciones), uvs: new Float32Array(uvs), indices: new Uint16Array(indices), numIndices: indices.length }
}

// puas conos para el caparazon
export function crearPua(radioBase: number = 0.15, altura: number = 0.4, segmentos: number = 8) {
  const posiciones: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const puntaIdx = 0
  posiciones.push(0, altura, 0)
  uvs.push(0.5, 1)
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2
    posiciones.push(Math.cos(theta) * radioBase, 0, Math.sin(theta) * radioBase)
    uvs.push(i / segmentos, 0)
  }
  for (let i = 0; i < segmentos; i++) indices.push(puntaIdx, i + 2, i + 1)
  const baseCenterIdx = posiciones.length / 3
  posiciones.push(0, 0, 0)
  uvs.push(0.5, 0.5)
  const startBase = 1
  for (let i = 0; i < segmentos; i++) indices.push(baseCenterIdx, startBase + i, startBase + i + 1)
  return { posiciones: new Float32Array(posiciones), uvs: new Float32Array(uvs), indices: new Uint16Array(indices), numIndices: indices.length }
}

// borde crema del caparazon
export function crearBordeCaparazon(radioMayor: number = 1.25, radioMenor: number = 0.22, segmentos: number = 24) {
  const posiciones: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segmentos; i++) {
    const phi = (i / segmentos) * Math.PI * 2
    for (let j = 0; j <= segmentos / 2; j++) {
      const theta = (j / (segmentos / 2)) * Math.PI * 2
      const x = (radioMayor + radioMenor * Math.cos(theta)) * Math.cos(phi)
      const z = (radioMayor + radioMenor * Math.cos(theta)) * Math.sin(phi)
      const y = radioMenor * Math.sin(theta) * 0.6
      posiciones.push(x, y, z)
      uvs.push(i / segmentos, j / (segmentos / 2))
    }
  }
  const stride = segmentos / 2 + 1
  for (let i = 0; i < segmentos; i++) {
    for (let j = 0; j < segmentos / 2; j++) {
      const a = i * stride + j
      const b = a + stride
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return { posiciones: new Float32Array(posiciones), uvs: new Float32Array(uvs), indices: new Uint16Array(indices), numIndices: indices.length }
}

// boca negra achatada
export function crearBoca(radio: number = 0.55) {
  const esfera = crearEsfera(radio, 16, 16)
  const posiciones = new Float32Array(esfera.posiciones.length)
  for (let i = 0; i < esfera.posiciones.length; i += 3) {
    posiciones[i] = esfera.posiciones[i]
    posiciones[i + 1] = esfera.posiciones[i + 1]
    posiciones[i + 2] = esfera.posiciones[i + 2] * 0.5
  }
  return { posiciones, uvs: esfera.uvs, indices: esfera.indices, numIndices: esfera.numIndices }
}

// cuadro generico para ui y skybox
export function crearCuadro(ancho: number = 1, alto: number = 1) {
  const w = ancho / 2
  const h = alto / 2
  const posiciones = new Float32Array([
    -w, -h, 0,   w, -h, 0,   w,  h, 0,
    -w, -h, 0,   w,  h, 0,  -w,  h, 0
  ])
  const uvs = new Float32Array([
    0, 1,   1, 1,   1, 0,
    0, 1,   1, 0,   0, 0
  ])
  const indices = new Uint16Array([0, 1, 2, 3, 4, 5])
  return { posiciones, uvs, indices, numIndices: indices.length }
}

// cañon cilindro con tapas
export function crearCanon() {
  const radio = 0.2, largo = 2.0, segmentos = 12 
  const posiciones: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2
    const x = Math.cos(theta) * radio
    const y = Math.sin(theta) * radio
    const u = i / segmentos
    posiciones.push(x, y, 0, x, y, -largo)
    uvs.push(u, 0, u, 1)
  }
  for (let i = 0; i < segmentos; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3
    indices.push(a, b, c, b, d, c)
  }
  const baseCenterIdx = posiciones.length / 3
  posiciones.push(0, 0, 0)
  uvs.push(0.5, 0.5)
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2
    posiciones.push(Math.cos(theta) * radio, Math.sin(theta) * radio, 0)
    uvs.push(Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5)
  }
  for (let i = 0; i < segmentos; i++) indices.push(baseCenterIdx, baseCenterIdx + 1 + i, baseCenterIdx + 2 + i)
  const tipCenterIdx = posiciones.length / 3
  posiciones.push(0, 0, -largo)
  uvs.push(0.5, 0.5)
  for (let i = 0; i <= segmentos; i++) {
    const theta = (i / segmentos) * Math.PI * 2
    posiciones.push(Math.cos(theta) * radio, Math.sin(theta) * radio, -largo)
    uvs.push(Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5)
  }
  for (let i = 0; i < segmentos; i++) indices.push(tipCenterIdx, tipCenterIdx + 2 + i, tipCenterIdx + 1 + i)
  return { posiciones: new Float32Array(posiciones), uvs: new Float32Array(uvs), indices: new Uint16Array(indices), numIndices: indices.length }
}

// esfera completa para balas y objetivos
export function crearEsfera(radio: number, segmentosLat: number = 16, segmentosLong: number = 16) {
  const posiciones: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let lat = 0; lat <= segmentosLat; lat++) {
    const theta = (lat / segmentosLat) * Math.PI
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)
    for (let lon = 0; lon <= segmentosLong; lon++) {
      const phi = (lon / segmentosLong) * Math.PI * 2
      const sinPhi = Math.sin(phi)
      const cosPhi = Math.cos(phi)
      const x = cosPhi * sinTheta
      const y = cosTheta
      const z = sinPhi * sinTheta
      posiciones.push(radio * x, radio * y, radio * z)
      uvs.push(lon / segmentosLong, lat / segmentosLat)
    }
  }
  for (let lat = 0; lat < segmentosLat; lat++) {
    for (let lon = 0; lon < segmentosLong; lon++) {
      const first = (lat * (segmentosLong + 1)) + lon
      const second = first + segmentosLong + 1
      indices.push(first, second, first + 1, second, second + 1, first + 1)
    }
  }
  return { posiciones: new Float32Array(posiciones), uvs: new Float32Array(uvs), indices: new Uint16Array(indices), numIndices: indices.length }
}

// barra del indicador de fuerza
export function crearBarraIndicador() {
  const w = 0.8, h = 0.15, skew = 0.2 
  const offset = skew / 2 
  const posiciones = new Float32Array([
    -w/2 - offset, 0, 0,          w/2 - offset, 0, 0,          w/2 + offset, h, 0,
    -w/2 - offset, 0, 0,          w/2 + offset, h, 0,          -w/2 + offset, h, 0
  ])
  const uvs = new Float32Array([0,0, 1,0, 1,1, 0,0, 1,1, 0,1])
  const indices = new Uint16Array([0, 1, 2, 3, 4, 5])
  return { posiciones, uvs, indices, numIndices: indices.length }
}

// montaña triangulo plano
export function crearMontana() {
  const ancho = 10.0, alto = 6.0
  const posiciones = new Float32Array([-ancho/2, 0, 0,   ancho/2, 0, 0,   0, alto, 0])
  const uvs = new Float32Array([0,0, 1,0, 0.5,1])
  const indices = new Uint16Array([0, 1, 2])
  return { posiciones, uvs, indices, numIndices: indices.length }
}
