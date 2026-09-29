"use server";

import { revalidatePath } from "next/cache";
import { createRule, updateRule, deleteRule, getOrCreateRuleGroup, Rule, createBill } from "@/lib/firefly";
import { cleanTransactionDescription } from "@/lib/utils/string";

/**
 * Creates an auto-categorization rule for a transaction description.
 */
export async function createAutoCategoryRule(
  originalDescription: string,
  targetCategory: string
): Promise<{ success: boolean; rule?: Rule; error?: string }> {
  try {
    if (!originalDescription || !targetCategory) {
      return { success: false, error: "Original description and target category are required" };
    }

    const keyword = cleanTransactionDescription(originalDescription);
    const ruleGroupId = await getOrCreateRuleGroup("Dashboard Auto-Categorize", "Rules created automatically from the financial dashboard");

    const rule = await createRule({
      title: `Auto-categorize: ${keyword}`,
      description: `Automatically categorize similar transactions containing '${keyword}' to '${targetCategory}'`,
      ruleGroupId,
      trigger: "store-journal",
      active: true,
      strict: false,
      stopProcessing: false,
      triggers: [
        {
          type: "description_contains",
          value: keyword,
        },
      ],
      actions: [
        {
          type: "set_category",
          value: targetCategory,
        },
      ],
    });

    revalidatePath("/settings/rules");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Error in createAutoCategoryRule:", error);
    return { success: false, error: error.message || "Failed to create auto-categorization rule" };
  }
}

/**
 * Creates a subscription (bill) in Firefly and creates a linking rule.
 */
export async function createSubscriptionRule(
  originalDescription: string,
  billName: string,
  amount: number,
  frequency: string
): Promise<{ success: boolean; rule?: Rule; error?: string }> {
  try {
    if (!originalDescription || !billName || !amount || !frequency) {
      return { success: false, error: "All fields are required" };
    }

    const keyword = cleanTransactionDescription(originalDescription);
    
    // 1. Create the Bill in Firefly III
    // Firefly expects repeat_freq to be monthly, weekly, quarterly, half-year, yearly, etc.
    await createBill({
      name: billName,
      amountMin: amount,
      amountMax: amount,
      repeatFreq: frequency,
      active: true,
    });

    // 2. Create the rule to link transactions to the bill
    const ruleGroupId = await getOrCreateRuleGroup("Dashboard Subscriptions", "Rules linking transactions to dashboard subscriptions");
    const rule = await createRule({
      title: `Link Bill: ${billName}`,
      description: `Automatically link similar transactions containing '${keyword}' to Bill '${billName}'`,
      ruleGroupId,
      trigger: "store-journal",
      active: true,
      strict: false,
      stopProcessing: false,
      triggers: [
        {
          type: "description_contains",
          value: keyword,
        },
      ],
      actions: [
        {
          type: "link_to_bill",
          value: billName, // Firefly III matches bill by name or ID in rule actions. Usually name.
        },
      ],
    });

    revalidatePath("/settings/rules");
    revalidatePath("/subscriptions");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Error in createSubscriptionRule:", error);
    return { success: false, error: error.message || "Failed to create subscription rule" };
  }
}

/**
 * Creates a transfer rule specifically for Credit Card payments.
 * Converts transaction into a transfer using "Credit Card Clearing" as the connecting account.
 */
export async function createCreditCardTransferRule(
  originalDescription: string,
  targetCategory?: string
): Promise<{ success: boolean; rule?: Rule; error?: string }> {
  try {
    if (!originalDescription) {
      return { success: false, error: "Original description is required" };
    }

    const keyword = cleanTransactionDescription(originalDescription);
    const ruleGroupId = await getOrCreateRuleGroup("Dashboard Auto-Categorize", "Rules created automatically from the financial dashboard");

    const actions = [
      {
        type: "convert_transfer",
        value: "Credit Card Clearing",
      },
    ];

    if (targetCategory) {
      actions.push({
        type: "set_category",
        value: targetCategory,
      });
    }

    const rule = await createRule({
      title: `Credit Card Transfer: ${keyword}`,
      description: `Automatically convert credit card transactions containing '${keyword}' to transfer with Credit Card Clearing`,
      ruleGroupId,
      trigger: "store-journal",
      active: true,
      strict: false,
      stopProcessing: false,
      triggers: [
        {
          type: "description_contains",
          value: keyword,
        },
      ],
      actions,
    });

    revalidatePath("/settings/rules");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Error in createCreditCardTransferRule:", error);
    return { success: false, error: error.message || "Failed to create credit card transfer rule" };
  }
}

/**
 * General purpose edit rule action for the management UI.
 */
export async function updateRuleAction(
  id: string,
  payload: Partial<Omit<Rule, "id">>
): Promise<{ success: boolean; rule?: Rule; error?: string }> {
  try {
    if (!id) {
      return { success: false, error: "Rule ID is required" };
    }

    const rule = await updateRule(id, payload);

    revalidatePath("/settings/rules");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Error in updateRuleAction:", error);
    return { success: false, error: error.message || "Failed to update rule" };
  }
}

/**
 * Action to delete a rule.
 */
export async function deleteRuleAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) {
      return { success: false, error: "Rule ID is required" };
    }

    await deleteRule(id);

    revalidatePath("/settings/rules");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteRuleAction:", error);
    return { success: false, error: error.message || "Failed to delete rule" };
  }
}
