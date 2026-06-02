const express = require('express')
const router = express.Router()
const paymentController = require('../controller/payment.controller')
const upload = require('../middlewares/upload')

router.post('/', upload.single('payment_proof'), paymentController.createPayment);
router.get('/:booking_id', paymentController.getPaymentDetail);
router.get('/', paymentController.getAllPayments);
router.put('/:id/confirm', paymentController.confirmPayment);
router.get('/export/excel', paymentController.exportExcel);

module.exports = router