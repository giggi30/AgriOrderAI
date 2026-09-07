/**
 * Simulazione di un database utenti per AgriOrder AI.
 * In produzione, questo dovrebbe chiamare un'API reale collegata a un DB.
 */

export interface User {
  id: string;
  companyName: string;
  email: string;
}

const USERS_KEY = 'agriorder_users';
const SESSION_KEY = 'agriorder_session';

export const getStoredUsers = (): any[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const registerUser = (companyName: string, email: string, password: string): { success: boolean, message: string } => {
  const users = getStoredUsers();

  if (users.find(u => u.email === email)) {
    return { success: false, message: 'Email già registrata' };
  }

  const newUser = {
    id: crypto.randomUUID(),
    companyName,
    email,
    password // In una app reale, questa andrebbe hashata!
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { success: true, message: 'Registrazione completata' };
};

export const loginUser = (email: string, password: string): { success: boolean, user?: User, message: string } => {
  const users = getStoredUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return { success: false, message: 'Credenziali non valide' };
  }

  const sessionUser: User = {
    id: user.id,
    companyName: user.companyName,
    email: user.email
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return { success: true, user: sessionUser, message: 'Login effettuato' };
};

export const getSessionUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('isLoggedIn');
};
