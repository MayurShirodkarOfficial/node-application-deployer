const { Kafka } = require('kafkajs')
const { createClient } = require('@clickhouse/client')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('path')

const kafka = new Kafka({
    clientId: `api-server`,
    brokers: [''],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, '../kafka.pem'), 'utf-8')]
    },
    sasl: {
        username: '',
        password: '',
        mechanism: 'plain'
    }
})

const client = createClient({
    host: '',
    database: '',
    username: '',
    password: ''
})

const consumer = kafka.consumer({ groupId: 'api-server-logs-consumer' })

const initKafkaConsumer = async () => {
    await consumer.connect()
    await consumer.subscribe({ topics: ['container-logs'], fromBeginning: true })

    await consumer.run({
        eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {
            const messages = batch.messages
            console.log(`Recv. ${messages.length} messages..`)
            for (const message of messages) {
                if (!message.value) continue
                const stringMessage = message.value.toString()
                const { PROJECT_ID, DEPLOYEMENT_ID, log } = JSON.parse(stringMessage)
                console.log({ log, DEPLOYEMENT_ID })
                try {
                    const { query_id } = await client.insert({
                        table: 'log_events',
                        values: [{ event_id: uuidv4(), deployment_id: DEPLOYEMENT_ID, log }],
                        format: 'JSONEachRow'
                    })
                    console.log(query_id)
                    resolveOffset(message.offset)
                    await commitOffsetsIfNecessary(message.offset)
                    await heartbeat()
                } catch (err) {
                    console.log(err)
                }
            }
        }
    })
}

module.exports = { initKafkaConsumer }
