// Local preview of the Snoopy Mode Shopify theme (liquidjs + mocked Shopify objects, real catalogue).
// Usage: node preview/build.mjs [basePath]   -> writes _site/ (e.g. basePath /snoopy-mode-theme/ for GitHub Pages)
// ponytail: mocks only what this theme uses; not a general Shopify emulator.
import { Liquid, Tag } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.resolve(HERE, '..');
const OUT = path.join(THEME, '_site');
const BASE = (process.argv[2] || '/').replace(/\/?$/, '/');
// liquidjs can't parse `comment ... endcomment` inside {% liquid %} blocks (Shopify can): strip them for the preview.
const read = (p) => fs.readFileSync(path.join(THEME, p), 'utf8').replace(/\r\n/g, '\n').replace(/^[ \t]*comment[ \t]*\n[\s\S]*?^[ \t]*endcomment[ \t]*$/gm, '');
const data = (f) => JSON.parse(fs.readFileSync(path.join(HERE, 'data', f), 'utf8'));
const locale = JSON.parse(read('locales/nl.default.json'));

// ---------- catalogue (real Snoopy products, scraped from /products.json) ----------
const cents = (s) => Math.round(parseFloat(s || 0) * 100);
const raw = data('products.json').products;
const products = raw.map((p) => {
  const images = p.images.map((i) => ({ id: i.id, src: i.src, alt: '', width: i.width, height: i.height, aspect_ratio: i.width / i.height, media_type: 'image', presentation: { focal_point: null } }));
  const variants = p.variants.map((v) => ({ id: v.id, title: v.title, price: cents(v.price), compare_at_price: v.compare_at_price ? cents(v.compare_at_price) : null, available: v.available, sku: v.sku, options: [v.option1, v.option2, v.option3].filter(Boolean) }));
  const v0 = variants.find((v) => v.available) || variants[0];
  const options = p.options.map((o, i) => ({ name: o.name, position: i + 1, values: o.values, selected_value: v0.options[i] }));
  return {
    id: p.id, handle: p.handle, title: p.title, url: `/products/${p.handle}`, type: p.product_type, vendor: p.vendor, tags: p.tags,
    description: p.body_html || '', images, media: images, featured_image: images[0], featured_media: images[0],
    variants, selected_or_first_available_variant: v0, price: v0.price, compare_at_price: v0.compare_at_price,
    available: variants.some((v) => v.available), has_only_default_variant: variants.length === 1 && v0.title === 'Default Title',
    options_with_values: options, options: options.map((o) => o.name), metafields: { custom: {} }, collections: [],
  };
});
const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
const cmap = data('collections-map.json');
const titles = { blazers: 'Blazers', 'blouses-tops': 'Blouses', 'broeken-1': 'Broeken', 'jassen-blazers': 'Jassen', broeken: 'Jeans', 'nieuw-binnen': 'Nieuw binnen', 'onze-bestseller': 'Onze bestseller', rokken: 'Rokken', sale: 'Sale', schoenen: 'Schoenen', tassen: 'Tassen', tops: 'Tops', 'truien-vesten': 'Truien', jurken: 'Jurken' };
const C = (handle, title, hs) => {
  const ps = hs.map((h) => byHandle[h]).filter(Boolean);
  return { handle, title, url: `/collections/${handle}`, products: ps, products_count: ps.length, all_products_count: ps.length, description: '', featured_image: ps[0]?.featured_image || null, filters: [], sort_options: [{ value: 'manual', name: 'Uitgelicht' }, { value: 'price-ascending', name: 'Prijs, laag naar hoog' }, { value: 'price-descending', name: 'Prijs, hoog naar laag' }, { value: 'created-descending', name: 'Nieuwste' }], sort_by: 'manual', default_sort_by: 'manual' };
};
const collections = Object.fromEntries(Object.entries(titles).map(([h, t]) => [h, C(h, t, cmap[h] || [])]));
collections.all = C('all', 'Alle producten', products.map((p) => p.handle));
for (const c of Object.values(collections)) c.products.forEach((p) => p.collections.push(c));

const L = (title, url, links = []) => ({ title, url, links, active: false, child_active: false });
const linklists = {
  'main-menu': { title: 'Hoofdmenu', links: [L('Sale', '/collections/sale'), L('Collectie', '/collections/all'),
    L('Producten', '/collections/all', ['truien-vesten', 'tops', 'blouses-tops', 'broeken-1', 'broeken', 'blazers', 'jassen-blazers', 'rokken', 'schoenen', 'jurken', 'tassen'].map((h) => L(titles[h], `/collections/${h}`))),
    L('Over ons', '/pages/over-ons'), L('Contact', '/pages/contact')] },
  footer: { title: 'Klantenservice', links: [L('Verzending & retour', '/pages/verzending-retour'), L('Maattabel', '/pages/maattabel'), L('Veelgestelde vragen', '/pages/veelgestelde-vragen'), L('Contact', '/pages/contact'), L('Betaalmethoden', '/pages/betaalmethoden')] },
  shop: { title: 'Shop', links: ['blazers', 'blouses-tops', 'broeken-1', 'jassen-blazers', 'broeken', 'jurken'].map((h) => L(titles[h], `/collections/${h}`)) },
  legal: { title: 'Juridisch', links: [L('Algemene voorwaarden', '/pages/algemene-voorwaarden'), L('Privacybeleid', '/pages/privacybeleid'), L('Cookies', '/pages/cookies')] },
};
const pageObjs = Object.fromEntries(['over-ons', 'contact', 'verzending-retour', 'maattabel', 'veelgestelde-vragen', 'betaalmethoden', 'algemene-voorwaarden', 'privacybeleid', 'cookies'].map((h) => [h, { handle: h, url: `/pages/${h}`, title: h.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()), content: '' }]));

// ---------- settings ----------
const schemaDefaults = (schema) => Object.fromEntries((schema.settings || []).filter((s) => 'default' in s).map((s) => [s.id, s.default]));
const settings = Object.assign({}, ...JSON.parse(read('config/settings_schema.json')).map(schemaDefaults), JSON.parse(read('config/settings_data.json')).current);
const resolve = (type, v) => {
  if (v == null || v === '') return type === 'url' || type === 'text' ? v : null;
  if (type === 'collection') return collections[v] || null;
  if (type === 'product') return byHandle[v] || null;
  if (type === 'collection_list') return (v || []).map((h) => collections[h]).filter(Boolean);
  if (type === 'product_list') return (v || []).map((h) => byHandle[h]).filter(Boolean);
  if (type === 'image_picker') return null; // merchant uploads; preview shows theme fallbacks
  if (type === 'url') return String(v).replace('shopify://collections/', '/collections/').replace('shopify://pages/', '/pages/');
  return v;
};
const schemaOf = (type) => { const m = read(`sections/${type}.liquid`).match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/); return m ? JSON.parse(m[1]) : {}; };
function buildSection(id, d) {
  const schema = schemaOf(d.type);
  const types = Object.fromEntries((schema.settings || []).map((s) => [s.id, s.type]));
  const st = { ...schemaDefaults(schema), ...(d.settings || {}) };
  for (const k in st) st[k] = resolve(types[k], st[k]);
  let order = d.block_order, blocksSrc = d.blocks;
  if (!order && schema.presets?.[0]?.blocks && !d.settings) { blocksSrc = Object.fromEntries(schema.presets[0].blocks.map((b, i) => [`p${i}`, b])); order = Object.keys(blocksSrc); }
  const blocks = (order || []).map((bid) => {
    const b = blocksSrc[bid]; const bs = (schema.blocks || []).find((x) => x.type === b.type) || {};
    const bt = Object.fromEntries((bs.settings || []).map((s) => [s.id, s.type]));
    const s = { ...schemaDefaults(bs), ...b.settings }; for (const k in s) s[k] = resolve(bt[k], s[k]);
    return { id: bid, type: b.type, settings: s, shopify_attributes: '' };
  });
  return { id, type: d.type, settings: st, blocks };
}

// ---------- engine ----------
const clean = (s) => s.replace(/\r\n/g, '\n').replace(/^[ \t]*comment[ \t]*\n[\s\S]*?^[ \t]*endcomment[ \t]*$/gm, '');
const liqFs = {
  exists: async (f) => fs.existsSync(f), existsSync: (f) => fs.existsSync(f),
  readFile: async (f) => clean(fs.readFileSync(f, 'utf8')), readFileSync: (f) => clean(fs.readFileSync(f, 'utf8')),
  resolve: (root, file, ext) => path.resolve(root, file.endsWith(ext) ? file : file + ext), contains: () => true, dirname: path.dirname, sep: path.sep,
};
const engine = new Liquid({ root: [path.join(THEME, 'snippets')], extname: '.liquid', jsTruthy: false, strictFilters: true, relativeReference: false, fs: liqFs });
const money = (c) => '€' + (Number(c || 0) / 100).toFixed(2).replace('.', ',');
const named = (args) => Object.fromEntries(args.filter(Array.isArray));
const attrs = (h) => Object.entries(h).filter(([, v]) => v !== false && v != null && v !== '').map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
const withW = (src, w) => (w ? `${src}${src.includes('?') ? '&' : '?'}width=${w}` : src);
engine.registerFilter('t', (k) => k.split('.').reduce((o, x) => o?.[x], locale) ?? k);
engine.registerFilter('asset_url', (f) => `/assets/${f}`);
engine.registerFilter('image_url', (img, ...a) => { const src = typeof img === 'string' ? img : img?.src || ''; return withW(src, named(a).width); });
engine.registerFilter('image_tag', function (src, ...a) {
  const h = named(a); const widths = h.widths; delete h.widths;
  if (widths && src.startsWith('http')) h.srcset = String(widths).split(',').map((w) => `${withW(src.replace(/[?&]width=\d+/, ''), w.trim())} ${w.trim()}w`).join(', ');
  if (!('width' in h)) { h.width = 800; h.height = 1200; }
  return `<img src="${src}" ${attrs(h)}>`;
});
engine.registerFilter('money', money);
engine.registerFilter('money_with_currency', (c) => money(c) + ' EUR');
engine.registerFilter('money_without_trailing_zeros', (c) => money(c).replace(',00', ''));
engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('preload_tag', (u) => `<link rel="preload" href="${u}" as="font" crossorigin>`);
engine.registerFilter('placeholder_svg_tag', (n, cls) => `<svg class="${cls || ''}" style="background:#ddd"></svg>`);
engine.registerFilter('video_tag', () => '');
engine.registerFilter('default_pagination', () => '');
engine.registerFilter('default_errors', () => '');
engine.registerFilter('format_address', (a) => String(a || ''));
engine.registerFilter('handle', (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
engine.registerFilter('payment_type_svg_tag', () => '');
engine.registerFilter('url_param_escape', (s) => encodeURIComponent(s));
engine.registerFilter('pluralize', (n, a, b) => (n === 1 ? a : b));

class SchemaTag extends Tag { constructor(t, r, l) { super(t, r, l); while (r.length) { const x = r.shift(); if (x.name === 'endschema') break; } } * render() {} }
engine.registerTag('schema', SchemaTag);
const blockTag = (end, open, close, push = () => ({})) => class extends Tag {
  constructor(t, r, l, p) { super(t, r, l); this.tpls = []; this.args = t.args; const s = p.parseStream(r).on(`tag:${end}`, () => s.stop()).on('template', (x) => this.tpls.push(x)).on('end', () => { throw new Error(`${end} missing`); }); s.start(); }
  * render(ctx, em) { em.write(open(this.args)); ctx.push(push(this.args)); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, em); ctx.pop(); em.write(close); }
};
engine.registerTag('style', blockTag('endstyle', () => '<style>', '</style>'));
engine.registerTag('form', blockTag('endform', (a) => {
  const cls = (a.match(/class:\s*'([^']*)'/) || [])[1] || ''; const id = (a.match(/id:\s*'([^']*)'/) || [])[1] || '';
  return a.includes("'product'") ? `<form method="post" action="/cart/add" id="${id}" class="${cls}" data-add-form>` : `<form method="post" action="#" id="${id}" class="${cls}">`;
}, '</form>', () => ({ form: { errors: null, posted_successfully: false } })));
engine.registerTag('paginate', blockTag('endpaginate', () => '', '', () => ({ paginate: { pages: 1, parts: [] } })));

let SCOPE = {};
async function renderSection(sec) {
  const html = await engine.parseAndRender(read(`sections/${sec.type}.liquid`), { ...SCOPE, section: sec });
  return `<div id="shopify-section-${sec.id}" class="shopify-section">${html}</div>`;
}
engine.registerTag('section', class extends Tag { constructor(t, r, l) { super(t, r, l); this.name = t.args.replace(/['"\s]/g, ''); } async render(ctx, em) { em.write(await renderSection(buildSection(this.name, { type: this.name }))); } });

const cart = { item_count: 0, items: [], total_price: 0, items_subtotal_price: 0, requires_shipping: true, currency: { iso_code: 'EUR', symbol: '€' } };
async function page(template, extra = {}) {
  SCOPE = {
    settings, collections, linklists, pages: pageObjs, cart, shop: { name: 'Snoopy Mode', url: 'https://snoopy-mode.nl', email: 'info@snoopy-mode.nl', money_format: '€{{amount_with_comma_separator}}' },
    routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', search_url: '/search', account_url: '/account', all_products_collection_url: '/collections/all' },
    request: { locale: { iso_code: 'nl' }, page_type: template.split('.')[0], path: '/', design_mode: false }, canonical_url: 'https://snoopy-mode.nl/', page_title: 'Snoopy Mode', page_description: '', current_page: 1, template: { name: template.split('.')[0] }, ...extra,
  };
  // Shopify template globals are visible inside render-snippets too.
  for (const k of ['product', 'collection', 'canonical_url', 'page_title', 'page_description', 'current_page', 'current_tags', 'template', 'page', 'page_image']) delete engine.options.globals[k];
  Object.assign(engine.options.globals, { settings, collections, linklists, pages: pageObjs, cart, routes: SCOPE.routes, shop: SCOPE.shop, request: SCOPE.request, product: SCOPE.product, collection: SCOPE.collection, canonical_url: SCOPE.canonical_url, page_title: SCOPE.page_title, page_description: SCOPE.page_description, current_page: SCOPE.current_page, template: SCOPE.template, page: SCOPE.page });
  let body;
  if (fs.existsSync(path.join(THEME, `templates/${template}.json`))) {
    const t = JSON.parse(read(`templates/${template}.json`));
    body = (await Promise.all(t.order.filter((id) => !t.sections[id].disabled).map((id) => renderSection(buildSection(id, t.sections[id]))))).join('');
  } else body = await engine.parseAndRender(read(`templates/${template}.liquid`), SCOPE);
  return engine.parseAndRender(read('layout/theme.liquid'), { ...SCOPE, content_for_layout: body, content_for_header: '' });
}

const BANNER = `<div style="position:fixed;left:12px;bottom:12px;z-index:9999;background:#1C1A17;color:#fff;font:500 12px/1.3 system-ui;padding:8px 12px;pointer-events:none">Preview. Winkelmand en afrekenen werken pas in Shopify.</div><script>document.addEventListener('submit',e=>{if(e.target.closest('[data-add-form]')){e.preventDefault();e.stopImmediatePropagation();alert('Preview: toevoegen aan winkelmand werkt pas in Shopify.')}},true)</script>`;
// GitHub Pages serves from /<repo>/: prefix root-relative links and assets.
const rebase = (html) => (BASE === '/' ? html : html.replace(/(href|src|srcset|action|poster)="\/(?!\/)/g, `$1="${BASE}`).replace(/url\(\/assets\//g, `url(${BASE}assets/`));
const routes = {
  '': () => page('index'),
  'cart': () => page('cart'),
  'search': () => page('search', { search: { performed: false, results: [], results_count: 0, terms: '' } }),
  'collections': () => page('list-collections'),
  'pages/over-ons': () => page('page.over-ons', { page: pageObjs['over-ons'] }),
  'pages/contact': () => page('page.contact', { page: pageObjs.contact }),
  'pages/verzending-retour': () => page('page.levering', { page: pageObjs['verzending-retour'] }),
  'pages/maattabel': () => page('page.maattabel', { page: pageObjs.maattabel }),
  'pages/veelgestelde-vragen': () => page('page.vragen', { page: pageObjs['veelgestelde-vragen'] }),
  ...Object.fromEntries(products.slice(0, 40).map((p) => [`products/${p.handle}`, () => page('product', { product: p, page_title: p.title, canonical_url: `https://snoopy-mode.nl/products/${p.handle}` })])),
  ...Object.fromEntries(Object.values(collections).map((c) => [`collections/${c.handle}`, () => page(c.handle === 'sale' ? 'collection.sale' : 'collection', { collection: c, page_title: c.title, canonical_url: `https://snoopy-mode.nl/collections/${c.handle}` })])),
};
const only = process.argv[3];
if (!only && fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
let n = 0;
for (const [route, render] of Object.entries(routes)) {
  if (only && !route.startsWith(only)) continue;
  try {
    const dir = path.join(OUT, route); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), rebase((await render()).replace('</body>', BANNER + '</body>'))); n++;
  } catch (e) { console.error(`FAIL ${route}: ${e.message.split('\n')[0]}`); }
}
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.cpSync(path.join(THEME, 'assets'), path.join(OUT, 'assets'), { recursive: true });
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.copyFileSync(path.join(OUT, 'index.html'), path.join(OUT, '404.html'));
console.log(`built ${n} pages -> ${OUT} (base ${BASE})`);
