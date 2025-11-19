# Node RabbitMQ Microservices

## Visão Geral
Sistema de exemplo para processamento de pedidos e geração de faturas usando arquitetura de microsserviços. O serviço `orders` registra pedidos e publica mensagens; o serviço `invoices` consome essas mensagens para processar e registrar faturas. A comunicação assíncrona via RabbitMQ desacopla fluxos e permite escalabilidade.

## Arquitetura
- **Serviços Principais**: `app-orders` (criação de pedidos) e `app-invoices` (faturas).
- **Mensageria**: RabbitMQ com fila `orders`. O serviço de pedidos envia mensagens (evento de pedido criado) e o de faturas lê da mesma fila.
- **Gateway**: Kong como API Gateway (proxy, governança e futura observabilidade de requisições HTTP externas).
- **Tracing**: OpenTelemetry + Jaeger para rastreamento distribuído (cada serviço define `OTEL_SERVICE_NAME`).
- **Infraestrutura**: Pulumi (pasta `infra/`) define recursos (cluster, load balancer, serviços ECS, RabbitMQ, etc.).
- **Contratos**: Esquemas de mensagens centralizados em `contracts/` garantem tipo e formato consistente entre serviços.

Fluxo simplificado:
1. Cliente envia requisição HTTP ao serviço `orders` (direto ou via Kong).
2. `orders` persiste dados (PostgreSQL) e publica mensagem JSON na fila `orders`.
3. `invoices` consome a mensagem, gera a fatura e persiste no seu banco.
4. Traces de cada operação são exportados para Jaeger.

## Tecnologias Principais
- Node.js (ESM, TypeScript sem transpilar via `--experimental-strip-types`)
- Fastify (API HTTP)
- RabbitMQ (mensageria)
- PostgreSQL (persistência por serviço)
- Drizzle ORM (mapeamento e migrações)
- OpenTelemetry + Jaeger (rastreabilidade)
- Kong (API Gateway)
- Pulumi (Infra como código)

## Execução Local
Pré‑requisitos: Docker, Node.js >= 22.

### Subir serviços de infraestrutura base
Na raiz, subir RabbitMQ, Jaeger e Kong:
```powershell
cd .\
docker compose up -d
```
RabbitMQ UI: http://localhost:15672  (usuário padrão guest/guest ou conforme configurado)  
Jaeger UI: http://localhost:16686  
Kong Admin API/UI: http://localhost:8001 / http://localhost:8002

### Bancos de dados de cada serviço
Cada app possui seu próprio `docker-compose.yml` para PostgreSQL:
```powershell
# Orders DB
cd .\app-orders
docker compose up -d

# Invoices DB
cd ..\app-invoices
docker compose up -d
```

### Instalar dependências e iniciar serviços
```powershell
# Orders
cd .\app-orders
npm install
npm run dev

# Invoices (novo terminal)
cd ..\app-invoices
npm install
npm run dev
```

### Teste rápido
Enviar um POST para criar pedido (exemplo hipotético, ajuste conforme rotas reais):
```powershell
curl -X POST http://localhost:3333/orders -H "Content-Type: application/json" -d '{"amount":150,"customerId":"c1"}'
```
O serviço `orders` publicará a mensagem; `invoices` consumirá e registrará a fatura.

## Variáveis de Ambiente
Cada serviço requer arquivo `.env` (exemplos mínimos):
`app-orders/.env`:
```
DATABASE_URL=postgresql://docker:docker@localhost:5482/orders
BROKER_URL=amqp://guest:guest@localhost:5672
OTEL_SERVICE_NAME=orders-service
```
`app-invoices/.env`:
```
DATABASE_URL=postgresql://docker:docker@localhost:5483/invoices
BROKER_URL=amqp://guest:guest@localhost:5672
OTEL_SERVICE_NAME=invoices-service
```
Outros pontos:
- `BROKER_URL` deve apontar para o RabbitMQ (local ou hospedado).
- Ajuste host/porta conforme sua rede ou containerização.
- Para produção, use credenciais segregadas e variáveis seguras (secret manager / env protegidas).

## Migrações
Gerar ou aplicar migrações (exemplo):
```powershell
# Dentro do serviço
npx drizzle-kit generate
# Verifique scripts adicionais se desejar aplicar automaticamente
```

## Observabilidade
Com Jaeger ativo, traces são enviados automaticamente se `OTEL_SERVICE_NAME` estiver definido. Acessar UI para inspecionar latências e spans.
