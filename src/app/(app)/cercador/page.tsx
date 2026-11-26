import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { MemberAvatar, MemberLink } from "@/features/profiles/components/member-link";
import { searchMembers } from "@/features/profiles/queries";
import { requireMember } from "@/lib/auth";

export const metadata: Metadata = { title: "Cercador" };

export default async function SearchPage({ searchParams }: PageProps<"/cercador">) {
  await requireMember();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.slice(0, 60) : "";
  const results = await searchMembers(query);

  return (
    <PageShell>
      <Card>
        <CardHeader title="Cerca membres de Sorli" />
        <CardBody className="space-y-3">
          <form role="search" className="flex gap-2">
            <label htmlFor="cerca" className="sr-only">
              Nom o nom d&apos;usuari
            </label>
            <Input id="cerca" name="q" defaultValue={query} placeholder="Nom o nom d'usuari" autoFocus />
            <Button type="submit">Cerca</Button>
          </form>

          <p className="text-xs text-tinta-suau">
            {query
              ? `${results.length} ${results.length === 1 ? "resultat" : "resultats"} per «${query}»`
              : `Tots els membres (${results.length})`}
          </p>

          <ul className="divide-y divide-linia-suau border-t border-linia-suau">
            {results.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2">
                <MemberAvatar member={m} size="md" />
                <div className="min-w-0">
                  <MemberLink member={m} />
                  <p className="text-xs text-tinta-suau">@{m.username}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </PageShell>
  );
}
