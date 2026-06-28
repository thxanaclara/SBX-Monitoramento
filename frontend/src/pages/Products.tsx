import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Table, Thead, Tr, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { StatusSignal } from "@/components/StatusSignal";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { Product, ProductCategory } from "@/types";
import { formatDateBR } from "@/lib/utils";

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [shopeeUrl, setShopeeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");

  async function loadAll() {
    setLoading(true);
    const [productsData, categoriesData] = await Promise.all([api.getProducts(), api.getCategories()]);
    setProducts(productsData);
    setCategories(categoriesData);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddProduct(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!categoryId || !shopeeUrl) {
      setFormError("Selecione a categoria e informe o link da Shopee.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createProduct({ category_id: categoryId, shopee_url: shopeeUrl });
      setDialogOpen(false);
      setShopeeUrl("");
      setCategoryId("");
      loadAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível adicionar o produto.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await api.createCategory(newCategoryName.trim());
    setNewCategoryName("");
    setNewCategoryDialogOpen(false);
    loadAll();
  }

  return (
    <AppLayout title="Produtos monitorados">
      <Card>
        <CardHeader>
          <div>
            <h2 className="font-display font-bold text-sm">Catálogo de monitoramento</h2>
            <p className="text-xs text-muted mt-0.5">Sem limite de produtos. Atualização automática a cada 10 minutos.</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setNewCategoryDialogOpen(true)}>
                + Categoria
              </Button>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus size={14} /> Adicionar produto
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted">Carregando…</p>}
          {!loading && products.length === 0 && (
            <p className="text-sm text-muted py-6 text-center">
              Nenhum produto cadastrado ainda.{" "}
              {isAdmin ? 'Clique em "Adicionar produto" para começar.' : "Peça a um admin para cadastrar o primeiro produto."}
            </p>
          )}
          {products.length > 0 && (
            <Table>
              <Thead>
                <tr>
                  <Th>Produto</Th>
                  <Th>Categoria</Th>
                  <Th>Status</Th>
                  <Th>Admin responsável</Th>
                  <Th>Última sincronização</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {products.map((p) => (
                  <Tr key={p.id}>
                    <Td>
                      <Link to={`/produtos/${p.id}`} className="font-medium hover:text-accent">
                        {p.name}
                      </Link>
                    </Td>
                    <Td className="text-muted">{p.category_name ?? "—"}</Td>
                    <Td>
                      <StatusSignal status={p.validation_status} />
                    </Td>
                    <Td className="text-muted">{p.created_by_name ?? "—"}</Td>
                    <Td className="font-mono-data text-xs text-muted">
                      {p.last_synced_at ? formatDateBR(p.last_synced_at) : "aguardando…"}
                    </Td>
                    <Td>
                      <a href={p.shopee_url} target="_blank" rel="noreferrer" className="text-muted hover:text-accent">
                        <ExternalLink size={14} />
                      </a>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Adicionar produto para monitoramento">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Categoria</Label>
            <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="">Selecione…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shopee_url">Link do produto na Shopee</Label>
            <Input
              id="shopee_url"
              type="url"
              placeholder="https://shopee.com.br/produto-..."
              value={shopeeUrl}
              onChange={(e) => setShopeeUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted">
              Nome, preço, histórico de vendas e gráfico serão importados automaticamente da Shopee.
            </p>
          </div>
          {formError && <p className="text-sm text-signal-red">{formError}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Adicionando…" : "Adicionar e sincronizar"}
          </Button>
        </form>
      </Dialog>

      <Dialog open={newCategoryDialogOpen} onClose={() => setNewCategoryDialogOpen(false)} title="Nova categoria">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new_category">Nome da categoria</Label>
            <Input
              id="new_category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex.: Casa e cozinha"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Criar categoria
          </Button>
        </form>
      </Dialog>
    </AppLayout>
  );
}
