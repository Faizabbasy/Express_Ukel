// const passwordHash = require('password-hash');
// const jwt = require('jsonwebtoken');
// const { User } = require("../models");
// const Validator = require("fastest-validator");
// const v = new Validator();
// const { response } = require("../helpers/response.formatter");
// const { auth_secret } = require('../config/base.config');

// module.exports = {
//     // 🆕 1. FUNGSI UNTUK REGRISTRASI (UNTUK MENGISI TABEL USERS YANG KOSONG)
//     register: async (req, res) => {
//         try {
//             const { name, username, password, phoneNumber } = req.body;

//             // Validasi input dari Postman
//             const schema = {
//                 name: { type: 'string', min: 3 },
//                 username: { type: 'string', min: 3 },
//                 password: { type: 'string', min: 6 },
//                 phoneNumber: { type: 'string', optional: true }
//             }

//             const validate = v.validate({ name, username, password, phoneNumber }, schema);
//             if (validate.length > 0) {
//                 return res.status(400).json(response(400, 'error validasi', validate));
//             }

//             // Cek apakah username sudah pernah dipakai orang lain
//             const userCheck = await User.findOne({ where: { username: username } });
//             if (userCheck) {
//                 return res.status(400).json(response(400, 'Username sudah terdaftar!'));
//             }

//             // Mengenkripsi password pakai passwordHash agar aman di database
//             const hashedPassword = passwordHash.generate(password);

//             // Proses memasukkan data ke tabel users yang kosong tadi
//             const newUser = await User.create({
//                 name,
//                 username,
//                 password: hashedPassword,
//                 phoneNumber // Sesuai dengan tulisan phoneNumber di PhpMyAdmin abang
//             });

//             const data = {
//                 id: newUser.id,
//                 name: newUser.name,
//                 username: newUser.username
//             };

//             return res.status(201).json(response(201, 'Register berhasil', data));

//         } catch (error) {
//             return res.status(500).json(response(500, 'server error', error.message));
//         }
//     },

//     // 2. FUNGSI LOGIN (YANG SUDAH ABANG BUAT KEMARIN)
//     login: async (req, res) => {
//         try {
//             const { username, password } = req.body;

//             const schema = {
//                 username: { type: 'string' },
//                 password: { type: 'string' }
//             }
//             const validate = v.validate({username: username, password: password}, schema);
//             if (validate.length > 0) {
//                 return res.status(400).json(response(400, 'error validasi', validate));
//             }

//             const user = await User.findOne({ where: { username: username }});
//             if (!user) {
//                 return res.status(400).json(response(400, 'User not found'));
//             }

//             const verified = passwordHash.verify(password, user.password);
//             if (!verified) {
//                 return res.status(400).json(response(400, 'Invalid password'));
//             }

//             const token = jwt.sign({ userId: user.id, username: user.username, name: user.name }, auth_secret, {
//                 expiresIn: '1h'
//             });

//             const data = {
//                 data : {
//                     name: user.name,
//                     username: user.username,
//                     phoneNumber: user.phoneNumber
//                 },
//                 token : token
//             }
//             return res.status(200).json(response(200, 'loggedin', data));
//         } catch (error) {
//             return res.status(500).json(response(500, 'server error', error.message));
//         }
//     }
// }


const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const { User } = require("../models");
const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { auth_secret } = require('../config/base.config');

module.exports = {

    register: async (req, res) => {
        try {
            const { name, username, password, phoneNumber } = req.body;

            // Validasi input dari Postman
            const schema = {
                name: { type: 'string', min: 3 },
                username: { type: 'string', min: 3 },
                password: { type: 'string', min: 6 },
                phoneNumber: { type: 'string', optional: true }
            }

            const validate = v.validate({ name, username, password, phoneNumber }, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'error validasi', validate));
            }

            // Keamanan tambahan: Melarang user biasa mendaftar memakai username 'admin'
            if (username.toLowerCase() === 'admin') {
                return res.status(400).json(response(400, 'Username "admin" dilindungi oleh sistem!'));
            }

            // Cek apakah username sudah pernah dipakai orang lain di database
            const userCheck = await User.findOne({ where: { username: username } });
            if (userCheck) {
                return res.status(400).json(response(400, 'Username sudah terdaftar!'));
            }

            // Mengenkripsi password user biasa pakai passwordHash agar aman di database
            const hashedPassword = passwordHash.generate(password);

            // Proses memasukkan data ke tabel users
            const newUser = await User.create({
                name,
                username,
                password: hashedPassword,
                phoneNumber,
                role: 'user' // Otomatis diset sebagai user biasa di DB
            });

            const data = {
                id: newUser.id,
                name: newUser.name,
                username: newUser.username,
                role: newUser.role
            };

            return res.status(201).json(response(201, 'Register berhasil', data));

        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            // Validasi input login
            const schema = {
                username: { type: 'string' },
                password: { type: 'string' }
            }
            const validate = v.validate({ username: username, password: password }, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, 'error validasi', validate));
            }

            // 👑 GERBANG 1: Cek Akun Admin Manual (Hardcoded di Code)
            // Abang bisa ganti kata 'admin' dan 'admin123' di bawah ini sesuai selera
            if (username === 'admin' && password === 'admin123') {

                // Langsung buatkan token JWT khusus Admin tanpa nengok database MySQL
                const token = jwt.sign(
                    {
                        userId: 0,
                        username: 'admin',
                        role: 'admin'
                    },
                    auth_secret,
                    { expiresIn: '1h' }
                );

                const adminData = {
                    data: {
                        name: "Admin ISC",
                        username: "admin",
                        phoneNumber: "0000000000",
                        role: "admin"
                    },
                    token: token
                }

                // Potong kompas langsung kirim respons sukses Admin ke Postman/React
                return res.status(200).json(response(200, 'loggedin as Admin', adminData));
            }


            // 👤 GERBANG 2: Jika lolos dari atas (bukan admin manual), baru cari ke database MySQL
            const user = await User.findOne({ where: { username: username } });
            if (!user) {
                return res.status(400).json(response(400, 'User not found'));
            }

            // Verifikasi password hash di database untuk user biasa
            const verified = passwordHash.verify(password, user.password);
            if (!verified) {
                return res.status(400).json(response(400, 'Invalid password'));
            }

            // Buat token JWT untuk user biasa memakai data 'role' asli dari DB
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role
                },
                auth_secret,
                { expiresIn: '1h' }
            );

            const data = {
                data: {
                    name: user.name,
                    username: user.username,
                    phoneNumber: user.phoneNumber,
                    role: user.role // Menampilkan role asli dari DB ('user')
                },
                token: token
            }

            return res.status(200).json(response(200, `loggedin as ${user.role}`, data));

        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    },

    getUser: async (req, res) => {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] } // Agar password tidak ikut tampil di respons
            });
            return res.status(200).json(response(200, 'success', users));
        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    }
};