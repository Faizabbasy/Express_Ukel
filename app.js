const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')


const db = require('./models')
const categoryRoutes = require('./routes/category.routes')
const courtRoutes = require('./routes/court.routes')
const bookingRoutes = require('./routes/booking.router')
const loginRoutes = require('./routes/login.routes')
const paymentRoutes = require('./routes/payment.router')


const methodOverride = require('method-override');

app.use(express.json())
app.use(express.urlencoded({ extended: true })); // Sambil ditambah ini ya bang biar bisa baca form-data nanti
app.use(methodOverride('_method'))
app.use(cors())
app.use('/uploads', express.static('uploads'))


app.use('/categories', categoryRoutes)
app.use('/courts', courtRoutes)
app.use('/bookings', bookingRoutes)
app.use('/payments', paymentRoutes)



// 📄 CUKUP TULIS SATU BARIS INI SAJA UNTUK AUTH:
app.use('/', loginRoutes) 


app.get('/', (req, res) => {
    res.send('Hello World')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})