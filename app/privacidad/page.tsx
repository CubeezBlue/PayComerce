import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Política de Privacidad — PayComerce",
  description: "Cómo PayComerce trata los datos personales.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad" updated="6 de julio de 2026">
      <p>
        En <strong>PayComerce</strong> respetamos tu privacidad. Esta Política explica qué datos personales
        recopilamos, con qué finalidad y cuáles son tus derechos, de acuerdo con la Ley 25.326 de Protección de
        Datos Personales de la República Argentina y su normativa complementaria.
      </p>

      <Section n={1} title="Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos es PayComerce. Podés contactarnos por cualquier cuestión de
          privacidad en{" "}
          <a href="mailto:hola@paycomerce.com" className="text-[var(--pc)] hover:underline">hola@paycomerce.com</a>.
        </p>
      </Section>

      <Section n={2} title="Qué datos recopilamos">
        <p><strong>Del Comercio (nuestro cliente):</strong> nombre del negocio, datos de contacto (email, teléfono/WhatsApp),
          contraseña (almacenada de forma cifrada), datos de configuración de la tienda y, si contrata integraciones,
          las credenciales necesarias para conectarlas.</p>
        <p><strong>De los clientes finales del Comercio:</strong> los datos que ingresan al hacer un pedido (nombre,
          teléfono, dirección de entrega y detalle del pedido). Estos datos se tratan por cuenta y orden del Comercio,
          que es su responsable principal.</p>
        <p><strong>Datos técnicos:</strong> información de uso y navegación necesaria para el funcionamiento y la
          seguridad del Servicio.</p>
      </Section>

      <Section n={3} title="Finalidad del tratamiento">
        <ul className="ml-5 list-disc space-y-1">
          <li>prestar y mantener el Servicio (crear y operar la tienda, procesar pedidos);</li>
          <li>gestionar el cobro de los planes e integraciones;</li>
          <li>brindar soporte y comunicar novedades relevantes del Servicio;</li>
          <li>garantizar la seguridad y prevenir usos indebidos.</li>
        </ul>
      </Section>

      <Section n={4} title="Con quién compartimos datos">
        <p>
          No vendemos datos personales. Solo los compartimos con proveedores que nos ayudan a prestar el Servicio,
          en la medida necesaria: el proveedor de infraestructura/hosting, y —cuando el Comercio las activa— las
          integraciones de <strong>Mercado Pago</strong> (cobros), <strong>ARCA/AFIP</strong> (facturación) y servicios
          de mapas para autocompletar direcciones. Cada uno trata los datos según sus propias políticas.
        </p>
      </Section>

      <Section n={5} title="Conservación de los datos">
        <p>
          Conservamos los datos mientras la cuenta esté activa y durante el plazo necesario para cumplir obligaciones
          legales. Ante la baja de la cuenta, los datos se eliminan o anonimizan en un plazo razonable, salvo que la
          ley exija conservarlos.
        </p>
      </Section>

      <Section n={6} title="Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger los datos, incluyendo el cifrado de las
          contraseñas y el aislamiento de la información de cada Comercio. Ningún sistema es 100% infalible, pero
          trabajamos para minimizar los riesgos.
        </p>
      </Section>

      <Section n={7} title="Datos de los clientes finales">
        <p>
          Respecto de los datos de los clientes finales que compran en una tienda, el <strong>Comercio</strong> es el
          responsable del tratamiento y debe informar y respetar los derechos de esas personas. PayComerce actúa como
          encargado del tratamiento, procesando esos datos únicamente para prestar el Servicio.
        </p>
      </Section>

      <Section n={8} title="Tus derechos">
        <p>
          Podés ejercer los derechos de acceso, rectificación, actualización y supresión de tus datos personales
          escribiéndonos a{" "}
          <a href="mailto:hola@paycomerce.com" className="text-[var(--pc)] hover:underline">hola@paycomerce.com</a>.
          La <strong>AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA</strong>, órgano de control de la Ley 25.326, tiene la
          atribución de atender denuncias y reclamos relacionados con el incumplimiento de la normativa de protección
          de datos personales.
        </p>
      </Section>

      <Section n={9} title="Cookies">
        <p>
          Utilizamos cookies y almacenamiento local estrictamente necesarios para el funcionamiento del Servicio
          (por ejemplo, mantener tu sesión iniciada y recordar la tienda y el carrito). No usamos cookies con fines
          publicitarios de terceros.
        </p>
      </Section>

      <Section n={10} title="Menores de edad">
        <p>
          El Servicio está dirigido a personas mayores de edad que operan un comercio. No recopilamos de forma
          intencional datos de menores.
        </p>
      </Section>

      <Section n={11} title="Cambios en esta Política">
        <p>
          Podemos actualizar esta Política. Publicaremos la versión vigente en esta página e informaremos los cambios
          relevantes.
        </p>
      </Section>

      <p className="rounded-xl bg-neutral-50 p-4 text-xs text-neutral-400 ring-1 ring-black/5">
        Este documento es un modelo general y no constituye asesoramiento legal. Se recomienda su revisión por un
        profesional del derecho antes del lanzamiento comercial.
      </p>
    </LegalPage>
  );
}
