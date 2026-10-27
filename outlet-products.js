// Catálogo curado "Outlet USA" de Dominus — modelos de outlets de EE. UU.
// que Dominus compra por encargo y entrega en Nicaragua.
// Precios de outlet verificados el 2026-10-26. El stock de outlet cambia a
// diario: cada pedido confirma talla y disponibilidad ANTES de cobrar.
// precio_final = precio puesto en Nicaragua (incluye flete EE. UU. -> Nicaragua).
// TC de referencia: C$36.774 por US$1 (2026-10-26).
// NOTA: algunas fotos vienen de catálogos que caducan en días; refrescar
// este archivo al actualizar modelos/precios.
var OUTLET_TC = 36.774;
var OUTLET_VERIFICADO = "26 de octubre de 2026";
var OUTLET_WA = "15704698339";

var OUTLET_PRODUCTS = [
  {
    "id": "campus-bark",
    "marca": "adidas",
    "nombre": "adidas Campus 00s 'Bark'",
    "detalle": "Originals · unisex",
    "tienda": "Outlet EE. UU.",
    "precio_outlet": 51.0,
    "precio_lista": 110.0,
    "precio_final": 115,
    "ref_ni": "Modelos equivalentes en Nicaragua se venden entre $140 y $152.",
    "img": "https://scontent-atl3-1.xx.fbcdn.net/v/t45.5328-4/320087942_5630525430400268_5472256149883112496_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=657aed&_nc_ohc=xIZaC6XsSwMQ7kNvwGPbmbd&_nc_oc=AdrCVjOP0I-_LRY_tJHzHYdU1w71W4Xo-SPyU6BFg8LPob9p3f2lZXte4zF3nYhFNcY8rVads4_z0MfJbi1VwyXx&_nc_zt=23&_nc_ht=scontent-atl3-1.xx&_nc_gid=h9DcaYto3K_5GA8iyRBE2A&oh=00_AQOMnKerfBzLesPZhIhXZqykIt_3qfBRX8HA8Te_kaeLRQ&oe=6AE5E88D",
    "nota": ""
  },
  {
    "id": "nb550",
    "marca": "New Balance",
    "nombre": "New Balance 550",
    "detalle": "Casual retro · unisex",
    "tienda": "Outlet EE. UU.",
    "precio_outlet": 53.89,
    "precio_lista": 109.99,
    "precio_final": 112,
    "ref_ni": "En la región se vende entre $110 (oferta) y $170 (regular).",
    "img": "https://scontent-atl3-1.xx.fbcdn.net/v/t45.5328-4/468728356_448798377970217_473538114367557863_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=657aed&_nc_ohc=OpHL1v0vXIsQ7kNvwF_wIqZ&_nc_oc=AdqMWG_bL86PaE44TKXFdTSXh6qtgCWL-975gMuZXXHcZ39pkTpyihgGfUCC2wrz1sTjlMLAT5hLGJnUo7auKeLA&_nc_zt=23&_nc_ht=scontent-atl3-1.xx&_nc_gid=h9DcaYto3K_5GA8iyRBE2A&oh=00_AQMmKSK5xSGKW8pMeY0LZawkQAZwmUtVjAPRJe8MLC4RUA&oe=6AE60B21",
    "nota": ""
  },
  {
    "id": "af1-pink-foam",
    "marca": "Nike",
    "nombre": "Nike Air Force 1 Retro Premium (Mujer)",
    "detalle": "Pink Foam · mujer",
    "tienda": "Outlet EE. UU.",
    "precio_outlet": 75.97,
    "precio_lista": 115.0,
    "precio_final": 130,
    "ref_ni": "En Kicks Nicaragua cuesta C$5,596 (~$152).",
    "img": "https://scontent-atl3-1.xx.fbcdn.net/v/t45.5328-4/678858992_1459679485839606_8833756079351074022_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=657aed&_nc_ohc=xstVYa348HsQ7kNvwEKYV2D&_nc_oc=Adp3qkvynq-8acpXoHGMEbe5KLO8d-rEb-yDCkoYBSaHRTjqIZoNWyk4hG5rB-zKYmrksgYUxP-pBmdtMQH0_Hn9&_nc_zt=23&_nc_ht=scontent-atl3-1.xx&_nc_gid=h9DcaYto3K_5GA8iyRBE2A&oh=00_AQOJqtZSZAwdMhQM9r8vCK3GO8__QIAV4fI7S6tiS4VlnA&oe=6AE60737",
    "nota": "Color Pink Foam: pide la foto real por WhatsApp antes de pagar."
  },
  {
    "id": "nb740-joes",
    "marca": "New Balance",
    "nombre": "New Balance 740 Mint Flash",
    "detalle": "Running retro · unisex",
    "tienda": "Joe's New Balance Outlet",
    "precio_outlet": 69.99,
    "precio_lista": 114.99,
    "precio_final": 118,
    "ref_ni": "Modelos New Balance similares en Siman Nicaragua: hasta C$5,099 (~$139).",
    "img": "https://nb.scene7.com/is/image/NB/u740yc2_nb_02_i?$pdpflexf2$&wid=440&hei=440",
    "nota": ""
  },
  {
    "id": "samba-rack",
    "marca": "adidas",
    "nombre": "adidas Samba OG (Mujer)",
    "detalle": "Dbrown · mujer",
    "tienda": "Nordstrom Rack",
    "precio_outlet": 49.97,
    "precio_lista": 110.0,
    "precio_final": 95,
    "ref_ni": "En Kicks Nicaragua: regular C$5,226 (~$142).",
    "img": "https://n.nordstrommedia.com/it/35530d7a-059b-46e4-8e76-80367167b8e0.jpeg?w=780&h=1170&crop=pad&trim=color",
    "nota": "Tallas vistas al verificar: 5.5 y 7 US. Se confirma al pedir."
  },
  {
    "id": "court-vision",
    "marca": "Nike",
    "nombre": "Nike Court Vision Low",
    "detalle": "Casual · hombre",
    "tienda": "Outlet EE. UU.",
    "precio_outlet": 55.25,
    "precio_lista": 90.0,
    "precio_final": 98,
    "ref_ni": "En Siman Nicaragua cuesta entre C$3,749 y C$4,499 (~$102–122).",
    "img": "https://scontent-atl3-1.xx.fbcdn.net/v/t45.5328-4/638798811_1402362548327663_3371461074308924346_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=657aed&_nc_ohc=k0MUFbFIGgEQ7kNvwHtcyPo&_nc_oc=AdrZzzY6FfzTtBNADnDf6iC5l0mGEGy-GL-3mdcbjyXHR5BwAovYF13zfgmh1IEYcqDsm1R2ANyGUUpph58wDW5s&_nc_zt=23&_nc_ht=scontent-atl3-1.xx&_nc_gid=h9DcaYto3K_5GA8iyRBE2A&oh=00_AQNklQIPHXT5wOiYPGQ-vxLrOkmpQ5XgZYihzzDxEHRzYg&oe=6AE608CC",
    "nota": ""
  },
  {
    "id": "grand-court",
    "marca": "adidas",
    "nombre": "adidas Grand Court 3.0",
    "detalle": "Casual · unisex",
    "tienda": "Outlet EE. UU.",
    "precio_outlet": 42.0,
    "precio_lista": 70.0,
    "precio_final": 82,
    "ref_ni": "Modelos adidas casuales similares en Siman Nicaragua: hasta C$3,749 (~$102).",
    "img": "https://scontent-atl3-2.xx.fbcdn.net/v/t45.5328-4/825270700_1427878102614615_7893049718380743598_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=657aed&_nc_ohc=MTHWxw_q3B0Q7kNvwGrJgLq&_nc_oc=Adru-DFwMyA6GQMu-KcAKdB_LU9KryWRQNou8uUpD9WJ3e4PLDmdlc5Wbg3khYuNIPpDOD2F7h0sGgeGOFsTk1kF&_nc_zt=23&_nc_ht=scontent-atl3-2.xx&_nc_gid=h9DcaYto3K_5GA8iyRBE2A&oh=00_AQOL0JuFN7JHCqGEbLGlu7Hysh5ZOymYxpUPw8KkubO1bA&oe=6AE5E5BB",
    "nota": ""
  },
  {
    "id": "vans-oldskool",
    "marca": "Vans",
    "nombre": "Vans Old Skool Pink Dawn",
    "detalle": "Clásico skate · unisex",
    "tienda": "Nordstrom Rack",
    "precio_outlet": 34.97,
    "precio_lista": 70.0,
    "precio_final": 88,
    "ref_ni": "",
    "img": "https://n.nordstrommedia.com/it/31660e19-0f28-4b0a-84ed-3d59cc32a4eb.jpeg?w=780&h=1170&crop=pad&trim=color",
    "nota": "Color Pink Dawn. Tallas vistas: de W 5 / M 3.5 a W 10 / M 8.5 US."
  }
];
