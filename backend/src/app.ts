import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

const app: Application = express();

// Security Middlewares
app.use(helmet());

// Enable CORS
app.use(cors());

// Compress responses
app.use(compression());

// Parse JSON
app.use(express.json());

// Parse URL Encoded
app.use(express.urlencoded({ extended: true }));

export default app;