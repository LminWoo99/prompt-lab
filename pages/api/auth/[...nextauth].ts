import NextAuth, { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: { scope: "repo" },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        console.log("[JWT callback] account keys:", Object.keys(account));
        console.log("[JWT callback] access_token:", account.access_token);
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[Session callback] token.accessToken:", token.accessToken);
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      console.log("[Session callback] session.accessToken:", session.accessToken);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
