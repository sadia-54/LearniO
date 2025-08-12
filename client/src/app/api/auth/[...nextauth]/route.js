import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On first sign in, fetch user_id from backend using Google idToken
      if (account?.id_token && !token.user_id) {
        try {
          const res = await fetch(`${process.env.BACKEND_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: account.id_token }),
          });
          const data = await res.json();
          token.user_id = data.user_id;  // Store backend user_id in token
        } catch (error) {
          console.error("Failed to fetch backend user_id:", error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Attach the backend user_id to the session object accessible on frontend
      session.user.user_id = token.user_id || null;
      return session;
    },

    async redirect({ url, baseUrl }) {
      return "/home"; // Redirect after login
    },
  },
  pages: {
    signIn: "/auth/signin", // Optional custom signin page
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
