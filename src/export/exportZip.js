import JSZip from 'jszip';
import { buildSite } from './buildSite';
import { slugify } from '../utils/helpers';

export async function exportSiteZip(site) {
  const { html, css, js, files } = buildSite(site);
  const zip = new JSZip();
  zip.file('index.html', html);
  zip.file('site.css', css);
  zip.file('site.js', js);
  for (const f of files) zip.file(f.path, f.base64, { base64: true });
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
