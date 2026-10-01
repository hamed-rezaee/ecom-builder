import JSZip from 'jszip';
import { buildSite, localePath } from './buildSite';
import { slugify } from '../utils/helpers';
import { normalizeLocales } from '../utils/i18n';

export async function exportSiteZip(site) {
  const locales = normalizeLocales(site.locales);
  const zip = new JSZip();
  let shared;
  for (const code of [locales.default, ...locales.enabled]) {
    const build = buildSite(site, { locale: code });
    zip.file(`${localePath(code, locales)}index.html`, build.html);
    shared ??= build;
  }
  zip.file('site.css', shared.css);
  zip.file('site.js', shared.js);
  for (const f of shared.files) zip.file(f.path, f.base64, { base64: true });
  const blob = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(site.name)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
