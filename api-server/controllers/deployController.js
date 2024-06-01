const { PrismaClient } = require('@prisma/client')
const { RunTaskCommand } = require('@aws-sdk/client-ecs')
const { ecsClient } = require('../utils/ecsClient')

const prisma = new PrismaClient()

const config = {
    CLUSTER: '',
    TASK: ''
}

const deployProject = async (req, res) => {
    const { projectId } = req.body

    const project = await prisma.project.findUnique({ where: { id: projectId } })

    if (!project) return res.status(404).json({ error: 'Project not found' })

    const deployment = await prisma.deployement.create({
        data: {
            project: { connect: { id: projectId } },
            status: 'QUEUED',
        }
    })

    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: ['subnet-0c364045c881f1aad', 'subnet-0b70fd02fcb7a6d19', 'subnet-0c1ddfb525fdc0198'],
                securityGroups: ['sg-0f68ac449a85ac7f6']
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'build-server-img',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: project.gitURL },
                        { name: 'PROJECT_ID', value: projectId },
                        { name: 'DEPLOYEMENT_ID', value: deployment.id },
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command)

    return res.json({ status: 'queued', data: { deploymentId: deployment.id } })
}

const getLogs = async (req, res) => {
    const { client } = require('../models/prismaClient') // Assumes you have a ClickHouse client setup here
    const id = req.params.id
    const logs = await client.query({
        query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
        query_params: {
            deployment_id: id
        },
        format: 'JSONEachRow'
    })

    const rawLogs = await logs.json()

    return res.json({ logs: rawLogs })
}

module.exports = {
    deployProject,
    getLogs
}
