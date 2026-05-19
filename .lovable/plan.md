## Plano de Implementação: Card de Assinaturas

1. **Criar o componente `SubscriptionsCard`**:
   - Localização: `src/components/transactions/SubscriptionsCard.tsx`
   - Funcionalidade: Buscar assinaturas da tabela `Assinaturas` para o `id_usuario` do usuário logado (via `Usuarios.id`).
   - UI: Card com título, botão "+", lista de assinaturas (ícone/avatar, nome, dia de cobrança, valor, status "Ativa"/"Cancelada" com estilo condicional).
   - Exibir estado vazio caso não existam assinaturas.

2. **Criar o modal de adicionar (`AddSubscriptionModal`)**:
   - Localização: `src/components/transactions/AddSubscriptionModal.tsx`
   - Campos: Nome, Valor, Método (apenas Crédito, Débito, Pix, Dinheiro, Parcelado), Dia de cobrança, Data da compra, Data final (apenas para Crédito), Descrição (opcional).
   - Regra: Categoria fixa como "Assinatura".
   - Ação: Enviar payload via POST para `https://autowebhook.dudaclientes.site/webhook/Transacoes` com `acao: "adicionar"`.

3. **Adicionar a funcionalidade de detalhes e cancelamento**:
   - Modal ou painel para detalhes da assinatura.
   - Botão "Cancelar assinatura".
   - Ação: Enviar payload via POST para o mesmo webhook com `acao: "cancelar"`.

4. **Integrar na página `src/routes/transactions.tsx`**:
   - Adicionar o `SubscriptionsCard` abaixo do card "Distribuição dos Gastos" na coluna lateral direita.
   - Implementar os logs de debug necessários.

5. **Ajustes de estilo**:
   - Manter a identidade visual (fundo branco, bordas arredondadas, sombra suave).
   - Transições e comportamento consistentes com o restante do sistema.
