import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { mediaUrl } from "@/lib/media";
import type { ProfileSummary } from "../queries";

/** Nom en negreta que enllaça al perfil. */
export function MemberLink({ member, className }: { member: ProfileSummary; className?: string }) {
  return (
    <Link href={`/perfil/${member.username}`} className={className ?? "font-bold"}>
      {member.display_name}
    </Link>
  );
}

/** Avatar quadrat que enllaça al perfil. */
export function MemberAvatar({
  member,
  size = "sm",
}: {
  member: ProfileSummary;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  return (
    <Link href={`/perfil/${member.username}`} className="shrink-0" aria-label={member.display_name}>
      <Avatar name={member.display_name} src={mediaUrl("avatars", member.avatar_path)} size={size} />
    </Link>
  );
}
