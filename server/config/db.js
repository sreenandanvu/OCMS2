import mongoose from "mongoose";

export async function connectDB() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/ocms2";

  try {
    await mongoose.connect(uri);

    console.log("MongoDB connected");
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    process.exit(1);
  }
}