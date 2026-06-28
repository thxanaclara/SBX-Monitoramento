# Especificação — SBX Monitoramento

## Visão geral

SaaS de monitoramento de vendas de produtos da Shopee, voltado a identificar
produtos com potencial de revenda/dropshipping com base em volume real de
vendas. Vendido por assinatura mensal. Arquitetura própria (sem Lovable nem
Supabase): API Node.js + banco local, front-end React, extensão de navegador.

## Perfis de usuário

- **Admin**: cadastra e edita produtos/categorias, cadastra novos usuários
  (admins e staffs) da própria conta, gera anúncios (texto + imagem).
- **Staff**: visualiza produtos e métricas, gera anúncios (texto + imagem).
  Não cadastra nem edita produtos, categorias ou usuários.

## Multi-tenant

Cada conta assinante é uma `Organization` isolada — todas as consultas da API
filtram por `organizationId` a partir do token do usuário logado.

## Cadastro de usuários

- **Automático**: via webhook da plataforma de pagamento
  (`POST /api/webhooks/subscription`), na assinatura aprovada → cria a
  organização + o primeiro admin.
- **Manual**: tela "Usuários" (admin only, `POST /api/users`) → cadastra
  novos admins/staffs vinculados à mesma organização de quem está cadastrando.

## Telas

1. **Login** — e-mail/senha.
2. **Visão geral (Dashboard)** — contagem de produtos por status de
   validação, lista dos cadastrados recentemente.
3. **Produtos monitorados** — tabela com categoria, link da Shopee, status,
   admin responsável, última sincronização. Só admin adiciona/edita. Sem
   limite de produtos. Ao adicionar (categoria + link), o sistema importa
   automaticamente: nome, histórico de preços, vendas diárias, histórico de
   vendas e calcula a validação.
4. **Detalhe do produto** — vendas diárias, histórico desde a postagem na
   Shopee, picos de venda, gráfico de vendas e de preço. Filtros por dia, mês,
   ano e nome do produto.
5. **Gerador de anúncios** — qualquer usuário (admin ou staff) gera novas
   variações de título/texto e imagem a partir do anúncio de um produto
   monitorado.
6. **Usuários** (admin only) — lista e cadastro de novos admins/staffs.

## Regra de validação

Calculada pela média de vendas diárias dos **últimos 60 dias** (2 meses),
recalculada automaticamente sempre que uma venda diária é registrada:

| Média de vendas/dia (60 dias) | Status | Cor |
|---|---|---|
| ≥ 20 | Possivelmente validado | Verde |
| 10 a 19 | Em validação | Amarelo |
| < 10 (ou sem histórico suficiente) | Não validado | Vermelho |

## Atualização automática

Sincronização com a Shopee a cada 10 minutos, via GitHub Actions (cron)
chamando a API — roda no backend, sem depender de navegador, aba ou
computador aberto. Exige que a API esteja publicada (acessível pela
internet), e não só rodando localmente.

## Geração de anúncios (texto + imagem)

- **Texto**: Gemini API (camada gratuita real em modelos como
  `gemini-2.5-flash`), com fallback local por template se não houver chave.
- **Imagem**: opcional e pago (não existe opção gratuita confiável em 2026);
  usa o modelo de imagem da Gemini API (~US$ 0,04/imagem) quando
  `ENABLE_IMAGE_GENERATION=true`.

## Extensão de navegador

Atalho para o admin capturar um produto direto da página da Shopee e enviá-lo
para o monitoramento, sem copiar e colar o link. Não substitui a
sincronização automática — é só uma forma rápida de cadastro. Funciona com
qualquer instância publicada da API (URL configurável nas opções da extensão).

## Pontos em aberto / decisões futuras

- Plataforma de pagamento (Stripe, Kiwify, Hotmart ou outra) — define o
  formato exato do payload do webhook de cadastro de usuários.
- Onde publicar o backend (Railway, Render, VPS) para o cron e a extensão
  funcionarem fora da sua máquina.
- Provedor de e-mail transacional para envio de senha temporária a novos
  usuários.
- Serviço de scraping com renderização para extrair os dados reais da Shopee.
- Migração de SQLite para Postgres quando o volume justificar.
