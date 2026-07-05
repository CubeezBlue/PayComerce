import { NextRequest, NextResponse } from "next/server";

// Autocompletado de direcciones vía OpenStreetMap (Nominatim), gratis y sin API key.
// Se hace del lado del servidor para evitar CORS y poder mandar el User-Agent requerido.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json([]);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "ar"); // priorizar Argentina

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "PayComerce/1.0 (tienda online)", "Accept-Language": "es" },
    });
    if (!res.ok) return NextResponse.json([]);
    const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    const results = data.map((d) => ({ label: d.display_name, lat: d.lat, lon: d.lon }));
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
