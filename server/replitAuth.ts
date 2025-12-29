import "dotenv/config";
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { Pool } from "pg";
import { storage } from "./storage";

// Make Replit auth optional for local development
const isReplitAuthEnabled = !!process.env.REPLIT_DOMAINS;

const getOidcConfig = memoize(
  async () => {
    if (!isReplitAuthEnabled) {
      throw new Error("Replit auth is not enabled");
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  // Fix SSL certificate issue for Railway
  let connectionString = process.env.DATABASE_URL;
  // Remove sslmode from connection string if present, we'll handle it in Pool config
  if (connectionString && connectionString.includes('sslmode')) {
    connectionString = connectionString.replace(/[?&]sslmode=[^&]*/, '');
    // Clean up any double ? or &
    connectionString = connectionString.replace(/\?&/, '?').replace(/&&/, '&');
    if (connectionString.endsWith('?') || connectionString.endsWith('&')) {
      connectionString = connectionString.slice(0, -1);
    }
  }
  
  const pgStore = connectPg(session);
  
  // Create custom pool with SSL settings for Railway
  let storeOptions: any = {
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  };
  
  // For Railway, create a custom pool with SSL settings
  if (connectionString && connectionString.includes('railway')) {
    const pool = new Pool({
      connectionString,
      ssl: { 
        rejectUnauthorized: false
      }
    });
    storeOptions.pool = pool;
  } else {
    storeOptions.conString = connectionString;
  }
  
  const sessionStore = new pgStore(storeOptions);
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Generate a username based on email or a random string if no email
  const email = claims["email"] || "";
  let username = "";
  let nickname = "";
  
  if (email) {
    // Use part before @ as username
    username = email.split('@')[0];
  } else {
    // Generate a random username
    username = `user_${Math.floor(Math.random() * 10000)}`;
  }
  
  // Set nickname based on first name and last name or username
  if (claims["first_name"] || claims["last_name"]) {
    nickname = [claims["first_name"], claims["last_name"]].filter(Boolean).join(' ');
  } else {
    nickname = username;
  }
  
  await storage.upsertUser({
    id: claims["sub"],
    username,
    nickname,
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Only setup Replit auth if enabled
  if (isReplitAuthEnabled) {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  } else {
    // For local development without Replit auth
    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // For manual login (local development), check session instead
  if (!isReplitAuthEnabled) {
    const session = req.session as any;
    if (!req.isAuthenticated() && !session?.passport?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return next();
  }

  // Replit auth flow
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};
