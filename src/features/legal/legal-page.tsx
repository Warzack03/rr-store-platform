import Link from "next/link";
import type { ReactNode } from "react";

import { getPublicStoreSettings } from "@/features/settings/server/store-settings";

export type LegalDocument =
  | "aviso-legal"
  | "privacidad"
  | "cookies"
  | "condiciones-de-compra"
  | "envios"
  | "cambios-y-devoluciones";

export const legalMetadata = {
  "aviso-legal": {
    title: "Aviso legal",
    description: "Información legal de la tienda oficial de Rising Raimon.",
  },
  privacidad: {
    title: "Política de privacidad",
    description: "Cómo tratamos y protegemos los datos personales en la tienda de Rising Raimon.",
  },
  cookies: {
    title: "Política de cookies",
    description: "Información sobre las cookies técnicas utilizadas por la tienda de Rising Raimon.",
  },
  "condiciones-de-compra": {
    title: "Condiciones de compra",
    description: "Condiciones aplicables a los pedidos realizados en la tienda de Rising Raimon.",
  },
  envios: {
    title: "Envíos",
    description: "Zona, preparación, transporte y seguimiento de los pedidos de Rising Raimon.",
  },
  "cambios-y-devoluciones": {
    title: "Cambios y devoluciones",
    description: "Procedimiento para comunicar incidencias, cambios y devoluciones de pedidos.",
  },
} as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-3xl font-bold uppercase tracking-wide text-white">{title}</h2>
      <div className="space-y-3 leading-7 text-white/72">{children}</div>
    </section>
  );
}

function ContactLink({ email }: { email: string }) {
  return <a className="font-semibold text-brand-gold underline underline-offset-4" href={`mailto:${email}`}>{email}</a>;
}

function LegalContent({ document, email }: { document: LegalDocument; email: string }) {
  if (document === "aviso-legal") {
    return <>
      <Section title="Titular de la tienda"><p>Esta tienda oficial es gestionada por Rising Raimon. Para cualquier comunicación relacionada con el sitio o con una compra puedes escribir a <ContactLink email={email} />.</p></Section>
      <Section title="Objeto"><p>El sitio ofrece información y venta online de equipaciones y otros productos oficiales de Rising Raimon. El acceso y uso de la web implica respetar estas condiciones y la legislación aplicable.</p></Section>
      <Section title="Propiedad intelectual"><p>La marca, el escudo, las fotografías, los diseños y los contenidos de esta web pertenecen a Rising Raimon o se utilizan con autorización. No pueden reproducirse ni utilizarse con fines comerciales sin permiso previo.</p></Section>
      <Section title="Responsabilidad"><p>Trabajamos para mantener la información disponible y actualizada. Podemos suspender temporalmente el acceso por mantenimiento, seguridad o causas ajenas a nuestro control. Los enlaces externos se facilitan como referencia y están sujetos a las condiciones de sus respectivos responsables.</p></Section>
      <Section title="Legislación aplicable"><p>La relación con las personas usuarias se rige por la normativa española y europea que resulte aplicable, sin limitar los derechos que correspondan a quienes compran como consumidores.</p></Section>
    </>;
  }

  if (document === "privacidad") {
    return <>
      <Section title="Responsable y contacto"><p>Rising Raimon es responsable del tratamiento de los datos utilizados en esta tienda. Puedes realizar consultas o ejercer tus derechos escribiendo a <ContactLink email={email} />.</p></Section>
      <Section title="Datos que tratamos"><p>Tratamos los datos que facilitas al realizar un pedido o contactar con nosotros: identificación, contacto, dirección de entrega, productos, personalizaciones, observaciones, información operativa del pedido y referencias del pago. No recibimos ni almacenamos los datos completos de tu tarjeta.</p></Section>
      <Section title="Finalidades y bases legales"><p>Utilizamos los datos para validar el carrito, tramitar el pago, fabricar y entregar el pedido, enviar comunicaciones operativas, atender incidencias, prevenir abusos y cumplir obligaciones legales. Las bases son la ejecución del contrato, el cumplimiento de obligaciones legales y nuestro interés legítimo en mantener la tienda segura.</p></Section>
      <Section title="Destinatarios"><p>Solo comunicamos los datos necesarios a proveedores que participan en el servicio, como alojamiento, Stripe para el pago, el servicio de correo y SEUR para el transporte. También podremos comunicarlos cuando exista una obligación legal.</p></Section>
      <Section title="Conservación"><p>Conservamos los datos durante el tiempo necesario para gestionar el pedido, atender responsabilidades y cumplir los plazos legales. Después se eliminan o se mantienen bloqueados cuando corresponda.</p></Section>
      <Section title="Tus derechos"><p>Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad cuando resulte aplicable. También puedes reclamar ante la Agencia Española de Protección de Datos si consideras que el tratamiento no es adecuado.</p></Section>
      <Section title="Seguridad"><p>Aplicamos medidas técnicas y organizativas para limitar accesos, proteger las comunicaciones y reducir la información almacenada. El enlace privado de un pedido debe conservarse como información confidencial.</p></Section>
    </>;
  }

  if (document === "cookies") {
    return <>
      <Section title="Qué son las cookies"><p>Las cookies son pequeños archivos que el navegador guarda para que una web pueda recordar información necesaria entre páginas o mantener una sesión segura.</p></Section>
      <Section title="Cookies utilizadas"><p>La tienda utiliza únicamente cookies y almacenamiento técnico necesarios para el carrito, la seguridad y el acceso de administración. No utilizamos cookies de publicidad, perfiles comerciales ni herramientas de analítica de terceros.</p></Section>
      <Section title="Servicios externos"><p>Al continuar al pago accedes a Stripe Checkout, alojado por Stripe. Ese servicio puede utilizar sus propias tecnologías necesarias para procesar el pago y prevenir el fraude, conforme a su política de privacidad.</p></Section>
      <Section title="Cómo gestionarlas"><p>Puedes borrar o bloquear las cookies desde la configuración del navegador. Si bloqueas las que son estrictamente necesarias, el carrito, el pago o el acceso administrativo pueden dejar de funcionar correctamente.</p></Section>
      <Section title="Cambios"><p>Si en el futuro incorporamos cookies no esenciales, actualizaremos esta política y solicitaremos el consentimiento previo cuando sea obligatorio.</p></Section>
    </>;
  }

  if (document === "condiciones-de-compra") {
    return <>
      <Section title="Ámbito"><p>Estas condiciones se aplican a los pedidos realizados en la tienda oficial de Rising Raimon. Antes de pagar debes revisarlas y aceptar también la política de privacidad.</p></Section>
      <Section title="Productos y drops"><p>La tienda funciona principalmente mediante periodos de venta limitados. Los productos se fabrican después de cerrar el drop, por lo que el plazo incluye fabricación, preparación y transporte. Las fotografías intentan representar fielmente cada producto, aunque puede haber pequeñas diferencias de color según la pantalla.</p></Section>
      <Section title="Precios y pago"><p>Los precios se muestran en euros e incluyen los impuestos aplicables. El coste de envío aparece desglosado antes del pago. El pago se realiza mediante Stripe Checkout y el pedido solo queda confirmado cuando recibimos la confirmación segura del pago.</p></Section>
      <Section title="Confirmación"><p>Después de confirmar el pago recibirás una confirmación de pedido y un enlace privado para consultar su estado. Esa confirmación no constituye una factura fiscal. Si necesitas documentación específica, contacta con <ContactLink email={email} />.</p></Section>
      <Section title="Personalizaciones"><p>Debes revisar con atención tallas, nombres y dorsales antes del pago. Las personalizaciones se fabrican conforme a la información enviada y pueden afectar al régimen de cambios o desistimiento dentro de los límites previstos por la normativa de consumo.</p></Section>
      <Section title="Disponibilidad e incidencias"><p>Si una incidencia excepcional impide atender el pedido, contactaremos contigo para ofrecer una solución o tramitar el reembolso correspondiente. Una devolución de dinero puede tardar varios días en reflejarse según el método de pago.</p></Section>
      <Section title="Atención"><p>Para cualquier duda sobre una compra escribe a <ContactLink email={email} /> indicando el número de pedido, sin enviar datos de tarjeta.</p></Section>
    </>;
  }

  if (document === "envios") {
    return <>
      <Section title="Zona de entrega"><p>Realizamos entregas a domicilio únicamente en España peninsular. Actualmente no enviamos a Canarias, Baleares, Ceuta, Melilla ni destinos internacionales.</p></Section>
      <Section title="Coste"><p>La tarifa vigente se muestra en el carrito y en el resumen del checkout antes de pagar. No añadimos costes de transporte después de confirmar el pedido.</p></Section>
      <Section title="Preparación"><p>Los productos de un drop se fabrican una vez finalizado su periodo de venta. La estimación indicada en la tienda comienza según la información mostrada durante la compra y puede incluir tiempo de fabricación.</p></Section>
      <Section title="Transporte y seguimiento"><p>Los pedidos se tramitan mediante SEUR. Cuando el pedido salga, enviaremos un correo y mostraremos en el enlace privado el número o enlace de seguimiento si está disponible.</p></Section>
      <Section title="Entrega fallida"><p>Si la entrega no puede completarse, escribe a <ContactLink email={email} /> con tu número de pedido. Revisaremos la incidencia y la gestionaremos directamente con SEUR.</p></Section>
    </>;
  }

  return <>
    <Section title="Comunicar una incidencia"><p>Escribe a <ContactLink email={email} /> indicando el número de pedido y explicando el motivo. Si el producto presenta un defecto o has recibido un artículo diferente, incluye fotografías que permitan revisarlo.</p></Section>
    <Section title="Revisión del caso"><p>Estudiaremos cada solicitud según el estado del producto, la personalización realizada y los derechos que reconozca la normativa de consumo. No envíes ningún artículo antes de recibir instrucciones.</p></Section>
    <Section title="Productos personalizados"><p>Los nombres y dorsales se fabrican específicamente para cada pedido. Esta circunstancia puede limitar el desistimiento o el cambio cuando el producto se ha producido correctamente, sin afectar a los derechos por defecto, daño o falta de conformidad.</p></Section>
    <Section title="Devolución y reembolso"><p>Cuando proceda una devolución, indicaremos la dirección y el método. El producto debe conservarse en condiciones adecuadas. Los reembolsos se realizan mediante el método de pago original y pueden tardar varios días en aparecer.</p></Section>
    <Section title="Garantías legales"><p>Estas condiciones no limitan los derechos y garantías que corresponden legalmente a las personas consumidoras.</p></Section>
  </>;
}

export async function LegalPage({ document }: { document: LegalDocument }) {
  const settings = await getPublicStoreSettings();
  const email = settings?.supportEmail ?? "risingraimon@gmail.com";
  const meta = legalMetadata[document];

  return (
    <article className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16">
      <nav aria-label="Migas de pan" className="text-sm text-white/55">
        <Link className="hover:text-brand-gold" href="/">Inicio</Link> <span aria-hidden="true">/</span> <span>{meta.title}</span>
      </nav>
      <header className="mt-7 border-b border-white/12 pb-8">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">Información de la tienda</p>
        <h1 className="mt-3 font-display text-6xl leading-[0.9] tracking-wide text-white sm:text-7xl">{meta.title}</h1>
        <p className="mt-5 max-w-2xl leading-7 text-white/65">{meta.description}</p>
      </header>
      <div className="mt-10 space-y-10"><LegalContent document={document} email={email} /></div>
    </article>
  );
}
