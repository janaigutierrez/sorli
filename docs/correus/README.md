# Correus de Sorli (en català)

Supabase envia aquests correus. Per posar-los en català:

**Supabase → projecte sorli → Authentication → Emails → Templates**

| Plantilla de Supabase | Assumpte (Subject) | Cos (Message body, pestanya *Source*) |
|---|---|---|
| **Confirm signup** | `Confirma el teu correu · Sorli` | [`1-confirmacio-alta.html`](1-confirmacio-alta.html) |
| **Reset password** | `Canvia la contrasenya · Sorli` | [`2-recuperar-contrasenya.html`](2-recuperar-contrasenya.html) |
| **Change email address** | `Confirma el canvi de correu · Sorli` | [`3-canvi-de-correu.html`](3-canvi-de-correu.html) |

Per a cada una: obre-la, enganxa l'assumpte, a "Message body" substitueix **tot** el contingut pel de l'arxiu `.html` i desa (**Save changes**).

No toquis les parts `{{ .ConfirmationURL }}`, `{{ .Email }}` i `{{ .NewEmail }}`: Supabase les substitueix per l'enllaç i els correus reals.
