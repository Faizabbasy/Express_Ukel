const jwt = require('jsonwebtoken');
const { response } = require("../helpers/response.formatter");
const { auth_secret } = require('../config/base.config')

module.exports = {
    verifyToken: async (req, res, next) => {
        let token = req.header('Authorization')
        if (!token) {
            return res.status(401).json(response(401, 'Unauthorized'))
        }

        try {
            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length);
            }
            const decoded = jwt.verify(token, auth_secret);
            // menyimpan data userId dari token ke req sehingga jika controller ingin menggunakan userId pengguna login bisa menggunakan (req.userId)
            // decoded.userId : tulisan userId bersumber dari login controller jwt.sign bagian parameter pertama (payload)
            req.userId = decoded.userId;
            // melanjutkan permintaan /req route
            next();
        } catch (error) {
            return res.status(401).json(response(401, 'Unauthorized'))
        }
    } 
}