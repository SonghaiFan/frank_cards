import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Unauthorized." }, 401);

  const { confirmation } = await request.json().catch(() => ({}));
  if (confirmation !== "DELETE") return json({ error: "Confirmation is required." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    console.error("Missing Supabase environment configuration for account deletion.");
    return json({ error: "Account deletion is temporarily unavailable." }, 500);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Unauthorized." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Storage ownership prevents auth.admin.deleteUser. Remove all files in the
  // user's avatar folder before deleting auth.users and its cascading rows.
  const { data: avatarFiles, error: avatarListError } = await adminClient.storage.from("avatars").list(user.id, { limit: 1000 });
  if (avatarListError) {
    console.error("Unable to list avatar files before account deletion.", avatarListError);
    return json({ error: "Account deletion is temporarily unavailable." }, 500);
  }

  const avatarPaths = (avatarFiles ?? []).map((file) => `${user.id}/${file.name}`);
  if (avatarPaths.length > 0) {
    const { error: avatarRemoveError } = await adminClient.storage.from("avatars").remove(avatarPaths);
    if (avatarRemoveError) {
      console.error("Unable to remove avatar files before account deletion.", avatarRemoveError);
      return json({ error: "Account deletion is temporarily unavailable." }, 500);
    }
  }

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id, false);
  if (deleteUserError) {
    console.error("Unable to delete user account.", deleteUserError);
    return json({ error: "Account deletion is temporarily unavailable." }, 500);
  }

  return json({ deleted: true });
});
