import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MemberAvatar } from "@/features/profiles/components/member-link";
import type { ProfileSummary } from "@/features/profiles/queries";

/** Bloc lateral "Membres" amb la graella d'avatars. */
export function MembersBox({ members }: { members: ProfileSummary[] }) {
  return (
    <Card>
      <CardHeader
        title={`Membres (${members.length})`}
        action={<Link href="/cercador">Veure tots</Link>}
      />
      <CardBody className="grid grid-cols-3 gap-x-2 gap-y-2.5">
        {members.slice(0, 12).map((m) => (
          <div key={m.id} className="min-w-0 text-center text-xs">
            <MemberAvatar member={m} size="md" />
            <Link href={`/perfil/${m.username}`} className="mt-0.5 block truncate">
              {m.display_name.split(" ")[0]}
            </Link>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
