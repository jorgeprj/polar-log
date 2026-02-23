import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

const PUBLIC_ROUTES = ["/", "/pol"]; 

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    if (!hasEnvVars) return supabaseResponse;

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

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

    const path = request.nextUrl.pathname;

    const isAuthGroup = path.startsWith("/auth");
    const isLoginPage = path === "/auth/login";

    const isPublicRoute =
        isAuthGroup || PUBLIC_ROUTES.includes(path);

    if (!user) {
        if (!isLoginPage) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    if (isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    if (isPublicRoute) {
        return supabaseResponse;
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/unauthorized";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}