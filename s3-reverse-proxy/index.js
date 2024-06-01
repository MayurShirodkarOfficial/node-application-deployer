const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
const PORT = 8000
//s3
const BASE_PATH = ''

const proxy = httpProxy.createProxy()

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    const id = '12dfefb7-55dd-4fbf-9c4a-9fd5c0412328'

    const resolvesTo = `${BASE_PATH}/${id}`

    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true })

})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
        proxyReq.path += 'index.html'

})

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`))