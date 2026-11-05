# -*- coding: utf-8 -*-
"""Genera el catálogo maestro de 'Zapatos por encargo' de Dominus y el
archivo de datos que consume la página (outlet-products.js).
Fuente: ~/workspace/shopping-margin/merged-draft.json (+ parches de galerías).
Precio visible = precio del producto: tienda + $10 + envío de la tienda.
El envío a Nicaragua NO va en el precio: se suma cuando el cliente paga
($5/libra, marítimo, incluye entrega a domicilio)."""
import json, re, unicodedata, os

BASE = os.path.expanduser('~/workspace')
DRAFT = os.path.join(BASE, 'shopping-margin/merged-draft.json')
PATCHES = os.path.join(BASE, 'shopping-margin/gallery-patches.json')
MASTER = os.path.join(BASE, 'marketplace/zapatos-catalogo.json')
OUTJS = os.path.join(BASE, 'marketplace/outlet-products.js')
TC = 36.774
ENVIO_STD_PAR = 15.0   # Envio Standard por par (Sergio, 28-oct): flete USA->NI + entrega nacional, 25 dias habiles
ENVIO_PRIO_PAR = 25.0  # Envio Prioritario por par (Sergio, 28-oct): flete USA->NI + entrega nacional, 10 dias habiles
ENVIO_USA = 4.99       # Envio a Estados Unidos POR PAR (Sergio, 28-oct): se cobra por cada par al elegir direccion de EE. UU.

# Descripciones por familia de modelo (redacción propia, sin comparaciones).
FAMILIAS = [
 (r'campus 00s', "El Campus 00s reinterpreta el clásico Campus de los 80 con la estética ancha de los 2000: parte superior de gamuza suave, lengüeta y cuello acolchados, las 3 franjas en contraste y suela cupsole de goma. Un favorito del streetwear que combina con todo.",
  ["Parte superior de gamuza", "Lengüeta y cuello acolchados", "Suela cupsole de goma", "Silueta ancha estilo 2000"]),
 (r'samba', "El Samba nació en las canchas de fútbol sala de los 50 y hoy es un ícono de la calle: perfil bajo de cuero suave, puntera reforzada en forma de T, las 3 franjas clásicas y suela de goma natural. Ligero, limpio y fácil de combinar.",
  ["Parte superior de cuero suave", "Puntera reforzada en T", "Suela de goma natural (gum)", "Perfil bajo clásico"]),
 (r'ultraboost', "El Ultraboost 5X es el tope de comodidad de adidas para correr y caminar todo el día: mediasuela Boost que devuelve energía en cada paso y parte superior de tejido elástico que se ajusta como un calcetín.",
  ["Mediasuela Boost de retorno de energía", "Tejido elástico tipo Primeknit", "Suela de goma Continental", "Pensado para running y uso diario"]),
 (r'grand court alpha', "El Grand Court Alpha mezcla el estilo de cancha de los 70 con un aire moderno: parte superior sintética con capas, suela cupsole y plantilla acolchada para usarlo todo el día.",
  ["Estilo retro de cancha", "Plantilla acolchada", "Suela cupsole de goma", "Parte superior sintética con capas"]),
 (r'grand court|vl court', "Línea de cancha de perfil bajo y acabado limpio: parte superior suave con las 3 franjas, suela cupsole y plantilla acolchada. El básico elegante de adidas que resuelve cualquier outfit, del jean al pantalón de vestir.",
  ["Perfil bajo estilo tenis clásico", "Las 3 franjas laterales", "Plantilla acolchada", "Suela cupsole de goma"]),
 (r'samoa', "El Samoa es un clásico de entrenamiento de los 80 con parte superior de cuero, puntera reforzada y suela de goma con el patrón original. Sobrio, resistente y con mucha historia.",
  ["Parte superior de cuero", "Puntera reforzada", "Suela de goma clásica", "Diseño retro de los 80"]),
 (r'sl 72', "El SL 72 OG nació para las Olimpiadas del 72 como un tenis de running ultraligero. Hoy conserva su mezcla de nylon y gamuza, su perfil fino y su suela con tacos, en clave retro total.",
  ["Nylon con detalles de gamuza", "Perfil fino y ligero", "Suela retro con tacos", "Original de 1972"]),
 (r'run 84|run84', "El Run 84 toma el running de los 80 y lo deja listo para la calle: malla con capas de gamuza, mediasuela acolchada y una silueta retro que se ve bien con todo.",
  ["Malla con capas de gamuza", "Estética runner de los 80", "Mediasuela acolchada", "Suela de goma con tracción"]),
 (r'kaptir', "El Kaptir 4.0 es un tenis urbano de tejido técnico con mediasuela acolchada pensada para caminar todo el día. Calce tipo calcetín y look deportivo limpio.",
  ["Tejido técnico tipo calcetín", "Mediasuela acolchada", "Estilo urbano deportivo", "Suela de goma"]),
 (r'daily 4', "El Daily 4.0 es el tenis de diario de adidas: parte superior de lona y sintético, mediasuela ligera y un diseño sencillo que combina con todo el clóset.",
  ["Parte superior de lona/sintético", "Mediasuela ligera", "Diseño versátil de diario", "Suela de goma"]),
 (r'lite racer', "El Lite Racer 4.0 es un runner ligero de malla con mediasuela Cloudfoam suave: entra y sale fácil, calza cómodo y sirve igual para caminar, entrenar suave o el día a día.",
  ["Malla ligera y fresca", "Mediasuela Cloudfoam", "Calce cómodo tipo slip-on", "Suela de goma"]),
 (r'swift run', "El Swift Run 1.0 es un runner de tejido elástico con mediasuela EVA: calce ajustado tipo calcetín, muy ligero y con un look deportivo que funciona a diario.",
  ["Tejido elástico tipo calcetín", "Mediasuela EVA ligera", "Estilo runner moderno", "Suela de goma"]),
 (r'x_plr|x plr', "El X_PLR Path combina malla y capas sintéticas en una silueta runner moderna, con mediasuela acolchada y cordones elásticos de ajuste rápido.",
  ["Malla con capas sintéticas", "Cordones elásticos", "Mediasuela acolchada", "Estilo runner urbano"]),
 (r'550', "El 550 es el clásico de básquetbol de 1989 que volvió como favorito del streetwear: cuero liso de caña baja, suela de goma con tracción y un calce estructurado que se ve limpio con jeans, shorts o joggers.",
  ["Parte superior de cuero", "Caña baja, diseño de 1989", "Suela de goma con tracción", "Estilo retro de cancha"]),
 (r'740', "El 740 rescata el espíritu runner de los 90: malla técnica con capas, mediasuela ABZORB que absorbe el impacto y suela segmentada. Ligero y con mucha presencia retro.",
  ["Malla técnica con capas", "Mediasuela ABZORB", "Suela de goma segmentada", "Estética runner de los 90"]),
 (r'530', "El 530 es un runner retro de los 90 con mediasuela ABZORB y una mezcla de malla y sintético que lo hace ligero y muy combinable. De los modelos más buscados de New Balance.",
  ["Estética runner de los 90", "Mediasuela ABZORB", "Malla con capas sintéticas", "Suela de goma"]),
 (r'574', "El 574 es EL clásico de New Balance: gamuza con malla, mediasuela ENCAP y la silueta todoterreno que lleva décadas siendo un básico del clóset.",
  ["Gamuza con malla", "Mediasuela ENCAP", "Silueta clásica todoterreno", "Suela de goma con tracción"]),
 (r'2002r', "El 2002R toma un runner premium de 2010 y lo trae a la calle: gamuza y malla de alta calidad, mediasuela ABZORB con cápsulas N-ergy y un acabado que se siente de otro nivel.",
  ["Gamuza y malla premium", "ABZORB + N-ergy en la mediasuela", "Diseño basado en el 2002 de 2010", "Acabado de alta gama"]),
 (r'abzorb 2000|2000', "El ABZORB 2000 es la propuesta futurista de New Balance: silueta chunky con mediasuela ABZORB de doble densidad y un diseño que mezcla running técnico con streetwear.",
  ["Silueta chunky moderna", "Mediasuela ABZORB", "Diseño técnico futurista", "Suela de goma"]),
 (r'204l', "El 204L mezcla el perfil fino de los runners de los 70 con detalles modernos: caña baja, capas de gamuza y malla, y una suela delgada muy de moda.",
  ["Perfil fino estilo 70s", "Gamuza con malla", "Caña baja", "Suela delgada retro"]),
 (r'1000', "El 1000 vuelve de 1999 con su diseño técnico invertido: capas sintéticas y de malla, mediasuela ABZORB y ese look Y2K que está en todos lados.",
  ["Diseño técnico de 1999", "Mediasuela ABZORB", "Capas de malla y sintético", "Estética Y2K"]),
 (r'408', "El 408 es un runner retro de New Balance con malla y capas sintéticas, mediasuela acolchada y un estilo limpio de los 90 para todos los días.",
  ["Estética runner de los 90", "Malla con capas", "Mediasuela acolchada", "Suela de goma"]),
 (r'997h', "El 997H es la versión ligera y moderna del clásico 997: parte superior de gamuza, malla y sintético, con mediasuela renovada para usarlo todo el día.",
  ["Inspirado en el clásico 997", "Gamuza, malla y sintético", "Mediasuela ligera y cómoda", "Suela de goma"]),
 (r'air force 1', "El Air Force 1 es el tenis más icónico de Nike: cuero con puntera perforada, unidad Air encapsulada, entresuela de espuma y suela de goma con los círculos de pivote del diseño original de 1982.",
  ["Parte superior de cuero", "Unidad Nike Air encapsulada", "Puntera perforada", "Suela de goma con círculos de pivote"]),
 (r'air max intrlk', "El Air Max INTRLK Lite es un Air Max ligero para mujer: parte superior de tejido y sintético, unidad Air visible en el talón y una mediasuela suave para todo el día.",
  ["Unidad Air visible", "Tejido con capas sintéticas", "Mediasuela ligera", "Diseño para mujer"]),
 (r'air max portal', "El Air Max Portal mezcla el ADN Air Max con un diseño moderno y chunky: capas de tejido y sintético, unidad Air en el talón y mucha amortiguación para la calle.",
  ["Unidad Air en el talón", "Silueta moderna y chunky", "Capas de tejido y sintético", "Diseño para mujer"]),
 (r'air max torch', "El Air Max Torch 4 es un clásico de running de Nike: malla transpirable con capas, unidad Max Air en el talón para absorber impactos y suela de goma durable.",
  ["Unidad Max Air en el talón", "Malla transpirable", "Suela de goma durable", "Estilo running clásico"]),
 (r'air max excee', "El Air Max Excee le da un giro moderno al Air Max 90: unidad Air visible, capas de malla y sintético, y una mediasuela de espuma cómoda para diario.",
  ["Unidad Air visible", "Inspirado en el Air Max 90", "Malla con capas sintéticas", "Mediasuela de espuma"]),
 (r'court vision', "El Court Vision Low está inspirado en el básquetbol de los 80: parte superior de cuero sintético con acabado limpio, cuello acolchado y suela cupsole de goma para usar todo el día.",
  ["Estilo básquetbol de los 80", "Cuero sintético durable", "Cuello acolchado", "Suela cupsole de goma"]),
 (r'pacific', "El Nike Pacific es un tenis de perfil bajo y look vintage: parte superior de lona y gamuza, suela de goma estilo retro y un calce relajado para todos los días.",
  ["Estilo vintage de perfil bajo", "Lona con gamuza", "Suela de goma retro", "Calce relajado"]),
 (r'v5 rnr', "El V5 RNR es un runner moderno de Nike con malla técnica, mediasuela de espuma suave y una silueta deportiva pensada para comodidad diaria.",
  ["Malla técnica transpirable", "Mediasuela de espuma", "Silueta runner moderna", "Suela de goma"]),
 (r'old skool', "El Old Skool es el primer Vans con la franja lateral (Sidestripe), de 1977: lona con gamuza, cuello acolchado y la clásica suela waffle de goma. Un ícono del skate que funciona con todo.",
  ["Lona con gamuza", "Franja lateral Sidestripe", "Suela waffle de goma", "Cuello acolchado"]),
 (r'chuck|converse', "El Chuck Taylor All Star en su versión Madison de caña baja: lona clásica, plantilla acolchada y la suela de goma vulcanizada de siempre, en un corte pensado para mujer.",
  ["Lona clásica", "Caña baja ( Ox )", "Plantilla acolchada", "Suela vulcanizada de goma"]),
 (r'crocs', "El Classic Clog de Crocs: la zueco original de resina Croslite, ultraligera, con ventilación lateral y correa trasera ajustable. Comodidad total para la casa, el jardín o la playa.",
  ["Resina Croslite ultraligera", "Ventilación lateral", "Correa trasera ajustable", "Se limpia con agua"]),
 (r"d'lites|dlites", "El D'Lites es el chunky clásico de Skechers: parte superior de cuero y sintético, plantilla Memory Foam y una suela gruesa con mucha amortiguación.",
  ["Silueta chunky retro", "Plantilla Memory Foam", "Parte superior de cuero/sintético", "Suela gruesa acolchada"]),
 (r'summits|slip-ins', "El Summits High Range es un Slip-Ins de Skechers: te lo pones sin manos, con malla técnica, plantilla Memory Foam y suela flexible para caminar todo el día.",
  ["Slip-Ins: sin manos, sin agacharse", "Plantilla Memory Foam", "Malla técnica fresca", "Suela flexible"]),
]
DEFAULT_DESC = ("Modelo original de {marca}, cómodo y versátil para uso diario. Lo compramos por encargo y te lo entregamos en Nicaragua.",
  ["Producto original", "Por encargo: confirmamos tu talla antes de cobrar", "Entrega a domicilio en Nicaragua"])

def descripcion(p):
    n = p['nombre'].lower()
    for pat, desc, feats in FAMILIAS:
        if re.search(pat, n):
            return desc, feats
    d, f = DEFAULT_DESC
    return d.format(marca=p['marca']), f

def tallas(genero):
    g = (genero or '').lower()
    if 'mujer' in g or 'women' in g:
        return [str(x/2) for x in range(10, 23)]  # 5 .. 11
    if 'hombre' in g or 'men' in g:
        return ['7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','13']
    return ['6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','12','13']  # unisex

def _nocrop(u):
    # Amazon _AC_SRw,h_ RECORTA la foto a ese encuadre (las fotos anchas salian
    # cortadas y mas grandes que su cuadro en la ficha); _AC_SX1024_ escala sin recortar.
    return re.sub(r'_AC_SR\d+,\d+_', '_AC_SX1024_', u or '')

def write_outputs(out, verificado=None):
    for p in out:
        if p.get('fotos'): p['fotos'] = [_nocrop(u) for u in p['fotos']]
    master = {'tc': TC, 'envio_ni_lb': None, 'peso_lb': None,
              'envio_std_par': ENVIO_STD_PAR, 'envio_prio_par': ENVIO_PRIO_PAR, 'productos': out}
    json.dump(master, open(MASTER, 'w'), ensure_ascii=False, indent=1)
    header = ("// Zapatos por encargo · Dominus — datos del catalogo.\n"
              "// Generado por build_zapatos.py desde zapatos-catalogo.json. No editar a mano.\n"
              "// Precio mostrado = precio del producto (tienda + $10 + envio de la tienda).\n"
              "// El envio se suma al pagar segun el pais: a Nicaragua por par (Standard $15, 25 dias habiles; Prioritario $25, 10 dias habiles; entrega nacional incluida); a Estados Unidos $4.99 por par.\n")
    pub = []
    for p in out:
        if p.get('oculto'): continue
        d = {k: p[k] for k in ('codigo','marca','nombre','genero','precio','precio_c','fotos','descripcion','detalles','tallas')}
        if p.get('precios_talla'): d['pt'] = p['precios_talla']
        pub.append(d)
    with open(OUTJS, 'w') as f:
        f.write(header)
        f.write(f"var ZAP_TC = {TC};\nvar ZAP_ENVIO_STD = {ENVIO_STD_PAR};\nvar ZAP_ENVIO_PRIO = {ENVIO_PRIO_PAR};\nvar ZAP_ENVIO_USA = {ENVIO_USA};\n")
        f.write("var ZAP_VERIFICADO = \"" + (verificado or "26 de octubre de 2026") + "\";\n")
        f.write("var ZAP_WA = \"15704698339\";\n")
        f.write("var ZAPATOS = " + json.dumps(pub, ensure_ascii=False, indent=1) + ";\n")
    return len(pub)

def from_master():
    master = json.load(open(MASTER))
    n = write_outputs(master['productos'])
    print(f"regenerado desde catalogo maestro: {n} productos publicados")

def main():
    import sys
    if '--from-master' in sys.argv:
        from_master(); return
    draft = json.load(open(DRAFT))
    patches = {}
    if os.path.exists(PATCHES):
        patches = json.load(open(PATCHES))
    for p in draft:
        key = (p['tienda'] + '|' + p['nombre']).lower()
        for pk, gal in patches.items():
            if pk.lower() in key or key in pk.lower():
                if gal: p['imagenes'] = gal
    out, sin_foto = [], []
    for i, p in enumerate(draft, 1):
        if not p['imagenes']:
            sin_foto.append(p['tienda'] + ' | ' + p['nombre'])
            continue
        desc, feats = descripcion(p)
        precio = round(float(p['precio_producto']), 2)
        out.append({
            'codigo': f"DOM-{len(out)+1:03d}",
            'marca': p['marca'], 'nombre': p['nombre'], 'genero': p.get('genero') or '',
            'precio': precio, 'precio_c': int(round(precio * TC)),
            'fotos': p['imagenes'], 'descripcion': desc, 'detalles': feats,
            'tallas': tallas(p.get('genero')),
            'tienda': p['tienda'], 'url_producto': p.get('url_producto') or '',
            'precio_tienda': p['precio_tienda'], 'envio_tienda': p['envio_tienda'],
            'notas': p.get('notas') or '',
        })
    n = write_outputs(out)
    print(f"catalogo: {n} productos con foto | {len(sin_foto)} sin foto (fuera por ahora)")
    for s in sin_foto: print('  SIN FOTO:', s)

if __name__ == '__main__':
    main()
