import { PathTabs } from "@/components/ui/path-tabs";

export function ProfileTabs({ username }: { username: string }) {
  const base = `/perfil/${username}`;
  return (
    <PathTabs
      className="px-3"
      items={[
        { href: base, label: "Mur" },
        { href: `${base}/fotos`, label: "Fotos" },
        { href: `${base}/wishes`, label: "Wishes" },
        { href: `${base}/musica`, label: "Música" },
      ]}
    />
  );
}
