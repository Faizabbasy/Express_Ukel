const express = require('express')
const router = express.Router()
const bookingController = require('../controller/booking.controller')

router.get('/', bookingController.getAllBookings)
router.post('/', bookingController.createBooking)
router.delete('/:id', bookingController.cancelBooking)
router.put('/:id/status', bookingController.updateStatus)


module.exports = router