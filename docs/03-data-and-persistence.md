# 03 — Persistência, Filas PostgreSQL & Purga

> **Matriz de Documentação — Pilar 4: Dados, Persistência & Ciclo de Vida**  
> *Versão:* 1.0.0  
> *Status:* Ativo  

---

## 1. Destaques do Banco de Dados PostgreSQL

O sistema utiliza PostgreSQL 16+ com extensões `uuid-ossp` e `pgvector`. A modelagem é 100% alinhada com as entidades de domínio C# em **PascalCase estrito** (requer uso de aspas duplas em queries SQL manuais).

- **Tabelas Principais:** `"Users"`, `"Orders"`, `"OrderEditors"`, `"WorkstationAssets"`, `"TimecodeMarkers"`, `"MediaProcessingJobs"`.
- **Índices Críticos:**
  - `"IX_MediaProcessingJobs_Queue"`: Índice parcial para performance extrema em filas:
    ```sql
    CREATE INDEX "IX_MediaProcessingJobs_Queue"
    ON "MediaProcessingJobs" ("Status", "Priority" DESC, "CreatedAt" ASC)
    WHERE "Status" = 'Pending';
    ```

---

## 2. Mecânica Database-as-a-Queue (`SKIP LOCKED`)

Em vez de incluir brokers externos como RabbitMQ ou Redis na V1, o próprio PostgreSQL gerencia as tarefas assíncronas dos Workers .NET 10 através do padrão `SKIP LOCKED`:

```sql
UPDATE "MediaProcessingJobs"
SET "Status" = 'Processing',
    "LockedByWorkerId" = @WorkerId,
    "LockedAt" = NOW(),
    "Attempts" = "Attempts" + 1,
    "UpdatedAt" = NOW()
WHERE "JobId" = (
    SELECT "JobId"
    FROM "MediaProcessingJobs"
    WHERE "Status" = 'Pending'
    ORDER BY "Priority" DESC, "CreatedAt" ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
)
RETURNING "JobId", "AssetId", "JobType", "Attempts";
```

### Vantagens do Padrão
- **Zero Colisão:** Múltiplos containers de Workers capturam tarefas concorrentemente sem travar a tabela inteira.
- **Consistência ACID:** Transação atômica que garante que um job só seja processado por um Worker por vez.
- **Resiliência a Falhas:** Caso o container caia durante o processamento, uma rotina reseta jobs com `LockedAt > 15 minutos` de volta para `Pending`.

---

## 3. Ciclo de Vida do Armazenamento (Purga Final)

Para evitar acúmulo perpétuo de espaço em disco no servidor local:

1. **Fase Ingestão:** Download RAW temporário -> Purga RAW após criação de High-Fidelity + Proxy Web.
2. **Fase Edição:** Arquivos High-Fidelity e Proxy mantidos no disco do servidor enquanto a Order está `InProduction` ou `InReview`.
3. **Fase Conclusão:** Quando a Order transiciona para `Completed` ou `Cancelled`, o sistema executa a **Purga Final**, deletando os arquivos locais de High-Fidelity e Proxies.
4. **Preservação de Histórico:** O registro da Order, metadados de mídias, marcadores de timecode e links externos permanecem salvos no PostgreSQL indefinidamente para consultas futuras.
