import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = (process.env.TEST_ADMIN_USERNAME ?? "adminegoto").trim();
const email = (process.env.TEST_ADMIN_EMAIL ?? `${username}@egoto.test`)
  .trim()
  .toLowerCase();
const password = process.env.TEST_ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !password) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and TEST_ADMIN_PASSWORD in the local environment.",
  );
}

if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Service-role key must not use a NEXT_PUBLIC_ variable.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const listed = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listed.error) throw listed.error;
  const existingUser = listed.data.users.find(
    (candidate) => candidate.email?.toLowerCase() === email,
  );
  let userId: string;

  if (existingUser) {
    const updated = await supabase.auth.admin.updateUserById(existingUser.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        ...existingUser.user_metadata,
        username,
      },
    });
    if (updated.error) throw updated.error;
    userId = updated.data.user.id;
  } else {
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;
  }

  const profile = await supabase.from("admin_profiles").upsert(
    {
      user_id: userId,
      role: "ADMIN",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (profile.error) throw profile.error;

  console.log(`Test admin ready. Username: ${username}`);
  console.log(`Login email: ${email}`);
  console.log(
    "Password: supplied via TEST_ADMIN_PASSWORD (not stored in source).",
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);
  console.error(`Test admin creation failed: ${message}`);
  process.exitCode = 1;
});
