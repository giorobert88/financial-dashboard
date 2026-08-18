import fs from "fs";
import path from "path";

const AUTH_FILE_PATH = process.env.AUTH_FILE_PATH || path.join(process.cwd(), ".dashboard_auth");

function getStoredAuthData() {
  try {
    if (fs.existsSync(AUTH_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(AUTH_FILE_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to parse stored auth details:", e);
  }
  return null;
}

export function getActiveApiUrl(): string {
  try {
    const overridePath = path.join(process.cwd(), ".url_override");
    if (fs.existsSync(overridePath)) {
      const url = fs.readFileSync(overridePath, "utf-8").trim();
      return url.endsWith('/') ? url.slice(0, -1) : url;
    }
    const stored = getStoredAuthData();
    if (stored?.fireflyApiUrl) {
      return stored.fireflyApiUrl.endsWith('/') ? stored.fireflyApiUrl.slice(0, -1) : stored.fireflyApiUrl;
    }
  } catch (err) {
    console.error("Failed to read API URL override file:", err);
  }
  const defaultUrl = process.env.FIREFLY_API_URL || "http://localhost:8080";
  return defaultUrl.endsWith('/') ? defaultUrl.slice(0, -1) : defaultUrl;
}

export function getActivePat(): string {
  try {
    const overridePath = path.join(process.cwd(), ".pat_override");
    if (fs.existsSync(overridePath)) {
      return fs.readFileSync(overridePath, "utf-8").trim();
    }
    const stored = getStoredAuthData();
    if (stored?.fireflyPat) {
      return stored.fireflyPat;
    }
  } catch (err) {
    console.error("Failed to read PAT override file:", err);
  }
  return process.env.FIREFLY_PAT || "";
}

export async function isDemoModeActive(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get("demo_mode")?.value === "true";
  } catch {
    return false;
  }
}

const demoNameMap: Record<string, string> = {};
let demoCounter = 1;
function getDemoName(realName: string | null | undefined): string {
  if (!realName) return "Unknown";
  if (!demoNameMap[realName]) {
    demoNameMap[realName] = `Demo Entity ${demoCounter++}`;
  }
  return demoNameMap[realName];
}

function scaleValue(valStr: string | null | undefined): string {
  if (!valStr) return "0";
  const num = parseFloat(valStr);
  if (isNaN(num)) return valStr;
  return (num * 0.65).toFixed(2);
}

export function anonymizeData(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => anonymizeData(item));
  }
  if (typeof data === "object") {
    const newData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "name" || key === "source_name" || key === "destination_name" || key === "description" || key === "title") {
        newData[key] = typeof value === "string" ? getDemoName(value) : value;
      } else if (key === "current_balance" || key === "balance" || key === "amount" || key === "amount_min" || key === "amount_max") {
        newData[key] = typeof value === "string" ? scaleValue(value) : value;
      } else {
        newData[key] = anonymizeData(value);
      }
    }
    return newData;
  }
  return data;
}

export async function fetchFirefly(
  endpoint: string,
  params: Record<string, string> = {},
  options: RequestInit = {}
) {
  const isDemo = await isDemoModeActive();
  
  if (isDemo && options.method && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method.toUpperCase())) {
    console.log(`Demo Mode: Intercepted ${options.method} request to ${endpoint}`);
    return { data: { id: "demo-id", type: "success", attributes: { name: "Demo Success", amount_min: "0", amount_max: "0", active: true } } };
  }

  const apiUrl = getActiveApiUrl();
  const url = new URL(`${apiUrl}/api/v1${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const pat = getActivePat();

  const fetchOptions: RequestInit = {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...options,
  };

  // Tiered caching logic:
  if (options.next && ('revalidate' in options.next)) {
    // Caller specified revalidation, keep it as-is
  } else if (options.cache) {
    // Caller specified cache strategy, keep it as-is
  } else {
    // Default: do not cache (fetch fresh data to ensure mutations reflect immediately)
    fetchOptions.cache = "no-store";
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Firefly API Error:", response.status, response.statusText, "URL:", url.toString(), errorText);
    throw new Error(`Firefly API failed: ${response.statusText}`);
  }

  let jsonData = await response.json();
  if (isDemo) {
    jsonData = anonymizeData(jsonData);
  }
  return jsonData;
}

/** Mutation helper for PUT/PATCH requests to Firefly III */
export async function mutateFirefly(
  endpoint: string,
  method: "POST" | "PUT" | "PATCH",
  body: unknown,
): Promise<Response> {
  const isDemo = await isDemoModeActive();
  if (isDemo) {
    console.log(`Demo Mode: Intercepted ${method} request to ${endpoint}`);
    return new Response(JSON.stringify({ data: { id: "demo-id", type: "success", attributes: {} } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiUrl = getActiveApiUrl();
  const url = `${apiUrl}/api/v1${endpoint}`;
  const pat = getActivePat();
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return response;
}

export function parseNotes(notesStr: string | null): any {
  if (!notesStr) return null;
  try {
    return JSON.parse(notesStr);
  } catch {
    return null;
  }
}
