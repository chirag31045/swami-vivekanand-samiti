import mongoose from "mongoose";

const revokedAdminTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| TTL Index
|--------------------------------------------------------------------------
| Token automatically MongoDB se remove ho jayega
| jab expiresAt time cross ho jayega.
*/
revokedAdminTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

export default mongoose.model(
  "RevokedAdminToken",
  revokedAdminTokenSchema,
);