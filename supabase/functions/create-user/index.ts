// supabase/functions/create-user/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Role = "ADMIN" | "STUDENT" | "COACH";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401 });
    }

    const { name, email, password, role } = await req.json() as {
      name: string;
      email: string;
      password: string;
      role: Role;
    };

    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Client using caller's JWT (to identify who is calling)
    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: caller, error: callerErr } = await supabaseUserClient.auth.getUser();
    if (callerErr || !caller?.user) {
      return new Response(JSON.stringify({ error: "Invalid user session" }), { status: 401 });
    }

    const callerId = caller.user.id;

    // Check caller is ADMIN (read from profiles)
    const { data: profile, error: profErr } = await supabaseUserClient
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();

    if (profErr) {
      return new Response(JSON.stringify({ error: profErr.message }), { status: 500 });
    }

    if (profile?.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403 });
    }

    // Service role client (admin privileges) — ONLY on server
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Create Auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // optional: auto-confirm
      user_metadata: { name, role }
    });

    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "User creation failed" }), { status: 400 });
    }

    // 2) Insert profile row
    const { error: insertErr } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      name,
      email,
      role,
      status: "active",
      avatar: null
    });

    if (insertErr) {
      // rollback: delete auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true, userId: created.user.id }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
