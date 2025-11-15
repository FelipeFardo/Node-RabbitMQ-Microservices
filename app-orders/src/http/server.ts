import "@opentelemetry/auto-instrumentations-node/register"

import { fastify } from 'fastify'
import { fastifyCors } from "@fastify/cors"
import { randomUUID } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'
import { trace } from '@opentelemetry/api'
import { z } from 'zod'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { schema } from '../db/schema/index.ts'
import { db } from '../db/client.ts'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'
import { tracer } from "../../../docker/kong/tracer/tracer.ts"

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get("/health",()=>{
  return 'OK'
})

app.post("/orders", {
  schema: {
    body: z.object({
      amount: z.number(),
    })
  }
}, async (request, reply)=>{
  const {amount} = request.body
  console.log('amount:', amount)

  const orderId = randomUUID()

  await db.insert(schema.orders).values({id: orderId, amount,customerId: '1'  })

  const span = tracer.startSpan('Eu acho que aqui tá dando merda')
  
  span.setAttribute('Teste','Hello world')
  await setTimeout(2000)

  span.end()
  trace.getActiveSpan()?.setAttribute('order.id', orderId)

  dispatchOrderCreated({
    orderId,
    amount,
    customer: {
      id: '1'
    }
  })


  return reply.status(201).send()
})

app.listen({host:'0.0.0.0', port:3333}).then(()=>{
  console.log("[Orders] HTTP Server running!")
})