import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const azureConfigured =
  !!process.env.AZURE_AD_CLIENT_ID &&
  !!process.env.AZURE_AD_CLIENT_SECRET &&
  !!process.env.AZURE_AD_TENANT_ID;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            throw new Error("User not found");
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!passwordMatch) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error: any) {
          console.error("Auth Error:", error);
          // Let NextAuth handle the error and display it to the user
          throw error;
        }
      }
    }),
    // Microsoft Entra ID (Azure AD) — only registered when env is configured.
    ...(azureConfigured
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID!,
            authorization: { params: { scope: "openid profile email User.Read" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    // Gate Microsoft sign-ins: link to an existing user, or auto-provision
    // (when MS_SSO_AUTO_PROVISION !== "false"). Single-tenant already limits this
    // to the company directory.
    async signIn({ user, account, profile }) {
      // Credentials sign-in is already validated in authorize()
      if (account?.provider !== "azure-ad") return true;

      const email = (
        user?.email ||
        (profile as any)?.email ||
        (profile as any)?.preferred_username ||
        (profile as any)?.upn ||
        ""
      ).toLowerCase();

      if (!email) return false;

      const azureName = user?.name || (profile as any)?.name || email.split("@")[0];

      // Case-insensitive match so an invite stored as "Foo@x.com" links to SSO "foo@x.com"
      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });

      if (existing) {
        if (!existing.isActive) return false; // deactivated users cannot sign in
        // Azure is the source of truth for profile — keep the DB name in sync
        if (azureName && azureName !== existing.name) {
          await prisma.user.update({ where: { id: existing.id }, data: { name: azureName } });
        }
        return true;
      }

      // No account yet — auto-provision unless strict invite-only is enforced
      const autoProvision = process.env.MS_SSO_AUTO_PROVISION !== "false";
      if (!autoProvision) return false;

      // If this email was invited, honour the invite's role and mark it accepted
      const invite = await prisma.invitation.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });
      const defaultRole = await prisma.workspaceRole.findFirst({ where: { isDefault: true } });
      const workspaceRoleId = invite?.roleId || defaultRole?.id;

      await prisma.user.create({
        data: {
          email,
          name: azureName,
          passwordHash: "", // SSO-only account (no local password)
          role: "USER",
          workspaceRoleId,
        },
      });

      if (invite) {
        await prisma.invitation.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // On sign-in, resolve our DB user so the token always carries the real DB id + role
      if (user) {
        if (account?.provider === "azure-ad") {
          const email = (user.email || token.email || "").toLowerCase();
          const dbUser = email
            ? await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
            : null;
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.name = dbUser.name; // keep session name aligned with synced DB name
          }
        } else {
          token.id = (user as any).id;
          token.role = (user as any).role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-default-key-for-dev",
};
