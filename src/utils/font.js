import { FONT_EXTENSIONS } from '../data/fonts';
import { uid } from './helpers';
import { MAX_FONT_BYTES } from './theme';

// Reads an uploaded font file into a theme `customFonts` entry, or throws a user-facing Error.
export function readFontFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!Object.hasOwn(FONT_EXTENSIONS, ext)) {
    return Promise.reject(
      new Error('Use a .woff2, .woff, .ttf or .otf font file.'),
    );
  }
  if (file.size > MAX_FONT_BYTES) {
    return Promise.reject(
      new Error(
        `Font is too large. Keep it under ${MAX_FONT_BYTES / 1024} KB.`,
      ),
    );
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the font file.'));
    reader.onload = () =>
      resolve({
        id: uid('f').replace(/[^a-z0-9_]/gi, ''),
        name:
          file.name
            .replace(/\.[^.]+$/, '')
            .replace(/[^\w .-]/g, '')
            .slice(0, 40) || 'Custom font',
        ext,
        data: reader.result,
      });
    reader.readAsDataURL(file);
  });
}
