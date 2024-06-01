const { ECSClient } = require('@aws-sdk/client-ecs')

const ecsClient = new ECSClient({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
})

module.exports = { ecsClient }
