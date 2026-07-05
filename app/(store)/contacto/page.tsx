import { getSettings } from "@/lib/db";
import ContactForm from "@/components/ContactForm";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function ContactoPage() {
  const settings = getSettings(await getRequestStoreDb());

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-[var(--c-title)]">Contacto</h1>
      <p className="mt-1 text-[var(--c-muted)]">Estamos para ayudarte. Escribinos o pasá por el local.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Datos + form */}
        <div className="space-y-4">
          <InfoRow icon="📍" label="Dirección">{settings.address || "—"}</InfoRow>
          <InfoRow icon="🕒" label="Horario">{settings.hours || "—"}</InfoRow>
          <InfoRow icon="💬" label="WhatsApp">
            <a href={`https://wa.me/${(settings.whatsapp_number || "").replace(/\D/g, "")}`} target="_blank" className="text-[var(--accent-ink)] underline">
              +{settings.whatsapp_number}
            </a>
          </InfoRow>
          {settings.instagram && (
            <InfoRow icon="📸" label="Instagram">
              <a href={`https://instagram.com/${settings.instagram}`} target="_blank" className="text-[var(--accent-ink)] underline">
                @{settings.instagram}
              </a>
            </InfoRow>
          )}
          {settings.email && <InfoRow icon="✉️" label="Email">{settings.email}</InfoRow>}

          <ContactForm whatsapp={settings.whatsapp_number || ""} />
        </div>

        {/* Mapa */}
        <div className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
          <iframe
            title="Mapa"
            className="h-full min-h-[420px] w-full"
            loading="lazy"
            src={`https://www.google.com/maps?q=${encodeURIComponent(settings.map_query || settings.address || "Argentina")}&output=embed`}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[var(--c-card)] p-4 text-[var(--c-card-text)] shadow-sm ring-1 ring-black/5">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-card-muted)]">{label}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}
