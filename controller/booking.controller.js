const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { User, Court, Booking } = require("../models");
const { Op } = require("sequelize");

module.exports = {
    createBooking: async (req, res) => {
        try {
            const { user_id, court_id, booking_date, start_time, end_time, booking_type } = req.body;

            const schema = {
                user_id: { type: "number", positive: true, integer: true },
                court_id: { type: "number", positive: true, integer: true },
                booking_date: { type: "string" },
                start_time: { type: "string" },
                end_time: { type: "string" },
                booking_type: { type: "string", min: 2 }
            }

            const data = {
                user_id: Number(user_id),
                court_id: Number(court_id),
                booking_date: booking_date,
                start_time: start_time,
                end_time: end_time,
                booking_type: booking_type
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'error validasi', validate));
            }

            const userCheck = await User.findByPk(data.user_id);
            if (!userCheck) return res.status(444).json(response(444, 'User not found'));

            const courtCheck = await Court.findByPk(data.court_id);
            if (!courtCheck) return res.status(404).json(response(404, 'Court not found'));

            const checkBentrok = await Booking.findOne({
                where: {
                    court_id: data.court_id,
                    booking_date: data.booking_date,
                    [Op.or]: [
                        { start_time: { [Op.between]: [data.start_time, data.end_time] } },
                        { end_time: { [Op.between]: [data.start_time, data.end_time] } }
                    ]
                }
            });
            if (checkBentrok) {
                return res.status(400).json(response(400, 'Jadwal pada jam tersebut sudah dibooking!'));
            }

            const startHour = parseInt(data.start_time.split(':')[0]);
            const endHour = parseInt(data.end_time.split(':')[0]);
            const duration = endHour - startHour;

            if (duration <= 0) {
                return res.status(400).json(response(400, 'Jam selesai harus lebih besar dari jam mulai!'));
            }

            data.total_price = courtCheck.price * duration;
            data.status = 'pending';

            const bookingProcess = await Booking.create(data);
            return res.status(201).json(response(201, 'Booking berhasil dibuat', bookingProcess));

        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    cancelBooking: async (req, res) => {
        try {
            const { id } = req.params; 

            const booking = await Booking.findByPk(id);

            if (!booking) {
                return res.status(404).json(response(404, `Data booking dengan ID ${id} tidak ditemukan!`));
            }

            await booking.destroy();


            return res.status(200).json(response(200, `Booking ID berhasil dibatalkan/dihapus.`));

        } catch (error) {
            return res.status(500).json(response(500, 'server error saat membatalkan', error.message));
        }
    },

    getAllBookings: async (req, res) => {
        try {
            const dataBookings = await Booking.findAll();

            return res.status(200).json(response(200, 'Berhasil memuat semua data booking', dataBookings));
        } catch (error) {
            return res.status(500).json(response(500, 'Server error', error.message));
        }
    },

    updateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

            if (!status || !allowedStatuses.includes(status.toLowerCase())) {
                return res.status(400).json(response(400, `Status tidak valid. Harus salah satu dari: ${allowedStatuses.join(', ')}`));
            }

            const booking = await Booking.findByPk(id);
            if (!booking) {
                return res.status(404).json(response(404, 'Data booking tidak ditemukan'));
            }

            booking.status = status.toLowerCase();
            await booking.save();

            return res.status(200).json(response(200, `Status booking berhasil diubah menjadi ${status}`, booking));
        } catch (error) {
            return res.status(500).json(response(500, 'Server error saat update status', error.message));
        }
    },


}