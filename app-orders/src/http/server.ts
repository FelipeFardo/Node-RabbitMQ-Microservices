import { fastify } from 'fastify'
import { fastifyCors } from "@fastify/cors"
import { z } from 'zod'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { channels } from '../broker/channels/index.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

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

  channels.orders.sendToQueue('orders', Buffer.from("Hello world"))

  return reply.status(201).send()
})

app.listen({host:'0.0.0.0', port:3333}).then(()=>{
  console.log("[Orders] HTTP Server running!")
})