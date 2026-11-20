import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import "next-auth/jwt";
import { getUserByUsername } from "@/lib/database";
import { verifyPassword } from "@/lib/auth-passwords";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "viewer";
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: "admin" | "viewer";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "viewer";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "39ed4185bf218ca28f72f0346fc59a3d9b7d6d99ef793b85d382903332f36c2d",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        const username = String(credentials.username).trim().toLowerCase();
        const password = String(credentials.password);

        const user = getUserByUsername(username);
        if (!user) {
          return null;
        }

        const isValid = verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.displayName || user.username,
          email: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as "admin" | "viewer") || "viewer";
      }
      return session;
    },
  },
});
