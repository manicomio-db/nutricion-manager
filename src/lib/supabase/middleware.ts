import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  cliente: "/cliente",
  admin: "/admin",
};

function roleAllowed(pathname: string, role: string) {
  if (pathname.startsWith("/cliente")) return role === "cliente";
  if (pathname.startsWith("/admin")) return role === "admin";
  return true;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = ["/cliente", "/admin"].some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isProtected || pathname === "/login")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "cliente";

    if (isProtected && !roleAllowed(pathname, role)) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role] ?? "/login";
      return NextResponse.redirect(url);
    }

    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role] ?? "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
