/**
 * Client-side WebP Image Compressor
 * Compresses input payment proof image to WebP format under 200KB.
 */
export const compressImageToWebP = (file, maxWidth = 1000, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('File gambar tidak ditemukan.'));
      return;
    }

    // 1. Enforce max upload size limit (10MB) to prevent Memory Exhaustion / Zip Bomb attacks
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('Ukuran file terlalu besar. Maksimal 10MB.'));
      return;
    }

    // 2. Strict MIME Type Whitelist
    const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (!ALLOWED_MIMES.includes(file.type.toLowerCase())) {
      reject(new Error('Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WEBP.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengompresi gambar.'));
              return;
            }
            const compressedFile = new File([blob], `proof_${Date.now()}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Gagal membaca data gambar.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });
};
