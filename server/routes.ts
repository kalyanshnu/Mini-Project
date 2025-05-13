import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authService } from "./services/authService";
import { otpService } from "./services/otpService";
import { emailService } from "./services/emailService";
import { geoLocationService } from "./services/geoLocationService";
import * as crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import { loginSchema, otpSchema, registerSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session
  app.use(
    session({
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // 24 hours
      }),
      secret: process.env.SESSION_SECRET || "ECC-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
  
  // Generate public key from catchphrase (needed for client-server key consistency)
  app.post("/api/auth/generate-public-key", async (req: Request, res: Response) => {
    try {
      const { catchphrase } = req.body;
      
      if (!catchphrase || typeof catchphrase !== 'string') {
        return res.status(400).json({ message: "Invalid catchphrase" });
      }
      
      const publicKey = await authService.generatePublicKey(catchphrase);
      
      res.status(200).json({ publicKey });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Error handling middleware
  const handleError = (err: any, res: Response) => {
    console.error("Error:", err);
    
    if (err instanceof z.ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    return res.status(status).json({ message });
  };

  // User Registration
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email) || 
                           await storage.getUserByUsername(data.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Create a new user
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        publicKey: data.publicKey,
      });
      
      // Generate OTP secret for the user
      const otpSecret = otpService.generateSecret();
      await storage.updateUserOtpSecret(user.id, otpSecret);
      
      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.username);
      
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Identity Verification (Step 1 of login)
  app.post("/api/auth/verify-identity", async (req: Request, res: Response) => {
    try {
      const { email, catchphrase, publicKey: clientPublicKey } = req.body;
      
      // Validate basic fields
      loginSchema.parse({ email, catchphrase });
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if client sent a public key and it matches (preferred method)
      if (clientPublicKey && clientPublicKey === user.publicKey) {
        console.log("Public key match (client-provided key)");
      } else {
        // Generate public key from catchphrase as fallback
        const serverPublicKey = await authService.generatePublicKey(catchphrase);
        
        console.log("Client public key:", clientPublicKey || "not provided");
        console.log("Server public key:", serverPublicKey);
        console.log("Stored public key:", user.publicKey);
        
        // Verify if the generated public key matches
        if (serverPublicKey !== user.publicKey) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
      }
      
      // Generate and send OTP
      const otp = otpService.generateOTP(user.otpSecret!);
      await emailService.sendOTP(user.email, otp);
      
      // Explicitly log the OTP for development testing
      console.log(`[DEVELOPMENT OTP] Email: ${user.email}, OTP: ${otp}`);
      
      // Store user info in session for the next step
      req.session.pendingAuth = {
        userId: user.id,
        email: user.email,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      };
      
      res.status(200).json({ message: "Identity verified, OTP sent to email" });
    } catch (err) {
      handleError(err, res);
    }
  });

  // OTP Verification (Step 2 of login)
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { email, otp } = otpSchema.parse(req.body);
      
      // Check if there's a pending auth
      if (!req.session.pendingAuth) {
        return res.status(400).json({ message: "No pending authentication" });
      }
      
      // Validate session expiration
      if (req.session.pendingAuth.expiresAt < Date.now()) {
        delete req.session.pendingAuth;
        return res.status(400).json({ message: "Authentication expired, please start over" });
      }
      
      // Validate email
      if (req.session.pendingAuth.email !== email) {
        return res.status(400).json({ message: "Email mismatch" });
      }
      
      const userId = req.session.pendingAuth.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        delete req.session.pendingAuth;
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify OTP
      const isValid = otpService.verifyOTP(user.otpSecret!, otp);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid OTP" });
      }
      
      // Get geolocation info
      const ipAddress = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '';
      const locationInfo = await geoLocationService.getLocationFromIp(ipAddress);
      const deviceInfo = req.headers['user-agent'] || '';
      
      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Create new session
      const session = await storage.createSession({
        userId: user.id,
        token: sessionToken,
        deviceInfo: deviceInfo,
        ipAddress: ipAddress,
        location: locationInfo.city && locationInfo.country ? 
                  `${locationInfo.city}, ${locationInfo.country}` : 
                  'Unknown location',
      });
      
      // Create login activity
      let status = 'successful';
      
      // Check if this is a new location
      const userActivities = await storage.getLoginActivities(user.id);
      const isSameLocationExists = userActivities.some(
        activity => activity.location === session.location
      );
      
      if (!isSameLocationExists && userActivities.length > 0) {
        status = 'new_location';
      }
      
      await storage.createLoginActivity({
        userId: user.id,
        ipAddress: ipAddress,
        deviceInfo: deviceInfo,
        location: session.location,
        status: status,
      });
      
      // Send login notification email
      await emailService.sendLoginAlert(
        user.email, 
        session.location, 
        deviceInfo, 
        status === 'new_location'
      );
      
      // Clear the pending auth
      delete req.session.pendingAuth;
      
      // Set auth info in session
      req.session.auth = {
        userId: user.id,
        sessionId: session.id,
        sessionToken: sessionToken
      };
      
      res.status(200).json({ 
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        locationInfo
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Logout current session
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      if (!req.session.auth) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { sessionId } = req.session.auth;
      await storage.invalidateSession(sessionId);
      
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          throw err;
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Force logout all other sessions
  app.post("/api/auth/force-logout", async (req: Request, res: Response) => {
    try {
      if (!req.session.auth) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { userId, sessionId } = req.session.auth;
      await storage.invalidateAllSessions(userId, sessionId);
      
      res.status(200).json({ message: "All other sessions have been terminated" });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get user profile
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.auth) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { userId } = req.session.auth;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        otpEnabled: user.otpEnabled,
        createdAt: user.createdAt,
        publicKey: user.publicKey
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get active sessions
  app.get("/api/auth/sessions", async (req: Request, res: Response) => {
    try {
      if (!req.session.auth) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { userId, sessionId } = req.session.auth;
      const sessions = await storage.getSessions(userId);
      
      // Mark current session
      const enrichedSessions = sessions.map(session => ({
        ...session,
        isCurrent: session.id === sessionId
      }));
      
      res.status(200).json(enrichedSessions);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Get login activities
  app.get("/api/auth/login-activities", async (req: Request, res: Response) => {
    try {
      if (!req.session.auth) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { userId } = req.session.auth;
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getLoginActivities(userId, limit);
      
      res.status(200).json(activities);
    } catch (err) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
