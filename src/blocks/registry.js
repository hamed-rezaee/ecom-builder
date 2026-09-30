import {
  BadgeCheck,
  CircleHelp,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  Megaphone,
  MoveVertical,
  Quote,
  Sparkles,
  Star,
  Type,
} from 'lucide-react';
import { uid } from '../utils/helpers';
import { Banner, Footer, Header, RichText, Spacer } from './layout';
import {
  Faq,
  Features,
  Hero,
  ImageText,
  Newsletter,
  Testimonials,
} from './content';
import { FeaturedProduct, ProductGrid } from './commerce';
import {
  GRID_STYLES,
  IMAGE_SHAPES,
  IMAGE_SIZES,
  WIRE_SHAPES,
  WIRE_STYLES,
} from '../utils/wireShapes';

const text = (key, label) => ({ key, label, type: 'text' });
const area = (key, label) => ({ key, label, type: 'textarea' });
const link = (key, label) => ({ key, label, type: 'link' });
const image = (key, label) => ({ key, label, type: 'image' });
const select = (key, label, options) => ({
  key,
  label,
  type: 'select',
  options,
});

export const registry = {
  hero: {
    label: 'Hero',
    category: 'Content',
    icon: Sparkles,
    Component: Hero,
    defaults: {
      heading: 'Your headline here',
      subheading: 'Tell visitors what makes your store special.',
      buttonText: 'Shop now',
      buttonHref: '#/',
      image: '',
      align: 'left',
      height: 'md',
      wire: false,
      wireShape: 'terrain',
      wireStyle: 'both',
      wireColor: '#ffffff',
      wireSpeed: 50,
      wirePulse: true,
      wireInteractive: true,
      gridStyle: 'none',
      gridColor: '#ffffff',
    },
    fields: [
      text('heading', 'Heading'),
      area('subheading', 'Subheading'),
      text('buttonText', 'Button text'),
      link('buttonHref', 'Button link'),
      image('image', 'Background image'),
      select('align', 'Alignment', [
        ['left', 'Left'],
        ['center', 'Center'],
      ]),
      select('height', 'Height', [
        ['sm', 'Small'],
        ['md', 'Medium'],
        ['lg', 'Large'],
      ]),
      { key: 'wire', label: 'Wireframe animation', type: 'toggle' },
      select('wireShape', 'Wireframe shape', WIRE_SHAPES),
      select('wireStyle', 'Wireframe style', WIRE_STYLES),
      { key: 'wireColor', label: 'Wireframe color', type: 'color' },
      {
        key: 'wireSpeed',
        label: 'Wireframe speed',
        type: 'range',
        min: 0,
        max: 100,
      },
      { key: 'wirePulse', label: 'Traveling light pulses', type: 'toggle' },
      {
        key: 'wireInteractive',
        label: 'React to pointer (Preview and export)',
        type: 'toggle',
      },
      select('gridStyle', 'Background grid animation', GRID_STYLES),
      { key: 'gridColor', label: 'Grid color', type: 'color' },
    ],
  },
  productGrid: {
    label: 'Product grid',
    category: 'Store',
    icon: LayoutGrid,
    Component: ProductGrid,
    defaults: {
      heading: 'Our products',
      subheading: '',
      columns: 3,
      limit: 0,
      buttonText: 'Add to cart',
    },
    fields: [
      text('heading', 'Heading'),
      text('subheading', 'Subheading'),
      select('columns', 'Columns', [
        [2, '2'],
        [3, '3'],
        [4, '4'],
      ]),
      {
        key: 'limit',
        label: 'Max products (0 = all)',
        type: 'number',
        min: 0,
        max: 24,
      },
      text('buttonText', 'Button text'),
    ],
  },
  featuredProduct: {
    label: 'Featured product',
    category: 'Store',
    icon: Star,
    Component: FeaturedProduct,
    defaults: { productId: '', label: 'Featured' },
    fields: [
      { key: 'productId', label: 'Product', type: 'product' },
      text('label', 'Label'),
    ],
  },
  imageText: {
    label: 'Image + text',
    category: 'Content',
    icon: ImageIcon,
    Component: ImageText,
    defaults: {
      heading: 'Tell your story',
      text: 'Share what your brand stands for and why customers love it.',
      image: '',
      imagePosition: 'left',
      buttonText: '',
      buttonHref: '#/',
    },
    fields: [
      text('heading', 'Heading'),
      area('text', 'Text'),
      image('image', 'Image'),
      select('imagePosition', 'Image position', [
        ['left', 'Left'],
        ['right', 'Right'],
      ]),
      text('buttonText', 'Button text'),
      link('buttonHref', 'Button link'),
    ],
  },
  features: {
    label: 'Features',
    category: 'Content',
    icon: BadgeCheck,
    Component: Features,
    defaults: {
      heading: '',
      imageShape: 'rounded',
      imageSize: 'md',
      items: [
        {
          image: '',
          title: 'Fast shipping',
          text: 'Orders leave in 24 hours.',
        },
        {
          image: '',
          title: 'Easy returns',
          text: '30 days, no questions asked.',
        },
        {
          image: '',
          title: 'Secure checkout',
          text: 'Your details stay private.',
        },
      ],
    },
    fields: [
      text('heading', 'Heading'),
      select('imageShape', 'Image shape', IMAGE_SHAPES),
      select('imageSize', 'Image size', IMAGE_SIZES),
      {
        key: 'items',
        label: 'Features',
        type: 'list',
        itemLabel: 'Feature',
        newItem: { image: '', title: 'New feature', text: '' },
        itemFields: [
          image('image', 'Image'),
          text('title', 'Title'),
          text('text', 'Text'),
        ],
      },
    ],
  },
  testimonials: {
    label: 'Testimonials',
    category: 'Content',
    icon: Quote,
    Component: Testimonials,
    defaults: {
      heading: 'What customers say',
      items: [
        { quote: 'Great quality and fast delivery.', author: 'Alex P.' },
        { quote: 'Exactly what I was looking for.', author: 'Sam R.' },
      ],
    },
    fields: [
      text('heading', 'Heading'),
      {
        key: 'items',
        label: 'Testimonials',
        type: 'list',
        itemLabel: 'Testimonial',
        newItem: { quote: 'Loved it!', author: 'Customer' },
        itemFields: [area('quote', 'Quote'), text('author', 'Author')],
      },
    ],
  },
  faq: {
    label: 'FAQ',
    category: 'Content',
    icon: CircleHelp,
    Component: Faq,
    defaults: {
      heading: 'Frequently asked questions',
      items: [
        {
          q: 'How long does shipping take?',
          a: 'Most orders arrive within 3 to 5 business days.',
        },
        {
          q: 'What is your return policy?',
          a: 'Return any item within 30 days for a full refund.',
        },
      ],
    },
    fields: [
      text('heading', 'Heading'),
      {
        key: 'items',
        label: 'Questions',
        type: 'list',
        itemLabel: 'Question',
        newItem: { q: 'New question?', a: 'Answer.' },
        itemFields: [text('q', 'Question'), area('a', 'Answer')],
      },
    ],
  },
  newsletter: {
    label: 'Newsletter',
    category: 'Content',
    icon: Mail,
    Component: Newsletter,
    defaults: {
      heading: 'Join our newsletter',
      text: 'Get news and offers in your inbox.',
      buttonText: 'Subscribe',
    },
    fields: [
      text('heading', 'Heading'),
      area('text', 'Text'),
      text('buttonText', 'Button text'),
    ],
  },
  banner: {
    label: 'Banner',
    category: 'Content',
    icon: Megaphone,
    Component: Banner,
    defaults: {
      text: 'Free shipping on orders over $50',
      buttonText: 'Shop now',
      buttonHref: '#/',
      tone: 'primary',
    },
    fields: [
      text('text', 'Text'),
      text('buttonText', 'Button text'),
      link('buttonHref', 'Button link'),
      select('tone', 'Style', [
        ['primary', 'Brand color'],
        ['dark', 'Dark'],
        ['light', 'Light'],
      ]),
    ],
  },
  richText: {
    label: 'Text',
    category: 'Content',
    icon: Type,
    Component: RichText,
    defaults: {
      heading: 'Section title',
      body: 'Write something here.',
      align: 'left',
    },
    fields: [
      text('heading', 'Heading'),
      area('body', 'Body'),
      select('align', 'Alignment', [
        ['left', 'Left'],
        ['center', 'Center'],
      ]),
    ],
  },
  spacer: {
    label: 'Spacer',
    category: 'Content',
    icon: MoveVertical,
    Component: Spacer,
    defaults: { height: 48 },
    fields: [
      { key: 'height', label: 'Height (px)', type: 'number', min: 8, max: 320 },
    ],
  },
  header: {
    label: 'Header',
    global: true,
    Component: Header,
    defaults: {},
    fields: [
      text('logoText', 'Logo text'),
      text('announcement', 'Announcement bar (optional)'),
      { key: 'showCart', label: 'Show cart icon', type: 'toggle' },
      { key: 'sticky', label: 'Stick to top when scrolling', type: 'toggle' },
      {
        key: 'links',
        label: 'Menu links',
        type: 'list',
        itemLabel: 'Link',
        newItem: { label: 'Link', href: '#/' },
        itemFields: [text('label', 'Label'), link('href', 'Link')],
      },
    ],
  },
  footer: {
    label: 'Footer',
    global: true,
    Component: Footer,
    defaults: {},
    fields: [
      area('about', 'About text'),
      text('copyright', 'Copyright line'),
      {
        key: 'links',
        label: 'Links',
        type: 'list',
        itemLabel: 'Link',
        newItem: { label: 'Link', href: '#/' },
        itemFields: [text('label', 'Label'), link('href', 'Link')],
      },
    ],
  },
};

export const paletteTypes = Object.keys(registry).filter(
  (t) => !registry[t].global,
);

export function createBlock(type, overrides = {}) {
  return {
    id: uid('b'),
    type,
    props: { ...structuredClone(registry[type].defaults), ...overrides },
  };
}
