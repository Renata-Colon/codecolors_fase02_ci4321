// entrada
import { EstadoJuego } from './tipos'

export class ManejadorEntrada {
  private teclas: { [key: string]: boolean } = {}
  public disparoSolicitado = false
  private cambioFuerzaSolicitado = false
  public reinicioSolicitado = false
  public cambioCamaraSolicitado = false
  public cambioColorSolicitado = false
  private referenciaEstado!: EstadoJuego

  constructor() {
    window.addEventListener('keydown', (e) => {
      // evita scroll en la pagina tanto con space como con las teclas que tienen flechas
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
      
      // acciones de pulsacion unica
      if (!e.repeat) {
        if (e.code === 'Space') this.disparoSolicitado = true
        if (e.code === 'KeyF') this.cambioFuerzaSolicitado = true
        if (e.code === 'KeyR') this.reinicioSolicitado = true
        if (e.code === 'KeyC') this.cambioCamaraSolicitado = true
        if (e.code === 'KeyV') this.cambioColorSolicitado = true
        if (e.code === 'Digit1' || e.code === 'Numpad1') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 1
        if (e.code === 'Digit2' || e.code === 'Numpad2') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 2
        if (e.code === 'Digit3' || e.code === 'Numpad3') if (this.referenciaEstado) this.referenciaEstado.nivelFuerza = 3
      }
      
      this.teclas[e.code] = true
    })

    window.addEventListener('keyup', (e) => {
      this.teclas[e.code] = false
    })

    // si el jugador hace clic fuera de la ventana soltamos todas las teclas para que el tanque no se quede yendose solo hacia la pared infinitamente
    window.addEventListener('blur', () => {
      this.teclas = {}
    })
  }

  public vincularEstado(estado: EstadoJuego): void {
    this.referenciaEstado = estado
  }

  public procesarEntrada(dt: number): void {
    if (!this.referenciaEstado) return
    
    const VELOCIDAD_INCLINACION = 30 
    const VELOCIDAD_GIRO_TORRETA = 60
    const VELOCIDAD_MOVIMIENTO = 6
    const VELOCIDAD_GIRO_CUERPO = 90

    // base del vehiculo wasd traslacion en x y z
    // a y d izquierda y derecha en el eje x
    if (this.teclas['KeyA']) {
      this.referenciaEstado.rotacionCuerpo += VELOCIDAD_GIRO_CUERPO * dt
    }
    if (this.teclas['KeyD']) {
      this.referenciaEstado.rotacionCuerpo -= VELOCIDAD_GIRO_CUERPO * dt
    }

    // w y s para avanzar y retroceder en el eje z
    const rotRad = this.referenciaEstado.rotacionCuerpo * (Math.PI / 180)
    const adelanteX = -Math.sin(rotRad)
    const adelanteZ = -Math.cos(rotRad)

    if (this.teclas['KeyW']) {
      this.referenciaEstado.desplazamientoX += adelanteX * VELOCIDAD_MOVIMIENTO * dt
      this.referenciaEstado.desplazamientoZ += adelanteZ * VELOCIDAD_MOVIMIENTO * dt
    }
    if (this.teclas['KeyS']) {
      this.referenciaEstado.desplazamientoX -= adelanteX * VELOCIDAD_MOVIMIENTO * dt
      this.referenciaEstado.desplazamientoZ -= adelanteZ * VELOCIDAD_MOVIMIENTO * dt
    }

    this.referenciaEstado.desplazamientoX = Math.max(-14, Math.min(14, this.referenciaEstado.desplazamientoX))
    this.referenciaEstado.desplazamientoZ = Math.max(-14, Math.min(14, this.referenciaEstado.desplazamientoZ))

    // cabeza y torreta con flechas izquierda y derecha para rotacion en y
    if (this.teclas['ArrowLeft']) {
      this.referenciaEstado.rotacionTorreta += VELOCIDAD_GIRO_TORRETA * dt
    }
    if (this.teclas['ArrowRight']) {
      this.referenciaEstado.rotacionTorreta -= VELOCIDAD_GIRO_TORRETA * dt
    }

    // inclinacion del cañon con flechas arriba y abajo para rotacion en x
    if (this.teclas['ArrowUp']) {
      this.referenciaEstado.inclinacionCanon = Math.min(90, this.referenciaEstado.inclinacionCanon + VELOCIDAD_INCLINACION * dt)
    }
    if (this.teclas['ArrowDown']) {
      this.referenciaEstado.inclinacionCanon = Math.max(5, this.referenciaEstado.inclinacionCanon - VELOCIDAD_INCLINACION * dt)
    }

    // alternar fuerza con la tecla f
    if (this.cambioFuerzaSolicitado) {
      if (this.referenciaEstado.nivelFuerza === 1) {
        this.referenciaEstado.nivelFuerza = 2
      } else if (this.referenciaEstado.nivelFuerza === 2) {
        this.referenciaEstado.nivelFuerza = 3
      } else {
        this.referenciaEstado.nivelFuerza = 1 
      }
      this.cambioFuerzaSolicitado = false
    }
  }
}
