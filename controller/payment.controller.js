const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { Payment, Booking } = require("../models");
const ExcelJS = require('exceljs');

module.exports = {
    createPayment: async (req, res) => {
        try {
            const { booking_id, payment_method } = req.body;

            // Skema Validasi 
            const schema = {
                booking_id: { type: "number", positive: true, integer: true },
                payment_method: { type: "enum", values: ["transfer", "qris"] }
            };

            const dataToValidate = {
                booking_id: Number(booking_id),
                payment_method: payment_method
            };

            const validate = v.validate(dataToValidate, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'Error validasi data', validate));
            }

            const bookingCheck = await Booking.findByPk(dataToValidate.booking_id);
            if (!bookingCheck) {
                return res.status(404).json(response(404, 'Data Booking tidak ditemukan'));
            }

            const paymentData = {
                booking_id: dataToValidate.booking_id,
                payment_method: dataToValidate.payment_method,
                payment_date: new Date(),
                status: 'pending'   
            };

            if (dataToValidate.payment_method === 'transfer') {
                if (!req.file) {
                    return res.status(400).json(response(400, 'Bukti transfer wajib diunggah jika memilih metode Transfer!'));
                }
                paymentData.payment_proof = req.file.filename;
                paymentData.status = 'pending'; 
            } else if (dataToValidate.payment_method === 'qris') {
                paymentData.payment_proof = null;
                paymentData.status = 'paid';
            }

            const createProcess = await Payment.create(paymentData);

            return res.status(201).json(response(201, 'Proses pembayaran berhasil dikirim', createProcess));

        } catch (error) {
            return res.status(500).json(response(500, 'Server error', error.message));
        }
    },

    getPaymentDetail: async (req, res) => {
        try {
            const { booking_id } = req.params;

            const payment = await Payment.findOne({
                where: { booking_id: booking_id }
            });

            if (!payment) {
                return res.status(404).json(response(404, 'Belum ada data pembayaran untuk booking ini.'));
            }

            const result = payment.toJSON();

            if (result.payment_method === 'qris') {
                result.qris_barcode_url = "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg";
            }

            return res.status(200).json(response(200, 'Success mengambil detail pembayaran', result));
        } catch (error) {
            return res.status(500).json(response(500, 'Server error', error.message));
        }
    },

    getAllPayments: async (req, res) => {
        try {
            const payments = await Payment.findAll({
                order: [['id', 'DESC']]
            });

            return res.status(200).json(response(200, 'Success mengambil semua data pembayaran', payments));
        } catch (error) {
            return res.status(500).json(response(500, 'Server error', error.message));
        }
    },

    confirmPayment: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; 

            const statusFix = status.toLowerCase();

            const payment = await Payment.findByPk(id);
            if (!payment) {
                return res.status(404).json(response(404, 'Data pembayaran tidak ditemukan'));
            }

            payment.status = statusFix;
            await payment.save();
            console.log(`Tabel Payments berhasil diubah menjadi`);

            const idBookingAsli = payment.booking_id || payment.bookingId;
            if (idBookingAsli) {
                try {
                    const booking = await Booking.findByPk(idBookingAsli);
                    if (booking) {
                        booking.status = statusFix;
                        await booking.save();
                        console.log(` Booking berstatus ${statusFix}`);
                    } else {
                        console.log(`Booking ID #${idBookingAsli} tidak ditemukan `);
                    }
                } catch (bookingError) {
                    console.log('Error', bookingError);
                }
            }

            return res.status(200).json(response(200, `Pembayaran berhasil diperbarui menjadi ${statusFix.toUpperCase()}`, payment));

        } catch (error) {
            console.log("Error");
            console.error(error);

            return res.status(500).json(response(500, `Server error saat konfirmasi: ${error.message}`, null));
        }
    },

    exportExcel: async (req, res) => {
        try {
            const payments = await Payment.findAll({
                include: [
                    {
                        model: Booking,
                    }
                ],
                order: [['id', 'DESC']] 
            });

            const workbook = new ExcelJS.Workbook(); //keseluruhan file excel
            const worksheet = workbook.addWorksheet('Riwayat Transaksi'); //sheet di dalem file excel

            worksheet.columns = [
                { header: 'No', key: 'no', width: 8 },
                { header: 'ID Payment', key: 'id', width: 12 },
                { header: 'ID Booking', key: 'booking_id', width: 12 },
                { header: 'Metode', key: 'payment_method', width: 15 },
                { header: 'Tanggal Bayar', key: 'payment_date', width: 22 },
                { header: 'Total Harga', key: 'total_price', width: 18 },
                { header: 'Status Transaksi', key: 'status', width: 18 }
            ];

            worksheet.getRow(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1E3A8A' } 
            };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            payments.forEach((item, index) => {
                const hargaTotal = item.Booking ? item.Booking.total_price : 0;

                const row = worksheet.addRow({
                    no: index + 1,
                    id: item.id,
                    booking_id: item.booking_id || item.bookingId,
                    payment_method: item.payment_method ? item.payment_method.toUpperCase() : '-',
                    payment_date: item.payment_date,
                    total_price: hargaTotal,
                    status: item.status ? item.status.toUpperCase() : ''
                });

                row.getCell(6).numFmt = '"Rp"#,##0';

                row.getCell(1).alignment = { horizontal: 'center' };
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'center' };
                row.getCell(4).alignment = { horizontal: 'center' };
                row.getCell(7).alignment = { horizontal: 'center' };
            });

            res.setHeader(
                'Content-Type', // ngasi tau browser ini file excell
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition', // buat maksa browser download file 
                'attachment; filename=' + `Laporan_Transaksi_${Date.now()}.xlsx`
            );

            await workbook.xlsx.write(res);
            return res.end();

        } catch (error) {
            console.error(" Gagal Export Excel Transaksi:", error);
            return res.status(500).json(response(500, 'Gagal export riwayat transaksi ke Excel', error.message));
        }
    }
};