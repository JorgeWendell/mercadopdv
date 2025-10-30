# 🧪 Como Testar o Sistema de Validades

## 📝 Passo a Passo:

### 1️⃣ Criar uma Entrada de Mercadoria com Validade

1. Acesse **Estoque > Entrada de Mercadorias**
2. Clique em **Nova Entrada**
3. Preencha:
   - **Fornecedor:** Selecione um fornecedor
   - **Data da Compra:** Hoje
4. Clique em **Adicionar Item**
5. Preencha o item:
   - **Produto:** Selecione um produto qualquer
   - **Quantidade:** 10
   - **Preço Unitário:** 5.00
   - **Lote:** `LOTE-TESTE-001`
   - **Data de Validade:** 
     - Para **VENCIDO**: Coloque uma data passada (ex: 01/01/2024)
     - Para **CRÍTICO**: Coloque daqui a 5 dias
     - Para **ATENÇÃO**: Coloque daqui a 20 dias
6. Clique em **Registrar Entrada**

### 2️⃣ Verificar na Página de Validades

1. Acesse **Estoque > Validades**
2. O produto deve aparecer na tabela com:
   - Badge de status (Vencido/Crítico/Atenção)
   - Lote
   - Quantidade
   - Data de validade
   - Dias até vencer (ou dias vencido)

### 3️⃣ Testar o Descarte

1. Na mesma página, clique em **Descartar** no produto
2. Digite a quantidade a descartar
3. Escolha o motivo
4. Confirme
5. O estoque será reduzido automaticamente!

### 4️⃣ Ver Alertas no Dashboard

1. Acesse **Dashboard** (home)
2. Se houver produtos vencidos/críticos, aparecerá um card vermelho com:
   - Quantidade de produtos vencidos
   - Quantidade de produtos críticos
   - Botão para ir direto para a página de validades

---

## 🐛 Se não aparecer nenhum produto:

1. Certifique-se de que preencheu o campo **Data de Validade** na entrada
2. Verifique se a data está dentro do período selecionado (padrão: 30 dias)
3. Recarregue a página

---

## 📊 Filtros Disponíveis:

- **7 dias** - Mostra produtos que vencem em até 7 dias
- **15 dias** - Mostra produtos que vencem em até 15 dias
- **30 dias** (padrão) - Mostra produtos que vencem em até 30 dias
- **60 dias** - Mostra produtos que vencem em até 60 dias
- **90 dias** - Mostra produtos que vencem em até 90 dias

---

## ✨ Status dos Produtos:

- 🔴 **Vencido** - Data de validade já passou
- 🟠 **Crítico** - Vence em até 7 dias
- 🟡 **Atenção** - Vence em 8-X dias (conforme filtro)

---

**Pronto para testar!** 🚀

