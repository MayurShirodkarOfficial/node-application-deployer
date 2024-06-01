const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')
const { initKafkaConsumer } = require('./utils/kafkaConsumer')

const projectRoutes = require('./routes/projectRoutes')
const deployRoutes = require('./routes/deployRoutes')

const app = express()
const PORT = 9000

app.use(express.json())
app.use(cors())

app.use('/project', projectRoutes)
app.use('/deploy', deployRoutes)

const io = new Server({ cors: '*' })

io.on('connection', socket => {
    socket.on('subscribe', channel => {
        socket.join(channel)
        socket.emit('message', JSON.stringify({ log: `Subscribed to ${channel}` }))
    })
})

io.listen(9002, () => console.log('Socket Server 9002'))

initKafkaConsumer()

app.listen(PORT, () => console.log(`API Server Running on port ${PORT}`))
