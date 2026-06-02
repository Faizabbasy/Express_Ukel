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

            // Cek apakah data booking-nya eksis
            const bookingCheck = await Booking.findByPk(dataToValidate.booking_id);
            if (!bookingCheck) {
                return res.status(404).json(response(404, 'Data Booking tidak ditemukan'));
            }

            // Siapkan objek data untuk disimpan ke MySQL
            const paymentData = {
                booking_id: dataToValidate.booking_id,
                payment_method: dataToValidate.payment_method,
                payment_date: new Date(),
                status: 'pending' // Default awal
            };

            // PERGABUNGAN LOGIKA TRANSFER VS QRIS
            if (dataToValidate.payment_method === 'transfer') {
                // Jika transfer, WAJIB upload file bukti tf
                if (!req.file) {
                    return res.status(400).json(response(400, 'Bukti transfer wajib diunggah jika memilih metode Transfer!'));
                }
                paymentData.payment_proof = req.file.filename;
                paymentData.status = 'pending'; // Harus di-approve admin manual
            } else if (dataToValidate.payment_method === 'qris') {
                // Jika QRIS, tidak butuh file upload, status diasumsikan langsung lunas (paid)
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

    // 3. GET ALL PAYMENTS FOR ADMIN DASHBOARD
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
            const { status } = req.body; // Menerima 'paid' atau 'rejected' dari frontend

            // 🌟 Samakan persis dengan isi ENUM database abang (huruf kecil penuh)
            const statusFix = status.toLowerCase();

            // 1. Ambil data payment berdasarkan ID
            const payment = await Payment.findByPk(id);
            if (!payment) {
                return res.status(404).json(response(404, `Data pembayaran dengan ID #${id} tidak ditemukan`));
            }

            // 2. Update status tabel Payments terlebih dahulu
            payment.status = statusFix;
            await payment.save();
            console.log(`✅ Tabel Payments ID #${id} berhasil diubah menjadi: ${statusFix}`);

            // 3. SINKRONISASI KE TABEL BOOKING YANG AMAN (Dibungkus try-catch terpisah)
            const idBookingAsli = payment.booking_id || payment.bookingId;
            if (idBookingAsli) {
                try {
                    const booking = await Booking.findByPk(idBookingAsli);
                    if (booking) {
                        // Kita coba set ke huruf kecil. Jika tabel booking ternyata ENUM-nya beda, 
                        // catch internal akan menangkapnya tanpa membuat rute payment ikut crash 500!
                        booking.status = statusFix;
                        await booking.save();
                        console.log(`=== ✅ SKSES SINKRON: Booking #${idBookingAsli} ikut berstatus ${statusFix} ===`);
                    } else {
                        console.log(`=== ⚠️ WARNING: Booking ID #${idBookingAsli} tidak ditemukan ===`);
                    }
                } catch (bookingError) {
                    console.log(`=== 🚨 GAGAL SINKRON TABEL BOOKING: ${bookingError.message} ===`);
                    console.log(`Kemungkinan kolom status di tabel booking isi ENUM-nya berbeda dengan tabel payment.`);
                }
            }

            // Return sukses bawaan formatter abang
            return res.status(200).json(response(200, `Pembayaran berhasil diperbarui menjadi ${statusFix.toUpperCase()}`, payment));

        } catch (error) {
            console.log("\n=========== 🚨 DETAIL ERROR SYSTEM 500 🚨 ===========");
            console.error(error);
            console.log("=====================================================\n");

            return res.status(500).json(response(500, `Server error saat konfirmasi: ${error.message}`, null));
        }
    },

    exportExcel: async (req, res) => {
        try {
            // 1. Ambil data transaksi lengkap dengan include data Booking-nya
            const payments = await Payment.findAll({
                include: [
                    {
                        model: Booking,
                        // include: [
                        //     { model: User, attributes: ['name', 'email'] },
                        //     { model: Court, attributes: ['nameCourt'] }
                        // ]
                    }
                ],
                order: [['id', 'DESC']] 
            });

            // Inisialisasi Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Riwayat Transaksi');

            // Setup Kolom Tabel Excel
            worksheet.columns = [
                { header: 'No', key: 'no', width: 8 },
                { header: 'ID Payment', key: 'id', width: 12 },
                { header: 'ID Booking', key: 'booking_id', width: 12 },
                { header: 'Metode', key: 'payment_method', width: 15 },
                { header: 'Tanggal Bayar', key: 'payment_date', width: 22 },
                { header: 'Total Harga', key: 'total_price', width: 18 },
                { header: 'Status Transaksi', key: 'status', width: 18 }
            ];

            // 4. Desain Header Tabel (Warna Biru Navy Elegan)
            worksheet.getRow(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1E3A8A' } // Navy Blue Hex
            };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            // 5. Looping Data Gabungan ke dalam Baris Excel
            payments.forEach((item, index) => {
                // Ambil data total_price dari tabel Booking jika relasinya aman
                const hargaTotal = item.Booking ? item.Booking.total_price : 0;

                const row = worksheet.addRow({
                    no: index + 1,
                    id: item.id,
                    booking_id: item.booking_id || item.bookingId,
                    payment_method: item.payment_method ? item.payment_method.toUpperCase() : '-',
                    payment_date: item.payment_date,
                    total_price: hargaTotal,
                    status: item.status ? item.status.toUpperCase() : 'PENDING'
                });

                // Format mata uang Rupiah untuk kolom Total Harga (Kolom ke-6)
                row.getCell(6).numFmt = '"Rp"#,##0';

                // Alignment data biar rapi tengah/kiri
                row.getCell(1).alignment = { horizontal: 'center' };
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'center' };
                row.getCell(4).alignment = { horizontal: 'center' };
                row.getCell(7).alignment = { horizontal: 'center' };
            });

            // 6. Set Header HTTP Browser untuk File Unduhan Excel asli
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=' + `Laporan_Transaksi_${Date.now()}.xlsx`
            );

            // 7. Write and send file
            await workbook.xlsx.write(res);
            return res.end();

        } catch (error) {
            console.error("🚨 Gagal Export Excel Transaksi:", error);
            return res.status(500).json(response(500, 'Gagal export riwayat transaksi ke Excel', error.message));
        }
    }
};