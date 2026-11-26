import { redirect } from "next/navigation";

// El proxy ja envia a /login si no hi ha sessió.
export default function Home() {
  redirect("/inici");
}
