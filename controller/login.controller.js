
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

            if (username.toLowerCase() === 'admin') {
                return res.status(400).json(response(400, 'Username "admin" dilindungi oleh sistem!'));
            }

            const userCheck = await User.findOne({ where: { username: username } });
            if (userCheck) {
                return res.status(400).json(response(400, 'Username sudah terdaftar!'));
            }

            const hashedPassword = passwordHash.generate(password);

            const newUser = await User.create({
                name,
                username,
                password: hashedPassword,
                phoneNumber,
                role: 'user' 
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

         
            if (username === 'admin' && password === 'admin123') {

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

                return res.status(200).json(response(200, 'loggedin as Admin', adminData));
            }


            const user = await User.findOne({ where: { username: username } });
            if (!user) {
                return res.status(400).json(response(400, 'User not found'));
            }

            const verified = passwordHash.verify(password, user.password);
            if (!verified) {
                return res.status(400).json(response(400, 'Invalid password'));
            }

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
                    role: user.role 
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
                attributes: { exclude: ['password'] } 
            });
            return res.status(200).json(response(200, 'success', users));
        } catch (error) {
            return res.status(500).json(response(500, 'server error', error.message));
        }
    }
};