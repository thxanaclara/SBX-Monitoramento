import express from "express";
import cors from "cors";
import path from "path";
import { authRouter } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { productsRouter } from "./routes/products";
import { adsRouter } from "./routes/ads";
import { usersRouter } from "./routes/users";
import { webhooksRouter } from "./routes/webhooks";

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
