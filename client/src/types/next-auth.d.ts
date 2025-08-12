// next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Include the default fields */
      name?: string | null;
      email?: string | null;
      image?: string | null;

      /** Add your custom user_id property */
      user_id?: string;
    };
  }

  interface User {
    user_id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user_id?: string;
  }
}
