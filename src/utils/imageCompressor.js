/**
 * Utilidad para comprimir y convertir imágenes a Data URL (base64).
 * Optimiza fotos tomadas con móviles o cámaras (que pueden pesar 5-10 MB)
 * reduciéndolas a ~150-250 KB manteniendo total nitidez para leer textos del carnet.
 */

export function comprimirImagen(file, { maxDimension = 1400, calidad = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se proporcionó ningún archivo'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado debe ser una imagen (JPG, PNG, WebP)'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Error al procesar la imagen'));
      };

      img.onload = () => {
        let { width, height } = img;

        // Calcular escala si supera la dimensión máxima
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Fondo blanco por si la imagen tiene transparencias (PNG)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG optimizado
        const dataUrl = canvas.toDataURL('image/jpeg', calidad);
        resolve(dataUrl);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
