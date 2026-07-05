"use client";

import { useState } from "react";

export default function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const valid = name.trim() && message.trim();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const text = encodeURIComponent(`Hola! Soy ${name}${phone ? ` (${phone})` : ""}.\n${message}`);
    const num = whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${num}?text=${text}`, "_blank");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-[var(--c-card)] p-8 text-center text-[var(--c-card-text)] shadow-sm ring-1 ring-black/5">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-2xl">✅</div>
        <h3 className="text-lg font-bold">¡Mensaje enviado!</h3>
        <p className="text-sm text-[var(--c-card-muted)]">Se abrió WhatsApp con tu consulta. Te respondemos a la brevedad.</p>
        <button onClick={() => setSent(false)} className="text-sm font-semibold text-[var(--accent-ink)] underline">
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl bg-[var(--c-card)] p-6 text-[var(--c-card-text)] shadow-sm ring-1 ring-black/5">
      <h3 className="text-lg font-bold">Escribinos</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className={inputCls} />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono (opcional)" className={inputCls} />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tu mensaje o consulta"
        rows={4}
        className={`resize-none ${inputCls}`}
      />
      <button
        type="submit"
        disabled={!valid}
        className="w-full rounded-full bg-[var(--brand)] py-3 font-semibold text-[var(--brand-text)] shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
      >
        Enviar por WhatsApp
      </button>
    </form>
  );
}
