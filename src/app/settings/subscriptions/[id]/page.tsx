import { getBillDetails, getRules, Rule } from "@/lib/firefly";
import { SubscriptionEditClient } from "./SubscriptionEditClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSubscriptionPage({ params }: PageProps) {
  const { id } = await params;

  const [bill, allRules] = await Promise.all([
    getBillDetails(id).catch(() => null),
    getRules().catch(() => [] as Rule[]),
  ]);

  if (!bill) {
    notFound();
  }

  // Find automation rules that have a link_to_bill action targeting this bill name
  const linkedRules = allRules.filter((rule) =>
    rule.actions.some(
      (a) => a.type === "link_to_bill" && a.value.toLowerCase() === bill.name.toLowerCase()
    )
  );

  return (
    <div className="flex flex-col gap-6 p-4 pt-12 pb-32 max-w-2xl mx-auto">
      <SubscriptionEditClient bill={bill} linkedRules={linkedRules} />
    </div>
  );
}
