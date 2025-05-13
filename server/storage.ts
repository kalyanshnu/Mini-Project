import { 
  users, 
  sessions, 
  loginActivities, 
  type User, 
  type InsertUser,
  type Session,
  type InsertSession,
  type LoginActivity,
  type InsertLoginActivity
} from "@shared/schema";

// Storage interface for application CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPublicKey(publicKey: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOtpSecret(userId: number, otpSecret: string): Promise<void>;
  updateUserOtpEnabled(userId: number, enabled: boolean): Promise<void>;
  
  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  getSessions(userId: number): Promise<Session[]>;
  invalidateSession(id: number): Promise<void>;
  invalidateAllSessions(userId: number, exceptId?: number): Promise<void>;
  
  // Login activity operations
  createLoginActivity(activity: InsertLoginActivity): Promise<LoginActivity>;
  getLoginActivities(userId: number, limit?: number): Promise<LoginActivity[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private loginActivities: Map<number, LoginActivity>;
  private userIdCounter: number;
  private sessionIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.loginActivities = new Map();
    this.userIdCounter = 1;
    this.sessionIdCounter = 1;
    this.activityIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByPublicKey(publicKey: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.publicKey === publicKey,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      otpEnabled: true, 
      otpSecret: null,
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserOtpSecret(userId: number, otpSecret: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.otpSecret = otpSecret;
      this.users.set(userId, user);
    }
  }

  async updateUserOtpEnabled(userId: number, enabled: boolean): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.otpEnabled = enabled;
      this.users.set(userId, user);
    }
  }

  // Session operations
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const now = new Date();
    const session: Session = { 
      ...insertSession, 
      id,
      isActive: true,
      createdAt: now,
      lastActive: now
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.token === token && session.isActive
    );
  }

  async getSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.isActive)
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }

  async invalidateSession(id: number): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      session.isActive = false;
      this.sessions.set(id, session);
    }
  }

  async invalidateAllSessions(userId: number, exceptId?: number): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId && session.isActive && id !== exceptId) {
        session.isActive = false;
        this.sessions.set(id, session);
      }
    }
  }

  // Login activity operations
  async createLoginActivity(insertActivity: InsertLoginActivity): Promise<LoginActivity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: LoginActivity = { 
      ...insertActivity, 
      id,
      createdAt: now
    };
    this.loginActivities.set(id, activity);
    return activity;
  }

  async getLoginActivities(userId: number, limit = 10): Promise<LoginActivity[]> {
    return Array.from(this.loginActivities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
