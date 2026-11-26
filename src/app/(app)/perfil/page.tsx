import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";

/** /perfil → el perfil de l'usuari autenticat. */
export default async function MyProfilePage() {
  const me = await requireMember();
  redirect(`/perfil/${me.username}`);
}
