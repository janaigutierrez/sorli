import { notFound } from "next/navigation";
import { ProfileHeader } from "@/features/profiles/components/profile-header";
import { getProfileByUsername } from "@/features/profiles/queries";
import { requireMember } from "@/lib/auth";

export async function generateMetadata({ params }: LayoutProps<"/perfil/[username]">) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  return { title: profile?.display_name ?? "Perfil" };
}

export default async function ProfileLayout({ params, children }: LayoutProps<"/perfil/[username]">) {
  const me = await requireMember();
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile || profile.status !== "active") notFound();

  return (
    <div className="mx-auto max-w-[980px] space-y-3 px-3 py-3">
      <ProfileHeader profile={profile} isMe={profile.id === me.id} />
      {children}
    </div>
  );
}
