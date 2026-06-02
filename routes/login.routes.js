const express = require('express')
const router = express.Router()
const upload = require('../middlewares/upload')
const loginController = require('../controller/login.controller')

router.post('/register', upload.none(), loginController.register )
router.post('/login', upload.none(), loginController.login)
router.get('/profile', loginController.getUser)

module.exports = router