import type { Metadata } from "next";
import LegalPage, { Section } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Términos y Condiciones — PayComerce",
  description: "Condiciones de servicio de PayComerce.",
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y Condiciones" updated="7 de julio de 2026">
      <p>
        Los presentes Términos y Condiciones (los “Términos”, “TyC” o “Condiciones”) regulan el acceso y uso de la
        plataforma <strong>PayComerce</strong> (el “Servicio” o la “Plataforma”), disponible en paycomerce.com y sus
        subdominios. La utilización del Servicio implica la aceptación plena y sin reservas de estos Términos por parte
        de la persona humana o jurídica que lo contrata (el “Comercio” o “Usuario”). Quien no esté de acuerdo con estos
        Términos debe abstenerse de registrarse y de utilizar el Servicio.
      </p>

      <Section n={1} title="Definiciones">
        <p>A los fines de estos Términos, se entiende por:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>PayComerce:</strong> la plataforma, el software y los servicios tecnológicos que se prestan a través del sitio.</li>
          <li><strong>Comercio / Usuario:</strong> la persona humana mayor de 18 años o la persona jurídica que se registra y contrata el Servicio para crear y operar su tienda online.</li>
          <li><strong>Cliente final:</strong> la persona que consulta el catálogo del Comercio y/o realiza pedidos o compras en la tienda de un Comercio.</li>
          <li><strong>Tienda / Catálogo:</strong> el sitio y el catálogo online del Comercio, alojado y publicado a través de PayComerce.</li>
          <li><strong>Plan:</strong> la modalidad de contratación del Servicio con su precio y funciones.</li>
          <li><strong>Integraciones:</strong> servicios de terceros que el Comercio puede conectar opcionalmente (por ejemplo, Mercado Pago, ARCA/AFIP, envío de emails, mapas).</li>
          <li><strong>Contenido:</strong> textos, imágenes, precios, descripciones y demás información publicada.</li>
          <li><strong>Pedido:</strong> la solicitud de productos o servicios que un Cliente final realiza al Comercio a través de la Tienda.</li>
        </ul>
      </Section>

      <Section n={2} title="Objeto y descripción del Servicio">
        <p>
          PayComerce es una plataforma tecnológica que permite a los comercios crear una tienda online, publicar su
          catálogo, recibir y gestionar pedidos (por ejemplo, a través de WhatsApp), administrar productos, precios,
          stock y sucursales y, opcionalmente, cobrar en línea y emitir comprobantes mediante integraciones de terceros.
          PayComerce provee exclusivamente el software y la infraestructura tecnológica; <strong>no vende</strong> los
          productos ni servicios ofrecidos por los comercios ni interviene en la relación comercial entre el Comercio y
          sus Clientes finales.
        </p>
      </Section>

      <Section n={3} title="Capacidad y registro">
        <p>
          Para registrarse, el Usuario debe ser mayor de 18 años y contar con capacidad legal para contratar conforme al
          Código Civil y Comercial de la Nación. No podrán registrarse quienes se encuentren inhabilitados o suspendidos
          comercial o legalmente. El registro requiere completar los datos solicitados (nombre del negocio, email,
          contraseña y demás información), que revisten <strong>carácter de declaración jurada</strong>; el Usuario es
          responsable por su veracidad, exactitud y actualización.
        </p>
      </Section>

      <Section n={4} title="Cuenta, credenciales y seguridad">
        <ul className="ml-5 list-disc space-y-1">
          <li>La cuenta es personal, única e intransferible.</li>
          <li>El Usuario es responsable de mantener la confidencialidad de su contraseña y de todas las operaciones realizadas desde su cuenta.</li>
          <li>Debe notificar de inmediato a PayComerce ante cualquier uso no autorizado o falla de seguridad de la que tome conocimiento.</li>
          <li>PayComerce implementa medidas de seguridad razonables (cifrado de contraseñas, conexiones seguras y protección ante intentos de acceso indebido), sin que ello constituya garantía de inviolabilidad.</li>
        </ul>
      </Section>

      <Section n={5} title="Planes, precios y pago del Servicio">
        <ul className="ml-5 list-disc space-y-1">
          <li>El Servicio se ofrece bajo planes de suscripción y funciones adicionales (integraciones) que pueden contratarse por separado, según se informa en paycomerce.com/precios.</li>
          <li>Los precios pueden actualizarse (por ejemplo, por variaciones de costos o inflación); los cambios se comunicarán con antelación razonable.</li>
          <li>El Servicio se presta de forma continua mientras se encuentre abonado. La falta de pago faculta a PayComerce a suspender o dar de baja la cuenta al finalizar el período abonado.</li>
          <li>El precio del Servicio que PayComerce cobra al Comercio es independiente de las eventuales comisiones que cobren las integraciones de terceros (por ejemplo, la pasarela de pagos), que corren por cuenta del Comercio.</li>
        </ul>
      </Section>

      <Section n={6} title="Integraciones de terceros">
        <p>
          El Comercio puede conectar servicios de terceros —como <strong>Mercado Pago</strong> (cobros en línea),
          <strong> ARCA/AFIP</strong> (facturación electrónica), servicios de envío de emails o de mapas— utilizando sus
          propias credenciales y cuentas. Dichos servicios se rigen por sus propios términos y políticas. PayComerce
          actúa únicamente como intermediario técnico y <strong>no es responsable</strong> por el funcionamiento,
          disponibilidad, cobros, acreditaciones, comisiones, retenciones ni por la facturación que gestionen esos
          terceros. El Comercio es el único responsable de contratarlos, configurarlos y cumplir con sus condiciones.
        </p>
      </Section>

      <Section n={7} title="Obligaciones y responsabilidades del Comercio">
        <p>El Comercio es el único y exclusivo responsable de su actividad y, en particular, se obliga a:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>ofrecer productos y servicios lícitos, y garantizar su <strong>calidad, estado, aptitud y legitimidad</strong>, incluyendo el cumplimiento de las normas <strong>bromatológicas</strong>, sanitarias y de habilitación que correspondan a su rubro;</li>
          <li>cumplir con la <strong>Ley 24.240 de Defensa del Consumidor</strong> y demás normas de protección al consumidor, incluyendo el deber de información, el derecho de arrepentimiento cuando corresponda y la correcta atención de reclamos;</li>
          <li>emitir a sus Clientes finales los <strong>comprobantes y facturas</strong> que exija la normativa, y cumplir con la totalidad de sus <strong>obligaciones impositivas, previsionales y fiscales</strong>;</li>
          <li>fijar los precios, condiciones de venta, medios de pago y de <strong>entrega</strong>, y cumplir con los plazos y la preparación de los Pedidos;</li>
          <li>tratar los datos personales de sus Clientes finales conforme a la ley, siendo el Comercio el responsable de dichos datos;</li>
          <li>mantener actualizada y veraz la información publicada en su Tienda.</li>
        </ul>
      </Section>

      <Section n={8} title="Uso permitido y conductas prohibidas">
        <p>El Comercio se compromete a no utilizar el Servicio para:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>comercializar productos o servicios ilegales, prohibidos o que requieran autorizaciones que no posea;</li>
          <li>infringir derechos de terceros (propiedad intelectual, marcas, imagen, honor, privacidad);</li>
          <li>publicar información falsa, engañosa o que induzca a error a los consumidores;</li>
          <li>difundir contenido discriminatorio, violento, injurioso o contrario a la moral y buenas costumbres;</li>
          <li>interferir en el funcionamiento de la Plataforma, vulnerar su seguridad o la de otros usuarios, o distribuir software malicioso;</li>
          <li>utilizar la Plataforma con fines distintos a los previstos en estos Términos.</li>
        </ul>
        <p>El incumplimiento habilita a PayComerce a advertir, suspender o cancelar la cuenta, sin perjuicio de las acciones legales que correspondan.</p>
      </Section>

      <Section n={9} title="Rol de PayComerce e independencia de la operación comercial">
        <p>
          PayComerce es un <strong>proveedor de tecnología</strong> que facilita el software para que el Comercio publique
          su catálogo y gestione pedidos. PayComerce <strong>no es propietario</strong> de los productos, <strong>no
          vende</strong>, no fija precios, no participa en la negociación, el perfeccionamiento, el pago ni la entrega de
          las operaciones entre el Comercio y sus Clientes finales, y no garantiza la concreción de ninguna operación.
          La relación de compraventa se celebra exclusivamente entre el Comercio y el Cliente final.
        </p>
      </Section>

      <Section n={10} title="Pedidos, pagos y entregas">
        <p>En consecuencia, respecto de los Pedidos, PayComerce:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>no garantiza la existencia, calidad, cantidad, disponibilidad ni la entrega de los productos;</li>
          <li>no es responsable por demoras, errores, incumplimientos o cancelaciones atribuibles al Comercio;</li>
          <li>no interviene en el flujo de dinero entre el Cliente final y el Comercio (los pagos, cuando se realizan en línea, se procesan a través de la pasarela contratada por el Comercio, con las credenciales del propio Comercio).</li>
        </ul>
        <p>Todo reclamo vinculado a un Pedido debe dirigirse al Comercio, que es quien realiza la venta.</p>
      </Section>

      <Section n={11} title="Propiedad intelectual">
        <p>
          El software, el código, la marca “PayComerce”, los logotipos, diseños, bases de datos y demás elementos de la
          Plataforma son de titularidad exclusiva de PayComerce o de sus licenciantes, y se encuentran protegidos por la
          normativa de propiedad intelectual e industrial. Queda prohibida su reproducción, adaptación, distribución o uso
          no autorizado. El Usuario renuncia a reclamar derecho alguno sobre las marcas y contenidos de PayComerce.
        </p>
      </Section>

      <Section n={12} title="Contenido del Comercio y licencia">
        <p>
          El Comercio conserva la titularidad sobre el Contenido que carga en su Tienda (textos, imágenes, etc.) y declara
          contar con los derechos necesarios para publicarlo. El Comercio otorga a PayComerce una licencia gratuita, no
          exclusiva y limitada para alojar, reproducir y mostrar dicho Contenido con el único fin de prestar el Servicio.
        </p>
      </Section>

      <Section n={13} title="Disponibilidad, mantenimiento y modificaciones del Servicio">
        <p>
          PayComerce procura mantener el Servicio disponible de forma continua, pero no garantiza que sea ininterrumpido
          o libre de errores. Podrá realizar tareas de mantenimiento, actualizaciones, mejoras o cambios de funciones que
          afecten temporalmente la disponibilidad, procurando minimizar las molestias.
        </p>
      </Section>

      <Section n={14} title="Garantías">
        <p>
          El Servicio se provee “tal cual” (as is) y “según disponibilidad”. En la medida permitida por la ley, PayComerce
          no garantiza que el Servicio resulte apto para un fin específico del Comercio, ni la veracidad de los datos que
          los Usuarios cargan, ni resultado comercial alguno. El Comercio utiliza el Servicio bajo su propia responsabilidad
          y riesgo.
        </p>
      </Section>

      <Section n={15} title="Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la legislación aplicable, PayComerce no será responsable por daños indirectos,
          incidentales, lucro cesante, pérdida de chance, pérdida de datos o de ventas derivados del uso o de la imposibilidad
          de uso del Servicio o de las integraciones de terceros. La responsabilidad total de PayComerce, por cualquier
          concepto, se limitará al importe efectivamente abonado por el Comercio por el Servicio en los tres (3) meses
          anteriores al hecho que motive el reclamo. Nada de lo aquí dispuesto limita los derechos que la normativa de
          defensa del consumidor reconozca de manera imperativa.
        </p>
      </Section>

      <Section n={16} title="Indemnidad">
        <p>
          El Comercio se obliga a mantener indemne y a defender a PayComerce, sus socios, administradores, empleados y
          colaboradores, frente a todo reclamo, demanda, sanción, multa, daño, pérdida o gasto (incluidos honorarios y
          costas) que un Cliente final, un tercero o una autoridad inicie o imponga como consecuencia de: (i) los productos
          o servicios que el Comercio ofrece o vende; (ii) el incumplimiento de la normativa aplicable a su actividad;
          (iii) el uso indebido de la Plataforma; o (iv) la infracción de estos Términos.
        </p>
      </Section>

      <Section n={17} title="Protección de datos personales">
        <p>
          El tratamiento de datos personales se rige por la <strong>Política de Privacidad</strong> de PayComerce, que forma
          parte integrante de estos Términos y se ajusta a la Ley 25.326 de Protección de Datos Personales. El Comercio es
          el responsable del tratamiento de los datos de sus Clientes finales; PayComerce actúa como encargado del tratamiento
          respecto de esos datos.
        </p>
      </Section>

      <Section n={18} title="Suspensión y cancelación por PayComerce">
        <p>
          PayComerce podrá, ante infracciones a estos Términos, a la ley o falta de pago, y de manera proporcional: emitir
          advertencias, suspender temporalmente el Servicio o la cuenta, o cancelarla de forma definitiva. En casos de
          ilicitud manifiesta o riesgo para terceros, la suspensión podrá ser inmediata.
        </p>
      </Section>

      <Section n={19} title="Baja del Comercio y efectos">
        <p>
          El Comercio puede dar de baja su cuenta en cualquier momento y sin costo, desde su panel. La baja implica el cese
          del Servicio y la eliminación de la Tienda y sus datos, sin perjuicio de la conservación que la ley pudiera exigir.
          Antes de la eliminación definitiva, el Comercio puede solicitar o exportar su información.
        </p>
      </Section>

      <Section n={20} title="Comunicaciones y notificaciones">
        <p>
          Las comunicaciones entre las partes se cursarán por medios electrónicos (email y/o el propio panel). El Usuario
          declara válidas las notificaciones enviadas al email registrado, y se obliga a mantenerlo actualizado. El uso de
          los canales de comunicación debe ser responsable; queda prohibido el envío de contenido injurioso, amenazante,
          discriminatorio o que infrinja derechos de terceros.
        </p>
      </Section>

      <Section n={21} title="Cesión">
        <p>
          El Comercio no podrá ceder ni transferir su cuenta, ni los derechos u obligaciones emergentes de estos Términos,
          sin el consentimiento previo y por escrito de PayComerce. PayComerce podrá ceder su posición contractual dando
          aviso al Usuario.
        </p>
      </Section>

      <Section n={22} title="Independencia de las partes">
        <p>
          La aceptación de estos Términos no genera entre las partes sociedad, asociación, mandato, agencia, franquicia ni
          relación laboral alguna. El único vínculo es la prestación onerosa de un servicio de software.
        </p>
      </Section>

      <Section n={23} title="Tolerancia y no renuncia">
        <p>
          La eventual tolerancia de PayComerce frente a un incumplimiento no implicará conformidad, ni renuncia a exigir en
          el futuro el estricto cumplimiento de estos Términos.
        </p>
      </Section>

      <Section n={24} title="Nulidad parcial">
        <p>
          Si alguna cláusula de estos Términos fuera declarada inválida o inaplicable, ello no afectará la validez de las
          restantes, que continuarán vigentes.
        </p>
      </Section>

      <Section n={25} title="Fuerza mayor">
        <p>
          PayComerce no será responsable por incumplimientos o demoras causados por hechos ajenos a su control razonable
          (caso fortuito o fuerza mayor), tales como fallas de proveedores de infraestructura, cortes de energía o de
          conectividad, ataques informáticos, medidas de autoridad o catástrofes.
        </p>
      </Section>

      <Section n={26} title="Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, las partes se
          someten a los tribunales ordinarios competentes que correspondan, sin perjuicio de los derechos y el fuero que la
          normativa de defensa del consumidor reconozca de manera imperativa al Usuario o al consumidor.
        </p>
      </Section>

      <Section n={27} title="Contacto">
        <p>
          Ante cualquier consulta sobre estos Términos, escribinos a{" "}
          <a href="mailto:hola@paycomerce.com" className="text-[var(--pc)] hover:underline">hola@paycomerce.com</a>.
        </p>
      </Section>

      <p className="rounded-xl bg-neutral-50 p-4 text-xs text-neutral-400 ring-1 ring-black/5">
        Este documento es un modelo general con fines informativos y no constituye asesoramiento legal. Se recomienda su
        revisión y adecuación por un profesional del derecho, según la razón social, el modelo de negocio y la normativa
        vigente, antes del lanzamiento comercial.
      </p>
    </LegalPage>
  );
}
