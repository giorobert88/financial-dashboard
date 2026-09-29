import { getRules, getRuleGroups, getCategories, fetchFirefly } from "@/lib/firefly";
import { RulesListClient } from "./RulesListClient";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  // Fetch rules, categories, bills, and rule groups in parallel on the server
  const [rules, categories, billsData, ruleGroups] = await Promise.all([
    getRules(),
    getCategories(),
    fetchFirefly("/bills", {}, { cache: "no-store" }).catch(() => ({ data: [] })),
    getRuleGroups().catch(() => []),
  ]);

  const bills = (billsData.data || []).map((b: any) => ({
    id: b.id,
    name: b.attributes.name as string,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 pt-12 pb-32 max-w-4xl mx-auto">
      <RulesListClient
        initialRules={rules}
        categories={categories}
        bills={bills}
        initialRuleGroups={ruleGroups}
      />
    </div>
  );
}
