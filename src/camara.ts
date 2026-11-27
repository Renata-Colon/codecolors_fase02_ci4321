import { mat4 } from 'gl-matrix'

// configuracion de camaras 
export type modoCamara = 'tercera' | 'cenital' | 'primera' | 'ui'

export interface MatricesCamara {
  vista: mat4
  proyeccion: mat4
}

export function configurarCamara(
  modo: modoCamara, 
  relacionAspecto: number, 
  posTanque: [number, number, number] = [0, 0, 0],
  rotacionCuerpoRad: number = 0,
  puntaCanon?: { posicion: [number, number, number], adelante: [number, number, number] }
): MatricesCamara {
  
  let vista = mat4.create()
  let proyeccion = mat4.create()

  // camara ortografica para la interfaz
  if (modo === 'ui') {
    const ancho = 1920 
    const alto = 1080
    proyeccion = mat4.ortho(mat4.create(), 0, ancho, alto, 0, -1, 1)
    vista = mat4.create() 

  // primera persona tipo conductor
  } else if (modo === 'primera') {
    proyeccion = mat4.perspective(mat4.create(), Math.PI / 4, relacionAspecto, 0.1, 200.0)
    const alturaOjo = 2.15
    const ojo: [number, number, number] = [
      posTanque[0] + Math.sin(rotacionCuerpoRad) * 0.2,
      alturaOjo,
      posTanque[2] + Math.cos(rotacionCuerpoRad) * 0.2
    ]
    const distanciaMira = 30
    const mira: [number, number, number] = [
      ojo[0] - Math.sin(rotacionCuerpoRad) * distanciaMira,
      ojo[1] - 0.5,
      ojo[2] - Math.cos(rotacionCuerpoRad) * distanciaMira
    ]
    vista = mat4.lookAt(mat4.create(), ojo, mira, [0, 1, 0])

  // camaras en perspectiva estandar
  } else {
    proyeccion = mat4.perspective(mat4.create(), Math.PI / 4, relacionAspecto, 0.1, 200.0)

    // tercera persona atras y arriba
    if (modo === 'tercera') {
      const distancia = 18
      const altura = 14
      const ojo: [number, number, number] = [
        posTanque[0] + Math.sin(rotacionCuerpoRad) * distancia,
        posTanque[1] + altura,
        posTanque[2] + Math.cos(rotacionCuerpoRad) * distancia
      ]
      const mira: [number, number, number] = [posTanque[0], posTanque[1] + 3, posTanque[2]]
      vista = mat4.lookAt(mat4.create(), ojo, mira, [0, 1, 0])
      
    // vista cenital desde muy arriba
    } else {
      vista = mat4.lookAt(mat4.create(), [posTanque[0], 35, posTanque[2] + 0.01], posTanque, [0, 0, -1])
    }
  }

  return { vista, proyeccion }
}
