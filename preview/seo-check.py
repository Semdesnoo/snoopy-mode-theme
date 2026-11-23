"""SEO self-check on the built preview: title/description length, one H1, OG tags, valid JSON-LD per page type.
Usage: python preview/seo-check.py   (after node preview/build.mjs)"""
import json, re, pathlib, sys
site = pathlib.Path(__file__).resolve().parent.parent / '_site'
need = {'': {'ClothingStore', 'WebSite'}, 'products/golden-loose-blazer': {'ClothingStore', 'Product', 'BreadcrumbList'},
        'collections/nieuw-binnen': {'ClothingStore', 'BreadcrumbList'}, 'pages/veelgestelde-vragen': {'ClothingStore', 'FAQPage'}}
fail = 0
for route, types in need.items():
    h = (site / route / 'index.html').read_text(encoding='utf8')
    title = re.search(r'<title>(.*?)</title>', h, re.S).group(1).strip()
    desc = re.search(r'<meta name="description" content="([^"]*)"', h).group(1)
    blocks = [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)]  # raises on invalid JSON
    got = {b['@type'] for b in blocks}
    h1 = len(re.findall(r'<h1[\s>]', h))
    og = all(f'property="og:{k}"' in h for k in ('title', 'description', 'image', 'url'))
    ok = types <= got and h1 == 1 and og and 10 < len(title) <= 65 and 70 <= len(desc) <= 160
    fail += not ok
    print('OK ' if ok else 'BAD', f'/{route}', f'title[{len(title)}]={title!r}', f'desc[{len(desc)}]', 'h1', h1, 'og', og, sorted(got))
    for b in blocks:
        if b['@type'] == 'Product':
            o = b['offers'][0]; print('     offer', o['price'], o['availability'].rsplit('/', 1)[1], 'ship', o['shippingDetails']['shippingRate']['value'], 'variants', len(b['offers']))
        if b['@type'] == 'ClothingStore' and route == '':
            print('     store', b.get('telephone'), b.get('address'), b.get('sameAs'))
        if b['@type'] == 'FAQPage': print('     faq', len(b['mainEntity']), 'vragen;', b['mainEntity'][0]['name'])
sys.exit(fail)
