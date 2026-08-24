import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      sessionVersion: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: string;
    sessionVersion?: number;
  }
}
