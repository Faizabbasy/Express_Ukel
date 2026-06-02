const express = require('express')
const router = express.Router()
const courtController = require('../controller/court.controller')
const upload = require('../middlewares/upload')

router.post('/', upload.single('image'), courtController.createCourt)
router.get('/', courtController.getCourts);
router.get('/:id', courtController.showCourt);
router.put('/:id', upload.single('image'), courtController.updateCourt)
router.delete('/:id', courtController.deleteCourt)

module.exports = router