"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const AUTH_FILE_PATH = process.env.AUTH_FILE_PATH || path.join(process.cwd(), ".dashboard_auth");
const SESSION_SECRET = process.env.SESSION_SECRET || "";

export async function checkIsSetup() {
  try {
    if (!fs.existsSync(AUTH_FILE_PATH)) return false;
    const data = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, "utf-8"));
    return !!(data.passwordHash && data.fireflyApiUrl && data.fireflyPat);
  } catch {
    return false;
  }
}

export async function createPasswordAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const fireflyApiUrl = formData.get("fireflyApiUrl") as string;
  const fireflyPat = formData.get("fireflyPat") as string;
  
  if (!SESSION_SECRET) {
    return { error: "Server error: SESSION_SECRET is not configured in environment variables." };
  }
  if (!password || password.length < 4) {
    return { error: "Password must be at least 4 characters long." };
  }
  if (!fireflyApiUrl || !fireflyPat) {
    return { error: "Firefly API URL and Access Token (PAT) are required." };
  }

  // Hash the password with the session secret as a pepper
  const hashedPassword = crypto.createHash("sha256").update(password + SESSION_SECRET).digest("hex");
  
  const config = {
    passwordHash: hashedPassword,
    fireflyApiUrl: fireflyApiUrl.trim(),
    fireflyPat: fireflyPat.trim(),
  };

  // Ensure the target directory exists
  const dir = path.dirname(AUTH_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Save the configuration to the local file
  fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set("auth_session", SESSION_SECRET, {
    httpOnly: true,
    secure: false, // Set to false to allow auth over local network HTTP
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 365, // 365 days
    path: "/",
  });

  redirect("/");
}

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;

  if (!SESSION_SECRET) {
    return { error: "Server error: SESSION_SECRET is not configured in environment variables." };
  }

  if (!fs.existsSync(AUTH_FILE_PATH)) {
    return { error: "Dashboard is not set up yet." };
  }

  let savedPassword = "";
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, "utf-8"));
    savedPassword = data.passwordHash;
  } catch {
    return { error: "Authentication configuration is invalid. Please reset setup." };
  }

  const hashedInputPassword = crypto.createHash("sha256").update(password + SESSION_SECRET).digest("hex");

  if (hashedInputPassword === savedPassword) {
    const cookieStore = await cookies();
    cookieStore.set("auth_session", SESSION_SECRET, {
      httpOnly: true,
      secure: false, // Set to false to allow auth over local network HTTP
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 365, // 365 days
      path: "/",
    });

    redirect("/");
  } else {
    return { error: "Incorrect password." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_session");
  redirect("/login");
}

