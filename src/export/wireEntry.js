// Bundled to an IIFE (see the ?iife plugin in vite.config.js) and shipped only with sites that use it.
import { mountWireframe } from '../utils/wireframe';

window.EBWire = {
  mountAll() {
    document
      .querySelectorAll('.eb-hero-wire:not([data-wire-ready])')
      .forEach((el) => {
        el.setAttribute('data-wire-ready', '');
        let options = null;
        try {
          options = JSON.parse(el.getAttribute('data-wire') || '{}');
        } catch {
          // malformed attribute: fall back to defaults
        }
        mountWireframe(el, options);
      });
  },
};
