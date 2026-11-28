import { EscenaJuego } from './main'
import { PuntaCanon } from './tipos'
import * as geo from './geometria'
import { cargarTexturas, texturasJuego } from './texturas'
import { mat4, vec4 } from 'gl-matrix'

export class EscenaGrafica implements EscenaJuego {
  private gl: WebGL2RenderingContext
  private ff: any
  private texturas: texturasJuego | null = null

  private vaoSuelo: WebGLVertexArrayObject | null = null
  private vaoCielo: WebGLVertexArrayObject | null = null
  private vaoMontanas: WebGLVertexArrayObject | null = null
  private vaoCaparazon: WebGLVertexArrayObject | null = null
  private vaoBorde: WebGLVertexArrayObject | null = null
  private vaoPua: WebGLVertexArrayObject | null = null
  private vaoRueda: WebGLVertexArrayObject | null = null
  private vaoBoca: WebGLVertexArrayObject | null = null
  private vaoCanon: WebGLVertexArrayObject | null = null
  private vaoProyectil: WebGLVertexArrayObject | null = null
  private vaoObjetivos: WebGLVertexArrayObject[] = []
  private vaoCuadro: WebGLVertexArrayObject | null = null 

  private numIndicesSuelo = 0
  private numIndicesCielo = 0
  private numIndicesMontanas = 0
  private numIndicesCaparazon = 0
  private numIndicesBorde = 0
  private numIndicesPua = 0
  private numIndicesRueda = 0
  private numIndicesBoca = 0
  private numIndicesCanon = 0
  private numIndicesProyectil = 0
  private numIndicesObjetivos: number[] = []
  private numIndicesCuadro = 0

  private modelCuerpo = mat4.create()
  private modelRueda = mat4.create()
  private modelCaparazon = mat4.create()
  private modelBorde = mat4.create()
  private modelPua = mat4.create()
  private modelBoca = mat4.create()
  private modelTorreta = mat4.create()
  private modelElevacion = mat4.create()
  private modelUI = mat4.create()

  private desplazamientoX = 0
  private desplazamientoZ = 0
  private rotacionCuerpoRad = 0
  private rotacionTorretaRad = 0
  private inclinacionCanonRad = 45 * (Math.PI / 180)
  private nivelFuerzaActual: 1 | 2 | 3 = 1
  private posicionProyectil: [number, number, number] = [0, 0, 0]
  private proyectilActivo = false
  private objetivosVivos = [true, true, true]

  private rotacionRuedaRad = 0
  private ultimaX = 0
  private ultimaZ = 0
  private readonly RADIO_RUEDA = 0.35

  private readonly colorCaparazon: [number, number, number] = [0.15, 0.55, 0.15]
  private readonly colorBorde: [number, number, number] = [0.95, 0.9, 0.78]
  private readonly colorPua: [number, number, number] = [0.9, 0.8, 0.5]
  private readonly colorRueda: [number, number, number] = [0.12, 0.12, 0.12]
  private readonly colorBoca: [number, number, number] = [0.03, 0.03, 0.03]
  private readonly colorCanon: [number, number, number] = [0.25, 0.25, 0.28]

  constructor(gl: WebGL2RenderingContext, ff: any) {
    this.gl = gl
    this.ff = ff
    this.inicializarGeometria()
  }

  public async cargarTexturas(): Promise<void> {
    this.texturas = await cargarTexturas(this.gl)
    console.log('texturas cargadas correctamente')
  }

  private sinTextura(): void {
    this.ff.disable('texture2D')
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)
  }

  private crearVAO(posiciones: Float32Array, uvs: Float32Array, indices: Uint16Array): WebGLVertexArrayObject {
    const vao = this.gl.createVertexArray()!
    this.gl.bindVertexArray(vao)
    const posBuffer = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, posiciones, this.gl.STATIC_DRAW)
    this.gl.enableVertexAttribArray(0)
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0)
    const uvBuffer = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, uvBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, uvs, this.gl.STATIC_DRAW)
    this.gl.enableVertexAttribArray(3)
    this.gl.vertexAttribPointer(3, 2, this.gl.FLOAT, false, 0, 0)
    const idxBuffer = this.gl.createBuffer()!
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, idxBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW)
    this.gl.bindVertexArray(null)
    return vao
  }

  private inicializarGeometria() {
    // esfera gigante para el cielo (radio 150 para que rodee todo)
    const cielo = geo.crearEsfera(150, 32, 32)
    this.vaoCielo = this.crearVAO(cielo.posiciones, cielo.uvs, cielo.indices)
    this.numIndicesCielo = cielo.numIndices

    const suelo = geo.crearSuelo()
    this.vaoSuelo = this.crearVAO(suelo.posiciones, suelo.uvs, suelo.indices)
    this.numIndicesSuelo = suelo.numIndices
    const montana = geo.crearMontana()
    this.vaoMontanas = this.crearVAO(montana.posiciones, montana.uvs, montana.indices)
    this.numIndicesMontanas = montana.numIndices
    const caparazon = geo.crearCaparazon(1.2, 20)
    this.vaoCaparazon = this.crearVAO(caparazon.posiciones, caparazon.uvs, caparazon.indices)
    this.numIndicesCaparazon = caparazon.numIndices
    const borde = geo.crearBordeCaparazon()
    this.vaoBorde = this.crearVAO(borde.posiciones, borde.uvs, borde.indices)
    this.numIndicesBorde = borde.numIndices
    const pua = geo.crearPua(0.18, 0.5, 10)
    this.vaoPua = this.crearVAO(pua.posiciones, pua.uvs, pua.indices)
    this.numIndicesPua = pua.numIndices
    const rueda = geo.crearRueda(0.35, 0.25, 16)
    this.vaoRueda = this.crearVAO(rueda.posiciones, rueda.uvs, rueda.indices)
    this.numIndicesRueda = rueda.numIndices
    const boca = geo.crearBoca(0.55)
    this.vaoBoca = this.crearVAO(boca.posiciones, boca.uvs, boca.indices)
    this.numIndicesBoca = boca.numIndices
    const canon = geo.crearCanon()
    this.vaoCanon = this.crearVAO(canon.posiciones, canon.uvs, canon.indices)
    this.numIndicesCanon = canon.numIndices
    const proyectil = geo.crearEsfera(0.25, 20, 20)
    this.vaoProyectil = this.crearVAO(proyectil.posiciones, proyectil.uvs, proyectil.indices)
    this.numIndicesProyectil = proyectil.numIndices
    for (let i = 0; i < 3; i++) {
      const obj = geo.crearEsfera(0.8, 24, 24)
      this.vaoObjetivos.push(this.crearVAO(obj.posiciones, obj.uvs, obj.indices))
      this.numIndicesObjetivos.push(obj.numIndices)
    }
    const cuadro = geo.crearCuadro(1, 1)
    this.vaoCuadro = this.crearVAO(cuadro.posiciones, cuadro.uvs, cuadro.indices)
    this.numIndicesCuadro = cuadro.numIndices
  }

  private actualizarMatricesTanque(): void {
    mat4.identity(this.modelCuerpo)
    mat4.translate(this.modelCuerpo, this.modelCuerpo, [this.desplazamientoX, 0.35, this.desplazamientoZ])
    mat4.rotateY(this.modelCuerpo, this.modelCuerpo, this.rotacionCuerpoRad)
    mat4.copy(this.modelCaparazon, this.modelCuerpo)
    mat4.translate(this.modelCaparazon, this.modelCaparazon, [0, 0.35, 0])
    mat4.copy(this.modelBorde, this.modelCuerpo)
    mat4.translate(this.modelBorde, this.modelBorde, [0, 0.35, 0])
    mat4.copy(this.modelBoca, this.modelCuerpo)
    mat4.translate(this.modelBoca, this.modelBoca, [0, 0.35, -0.95])
    mat4.copy(this.modelTorreta, this.modelCuerpo)
    mat4.translate(this.modelTorreta, this.modelTorreta, [0, 0.35, -0.4])
    mat4.rotateY(this.modelTorreta, this.modelTorreta, this.rotacionTorretaRad)
    mat4.copy(this.modelElevacion, this.modelTorreta)
    mat4.translate(this.modelElevacion, this.modelElevacion, [0, 0, -0.6])
    mat4.rotateX(this.modelElevacion, this.modelElevacion, this.inclinacionCanonRad)
  }

  private dibujarPua(latDeg: number, lonDeg: number, escala: number = 1): void {
    mat4.copy(this.modelPua, this.modelCaparazon)
    mat4.rotateY(this.modelPua, this.modelPua, lonDeg * (Math.PI / 180))
    mat4.rotateX(this.modelPua, this.modelPua, latDeg * (Math.PI / 180))
    mat4.translate(this.modelPua, this.modelPua, [0, 0.75, 0])
    mat4.scale(this.modelPua, this.modelPua, [escala, escala, escala])
    this.ff.setModelMatrix(this.modelPua)
    this.sinTextura()
    this.ff.setColor(this.colorPua)
    this.gl.bindVertexArray(this.vaoPua)
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesPua, this.gl.UNSIGNED_SHORT, 0)
  }

  public obtenerPuntaCanon(): PuntaCanon {
    const LARGO_CANON = 2.0
    this.actualizarMatricesTanque()
    const puntaLocal = vec4.fromValues(0, 0, -LARGO_CANON, 1)
    const puntaMundo = vec4.create()
    vec4.transformMat4(puntaMundo, puntaLocal, this.modelElevacion)
    const dirLocal = vec4.fromValues(0, 0, -1, 0)
    const dirMundo = vec4.create()
    vec4.transformMat4(dirMundo, dirLocal, this.modelElevacion)
    return {
      posicion: [puntaMundo[0], puntaMundo[1], puntaMundo[2]],
      adelante: [dirMundo[0], dirMundo[1], dirMundo[2]]
    }
  }

  public fijarTransformacionTanque(x: number, z: number, rotCuerpo: number, rotTorreta: number, inclinacion: number): void {
    const dx = x - this.ultimaX
    const dz = z - this.ultimaZ
    const dist = Math.sqrt(dx * dx + dz * dz)
    const rotRad = rotCuerpo * (Math.PI / 180)
    const adelanteX = -Math.sin(rotRad)
    const adelanteZ = -Math.cos(rotRad)
    const signo = (dx * adelanteX + dz * adelanteZ) >= 0 ? 1 : -1
    this.rotacionRuedaRad += signo * (dist / this.RADIO_RUEDA)
    this.desplazamientoX = x
    this.desplazamientoZ = z
    this.ultimaX = x
    this.ultimaZ = z
    this.rotacionCuerpoRad = rotCuerpo * (Math.PI / 180)
    this.rotacionTorretaRad = rotTorreta * (Math.PI / 180)
    this.inclinacionCanonRad = inclinacion * (Math.PI / 180)
  }

  public fijarIndicadorFuerza(nivel: 1 | 2 | 3): void { this.nivelFuerzaActual = nivel }
  public fijarTransformacionProyectil(posicion: [number, number, number], activo: boolean): void {
    this.posicionProyectil = posicion
    this.proyectilActivo = activo
  }
  public obtenerPosicionesObjetivos(): { id: number, posicion: [number, number, number], radio: number }[] {
    return [
      { id: 1, posicion: [-8, 1.0, -10], radio: 0.8 },
      { id: 2, posicion: [8, 4.5, -12], radio: 0.8 },
      { id: 3, posicion: [0, 7.5, -14], radio: 0.8 }
    ]
  }
  public actualizarObjetivos(objetivos: any[]): void {
    for (let i = 0; i < 3; i++) this.objetivosVivos[i] = objetivos[i].vivo
  }

  public renderizar(matrizVista: Float32Array, matrizProyeccion: Float32Array): void {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0) // fondo negro por si falla el cielo
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.ff.setProjectionMatrix(matrizProyeccion)
    this.ff.setViewMatrix(matrizVista)

    // dibujar el cielo primero
    // desactivamos el culling de caras para ver las caras internas de la esfera
    this.gl.disable(this.gl.CULL_FACE)
    this.gl.depthMask(false)
    
    this.ff.setModelMatrix(mat4.create())
    this.ff.enable('texture2D')
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texturas?.cielo || null)
    this.ff.setColor([1, 1, 1])
    this.gl.bindVertexArray(this.vaoCielo)
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesCielo, this.gl.UNSIGNED_SHORT, 0)
    
    this.sinTextura()
    this.gl.depthMask(true)
    this.gl.enable(this.gl.CULL_FACE)

    // suelo con textura
    this.ff.setModelMatrix(mat4.create())
    this.ff.enable('texture2D')
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texturas?.suelo || null)
    this.ff.setColor([1, 1, 1]) 
    this.gl.bindVertexArray(this.vaoSuelo)
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesSuelo, this.gl.UNSIGNED_SHORT, 0)
    this.sinTextura()

    // montañas
    this.ff.setColor([0.2, 0.12, 0.1])
    this.gl.bindVertexArray(this.vaoMontanas)
    const m1 = mat4.create(); mat4.translate(m1, m1, [-8, 0, -25]); mat4.scale(m1, m1, [0.8, 0.7, 1])
    this.ff.setModelMatrix(m1); this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesMontanas, this.gl.UNSIGNED_SHORT, 0)
    const m2 = mat4.create(); mat4.translate(m2, m2, [0, 0, -20]); mat4.scale(m2, m2, [1.2, 1.0, 1])
    this.ff.setModelMatrix(m2); this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesMontanas, this.gl.UNSIGNED_SHORT, 0)
    const m3 = mat4.create(); mat4.translate(m3, m3, [9, 0, -23]); mat4.scale(m3, m3, [0.9, 0.8, 1])
    this.ff.setModelMatrix(m3); this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesMontanas, this.gl.UNSIGNED_SHORT, 0)

    this.actualizarMatricesTanque()

    // ruedas
    this.sinTextura()
    this.ff.setColor(this.colorRueda)
    const ruedas: [number, number][] = [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]]
    for (const [rx, rz] of ruedas) {
      mat4.copy(this.modelRueda, this.modelCuerpo)
      mat4.translate(this.modelRueda, this.modelRueda, [rx, 0, rz])
      mat4.rotateX(this.modelRueda, this.modelRueda, this.rotacionRuedaRad)
      this.ff.setModelMatrix(this.modelRueda)
      this.gl.bindVertexArray(this.vaoRueda)
      this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesRueda, this.gl.UNSIGNED_SHORT, 0)
    }

    // caparazon con las dos caras activas para evitar transparencias
    this.gl.disable(this.gl.CULL_FACE)
    this.ff.setModelMatrix(this.modelCaparazon)
    this.ff.setColor(this.colorCaparazon)
    this.gl.bindVertexArray(this.vaoCaparazon)
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesCaparazon, this.gl.UNSIGNED_SHORT, 0)
    this.gl.enable(this.gl.CULL_FACE)

    // caparazon borde y boca
    this.sinTextura()
    this.ff.setModelMatrix(this.modelCaparazon)
    this.ff.setColor(this.colorCaparazon)
    this.gl.bindVertexArray(this.vaoCaparazon)
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesCaparazon, this.gl.UNSIGNED_SHORT, 0)
    this.ff.setModelMatrix(this.modelBorde)
    this.ff.setColor(this.colorBorde)
    this.gl.bindVertexArray(this.vaoBorde)
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesBorde, this.gl.UNSIGNED_SHORT, 0)
    this.ff.setModelMatrix(this.modelBoca)
    this.ff.setColor(this.colorBoca)
    this.gl.bindVertexArray(this.vaoBoca)
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesBoca, this.gl.UNSIGNED_SHORT, 0)

    this.dibujarPua(0, 0, 1.2)
    this.dibujarPua(55, 0)
    this.dibujarPua(55, 90)
    this.dibujarPua(55, 180)
    this.dibujarPua(55, 270)
    this.dibujarPua(80, 45, 0.8)
    this.dibujarPua(80, 135, 0.8)
    this.dibujarPua(80, 225, 0.8)
    this.dibujarPua(80, 315, 0.8)

    // canon
    this.sinTextura()
    this.ff.setModelMatrix(this.modelElevacion)
    this.ff.setColor(this.colorCanon)
    this.gl.bindVertexArray(this.vaoCanon)
    this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesCanon, this.gl.UNSIGNED_SHORT, 0)

    // proyectil y trayectoria
    this.sinTextura()
    const modelProyectil = mat4.create()
    if (this.proyectilActivo) {
      mat4.identity(modelProyectil)
      mat4.translate(modelProyectil, modelProyectil, this.posicionProyectil)
      this.ff.setModelMatrix(modelProyectil)
      this.ff.setColor([0.3, 0.7, 1.0])
      this.gl.bindVertexArray(this.vaoProyectil)
      this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesProyectil, this.gl.UNSIGNED_SHORT, 0)
    } else {
      mat4.copy(modelProyectil, this.modelElevacion)
      mat4.translate(modelProyectil, modelProyectil, [0, 0, -2.15])
      this.ff.setModelMatrix(modelProyectil)
      this.ff.setColor([0.3, 0.7, 1.0])
      this.gl.bindVertexArray(this.vaoProyectil)
      this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesProyectil, this.gl.UNSIGNED_SHORT, 0)
      const punta = this.obtenerPuntaCanon()
      const magnitudesFuerza: Record<1 | 2 | 3, number> = { 1: 15.0, 2: 25.0, 3: 35.0 }
      const velocidadMag = magnitudesFuerza[this.nivelFuerzaActual]
      let p: [number, number, number] = [...punta.posicion]
      let vel: [number, number, number] = [punta.adelante[0] * velocidadMag, punta.adelante[1] * velocidadMag, punta.adelante[2] * velocidadMag]
      const dtSim = 0.05
      const GRAVEDAD = -9.81
      let puntos = 0
      this.ff.setColor([0.3, 0.7, 1.0])
      this.gl.bindVertexArray(this.vaoProyectil)
      while (p[1] > 0 && puntos < 40) {
        p[0] += vel[0] * dtSim; p[1] += vel[1] * dtSim; p[2] += vel[2] * dtSim
        vel[1] += GRAVEDAD * dtSim
        mat4.identity(modelProyectil)
        mat4.translate(modelProyectil, modelProyectil, p)
        mat4.scale(modelProyectil, modelProyectil, [0.3, 0.3, 0.3])
        this.ff.setModelMatrix(modelProyectil)
        this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesProyectil, this.gl.UNSIGNED_SHORT, 0)
        puntos++
      }
    }

    // objetivos
    this.sinTextura()
    for (let i = 0; i < 3; i++) {
      if (this.objetivosVivos[i]) {
        const pos = this.obtenerPosicionesObjetivos()[i].posicion
        const modelObj = mat4.create()
        mat4.translate(modelObj, modelObj, pos)
        this.ff.setModelMatrix(modelObj)
        if (i < 2) this.ff.setColor([0.5, 0.1, 0.6])
        else this.ff.setColor([0.1, 0.8, 0.2])
        this.gl.bindVertexArray(this.vaoObjetivos[i])
        this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesObjetivos[i], this.gl.UNSIGNED_SHORT, 0)
      }
    }

    // interfaz
    this.dibujarInterfaz2D()
  }

  private dibujarInterfaz2D(): void {
    this.gl.disable(this.gl.DEPTH_TEST)
    this.sinTextura()
    const matrizOrto = mat4.ortho(mat4.create(), 0, 1920, 1080, 0, -1, 1)
    const matrizIdentidad = mat4.create()
    this.ff.setProjectionMatrix(matrizOrto as Float32Array)
    this.ff.setViewMatrix(matrizIdentidad as Float32Array)
    const tamano = 60
    const separacion = 10
    const margenIzquierdo = 40
    const margenSuperior = 40
    for (let i = 0; i < 3; i++) {
      const x = margenIzquierdo + i * (tamano + separacion)
      const y = margenSuperior
      mat4.identity(this.modelUI)
      mat4.translate(this.modelUI, this.modelUI, [x + tamano/2, y + tamano/2, 0])
      mat4.scale(this.modelUI, this.modelUI, [tamano, tamano, 1])
      this.ff.setModelMatrix(this.modelUI as Float32Array)
      if (i < this.nivelFuerzaActual) this.ff.setColor([0.2, 0.6, 1.0])
      else this.ff.setColor([0.15, 0.15, 0.2])
      this.gl.bindVertexArray(this.vaoCuadro)
      this.ff.drawElements(this.gl.TRIANGLES, this.numIndicesCuadro, this.gl.UNSIGNED_SHORT, 0)
    }
    this.gl.enable(this.gl.DEPTH_TEST)
  }
}
