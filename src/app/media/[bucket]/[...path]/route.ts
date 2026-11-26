import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKETS = new Set(["avatars", "photos"]);

/**
 * Serveix imatges dels buckets privats.
 * La URL signada la crea Supabase amb la sessió de l'usuari, així que les
 * polítiques de Storage (només membres actius) s'apliquen igualment.
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/media/[bucket]/[...path]">) {
  const { bucket, path } = await ctx.params;
  if (!BUCKETS.has(bucket)) return new NextResponse(null, { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path.map(decodeURIComponent).join("/"), 60 * 60);

  if (error || !data) return new NextResponse(null, { status: 404 });

  // Els fitxers tenen nom únic (uuid) i no canvien mai: el navegador
  // pot reutilitzar la redirecció durant ~50 min.
  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "private, max-age=3000" },
  });
}
