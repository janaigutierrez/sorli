import { notFound } from "next/navigation";
import { Wishlist } from "@/features/personal/components/wishlist";
import { getWishlist } from "@/features/personal/queries";
import { getProfileByUsername } from "@/features/profiles/queries";
import { requireMember } from "@/lib/auth";

/** Pestanya "Wishes": coses que fan il·lusió (idees per a aniversaris). */
export default async function WishesPage({ params }: PageProps<"/perfil/[username]/wishes">) {
  const me = await requireMember();
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const items = await getWishlist(profile.id);

  return (
    <Wishlist
      items={items}
      isMe={profile.id === me.id}
      canModerate={me.role === "admin"}
      userId={me.id}
      firstName={profile.display_name.split(" ")[0]}
    />
  );
}
