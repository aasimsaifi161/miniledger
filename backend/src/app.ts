import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import loanRoutes from "./routes/loan.routes";
import summaryRoutes from "./routes/summary.routes";
import { uploadsDir } from "./middleware/upload";
import { errorHandler, notFoundHandler } from "./middleware/error";

/**
 * Builds and configures the Express application.
 * Note: Does not call listen() so it can be easily imported into tests.
 */
const app = express();

// Enable CORS for mobile and web clients
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Serve uploaded receipts statically
app.use("/uploads", express.static(uploadsDir));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Register API routers
app.use("/auth", authRoutes);
app.use("/loans", loanRoutes);
app.use("/summary", summaryRoutes);

// Catch-all 404 handler for unknown routes
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

export { app };
export default app;
