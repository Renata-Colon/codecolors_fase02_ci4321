import { EstadoJuego, PuntaCanon } from './tipos'
import { configurarCamara, MatricesCamara, modoCamara } from './camara'
import { ManejadorEntrada } from './entrada'
import { MotorFisico } from './fisica'
import { createFixedFunction } from './vendor/ff/ff'
import { EscenaGrafica } from './escena'

// contrato de la escena
export interface EscenaJuego {
  obtenerPuntaCanon: () => PuntaCanon
  fijarTransformacionTanque: (x: number, z: number, rotacionCuerpo: number, rotacionTorreta: number, inclinacion: number) => void
  fijarIndicadorFuerza: (nivel: 1 | 2 | 3) => void
  fijarTransformacionProyectil: (posicion: [number, number, number], activo: boolean) => void
  obtenerPosicionesObjetivos: () => { id: number, posicion: [number, number, number], radio: number }[]
  actualizarObjetivos: (objetivos: any[]) => void
  renderizar: (matrizVista: Float32Array, matrizProyeccion: Float32Array) => void
  cargarTexturas: () => Promise<void>
}

// orquestador principal del juego
export class OrquestadorJuego {
  public estado: EstadoJuego
  private matrices: MatricesCamara
  private entrada: ManejadorEntrada
  private fisica: MotorFisico
  private escena: EscenaJuego
  private ultimoTiempo: number | null = null
  private readonly DT_MAXIMO = 0.1
  private reiniciandoPendiente = false
  private modoCamaraActual: modoCamara = 'tercera'
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement, escena: EscenaJuego) {
    this.canvas = canvas
    this.escena = escena
    this.entrada = new ManejadorEntrada()
    this.fisica = new MotorFisico()
    
    // estado inicial con nuevas variables de movimiento
    this.estado = {
      desplazamientoX: 0, desplazamientoZ: 0, rotacionCuerpo: 0, rotacionTorreta: 0,
      inclinacionCanon: 30, nivelFuerza: 1, puntaje: 0,
      proyectil: { activo: false, posicion: [0, 0, 0], velocidad: [0, 0, 0], radio: 0.25 },
      objetivos: this.escena.obtenerPosicionesObjetivos().map((t) => ({ ...t, vivo: true })),
    }
    this.entrada.vincularEstado(this.estado)
    this.actualizarCamara()
  }

  // recalcular matrices de camara en cada frame
  private actualizarCamara(): void {
    const rotCuerpoRad = this.estado.rotacionCuerpo * (Math.PI / 180)
    const posTanque: [number, number, number] = [this.estado.desplazamientoX, 0.35, this.estado.desplazamientoZ]
    if (this.modoCamaraActual === 'primera') {
      const punta = this.escena.obtenerPuntaCanon()
      this.matrices = configurarCamara('primera', this.canvas.width / this.canvas.height, posTanque, rotCuerpoRad, punta)
    } else {
      this.matrices = configurarCamara(this.modoCamaraActual, this.canvas.width / this.canvas.height, posTanque, rotCuerpoRad)
    }
  }

  public iniciar(): void { requestAnimationFrame(this.bucle.bind(this)) }

  public reiniciar(): void {
    this.reiniciandoPendiente = false
    this.estado.desplazamientoX = 0; this.estado.desplazamientoZ = 0
    this.estado.rotacionCuerpo = 0; this.estado.rotacionTorreta = 0
    this.estado.inclinacionCanon = 30; this.estado.nivelFuerza = 1; this.estado.puntaje = 0
    this.estado.proyectil = { activo: false, posicion: [0, 0, 0], velocidad: [0, 0, 0], radio: 0.25 }
    this.estado.objetivos = this.escena.obtenerPosicionesObjetivos().map((t) => ({ ...t, vivo: true }))
    this.escena.actualizarObjetivos(this.estado.objetivos)
    this.escena.fijarTransformacionTanque(this.estado.desplazamientoX, this.estado.desplazamientoZ, this.estado.rotacionCuerpo, this.estado.rotacionTorreta, this.estado.inclinacionCanon)
    this.escena.fijarIndicadorFuerza(this.estado.nivelFuerza)
    this.escena.fijarTransformacionProyectil(this.estado.proyectil.posicion, this.estado.proyectil.activo)
  }
  
  // bucle principal del juego
  private bucle(ahora: number): void {
    if (this.ultimoTiempo === null) this.ultimoTiempo = ahora
    const dt = Math.min((ahora - this.ultimoTiempo) / 1000.0, this.DT_MAXIMO)
    this.ultimoTiempo = ahora
    
    // fase uno procesar entradas
    this.entrada.procesarEntrada(dt)
    
    // cambiar camara con tecla c
    if (this.entrada.cambioCamaraSolicitado) {
      if (this.modoCamaraActual === 'tercera') this.modoCamaraActual = 'cenital'
      else if (this.modoCamaraActual === 'cenital') this.modoCamaraActual = 'primera'
      else this.modoCamaraActual = 'tercera'
      this.entrada.cambioCamaraSolicitado = false
    }
    
    if (this.entrada.reinicioSolicitado) { this.reiniciar(); this.entrada.reinicioSolicitado = false }
    if (this.entrada.disparoSolicitado) {
      const punta = this.escena.obtenerPuntaCanon() 
      this.fisica.lanzar(this.estado, punta.posicion, punta.adelante)
      this.entrada.disparoSolicitado = false
    }
    
    // fase dos actualizar fisica
    this.fisica.actualizar(this.estado, dt)
    const todosDestruidos = this.estado.objetivos.every((obj) => !obj.vivo)
    if (todosDestruidos && !this.reiniciandoPendiente) {
      this.reiniciandoPendiente = true
      setTimeout(() => { this.reiniciar() }, 1000)
    }
    
    // sincronizar estado con la escena
    this.escena.actualizarObjetivos(this.estado.objetivos)
    this.escena.fijarTransformacionTanque(this.estado.desplazamientoX, this.estado.desplazamientoZ, this.estado.rotacionCuerpo, this.estado.rotacionTorreta, this.estado.inclinacionCanon)
    this.escena.fijarIndicadorFuerza(this.estado.nivelFuerza)
    this.escena.fijarTransformacionProyectil(this.estado.proyectil.posicion, this.estado.proyectil.activo)
    this.actualizarCamara()
    
    // fase tres renderizar
    this.escena.renderizar(this.matrices.vista as Float32Array, this.matrices.proyeccion as Float32Array)
    requestAnimationFrame(this.bucle.bind(this))
  }
}

// inicializacion al cargar el dom
window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const gl = canvas.getContext('webgl2')
  if (!gl) { alert('tu navegador no soporta webgl2'); return }
  const ff = createFixedFunction(gl)
  const escena = new EscenaGrafica(gl, ff)
  await escena.cargarTexturas()
  const juego = new OrquestadorJuego(canvas, escena)
  ;(window as any).juego = juego
  juego.iniciar()
})
