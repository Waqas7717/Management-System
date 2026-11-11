// Turns a chosen picture into a small square thumbnail (under 2 KB) saved with the record.
export function readPhoto(file) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('Choose an image file (JPG or PNG).'));
    if (file.size > 15 * 1024 * 1024) return rej(new Error('This image is too large. Choose one under 15 MB.'));
    const r = new FileReader();
    r.onerror = () => rej(new Error('Could not read the image.'));
    r.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error('This image could not be opened.'));
      im.onload = () => {
        const m = Math.min(im.width, im.height), sx = (im.width - m) / 2, sy = (im.height - m) / 2;
        const MAX = 1900;
        for (const fmt of ['image/webp', 'image/jpeg']) {
          for (const Z of [72, 64, 56, 48, 40, 32]) {
            const cv = document.createElement('canvas'); cv.width = cv.height = Z;
            const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high';
            x.fillStyle = '#fff'; x.fillRect(0, 0, Z, Z);
            x.drawImage(im, sx, sy, m, m, 0, 0, Z, Z);
            for (const q of [0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]) {
              const d = cv.toDataURL(fmt, q);
              if (d.indexOf('data:' + fmt) === 0 && d.length <= MAX) return res(d);
            }
          }
        }
        rej(new Error('This image could not be made small enough. Try a simpler photo.'));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
