const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { Category, Court, Booking } = require("../models");
const { Op, where } = require("sequelize");
const fs = require('fs');
const path = require('path');
const { raw } = require("express");

module.exports = {
    createCourt: async (req, res) => {
        try {
            const { category_id, nameCourt, price, status } = req.body;

            // 1. PENCEGAHAN AWAL: Cek apakah file upload ada atau tidak
            if (!req.file) {
                return res.status(400).json(response(400, 'gambar tidak boleh kosong'));
            }

            // 2. Schema Validasi (Sertakan image agar sinkron)
            const schema = {
                category_id: { type: "number", positive: true, integer: true },
                nameCourt: { type: "string", min: 3 },
                price: { type: "number", positive: true, integer: true },
                status: { type: "enum", values: ["available", "maintenance", "non-active"], optional: true },
                image: { type: "string", min: 1 } // 🆕 Validasi string nama file gambar
            }

            // 3. Susun Data (Aman dari crash karena req.file sudah pasti ada)
            const data = {
                category_id: Number(category_id),
                nameCourt: nameCourt,
                price: Number(price),
                status: status || "available", 
                image: req.file.filename // Mengambil nama file yang disimpan Multer
            }

            // 4. Jalankan fastest-validator
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'error validasi', validate));
            }

            // 5. Cek data category_id di tabel category
            const categoryCheck = await Category.findByPk(data.category_id);
            if (!categoryCheck) {
                return res.status(404).json(response(404, 'Category not found'));
            }

            // 6. Proses buat data ke MySQL
            const createProcess = await Court.create(data);

            return res.status(201).json(response(201, 'created', createProcess));

        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    getCourts: async (req, res) => {
        try {
            const { price, sortBy, order } = req.query;
            const courts = await Court.findAll({
                where: price ? {
                    price: {
                        [Op.like]: `%${price}%`
                    }
                } : {},
                order: sortBy ? [[sortBy, order]] : []
            });
            return res.status(200).json(response(200, 'success', courts));
        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    showCourt: async (req, res) => {
        try {
            const { id } = req.params;
            const court = await Court.findByPk(id);
            return res.status(200).json(response(200, 'success', court));
        }
        catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    updateCourt: async (req, res) => {
        try {
            const { id } = req.params;
            const { category_id, nameCourt, price, status } = req.body;

            // validasi data
            const schema = {
                category_id: { type: "number", positive: true, integer: true },
                nameCourt: { type: "string", min: 3 },
                price: { type: "number", positive: true, integer: true },
                status: { type: "enum", values: ["available", "maintenance", "non-active"] }
            }
            const data = {
                category_id: Number(category_id),
                nameCourt: nameCourt,
                price: Number(price),
                status: status ? String(status).trim() : undefined // Jika status tidak diberikan, tetap gunakan status lama
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'error validasi', validate));
            }

            // ini buat ambil data sebelumnya
            const court = await Court.findByPk(id);
            // buat errornya
            if (!court) {
                return res.status(404).json(response(404, 'Court not found'));
            }
            if (req.file) {
                const rawImageName = court.getDataValue('image'); // Ambil nama file gambar lama
                const oldFilePath = path.join(process.cwd(), 'uploads', rawImageName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath); // Hapus file gambar lama
                }
            }
            const updateProcess = await Court.update({
                category_id: data.category_id,
                nameCourt: data.nameCourt,
                price: data.price,
                status: data.status,
            }, {
                where: {
                    id: id
                }
            });
            const itemUpdated = await Court.findByPk(id);
            return res.status(200).json(response(200, 'updated', itemUpdated));
        }
        catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }

    },

    deleteCourt: async (req, res) => {
        try {
            const { id } = req.params;

            const item = await Court.findByPk(id);
            if(!item) {
                return res.status(404).json(response(404, "Data Court tidak ditemukan"));
            }

            const rawImageName = item.getDataValue('image');
            if (rawImageName) {
                const filePath = path.join(process.cwd(), 'uploads', rawImageName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Gambar ${rawImageName} berhasil dihapus dari server`)
                }
            }

            await Court.destroy({
                where: { id: id }
            });

            return res.status(200).json(response(200, 'Lapangan berhasil dihapus'));

        } catch (error) {
            return res.status(500).json(response(500, 'server Error', error.message));
        }
    },

    
}