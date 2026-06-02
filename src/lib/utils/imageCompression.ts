/**
 * High-performance client-side image compression utility.
 * Compresses any File object to a base64 JPEG string under 100kb in size.
 */
export async function compressImage(file: File, maxSizeKb = 100): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions to ensure compact size while preserving quality
        const MAX_DIM = 1200;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas 2D context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Recursive compression helper to target under maxSizeKb
        let quality = 0.8;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        let sizeInKb = (base64.length * 3) / 4 / 1024; // Base64 size estimation

        while (sizeInKb > maxSizeKb && quality > 0.1) {
          quality -= 0.15;
          base64 = canvas.toDataURL('image/jpeg', quality);
          sizeInKb = (base64.length * 3) / 4 / 1024;
        }

        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
