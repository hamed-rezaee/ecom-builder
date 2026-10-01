import { createBlock } from '../blocks/registry';
import { DEFAULT_THEME } from '../utils/theme';
import { DEFAULT_LOCALES } from '../utils/i18n';
import { uid } from '../utils/helpers';

const product = (id, name, price, description) => ({
  id,
  name,
  price,
  description,
  shortDescription: '',
  image: '',
});

export function createStarterSite() {
  const products = [
    product(
      'mug',
      'Stoneware Mug',
      18,
      'Hand-glazed stoneware mug that keeps drinks warm.\nHolds 12 oz. Dishwasher safe.',
    ),
    product(
      'throw',
      'Linen Throw',
      64,
      'A soft, breathable linen throw for sofas and beds.',
    ),
    product(
      'candle',
      'Soy Candle',
      24,
      'Slow-burning soy wax candle with a warm cedar scent.',
    ),
    product(
      'board',
      'Walnut Board',
      48,
      'Solid walnut serving board with a food-safe oil finish.',
    ),
    product(
      'planter',
      'Brass Planter',
      36,
      'A compact planter with a polished brass finish.',
    ),
    product(
      'towel',
      'Tea Towel Set',
      22,
      'Set of three cotton tea towels in muted tones.',
    ),
    product(
      'vase',
      'Glass Vase',
      32,
      'Mouth-blown glass vase for fresh or dried flowers.',
    ),
    product(
      'tray',
      'Oak Tray',
      42,
      'A sturdy oak tray for breakfast in bed or tidy shelves.',
    ),
  ];

  return {
    name: 'Lumen & Co.',
    theme: {
      ...DEFAULT_THEME,
      animEntrance: 'fade-up',
      smoothScroll: true,
      scrollProgress: true,
      customFonts: [],
    },
    themePresets: [],
    locales: { ...DEFAULT_LOCALES, enabled: [] },
    translations: {},
    header: {
      logoText: 'Lumen & Co.',
      announcement: 'Free shipping on orders over $50',
      showCart: true,
      showLanguage: true,
      sticky: true,
      links: [
        { label: 'Home', href: '#/' },
        { label: 'Shop', href: '#/p/shop' },
        { label: 'About', href: '#/p/about' },
      ],
    },
    footer: {
      about: 'Thoughtfully designed essentials for everyday living.',
      copyright: '© 2026 Lumen & Co. All rights reserved.',
      links: [
        { label: 'Shop', href: '#/p/shop' },
        { label: 'About', href: '#/p/about' },
        { label: 'Cart', href: '#/cart' },
      ],
    },
    products,
    pages: [
      {
        id: uid('pg'),
        name: 'Home',
        slug: 'home',
        isHome: true,
        blocks: [
          createBlock('hero', {
            heading: 'Everyday goods, made to last',
            subheading:
              'Thoughtfully designed essentials for your home and daily routine.',
            buttonText: 'Shop the collection',
            buttonHref: '#/p/shop',
            height: 'lg',
            wire: true,
            wireShape: 'ripple',
            gridStyle: 'dots',
          }),
          createBlock('features'),
          createBlock('productGrid', {
            heading: 'Best sellers',
            subheading: 'Our most loved pieces.',
            columns: 4,
            perPage: 4,
            paginationStyle: 'none',
          }),
          createBlock('imageText', {
            heading: 'Designed with care',
            text: 'Every piece is made in small batches by makers we know and trust. We believe good things last, so we choose materials and finishes that only get better with use.',
            imagePosition: 'right',
            buttonText: 'Our story',
            buttonHref: '#/p/about',
          }),
          createBlock('testimonials'),
          createBlock('newsletter'),
        ],
      },
      {
        id: uid('pg'),
        name: 'Shop',
        slug: 'shop',
        blocks: [
          createBlock('richText', {
            heading: 'Shop all',
            body: 'Browse the full collection.',
            align: 'center',
          }),
          createBlock('productGrid', { heading: '', columns: 4 }),
          createBlock('banner', {
            text: 'Free shipping on orders over $50',
            buttonText: 'View cart',
            buttonHref: '#/cart',
          }),
        ],
      },
      {
        id: uid('pg'),
        name: 'About',
        slug: 'about',
        blocks: [
          createBlock('imageText', {
            heading: 'About us',
            text: 'We started Lumen & Co. to make simple, durable home goods that people keep for years.\n\nEvery product is tested in our own homes before it reaches yours.',
            imagePosition: 'left',
          }),
          createBlock('faq'),
        ],
      },
    ],
  };
}
