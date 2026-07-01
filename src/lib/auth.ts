export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// MVP stub: authed by default. Backend will wire OAuth PKCE flow + token storage
// in Stronghold when implemented. This interface is the contract the router
// `beforeLoad` guards consume, so no routing code needs to change later.
export const authState: AuthState = {
  isAuthenticated: true,
  user: {
    id: "local",
    name: "Local user",
    email: "local@forge.dev",
  },
  async login(_email: string, _password: string) {
    // Future: call backend, persist tokens in Store/Stronghold, set user
    this.isAuthenticated = true;
  },
  logout() {
    this.isAuthenticated = false;
    this.user = null;
  },
};