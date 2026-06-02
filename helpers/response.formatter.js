module.exports = {
    // response merupakan key dari object module.exports yang berisi anonimus function (arrow func)
    response : (status, message, data) => {
        if (data) {
            // jika response menghasilkan data
            return {
                status: status,
                message: message,
                data: data
            }
        } else {
            // jika response tidak menghasilkan data misalnya error validasi, delete data
            return {
                status: status,
                message: message
            }
        }
    }
}
