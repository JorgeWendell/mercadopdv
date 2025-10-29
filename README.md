## Sistema de Mercado – Guia Consolidado

Aplicação completa para gestão de supermercado com PDV, estoque, cadastros e dashboard.

Tecnologias: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Query, Zod, React Hook Form, Drizzle ORM (PostgreSQL), BetterAuth.

---

### 1) Requisitos
- Node 18+
- PostgreSQL 14+

### 2) Configuração de ambiente
Crie o arquivo `.env` com as variáveis necessárias (exemplos):

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/mercado
NEXTAUTH_SECRET=algum-segredo
```

### 3) Banco de dados (Drizzle)
Aplicar o schema no banco:

```bash
npm run db:push
```

Observações importantes do schema:
- Estoque e quantidades suportam 3 casas decimais.
- Tabelas principais: products, categories, suppliers, customers, purchases, purchase_items, sales, sale_items, sale_payments, stock_movements, payment_methods.

### 4) Instalação e execução

```bash
npm install
npm run dev
# Acesse http://localhost:3000
```

### 5) Autenticação
BetterAuth está configurado. A aplicação exige sessão para rotas protegidas.

### 6) Atalhos e UX do PDV
- Busca por código de barras ou nome.
- Quantidade com 3 casas decimais.
- Remoção apenas pelo ícone de lixeira.
- F3: finalizar venda.
- F6: limpar carrinho.
- Tab no campo de busca → foca a quantidade do primeiro item.
- Ao adicionar produto → foca quantidade do item recém-adicionado.

### 7) Impressão de cupom
Após finalizar a venda, é aberto um cupom térmico (80mm) em nova janela e a impressão é disparada automaticamente. Cabeçalho opcional via localStorage:

```js
localStorage.setItem('companyHeader', JSON.stringify({
  name: 'SUA EMPRESA LTDA',
  cnpj: '00.000.000/0000-00',
  address: 'RUA EXEMPLO, 123 - CIDADE/UF'
}))
// Remover
localStorage.removeItem('companyHeader')
```

Reimpressão disponível em Vendas > Histórico.

### 8) Dashboard
Página: `Vendas > Dashboard`
- KPIs: total de vendas (R$), quantidade, ticket médio.
- Comparativo com período anterior (variação %).
- Top produtos (quantidade) e top formas de pagamento (R$ e qtd).
- Vendas por hora (hoje) – independente do filtro.
- Tendência diária (gráfico) no período selecionado.

### 9) Histórico de Vendas
Página: `Vendas > Histórico`
- Filtros: período e forma de pagamento (data final inclui 23:59:59.999).
- Paginação: 12 por página, navegação numerada e "Ir para".

### 10) Cadastros e Estoque
- Produtos com categoria, fornecedor, preços e estoque decimal (3 casas).
- Entrada de mercadorias com itens e atualização de estoque.

### 11) Métodos de pagamento
Seed automático ao abrir o diálogo de pagamento, caso a tabela esteja vazia (Dinheiro, Crédito, Débito, Pix, VA, VR).

### 12) Scripts úteis

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # iniciar em produção
npm run db:push    # aplicar schema no banco
```

### 13) Observações finais
- Impressão emula impressora fiscal (layout 80mm); usar "Salvar como PDF" para emissão em ambiente local.
- Todos os valores monetários são tratados como string/decimal na persistência (Drizzle) e convertidos para número no cliente.
- Footer global com “© Adel Systems - {ano}”.

---

© Adel Systems - {ano_atual}
