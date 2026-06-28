import express from "express";
import cors from "cors";
import path from "path";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { adsRouter } from "./routes/ads.js";
import { usersRouter } from "./routes/users.js";
import { webhooksRouter } from "./routes/webhooks.js";

export const app = express();

app.use(cors());
app.use(express.json());

// imagens geradas pelo gerador de anúncios ficam acessíveis aqui
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/ads", adsRouter);
app.use("/api/users", usersRouter);
app.use("/api/webhooks", webhooksRouter);
