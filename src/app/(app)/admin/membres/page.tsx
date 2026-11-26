import { Card, CardHeader } from "@/components/ui/card";
import { MemberActions } from "@/features/admin/components/admin-buttons";
import { adminListMembers } from "@/features/admin/queries";
import { MemberAvatar, MemberLink } from "@/features/profiles/components/member-link";
import { requireAdmin } from "@/lib/auth";
import { formatFullDate, formatPostDate } from "@/lib/dates";

export const metadata = { title: "Membres" };

export default async function MembersAdminPage() {
  const me = await requireAdmin();
  const members = await adminListMembers();

  return (
    <Card>
      <CardHeader title={`Membres (${members.length})`} />
      <ul className="divide-y divide-linia-suau">
        {members.map((m) => {
          const isMe = m.id === me.id;
          return (
            <li key={m.id} className={`flex flex-wrap items-center gap-3 px-3 py-2.5 ${m.status === "suspended" ? "bg-perill-fons" : ""}`}>
              <MemberAvatar member={m} size="md" />
              <div className="min-w-0 flex-1">
                <p>
                  <MemberLink member={m} />{" "}
                  <span className="text-xs text-tinta-suau">@{m.username}</span>
                  {m.role === "admin" ? (
                    <span className="ml-1.5 border border-sorli-300 bg-sorli-100 px-1 text-[10px] font-bold text-sorli-800">ADMIN</span>
                  ) : null}
                  {m.status === "suspended" ? (
                    <span className="ml-1.5 border border-[#e3b4b4] bg-white px-1 text-[10px] font-bold text-perill">SUSPÈS</span>
                  ) : null}
                </p>
                <p className="text-xs text-tinta-suau">
                  {m.email} · {m.post_count} {Number(m.post_count) === 1 ? "publicació" : "publicacions"} · membre des de{" "}
                  <span title={formatFullDate(m.created_at)}>{formatPostDate(m.created_at)}</span>
                  {" · "}últim accés:{" "}
                  {m.last_sign_in_at ? (
                    <span title={formatFullDate(m.last_sign_in_at)}>{formatPostDate(m.last_sign_in_at)}</span>
                  ) : (
                    "mai"
                  )}
                </p>
              </div>
              {isMe ? (
                <span className="text-xs text-tinta-suau">(tu)</span>
              ) : (
                <MemberActions id={m.id} name={m.display_name} username={m.username} role={m.role} status={m.status} />
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
