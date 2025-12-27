import "./config/env";

import express, { Application } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import expressLayouts from "express-ejs-layouts";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import { loadUser } from "./middleware/loadUser";
import { queryParams } from "./middleware/queryParams";
import router from "./routes";

const app: Application = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use(logger);
app.use(loadUser);
app.use(queryParams);

// Routes
app.use("/", router);

// Error handling middleware (must be last)
app.use(errorHandler);

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
}

export default app;
