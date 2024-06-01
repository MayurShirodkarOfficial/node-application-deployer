const express = require('express')
const { deployProject, getLogs } = require('../controllers/deployController')

const router = express.Router()

router.post('/', deployProject)
router.get('/logs/:id', getLogs)

module.exports = router
