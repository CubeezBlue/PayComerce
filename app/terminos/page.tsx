import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Términos y Condiciones — PayComerce",
  description: "Condiciones de servicio de PayComerce.",
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y Condiciones" updated="6 de julio de 2026">
      <p>
        Estos Términos y Condiciones (los “Términos”) regulan el acceso y uso de la plataforma
        <strong> PayComerce</strong> (el “Servicio”), disponible en paycomerce.com. Al crear una cuenta o
        utilizar el Servicio, la persona o empresa que lo contrata (el “Comercio” o “Usuario”) declara
        haber leído, entendido y aceptado estos Términos. Si no está de acuerdo, debe abstenerse de usar el Servicio.
      </p>

      <Section n={1} title="Definiciones">
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>PayComerce:</strong> la plataforma y el software que provee el Servicio.</li>
          <li><strong>Comercio / Usuario:</strong> la persona humana o jurídica que contrata el Servicio para crear y operar su tienda.</li>
          <li><strong>Cliente final:</strong> la persona que compra o hace pedidos en la tienda de un Comercio.</li>
          <li><strong>Tienda:</strong> el catálogo online del Comercio alojado en PayComerce.</li>
          <li><strong>Integraciones:</strong> servicios de terceros que el Comercio puede conectar (ej. Mercado Pago, ARCA/AFIP).</li>
        </ul>
      </Section>

      <Section n={2} title="Objeto del Servicio">
        <p>
          PayComerce es una plataforma que permite a comercios crear una tienda online, recibir pedidos por
          WhatsApp, gestionar productos, precios, stock y sucursales, y opcionalmente cobrar en línea y emitir
          facturas mediante integraciones de terceros. PayComerce provee el software; el Comercio es el único
          responsable de los productos, precios, contenidos y ventas que realiza a través de su tienda.
        </p>
      </Section>

      <Section n={3} title="Capacidad">
        <p>
          Para usar el Servicio, el Usuario debe ser mayor de 18 años y contar con capacidad legal para contratar
          conforme a la legislación aplicable. No podrán registrarse quienes estén suspendidos o inhabilitados
          comercial o legalmente. La información brindada tiene carácter de declaración jurada.
        </p>
      </Section>

      <Section n={4} title="Registro y cuenta">
        <p>
          Para usar el Servicio, el Comercio debe crear una cuenta con datos veraces y actuales, un email válido y una
          contraseña de administración. El Comercio es responsable de mantener la confidencialidad de su contraseña y de
          toda la actividad realizada desde su cuenta, que es personal e intransferible. Debe notificarnos ante cualquier
          uso no autorizado.
        </p>
      </Section>

      <Section n={5} title="Planes, precios y pagos">
        <p>
          El Servicio se ofrece bajo planes mensuales y funciones adicionales (integraciones) que pueden contratarse por
          separado. Los precios se informan en paycomerce.com/precios y pueden actualizarse (por ejemplo, por inflación);
          los cambios se comunicarán con antelación razonable. El Servicio se presta de forma continua mientras esté
          abonado; la falta de pago puede derivar en la suspensión o baja de la cuenta al finalizar el período en curso.
        </p>
      </Section>

      <Section n={6} title="Integraciones de terceros">
        <p>
          El Servicio permite conectar servicios de terceros, como <strong>Mercado Pago</strong> (cobros en línea) y
          <strong> ARCA/AFIP</strong> (facturación electrónica), utilizando las credenciales propias del Comercio.
          El Comercio es responsable de contratar y configurar dichos servicios y de cumplir sus términos.
          PayComerce actúa como intermediario técnico y <strong>no</strong> es responsable por los cobros,
          acreditaciones, comisiones, retenciones, facturación ni por el funcionamiento de esos servicios de terceros.
        </p>
      </Section>

      <Section n={7} title="Uso permitido">
        <p>El Comercio se compromete a no utilizar el Servicio para:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>comercializar productos o servicios ilegales o prohibidos por la normativa vigente;</li>
          <li>infringir derechos de terceros (marcas, propiedad intelectual, imagen, etc.);</li>
          <li>publicar contenido falso, engañoso, ofensivo o que induzca a error a los consumidores;</li>
          <li>vulnerar la seguridad de la plataforma, interferir en su funcionamiento o distribuir software malicioso.</li>
        </ul>
        <p>El incumplimiento puede derivar en la suspensión o baja inmediata de la cuenta.</p>
      </Section>

      <Section n={8} title="Contenido y responsabilidad del Comercio">
        <p>
          El Comercio es el único responsable de la información publicada en su tienda: descripciones, precios,
          stock, imágenes, condiciones de venta y de la relación con sus clientes finales. En particular, el
          Comercio es responsable de:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>la calidad, estado y aptitud de los productos que vende, incluyendo las normas <strong>bromatológicas</strong> y de habilitación que correspondan a su actividad;</li>
          <li>emitir las <strong>facturas</strong> a sus clientes y cumplir sus obligaciones <strong>impositivas</strong>;</li>
          <li>cumplir con la normativa de <strong>Defensa del Consumidor</strong> (Ley 24.240) y demás normas aplicables;</li>
          <li>la preparación, los tiempos y la <strong>entrega</strong> de los pedidos.</li>
        </ul>
      </Section>

      <Section n={9} title="Pedidos, entregas y rol de PayComerce">
        <p>
          PayComerce es un <strong>proveedor de tecnología</strong>: facilita el software para que el Comercio reciba y
          gestione pedidos. PayComerce <strong>no vende</strong> los productos, <strong>no participa</strong> en la
          operación de venta ni en la entrega, no fija precios ni interviene en las condiciones de compraventa. Por lo tanto:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>no garantiza la entrega de los pedidos;</li>
          <li>no es responsable por demoras, errores o incumplimientos del Comercio;</li>
          <li>no responde por la existencia, calidad, cantidad, disponibilidad ni legitimidad de los productos.</li>
        </ul>
        <p>Cualquier reclamo por un pedido debe dirigirse al Comercio, que es quien realiza la venta.</p>
      </Section>

      <Section n={10} title="Garantías">
        <p>
          El Servicio se provee “tal cual” y “según disponibilidad”. PayComerce no garantiza que el Servicio sea apto para
          un fin específico del Comercio, ni la veracidad de los datos que los Usuarios cargan, ni el resultado comercial
          del uso de la plataforma. El Comercio utiliza el Servicio bajo su propia responsabilidad y riesgo.
        </p>
      </Section>

      <Section n={11} title="Disponibilidad del Servicio">
        <p>
          Trabajamos para mantener el Servicio disponible de forma continua, pero no garantizamos que sea
          ininterrumpido o libre de errores. Podremos realizar tareas de mantenimiento, actualizaciones o mejoras
          que afecten temporalmente la disponibilidad.
        </p>
      </Section>

      <Section n={12} title="Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la ley, PayComerce no será responsable por daños indirectos, lucro
          cesante, pérdida de datos o de ventas derivados del uso o imposibilidad de uso del Servicio o de las
          integraciones de terceros. La responsabilidad total de PayComerce se limitará al importe abonado por el
          Comercio en los últimos tres (3) meses.
        </p>
      </Section>

      <Section n={13} title="Indemnidad">
        <p>
          El Comercio se obliga a mantener indemne a PayComerce, sus socios, administradores y empleados, frente a
          cualquier reclamo, demanda, sanción, daño o gasto (incluidos honorarios legales) que un cliente final, un tercero
          o una autoridad inicie como consecuencia de los productos o servicios que el Comercio ofrece, del uso indebido de
          la plataforma o del incumplimiento de estos Términos o de la normativa aplicable.
        </p>
      </Section>

      <Section n={14} title="Baja y cancelación">
        <p>
          El Comercio puede dar de baja su cuenta en cualquier momento, sin costo. PayComerce puede suspender o cancelar
          cuentas que incumplan estos Términos, mediante advertencia, suspensión temporal o cancelación definitiva. Ante la
          baja, el Comercio puede solicitar la exportación de su información antes de la eliminación definitiva de los datos.
        </p>
      </Section>

      <Section n={15} title="Propiedad intelectual">
        <p>
          El software, la marca y los contenidos de la plataforma PayComerce son de su titularidad. Queda prohibido su uso,
          adaptación o reproducción no autorizada. El Comercio conserva la titularidad sobre los contenidos que carga en su
          tienda y otorga a PayComerce una licencia limitada para alojarlos y mostrarlos con el fin de prestar el Servicio.
        </p>
      </Section>

      <Section n={16} title="Cesión">
        <p>
          El Comercio no puede ceder ni transferir su cuenta, ni los derechos u obligaciones de estos Términos, sin la
          autorización previa y por escrito de PayComerce.
        </p>
      </Section>

      <Section n={17} title="Independencia de las partes">
        <p>
          La aceptación de estos Términos no crea entre las partes ninguna sociedad, mandato, agencia, franquicia ni
          relación laboral. El único vínculo es la prestación de un servicio de software.
        </p>
      </Section>

      <Section n={18} title="Tolerancia">
        <p>
          La eventual tolerancia de PayComerce frente a un incumplimiento no implica conformidad, ni renuncia a exigir el
          cumplimiento de estos Términos en el futuro.
        </p>
      </Section>

      <Section n={19} title="Modificaciones">
        <p>
          Podemos actualizar estos Términos. Publicaremos la versión vigente en esta página e informaremos los cambios
          relevantes. El uso continuado del Servicio implica la aceptación de la versión actualizada.
        </p>
      </Section>

      <Section n={20} title="Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, las partes se
          someten a los tribunales ordinarios competentes, sin perjuicio de los derechos que la normativa de defensa
          del consumidor reconozca al Usuario.
        </p>
      </Section>

      <Section n={21} title="Contacto">
        <p>
          Ante cualquier consulta sobre estos Términos, escribinos a{" "}
          <a href="mailto:hola@paycomerce.com" className="text-[var(--pc)] hover:underline">hola@paycomerce.com</a>.
        </p>
      </Section>

      <p className="rounded-xl bg-neutral-50 p-4 text-xs text-neutral-400 ring-1 ring-black/5">
        Este documento es un modelo general y no constituye asesoramiento legal. Se recomienda su revisión por un
        profesional del derecho antes del lanzamiento comercial.
      </p>
    </LegalPage>
  );
}
