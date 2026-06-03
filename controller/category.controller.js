const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { Category, Court } = require("../models");
const { Op, where } = require("sequelize");
const fs = require('fs');
const path = require('path');

module.exports = {
    createItem: async (req, res) => {
        try {
            const { name } = req.body;

            // validasi data
            const schema = {
                name: { type: "string", min: 4 },
            }

            // siapkan sumber data
            const data = {
                name: name,
            }

            // cek validasi
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'error validasi', validate));
            }
            // validasi file, kalo gada, ada error
            if (!req.file) {
                return res.status(400).json(response(400, 'gambar tidak boleh kosong'));
            }

            // proses create data
            const item = await Category.create({
                nameCategory: data.name,
                image: req.file.filename
            });
            return res.status(201).json(response(201, 'created', item));
        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    getItem: async (req, res) => {
        try {
            const { name, sortBy, order } = req.query;

            const items = await Category.findAll({
                where: name ? {
                    nameCategory: {
                        [Op.like]: `%${name}%`
                    }
                } : {},
                order: sortBy ? [
                    [sortBy, order]
                ] : []
            });
            return res.status(200).json(response(200, 'success', items));
        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    showItem: async (req, res) => {
        try {
            const { id } = req.params;

            const item = await Category.findByPk(id);
            return res.status(200).json(response(200, 'success', item));
        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    updateItem: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;

            // validasi data
            const schema = {
                name: { type: "string", min: 4 },
            }
            const data = {
                name: name,
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'error validasi', validate));
            }

            // ini buat ambil data sebelumnya
            const item = await Category.findByPk(id);
            // buat errornya
            if (!item) {
                return res.status(404).json(response(404, 'data not found'));
            }
            if (!name || name.length < 4) {
                return res.status(400).json(response(400, 'Name must be at least 4 characters long'));
            }

            if (req.file) {
                const rawImageName = item.getDataValue('image');
                // buat ambil lokasi gmbr sblmnya
                const oldFilePath = path.join(process.cwd(), 'uploads', rawImageName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath); //buat hapus file lama
                }
            }
            const updateProcess = await Category.update({
                nameCategory: name || item.nameCategory,
                image: (req.file ? req.file.filename : item.getDataValue('image'))
            }, {
                where: { id: id }
            });
            const itemUpdated = await Category.findByPk(id);
            return res.status(200).json(response(200, 'updated', itemUpdated));
        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    deleteItem: async (req, res) => {
        try {
            const { id } = req.params;

            const item = await Category.findByPk(id);
            if (!item) {
                return res.status(404).json(response(404, 'Data kategori tidak ditemukan'));
            }

            const rawImageName = item.getDataValue('image'); 
            if (rawImageName) {
                const filePath = path.join(process.cwd(), 'uploads', rawImageName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Menghapus file gambar
                    console.log(` Gambar ${rawImageName} berhasil dihapus dari server`);
                }
            }

            await Category.destroy({
                where: { id: id }
            });

            return res.status(200).json(response(200, 'Kategori berhasil dihapus'));

        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },
}