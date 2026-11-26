import { Card, CardBody, CardHeader } from "@/components/ui/card";

/** Secció prevista però encara no implementada. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="py-8 text-center text-tinta-suau">Properament a Sorli ✨</CardBody>
    </Card>
  );
}
