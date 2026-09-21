import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/adminModel.js";
import RevokedAdminToken from "../models/revokedAdminTokenModel.js";

const safeAdmin = (admin) => ({
  id: admin._id,
  username: admin.username,
  displayName: admin.displayName,
  email: admin.email,
  phone: admin.phone,
  designation: admin.designation,
  department: admin.department,
  bio: admin.bio,
  profileImage: admin.profileImage,
  role: admin.role,
  active: admin.active,
});

const getEnvAdmin = () => ({
  username: String(process.env.ADMIN_USERNAME || "admin").trim(),
  password: String(process.env.ADMIN_PASSWORD || "").trim(),
});

const ensureEnvAdmin = async () => {
  const envAdmin = getEnvAdmin();

  if (!envAdmin.password) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  let admin = await Admin.findOne({ username: envAdmin.username }).select(
    "+passwordHash",
  );

  if (!admin) {
    admin = await Admin.create({
      username: envAdmin.username,
      passwordHash: await bcrypt.hash(envAdmin.password, 12),
      displayName: "Admin",
      designation: "Administrator",
      department: "Administration",
      role: "admin",
      source: "env",
      active: true,
    });
    return admin;
  }

  // The ENV account is the bootstrap account. Keep its credentials aligned with .env.
  if (admin.source === "env") {
    admin.passwordHash = await bcrypt.hash(envAdmin.password, 12);
    admin.active = true;
    await admin.save();
  }

  return admin;
};

export async function adminLogin(req, res, next) {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const envAdmin = getEnvAdmin();

    /*
    |--------------------------------------------------------------------------
    | 1. Find admin by username
    |--------------------------------------------------------------------------
    */

    let admin = await Admin.findOne({
      username,
    }).select("+passwordHash");

    /*
    |--------------------------------------------------------------------------
    | 2. Bootstrap ENV admin
    |--------------------------------------------------------------------------
    */

    if (!admin && username === envAdmin.username) {
      admin = await ensureEnvAdmin();
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Username does not exist
    |--------------------------------------------------------------------------
    */

    if (!admin) {
      /*
       * Agar supplied password bootstrap admin password hai,
       * to username galat hai.
       *
       * Otherwise dono credentials invalid hain.
       */
      if (
        envAdmin.password &&
        password === envAdmin.password
      ) {
        return res.status(401).json({
          success: false,
          message: "Wrong username.",
        });
      }

      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials. Please check your username and password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Admin account disabled
    |--------------------------------------------------------------------------
    */

    if (!admin.active) {
      return res.status(403).json({
        success: false,
        message: "This admin account is disabled.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Check password
    |--------------------------------------------------------------------------
    */

    const passwordMatches = await bcrypt.compare(
      password,
      admin.passwordHash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Wrong password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Update last login
    |--------------------------------------------------------------------------
    */

    admin.lastLoginAt = new Date();

    await admin.save();

    /*
    |--------------------------------------------------------------------------
    | 7. Create JWT
    |--------------------------------------------------------------------------
    */

    const token = jwt.sign(
      {
        id: String(admin._id),
        username: admin.username,
        role: "admin",
        email: admin.email || "",
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.ADMIN_SESSION_EXPIRES_IN || "1d",

        jwtid: crypto.randomUUID(),
      },
    );

    /*
    |--------------------------------------------------------------------------
    | 8. Success
    |--------------------------------------------------------------------------
    */

    return res.json({
      success: true,
      token,
      admin: safeAdmin(admin),
    });
  } catch (error) {
    return next(error);
  }
}

export async function adminLogout(req, res, next) {
  try {
    const token = req.adminToken;
    const decoded = req.admin;

    if (token && decoded?.exp) {
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      await RevokedAdminToken.updateOne(
        { tokenHash },
        {
          $setOnInsert: {
            tokenHash,
            expiresAt: new Date(decoded.exp * 1000),
          },
        },
        { upsert: true },
      );
    }

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentAdmin(req, res, next) {
  try {
    const admin = await Admin.findById(req.admin.id).lean();

    if (!admin || !admin.active) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found or disabled.",
      });
    }

    return res.json({
      success: true,
      admin: safeAdmin(admin),
    });
  } catch (error) {
    return next(error);
  }
}

export { safeAdmin };
