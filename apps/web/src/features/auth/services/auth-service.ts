import { ID } from "appwrite";
import { account } from "@/lib/appwrite";
import { LoginResponse, LogoutResponse, RegisterResponse } from "../types";

class AuthService {
  async register(email: string, password: string, name: string): Promise<RegisterResponse> {
    const user = await account.create(ID.unique(), email, password, name);
    return {
      id: user.$id,
      email: user.email,
      name: user.name,
    };
  }

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
