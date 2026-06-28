# SBX Monitoramento

Plataforma para cadastrar produtos da Shopee, monitorar vendas diárias e
flutuação de preço automaticamente, classificar produtos por potencial de
validação e gerar variações de anúncio (texto + imagem) — com atualização
automática a cada 10 minutos, sem precisar manter nada aberto.

Este projeto **não depende de Lovable nem de Supabase**: o backend é uma API
própria (Node.js + Express) com banco de dados local (SQLite via Prisma),
pensada para você hospedar onde quiser.

Veja a especificação completa em [`docs/SPEC.md`](docs/SPEC.md).

## Estrutura do repositório

```
backend/      API (Node.js + Express + Prisma + SQLite) — autenticação, regras de negócio, IA
frontend/     Interface web (React + Vite + Tailwind)
extension/    Extensão de navegador (atalho de cadastro)
.github/      Workflow do GitHub Actions (sincronização a cada 10 min)
```

## 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed      # cria a conta de teste com os 2 usuários abaixo
npm run dev        # API em http://localhost:3001
```

### Usuários de teste (criados pelo seed)

| Papel | E-mail | Senha |
|---|---|---|
| Admin | `ana@sbxmonitoramento.com.br` | `Asbx0666!` |
| Staff | `vitor@sbxmonitoramento.com.br` | `staff` |

Em produção, os usuários reais são criados via webhook de assinatura
(`POST /api/webhooks/subscription`) ou pela tela "Usuários" — nunca pelo seed.

### Variáveis de ambiente importantes (`backend/.env`)

- `JWT_SECRET` / `SYNC_API_KEY` / `PAYMENT_WEBHOOK_SECRET`: gere valores
  aleatórios longos para cada uma (ex.: `openssl rand -hex 32`).
- `GEMINI_API_KEY`: opcional, mas necessária para os textos dos anúncios
  saírem melhores que o gerador local por template (veja a seção de IA).
- `ENABLE_IMAGE_GENERATION`: `true` só se você aceitar o custo por imagem
  (veja a seção de IA) — por padrão vem `false` e o sistema gera só texto.

## 2. Front-end

```bash
cd frontend
cp .env.example .env   # aponte VITE_API_URL para a URL do backend
npm install
npm run dev             # http://localhost:5173
```

## 3. IA para o gerador de anúncios — texto e imagem

**Texto (título + descrição):** usa a [Gemini API](https://ai.google.dev) do
Google. Em junho de 2026, modelos como `gemini-2.5-flash` têm uma camada
**gratuita real**, sem cartão de crédito — basta criar uma chave em
[aistudio.google.com/apikey](https://aistudio.google.com/apikey) e colocar em
`GEMINI_API_KEY`. Sem chave configurada, o sistema usa um gerador local por
template (sempre funciona, só é mais simples).

**Imagem:** nenhum provedor grande (Google ou OpenAI) tem API de imagem
gratuita em 2026 — isso é diferente do que muitos sites desatualizados ainda
dizem. A opção mais barata e simples de configurar é a própria Gemini API,
usando a mesma chave: o modelo `gemini-2.5-flash-image` custa cerca de
**US$ 0,04 por imagem** (R$ 0,20–0,25 ao câmbio atual). Por isso a geração de
imagem só roda se você ligar conscientemente `ENABLE_IMAGE_GENERATION=true`
no `.env` — sem isso, os anúncios saem só com texto.

> Não usamos o ChatGPT/OpenAI aqui porque, em 2026, a API da OpenAI não tem
> mais camada gratuita nem para texto (só 3 requisições/min num modelo
> antigo) — a Gemini é hoje a opção mais barata e mais fácil de configurar
> para esse caso de uso.

## 4. Atualização automática a cada 10 minutos (sem nada aberto)

A sincronização roda via **GitHub Actions** (`.github/workflows/sync-products.yml`),
chamando `POST /api/products/sync` a cada 10 minutos.

⚠️ **Importante**: como não há mais um backend hospedado na nuvem (isso era o
Supabase), a API em `backend/` precisa estar rodando em algum lugar acessível
pela internet — não só na sua máquina — para o GitHub Actions conseguir
chamá-la. Opções simples e baratas para isso: Railway, Render ou um VPS
pequeno (ex.: Hetzner, DigitalOcean). Veja a seção "Publicar o backend" abaixo.

Configure em **Settings → Secrets and variables → Actions** deste repositório:
- `API_URL` → a URL pública do seu backend publicado
- `SYNC_API_KEY` → o mesmo valor do `.env` do backend

## 5. Extensão de navegador

Veja o passo a passo de instalação no chat — resumo: `chrome://extensions` →
Modo do desenvolvedor → Carregar sem compactação → pasta `extension/`. Depois
configure a URL da API e faça login com um usuário **admin** nas opções da
extensão.

A extensão só serve como atalho de cadastro — ela não mantém nada
sincronizado por conta própria; isso é sempre feito pelo cron do passo 4. Por
isso o sistema continua funcionando mesmo com o navegador fechado.

## 6. Publicar o backend (para o cron e a extensão funcionarem fora da sua máquina)

Qualquer serviço que rode Node.js funciona. Caminho mais simples:
1. Crie uma conta no [Railway](https://railway.app) ou [Render](https://render.com).
2. Aponte para a pasta `backend/` deste repositório.
3. Configure as mesmas variáveis do `.env` lá nas configurações do serviço.
4. Troque `DATABASE_URL` para um banco Postgres gerenciado se for crescer
   além do uso inicial (o Prisma faz essa troca só mudando a connection
   string — o resto do código não muda).

## Limitações conhecidas / próximos passos

- **Scraping da Shopee**: não existe API pública para esses dados; veja os
  comentários em `backend/src/services/scraper.ts` para as opções reais de
  extração (serviços de scraping com renderização).
- **E-mail transacional**: senha temporária de novos usuários ainda não é
  enviada por e-mail (fica só na resposta da API) — plugue um provedor
  (Resend, SendGrid etc.) antes de produção.
- **Banco de dados**: SQLite por padrão (zero configuração); migre para
  Postgres quando o volume de assinantes justificar.
