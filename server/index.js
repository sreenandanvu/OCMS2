import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDB } from "./config/db.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const app = express();

const PORT =
  Number(process.env.PORT) || 5000;

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/*
|--------------------------------------------------------------------------
| Basic request logging
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl}`
  );

  next();
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api", apiRoutes);

/*
|--------------------------------------------------------------------------
| Root
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    name: "OCMS API",
    version: "1.0.0",
    status: "running",
  });
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(error);

    res.status(
      error.status || 500
    ).json({
      message:
        error.message ||
        "Internal server error",
    });
  }
);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log("");
    console.log(
      "================================="
    );
    console.log(
      "        OCMS API SERVER"
    );
    console.log(
      "================================="
    );
    console.log(
      `Server: http://localhost:${PORT}`
    );
    console.log(
      `API:    http://localhost:${PORT}/api`
    );
    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );
    console.log(
      "================================="
    );
    console.log("");
  });
}

startServer();