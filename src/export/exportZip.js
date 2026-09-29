import JSZip from 'jszip';
import { buildSite } from './buildSite';
import { slugify } from '../utils/helpers';

export async function exportSiteZip(site) {
  const { html, css, js } = buildSite(site);
  const zip = new JSZip();
  zip.file('index.html', html);
  zip.file('site.css', css);
  zip.file('site.js', js);
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
