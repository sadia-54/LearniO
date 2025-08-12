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
    async signIn({ user, account, profile, email, credentials }) {
      try {
        console.log('🔐 Sign in callback triggered for:', user.email);
        
        // Call backend to store user info
        const response = await fetch("http://localhost:5000/api/auth/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            profile_picture: user.image,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Backend API error:', errorData);
          throw new Error(`Backend error: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ User saved to database:', result);
        return true;
      } catch (error) {
        console.error('❌ Error saving user to database:', error);
        // Still allow sign in even if database save fails
        return true;
      }
    },
    async session({ session, token, user }) {
      // Add user ID to session if available
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      // Add user info to JWT token
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      return "/home";
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };