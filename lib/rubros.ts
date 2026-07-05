// Rubros de negocio: al elegir uno se generan textos y valores por defecto.
// Todo queda editable después.

export type Feature = { icon: string; title: string; text: string };

export type Rubro = {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  hero_subtitle: string;
  about_text: string;
  features: Feature[];
};

export const RUBROS: Rubro[] = [
  {
    key: "restaurante",
    name: "Restaurante / Rotisería",
    emoji: "🍽️",
    tagline: "Cocina de barrio, sabor de siempre",
    hero_subtitle: "Pedí online en 2 minutos. Retiro o delivery, pago en línea o al recibir.",
    about_text: "Somos un negocio familiar con años cocinando para el barrio. Ingredientes frescos, recetas caseras y la misma dedicación de siempre, ahora también online.",
    features: [
      { icon: "🥬", title: "Ingredientes frescos", text: "Compramos cada día para asegurar calidad." },
      { icon: "❤️", title: "Recetas caseras", text: "El mismo sabor de siempre, hecho con dedicación." },
      { icon: "⏱️", title: "Rápido y confiable", text: "Tu pedido listo en tiempo y forma." },
    ],
  },
  {
    key: "cafeteria",
    name: "Cafetería / Panadería",
    emoji: "☕",
    tagline: "El mejor café para empezar el día",
    hero_subtitle: "Pedí tu café, medialunas y pastelería. Retiro en el local o delivery.",
    about_text: "Un espacio pensado para disfrutar. Café de especialidad, pastelería artesanal y la mejor atención, ahora a un clic de distancia.",
    features: [
      { icon: "☕", title: "Café de especialidad", text: "Grano seleccionado y recién molido." },
      { icon: "🥐", title: "Pastelería artesanal", text: "Horneado del día, todos los días." },
      { icon: "🪑", title: "Ambiente cálido", text: "El lugar ideal para tu pausa." },
    ],
  },
  {
    key: "farmacia",
    name: "Farmacia / Perfumería",
    emoji: "💊",
    tagline: "Tu salud y bienestar, más cerca",
    hero_subtitle: "Medicamentos, dermocosmética y cuidado personal. Pedí online y retirá o recibí en casa.",
    about_text: "Atención profesional y productos de confianza. Estamos para cuidarte a vos y a tu familia, con asesoramiento y entrega rápida.",
    features: [
      { icon: "👩‍⚕️", title: "Asesoramiento profesional", text: "Farmacéuticos siempre disponibles." },
      { icon: "🚚", title: "Entrega rápida", text: "Recibí tu pedido en el día." },
      { icon: "✅", title: "Productos originales", text: "Calidad y trazabilidad garantizadas." },
    ],
  },
  {
    key: "ropa",
    name: "Indumentaria / Moda",
    emoji: "👕",
    tagline: "Tu estilo, a un clic",
    hero_subtitle: "Descubrí nuestra colección. Comprá online, pagá seguro y recibí en tu casa.",
    about_text: "Marcamos tendencia con prendas de calidad y diseño. Elegí tu estilo y renová tu guardarropa con envíos a todo el país.",
    features: [
      { icon: "✨", title: "Prendas de calidad", text: "Materiales y confección premium." },
      { icon: "📦", title: "Cambios fáciles", text: "Si no te queda, lo cambiamos." },
      { icon: "🚚", title: "Envíos a todo el país", text: "Recibí donde estés." },
    ],
  },
  {
    key: "ferreteria",
    name: "Ferretería / Corralón",
    emoji: "🔧",
    tagline: "Todo para tu obra y tu hogar",
    hero_subtitle: "Herramientas, materiales y más. Pedí online y coordiná retiro o entrega.",
    about_text: "Todo lo que necesitás en un solo lugar. Amplio stock, marcas líderes y atención que te asesora para que compres bien.",
    features: [
      { icon: "🧰", title: "Amplio stock", text: "Miles de productos disponibles." },
      { icon: "🏷️", title: "Mejores precios", text: "Ofertas y precios mayoristas." },
      { icon: "🤝", title: "Atención experta", text: "Te asesoramos en tu proyecto." },
    ],
  },
  {
    key: "kiosco",
    name: "Kiosco / Almacén / Dietética",
    emoji: "🛒",
    tagline: "Tu almacén de confianza, online",
    hero_subtitle: "Hacé las compras sin moverte. Pedí y recibí en casa o retirá cuando quieras.",
    about_text: "El almacén del barrio, ahora online. Productos frescos y de despensa, atención cercana y entrega rápida.",
    features: [
      { icon: "🧺", title: "Todo en un lugar", text: "Despensa, bebidas y más." },
      { icon: "🚚", title: "Delivery en el barrio", text: "Rápido y sin vueltas." },
      { icon: "😊", title: "Atención cercana", text: "Te conocemos por tu nombre." },
    ],
  },
  {
    key: "otro",
    name: "Otro rubro",
    emoji: "🏪",
    tagline: "Tu negocio, ahora online",
    hero_subtitle: "Mirá nuestros productos y hacé tu pedido en minutos.",
    about_text: "Contanos quiénes son y por qué elegirte. Este texto lo podés editar desde el panel de administración.",
    features: [
      { icon: "⭐", title: "Calidad garantizada", text: "Productos y servicio de primera." },
      { icon: "🚚", title: "Entrega rápida", text: "Recibí tu pedido sin demoras." },
      { icon: "🤝", title: "Atención personalizada", text: "Estamos para ayudarte." },
    ],
  },
];

export const DEFAULT_FEATURES: Feature[] = RUBROS[0].features;

export function parseFeatures(raw: string | undefined): Feature[] {
  if (!raw) return DEFAULT_FEATURES;
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length) return arr.slice(0, 3);
  } catch {}
  return DEFAULT_FEATURES;
}
