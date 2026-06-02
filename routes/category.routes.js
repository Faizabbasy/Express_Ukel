const express = require('express')
const router = express.Router()
const categoryController = require('../controller/category.controller')
const upload = require('../middlewares/upload')

router.post('/', upload.single('image'), categoryController.createItem)
router.get('/', categoryController.getItem);
router.get('/:id', categoryController.showItem);
router.put('/:id', upload.single('image'), categoryController.updateItem)
router.delete('/:id', categoryController.deleteItem)

module.exports = router