import { getSupabaseServerClient, isSupabaseConfigured } from "./server";

export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const sb = getSupabaseServerClient();

  try {
    const {
      data: { user },
      error,
    } = await sb.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      email_confirmed_at: user.email_confirmed_at || null,
      phone_confirmed_at: user.phone_confirmed_at || null,
      user_metadata: user.user_metadata || null,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function getUserProfile(userId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const sb = getSupabaseServerClient();

  try {
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function isAdminUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const sb = getSupabaseServerClient();

  try {
    const { data, error } = await sb
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
