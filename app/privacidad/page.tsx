import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Política de Privacidad — PayComerce",
  description: "Cómo PayComerce trata los datos personales.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad" updated="7 de julio de 2026">
      <p>
        En <strong>PayComerce</strong> asumimos un compromiso de respeto y protección de la privacidad de quienes utilizan
        nuestra plataforma. Esta Política de Privacidad (la “Política”) describe qué datos personales tratamos, con qué
        finalidad, con qué fundamento, con quién los compartimos y cuáles son tus derechos, conforme a la
        <strong> Ley 25.326 de Protección de Datos Personales</strong>, su decreto reglamentario y demás normativa aplicable
        de la República Argentina.
      </p>

      <Section n={1} title="Responsable del tratamiento">
        <p>
          El responsable del tratamiento de los datos recogidos a través de la plataforma es PayComerce. Para cualquier
          cuestión vinculada a la privacidad o al ejercicio de tus derechos, podés contactarnos en{" "}
          <a href="mailto:hola@paycomerce.com" className="text-[var(--pc)] hover:underline">hola@paycomerce.com</a>.
        </p>
      </Section>

      <Section n={2} title="Definiciones">
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Datos personales:</strong> información de cualquier tipo referida a personas humanas o jurídicas determinadas o determinables.</li>
          <li><strong>Titular de los datos:</strong> la persona a la que se refieren los datos.</li>
          <li><strong>Comercio / Usuario:</strong> el cliente de PayComerce que opera una tienda.</li>
          <li><strong>Cliente final:</strong> la persona que compra o hace pedidos en la tienda de un Comercio.</li>
          <li><strong>Tratamiento:</strong> operaciones y procedimientos que permiten recolectar, conservar, usar y ceder datos.</li>
          <li><strong>Datos sensibles:</strong> los que revelan origen racial, opiniones políticas, convicciones religiosas, salud, etc. PayComerce <strong>no</strong> solicita datos sensibles.</li>
        </ul>
      </Section>

      <Section n={3} title="Carácter de la información y consentimiento">
        <p>
          El suministro de datos es <strong>voluntario</strong>. La información que el Usuario provee reviste carácter de
          declaración jurada en cuanto a su veracidad. Al registrarse y utilizar el Servicio, el Usuario presta su
          consentimiento libre, expreso e informado para el tratamiento de sus datos en los términos de esta Política.
        </p>
      </Section>

      <Section n={4} title="Qué datos recopilamos">
        <p><strong>Del Comercio (nuestro cliente):</strong> nombre del negocio, datos de contacto (email, teléfono/WhatsApp),
          contraseña (almacenada de forma cifrada), datos de configuración y, si contrata integraciones, las credenciales
          necesarias para conectarlas. No almacenamos datos de tarjetas: los pagos, cuando existen, se procesan a través de
          la pasarela contratada por el propio Comercio.</p>
        <p><strong>De los Clientes finales del Comercio:</strong> los datos que ingresan al hacer un pedido (nombre, teléfono,
          dirección de entrega, ubicación aproximada e historial de pedidos). Estos datos se tratan por cuenta y orden del
          Comercio, que es su responsable principal.</p>
        <p><strong>Datos técnicos:</strong> información de uso, dispositivo y navegación necesaria para el funcionamiento,
          la seguridad y la mejora del Servicio.</p>
      </Section>

      <Section n={5} title="Finalidades y fundamento del tratamiento">
        <p>Tratamos los datos para:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>prestar y mantener el Servicio (crear y operar la tienda, procesar y gestionar pedidos) — ejecución del contrato;</li>
          <li>gestionar el cobro de los planes e integraciones — ejecución del contrato;</li>
          <li>brindar soporte, y enviar avisos y novedades relevantes del Servicio — interés legítimo/ejecución del contrato;</li>
          <li>garantizar la seguridad, prevenir fraudes y usos indebidos — interés legítimo;</li>
          <li>cumplir obligaciones legales y requerimientos de autoridad competente — obligación legal;</li>
          <li>elaborar estadísticas y mejorar la plataforma, de manera agregada.</li>
        </ul>
      </Section>

      <Section n={6} title="Con quién compartimos los datos">
        <p>
          No vendemos datos personales. Los compartimos únicamente en la medida necesaria con:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>proveedores que nos ayudan a prestar el Servicio (infraestructura/hosting, envío de emails), que actúan como encargados del tratamiento;</li>
          <li>las integraciones que el Comercio active (por ejemplo, <strong>Mercado Pago</strong>, <strong>ARCA/AFIP</strong>, servicios de mapas), que tratan los datos según sus propias políticas;</li>
          <li>autoridades administrativas o judiciales, ante un requerimiento fundado y en cumplimiento de la ley.</li>
        </ul>
      </Section>

      <Section n={7} title="Encargados del tratamiento">
        <p>
          Solo PayComerce y los terceros expresamente contratados a tal fin pueden procesar los datos, obligándose estos
          últimos a tratarlos conforme a las instrucciones de PayComerce y a la normativa vigente.
        </p>
      </Section>

      <Section n={8} title="Almacenamiento y transferencia internacional">
        <p>
          Los datos se alojan en servidores de nuestros proveedores de infraestructura y de servicios, que pueden
          encontrarse fuera de la República Argentina. Al utilizar el Servicio, prestás tu consentimiento para dicho
          almacenamiento y para las transferencias internacionales necesarias para la prestación del Servicio, procurando
          que los proveedores ofrezcan medidas de protección adecuadas.
        </p>
      </Section>

      <Section n={9} title="Conservación de los datos">
        <p>
          Conservamos los datos mientras la cuenta se encuentre activa y durante el plazo necesario para cumplir las
          finalidades descriptas y las obligaciones legales. Ante la baja de la cuenta, los datos se eliminan o anonimizan
          en un plazo razonable, salvo que la ley exija conservarlos.
        </p>
      </Section>

      <Section n={10} title="Seguridad de la información">
        <p>
          PayComerce implementa medidas técnicas y organizativas razonables para proteger los datos y evitar su
          adulteración, pérdida, consulta o tratamiento no autorizado, incluyendo el cifrado de contraseñas, conexiones
          seguras (HTTPS), protección contra intentos de acceso por fuerza bruta y el aislamiento de la información de cada
          Comercio. Ningún sistema es totalmente infalible, pero trabajamos permanentemente para minimizar los riesgos.
        </p>
      </Section>

      <Section n={11} title="Datos de los Clientes finales">
        <p>
          Respecto de los datos de los Clientes finales que compran en una tienda, el <strong>Comercio</strong> es el
          responsable del tratamiento y debe informar y respetar los derechos de esas personas. PayComerce actúa como
          encargado del tratamiento y procesa esos datos únicamente para prestar el Servicio y por cuenta del Comercio.
        </p>
      </Section>

      <Section n={12} title="Cookies y tecnologías similares">
        <p>
          Utilizamos cookies y almacenamiento local estrictamente necesarios para el funcionamiento del Servicio (por
          ejemplo, mantener la sesión iniciada y recordar la tienda y el carrito). No utilizamos cookies con fines
          publicitarios de terceros. Podés bloquearlas desde la configuración de tu navegador, aunque algunas funciones
          podrían dejar de funcionar correctamente.
        </p>
      </Section>

      <Section n={13} title="Comunicaciones y publicidad">
        <p>
          Podemos enviarte comunicaciones necesarias para el Servicio (por ejemplo, recuperación de contraseña o avisos
          importantes de tu cuenta) y, ocasionalmente, novedades o promociones. Podés dejar de recibir las comunicaciones
          promocionales en cualquier momento escribiéndonos a{" "}
          <a href="mailto:hola@paycomerce.com" className="text-[var(--pc)] hover:underline">hola@paycomerce.com</a>; los
          avisos operativos de tu cuenta continuarán mientras la cuenta esté activa.
        </p>
      </Section>

      <Section n={14} title="Derechos del titular de los datos">
        <p>
          Podés ejercer en forma gratuita los derechos de <strong>acceso, rectificación, actualización y supresión</strong>
          de tus datos personales, así como oponerte a su tratamiento, escribiéndonos a{" "}
          <a href="mailto:hola@paycomerce.com" className="text-[var(--pc)] hover:underline">hola@paycomerce.com</a>,
          acreditando tu identidad. Conforme a la Ley 25.326, el titular tiene derecho a acceder a sus datos en forma
          gratuita a intervalos no inferiores a seis meses, salvo interés legítimo. PayComerce podrá denegar solicitudes
          cuando así lo autorice la ley (por ejemplo, por afectar derechos de terceros, la seguridad pública o el secreto
          en investigaciones).
        </p>
        <p>
          La <strong>AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA</strong>, en su carácter de Órgano de Control de la Ley
          25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento
          de las normas sobre protección de datos personales.
        </p>
      </Section>

      <Section n={15} title="Menores de edad">
        <p>
          El Servicio está dirigido a personas mayores de edad que operan un comercio. No recopilamos de manera intencional
          datos de menores; si tomamos conocimiento de que un menor nos brindó datos, los eliminaremos y, de corresponder,
          lo notificaremos a sus padres o tutores.
        </p>
      </Section>

      <Section n={16} title="Enlaces a sitios de terceros">
        <p>
          La Tienda o la plataforma pueden contener enlaces a sitios o servicios de terceros (por ejemplo, redes sociales o
          pasarelas de pago). PayComerce no es responsable por las prácticas de privacidad ni por el contenido de esos
          sitios; esta Política aplica únicamente a PayComerce.
        </p>
      </Section>

      <Section n={17} title="Cambios en esta Política">
        <p>
          Podemos actualizar esta Política. Publicaremos la versión vigente en esta página e informaremos los cambios
          relevantes por los medios de contacto disponibles. El uso continuado del Servicio implica la aceptación de la
          versión actualizada.
        </p>
      </Section>

      <Section n={18} title="Contacto">
        <p>
          Ante cualquier consulta sobre esta Política o el tratamiento de tus datos, escribinos a{" "}
          <a href="mailto:hola@paycomerce.com" className="text-[var(--pc)] hover:underline">hola@paycomerce.com</a>.
        </p>
      </Section>

      <p className="rounded-xl bg-neutral-50 p-4 text-xs text-neutral-400 ring-1 ring-black/5">
        Este documento es un modelo general con fines informativos y no constituye asesoramiento legal. Se recomienda su
        revisión y adecuación por un profesional del derecho antes del lanzamiento comercial.
      </p>
    </LegalPage>
  );
}
