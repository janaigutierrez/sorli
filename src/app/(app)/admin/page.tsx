import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { RevokeInvitationButton } from "@/features/admin/components/admin-buttons";
import { InvitationCreator } from "@/features/admin/components/invitation-creator";
import { listInvitations, type InvitationStatus } from "@/features/admin/queries";
import { MemberLink } from "@/features/profiles/components/member-link";
import { formatFullDate, formatPostDate } from "@/lib/dates";

export const metadata = { title: "Invitacions" };

const BADGE: Record<InvitationStatus, string> = {
  pendent: "border-mar-300 bg-mar-100 text-mar-700",
  usada: "border-escuma-300 bg-escuma-100 text-escuma-600",
  caducada: "border-linia bg-fons text-tinta-suau",
  revocada: "border-[#e3b4b4] bg-perill-fons text-perill",
};

export default async function InvitationsPage() {
  const invitations = await listInvitations();
  const pending = invitations.filter((i) => i.status === "pendent").length;

  return (
    <>
      <Card>
        <CardHeader title="Nova invitació" />
        <CardBody>
          <InvitationCreator />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={`Invitacions (${invitations.length} · ${pending} pendents)`} />
        {invitations.length === 0 ? (
          <CardBody className="text-center text-tinta-suau">Encara no n&apos;has creat cap.</CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f2f5f5] text-left text-xs text-tinta-suau">
                <tr>
                  <th className="px-3 py-1.5 font-bold">Per a</th>
                  <th className="px-3 py-1.5 font-bold">Estat</th>
                  <th className="px-3 py-1.5 font-bold">Rol</th>
                  <th className="px-3 py-1.5 font-bold">Creada</th>
                  <th className="px-3 py-1.5 font-bold">Caduca / ús</th>
                  <th className="px-3 py-1.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-linia-suau">
                {invitations.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2">
                      {i.note ?? <span className="text-tinta-suau">—</span>}
                      {i.email ? <span className="block text-xs text-tinta-suau">{i.email}</span> : null}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`border px-1.5 py-0.5 text-xs font-bold ${BADGE[i.status]}`}>{i.status}</span>
                    </td>
                    <td className="px-3 py-2">{i.role === "admin" ? "Admin" : "Membre"}</td>
                    <td className="px-3 py-2 whitespace-nowrap" title={formatFullDate(i.created_at)}>
                      {formatPostDate(i.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      {i.status === "usada" ? (
                        i.usedBy ? <MemberLink member={i.usedBy} /> : "compte eliminat"
                      ) : i.status === "pendent" ? (
                        <span title={formatFullDate(i.expires_at)}>
                          {new Intl.DateTimeFormat("ca", { day: "numeric", month: "short", timeZone: "Europe/Madrid" }).format(new Date(i.expires_at))}
                        </span>
                      ) : (
                        <span className="text-tinta-suau">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {i.status === "pendent" ? <RevokeInvitationButton id={i.id} note={i.note} /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
