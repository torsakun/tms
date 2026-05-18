import { withAuth } from "next-auth/middleware";
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Prevent unauthenticated access to system and data APIs
  matcher: [
    "/",
    "/dashboards/:path*",
    "/projects/:path*", 
    "/workspace/:path*",
    "/settings/:path*",
    "/api/projects/:path*",
    "/api/runs/:path*",
    "/api/cases/:path*",
    "/api/workspace/:path*"
  ],
};
