import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // <-- REQUIRED in production
  callbacks: {
    async signIn({ user }) {
      try {
        console.log('🔐 Sign in callback triggered for:', user.email);
        
        const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
        const response = await fetch(`${API_BASE}/api/auth/users`, {
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
        
        // Store the user_id from backend response
        user.user_id = result.user.user_id;
        
        return true;
      } catch (error) {
        console.error('❌ Error saving user to database:', error);
        return true; // allow sign in even if DB save fails
      }
    },
    async jwt({ token, user }) {
      if (user?.user_id) {
        token.user_id = user.user_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.user_id) {
        session.user.user_id = token.user_id;
      }
      return session;
    },
    async redirect() {
      return "/home";
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
