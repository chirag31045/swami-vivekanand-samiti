import mongoose from "mongoose";

let connectionPromise = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("MONGODB_URI missing. Running in demo/in-memory mode.");
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(uri)
    .then(() => {
      console.log("MongoDB connected");
      return true;
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      connectionPromise = null;
      return false;
    });

  return connectionPromise;
}
