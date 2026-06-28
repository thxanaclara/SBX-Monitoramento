// Gera variações de anúncio (título + texto) e, opcionalmente, uma imagem
// para cada variação.
//
// TEXTO: usa a Gemini API (Google). Em junho de 2026, modelos como
// gemini-2.5-flash têm camada gratuita real, sem cartão de crédito — veja
// o README para os detalhes e limites. Sem GEMINI_API_KEY configurada, usa
// um gerador local por template (sempre funciona, mas é mais simples).
//
// IMAGEM: em junho de 2026 NÃO existe API de imagem com camada gratuita em
// nenhum provedor grande (Google, OpenAI). A opção mais barata e confiável é
// o modelo de imagem da própria Gemini API (~US$0,04 por imagem), cobrada
// como uso pago — por isso a geração de imagem só roda se você configurar
// ENABLE_IMAGE_GENERATION=true conscientemente. Sem isso, o sistema gera só
// texto (o que já cobre boa parte do pedido) e deixa imageUrl como null.

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";
const IMAGE_GEN_ENABLED = process.env.ENABLE_IMAGE_GENERATION === "true";

export interface AdVariation {
  variation_label: string;
  title: string;
  body: string;
  imagePrompt: string;
}

function localTemplateVariations(productName: string, price: number | null): AdVariation[] {
  const priceText = price ? `por apenas R$ ${price.toFixed(2).replace(".", ",")}` : "com preço especial";
  return [
    {
      variation_label: "Variação A — foco em urgência",
      title: `${productName}: estoque limitado`,
      body: `Você ainda não viu o motivo de tanta gente comprando ${productName.toLowerCase()}. Garanta o seu ${priceText} antes que acabe.`,
      imagePrompt: `Foto de produto em estúdio, fundo neutro, destacando ${productName}, estilo anúncio de e-commerce, com selo de "últimas unidades"`,
    },
    {
      variation_label: "Variação B — foco em benefício",
      title: `${productName} — o item que está facilitando o dia a dia de milhares de pessoas`,
      body: `Prático, eficiente e ${priceText}. Descubra por que ${productName.toLowerCase()} está conquistando tantas avaliações positivas.`,
      imagePrompt: `Foto de produto em uso no dia a dia, ambiente claro e aconchegante, destacando ${productName}, estilo anúncio de e-commerce`,
    },
    {
      variation_label: "Variação C — foco em prova social",
      title: `${productName}: o favorito da semana`,
      body: `Centenas de clientes já compraram ${productName.toLowerCase()} e aprovaram. Garanta o seu ${priceText} e confira você mesmo.`,
      imagePrompt: `Foto de produto com estrelas de avaliação e selo de "mais vendido", fundo neutro, destacando ${productName}, estilo anúncio de e-commerce`,
    },
  ];
}

async function geminiTextVariations(productName: string, price: number | null): Promise<AdVariation[] | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = `Crie 3 variações curtas de anúncio para revenda do produto "${productName}"${
    price ? `, vendido a R$ ${price}` : ""
  }. Responda APENAS em JSON (sem markdown, sem comentário), no formato:
[{"variation_label": "...", "title": "...", "body": "...", "imagePrompt": "descrição em inglês para gerar uma imagem de anúncio deste produto"}]`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return parsed;
  } catch {
    return null;
  }
}

async function geminiGenerateImage(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY || !IMAGE_GEN_ENABLED) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
    if (!imagePart) return null;

    const base64 = imagePart.inlineData.data as string;
    const uploadsDir = path.resolve(process.cwd(), "uploads", "ads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${randomUUID()}.png`;
    await writeFile(path.join(uploadsDir, fileName), Buffer.from(base64, "base64"));

    return `/uploads/ads/${fileName}`;
  } catch {
    return null;
  }
}

export async function generateAdVariations(
  productName: string,
  price: number | null
): Promise<{ variation_label: string; title: string; body: string; imageUrl: string | null }[]> {
  const variations = (await geminiTextVariations(productName, price)) ?? localTemplateVariations(productName, price);

  const withImages = await Promise.all(
    variations.map(async (v) => ({
      variation_label: v.variation_label,
      title: v.title,
      body: v.body,
      imageUrl: await geminiGenerateImage(v.imagePrompt),
    }))
  );

  return withImages;
}
