import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
	// Check for session cookie
	const sessionCookie = getSessionCookie(request);

	// If no session cookie, redirect to login
	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}

	return NextResponse.next();
}

// Apply middleware to dashboard routes and their sub-routes
export const config = {
	matcher: ["/dashboard/:path*"],
};
