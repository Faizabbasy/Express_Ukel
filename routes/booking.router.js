const express = require('express')
const router = express.Router()
const bookingController = require('../controller/booking.controller')

router.get('/', bookingController.getAllBookings    )
router.post('/', bookingController.createBooking)
router.delete('/:id', bookingController.cancelBooking)
router.patch('/:id/status', bookingController.updateStatus)


module.exports = router