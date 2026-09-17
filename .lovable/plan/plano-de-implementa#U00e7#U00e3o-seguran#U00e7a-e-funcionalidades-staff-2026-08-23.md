# Plano de Implementação: Segurança e Funcionalidades Staff

O objetivo é transformar os requisitos de segurança e gestão do prompt em funcionalidades reais no sistema, focando em proteção de dados, integridade de pedidos e auditoria.

## Ações Técnicas

### 1. Camada de Segurança (Backend/Supabase)

- **Sanitização de Input**: Reforçar a validação de tipos nos esquemas Zod dos Webhooks e Funções de Servidor para evitar injeções e ataques de payload.
- **Auditoria de RLS**: Revisar as políticas de Row Level Security para garantir que o acesso aos dados da loja seja estritamente limitado ao usuário autenticado (`auth.uid()`).
- **Log de Segurança**: Implementar rastreamento detalhado de alterações críticas (status de pedidos, alteração de configurações de caixa) na tabela `webhook_logs` ou similar.

### 2. Integridade e Performance Staff (Staff Level Engineering)

- **Rate Limiting Conceitual**: Adicionar travas lógicas no frontend para prevenir submissões duplicadas e spam de webhooks.
- **Proteção de PII**: Mascarar dados sensíveis de clientes (como partes do telefone) na UI, a menos que o usuário tenha permissão explícita.
- **Headers de Segurança**: Verificar e reforçar a configuração de CORS e Headers no endpoint público de pedidos.

### 3. Funcionalidades de Gestão (Painel Staff)

- **Monitor de Auditoria**: Uma nova seção ou log na aba de Integrações que mostra tentativas de acesso e erros de validação de webhook com severidade.
- **Relatório de Conformidade**: Validação em tempo real se a loja está seguindo as regras de segurança (ex: se o token do webhook foi alterado recentemente).

## Detalhes de Implementação

- Uso de `supabaseAdmin` para operações privilegiadas de auditoria.
- Middlewares de validação no `createServerFn`.
- Criptografia de tokens sensíveis no backend.

---

Este plano foca em transformar as diretrizes de segurança do seu prompt em código funcional, protegendo sua operação contra ataques modernos.
