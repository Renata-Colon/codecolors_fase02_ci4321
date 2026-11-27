// modulo para cargar imagenes como texturas
export interface texturasJuego {
  suelo: WebGLTexture
}

// funcion auxiliar para subir imagen a la gpu
function cargarUnaTextura(gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      
      // voltear imagen porque webgl tiene el origen abajo
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      
      // generar mipmaps para cuando esta lejos
      gl.generateMipmap(gl.TEXTURE_2D)
      
      // configurar repeticion de textura
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      
      resolve(tex)
    }
    img.onerror = () => reject(new Error(`no se pudo cargar: ${url}`))
    img.src = url
  })
}

// funcion principal para cargar todas las texturas
export async function cargarTexturas(gl: WebGL2RenderingContext): Promise<texturasJuego> {
  const suelo = await cargarUnaTextura(gl, '/texturas/perlin-noise.png')
  return { suelo }
}
