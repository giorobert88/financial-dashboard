"use server";

import { revalidatePath } from "next/cache";
import { updateAccountNotes, getGroupedAccounts, CreditCardConfig, clearNetWorthCache } from "@/lib/firefly";
import { PaydayConfig } from "@/lib/payday";

export async function setPrimaryAccount(newAccountId: string): Promise<{ success: boolean; error?: string }> {
  let oldPrimaryId: string | null = null;
  
  try {
    const groups = await getGroupedAccounts();
    
    for (const group of groups) {
      const primary = group.accounts.find((acc) => acc.isPrimarySource);
      if (primary) {
        oldPrimaryId = primary.id;
        break;
      }
    }

    if (oldPrimaryId === newAccountId) {
      return { success: true };
    }

    if (oldPrimaryId) {
      await updateAccountNotes(oldPrimaryId, { current_source: undefined });
    }

    try {
      await updateAccountNotes(newAccountId, { current_source: true });
    } catch (err: any) {
      if (oldPrimaryId) {
        await updateAccountNotes(oldPrimaryId, { current_source: true });
      }
      throw err;
    }

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/settings");

    return { success: true };
  } catch (err: any) {
    console.error("Error setting primary account:", err);
    return { success: false, error: err.message || "Failed to update primary account" };
  }
}

export async function updateCreditCardConfig(
  accountId: string,
  config: CreditCardConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const stmtDay = Number(config.statement_day);
    const dueDay = Number(config.due_day);
    
    if (isNaN(stmtDay) || stmtDay < 1 || stmtDay > 31) {
      return { success: false, error: "Statement day must be a number between 1 and 31" };
    }
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      return { success: false, error: "Due day must be a number between 1 and 31" };
    }

    const patch: Record<string, any> = {
      calc_type: config.calc_type,
      statement_day: stmtDay,
      due_day: dueDay,
    };

    if (config.calc_type === "min") {
      const minPercent = config.min_percent !== undefined ? Number(config.min_percent) : undefined;
      const minFloor = config.min_floor !== undefined ? Number(config.min_floor) : undefined;

      if (minPercent !== undefined && (isNaN(minPercent) || minPercent < 0 || minPercent > 1)) {
        return { success: false, error: "Minimum payment percentage must be between 0 and 1 (e.g. 0.025 for 2.5%)" };
      }
      if (minFloor !== undefined && (isNaN(minFloor) || minFloor < 0)) {
        return { success: false, error: "Minimum floor must be a positive number" };
      }

      patch.min_percent = minPercent;
      patch.min_floor = minFloor;
    } else {
      patch.min_percent = undefined;
      patch.min_floor = undefined;
    }

    await updateAccountNotes(accountId, patch);

    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/settings");

    return { success: true };
  } catch (err: any) {
    console.error("Error updating credit card config:", err);
    return { success: false, error: err.message || "Failed to update credit card configuration" };
  }
}

export async function forceRefresh(): Promise<{ success: boolean }> {
  clearNetWorthCache();
  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/uncategorized");
  return { success: true };
}

export async function toggleDemoMode(enabled: boolean): Promise<{ success: boolean }> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  if (enabled) {
    cookieStore.set("demo_mode", "true", { path: "/" });
  } else {
    cookieStore.delete("demo_mode");
  }

  // Clear cache and refresh all routes
  clearNetWorthCache();
  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/uncategorized");
  return { success: true };
}

import fs from "fs";
import path from "path";

export async function updateFireflyPat(newPat: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const AUTH_FILE_PATH = process.env.AUTH_FILE_PATH || path.join(process.cwd(), ".dashboard_auth");
    if (fs.existsSync(AUTH_FILE_PATH)) {
      try {
        const authData = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, "utf-8"));
        if (newPat === null || newPat.trim() === "") {
          delete authData.fireflyPat;
        } else {
          authData.fireflyPat = newPat.trim();
        }
        fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(authData, null, 2), "utf-8");
      } catch (e) {
        console.error("Failed to update PAT in .dashboard_auth:", e);
      }
    }

    const overridePath = path.join(process.cwd(), ".pat_override");
    if (newPat === null || newPat.trim() === "") {
      if (fs.existsSync(overridePath)) {
        fs.unlinkSync(overridePath);
      }
    } else {
      fs.writeFileSync(overridePath, newPat.trim(), "utf-8");
    }
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/uncategorized");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating Firefly PAT:", err);
    return { success: false, error: err.message || "Failed to update PAT key" };
  }
}

export async function updateFireflyUrl(newUrl: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const AUTH_FILE_PATH = process.env.AUTH_FILE_PATH || path.join(process.cwd(), ".dashboard_auth");
    if (fs.existsSync(AUTH_FILE_PATH)) {
      try {
        const authData = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, "utf-8"));
        if (newUrl === null || newUrl.trim() === "") {
          delete authData.fireflyApiUrl;
        } else {
          authData.fireflyApiUrl = newUrl.trim();
        }
        fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(authData, null, 2), "utf-8");
      } catch (e) {
        console.error("Failed to update URL in .dashboard_auth:", e);
      }
    }

    const overridePath = path.join(process.cwd(), ".url_override");
    if (newUrl === null || newUrl.trim() === "") {
      if (fs.existsSync(overridePath)) {
        fs.unlinkSync(overridePath);
      }
    } else {
      try {
        new URL(newUrl.trim());
      } catch {
        return { success: false, error: "Invalid URL format" };
      }
      fs.writeFileSync(overridePath, newUrl.trim(), "utf-8");
    }
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/uncategorized");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating Firefly URL:", err);
    return { success: false, error: err.message || "Failed to update API URL" };
  }
}

import { createRuleGroup as apiCreateRuleGroup, RuleGroup } from "@/lib/api/rules";
import { createBill as apiCreateBill, updateBill as apiUpdateBill, Bill } from "@/lib/api/bills";

export async function createRuleGroupAction(title: string): Promise<{ success: boolean; group?: RuleGroup; error?: string }> {
  try {
    if (!title.trim()) {
      return { success: false, error: "Title is required" };
    }
    const group = await apiCreateRuleGroup(title);
    revalidatePath("/settings/rules");
    return { success: true, group };
  } catch (err: any) {
    console.error("Error creating rule group:", err);
    return { success: false, error: err.message || "Failed to create rule group" };
  }
}

export async function createBillAction(payload: {
  name: string;
  amountMin: number;
  amountMax: number;
  repeatFreq: string;
  active?: boolean;
  date?: string;
}): Promise<{ success: boolean; bill?: Bill; error?: string }> {
  try {
    if (!payload.name.trim()) {
      return { success: false, error: "Name is required" };
    }
    const bill = await apiCreateBill(payload);
    revalidatePath("/settings/subscriptions");
    return { success: true, bill };
  } catch (err: any) {
    console.error("Error creating bill/subscription:", err);
    return { success: false, error: err.message || "Failed to create subscription" };
  }
}

export async function updateBillAction(
  id: string,
  payload: {
    name: string;
    amountMin: number;
    amountMax: number;
    repeatFreq: string;
    active: boolean;
    date?: string;
  }
): Promise<{ success: boolean; bill?: Bill; error?: string }> {
  try {
    const bill = await apiUpdateBill(id, payload);
    revalidatePath("/settings/subscriptions");
    revalidatePath(`/settings/subscriptions/${id}`);
    return { success: true, bill };
  } catch (err: any) {
    console.error("Error updating bill/subscription:", err);
    return { success: false, error: err.message || "Failed to update subscription" };
  }
}

export async function updatePaydayConfigAction(
  config: PaydayConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const AUTH_FILE_PATH = process.env.AUTH_FILE_PATH || path.join(process.cwd(), ".dashboard_auth");
    const PAYDAY_CONFIG_PATH = process.env.PAYDAY_CONFIG_PATH || path.join(path.dirname(AUTH_FILE_PATH), ".payday_config");

    if (config.ruleType === "fixed_date" && (!config.frequency || config.frequency === "monthly")) {
      const fd = config.fixedDate;
      if (fd === undefined || isNaN(fd) || fd < 1 || fd > 31) {
        return { success: false, error: "Fixed date must be a number between 1 and 31" };
      }
    }

    if (config.frequency && config.frequency !== "monthly") {
      if (!config.anchorDate || !config.anchorDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return { success: false, error: "Valid Anchor Date (YYYY-MM-DD) is required for weekly or bi-weekly frequencies" };
      }
    }

    const payload = {
      frequency: config.frequency || "monthly",
      anchorDate: config.frequency !== "monthly" ? config.anchorDate : undefined,
      ruleType: config.ruleType,
      fixedDate: config.ruleType === "fixed_date" ? Number(config.fixedDate) : undefined,
      rollbackWeekend: config.ruleType === "fixed_date" ? !!config.rollbackWeekend : undefined,
    };

    const dir = path.dirname(PAYDAY_CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(PAYDAY_CONFIG_PATH, JSON.stringify(payload, null, 2), "utf-8");

    clearNetWorthCache();
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/uncategorized");

    return { success: true };
  } catch (err: any) {
    console.error("Error updating payday config:", err);
    return { success: false, error: err.message || "Failed to update payday configuration" };
  }
}

import { setDefaultCurrencyApi } from "@/lib/api/currencies";

export async function setDisplayCurrencyAction(currency: {
  id?: string;
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("display_currency", JSON.stringify(currency), { path: "/", maxAge: 60 * 60 * 24 * 365 });

    if (currency.id || currency.code) {
      await setDefaultCurrencyApi(currency.id || currency.code).catch(() => false);
    }

    clearNetWorthCache();
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/settings");
    revalidatePath("/settings/currency");
    revalidatePath("/dashboard");
    revalidatePath("/uncategorized");

    return { success: true };
  } catch (err: any) {
    console.error("Error setting display currency:", err);
    return { success: false, error: err.message || "Failed to update display currency" };
  }
}

