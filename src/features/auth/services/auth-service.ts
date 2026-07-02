import { account } from "@/lib/appwrite";
import { LoginResponse, LogoutResponse } from "../types";

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const session = await account.createEmailPasswordSession({ email, password });
    return { session: session.$id };
  }

  async logout(): Promise<LogoutResponse> {
    await account.deleteSession({ sessionId: "current" });
    return { success: true };
  }
}

export default new AuthService();
