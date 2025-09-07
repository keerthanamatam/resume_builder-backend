const {createPool} = require('mysql')

const pool = createPool({
    port : 3306,
    host: 'localhost',
    user: 'root',
    password: 'Keerthi12*',
    database: 'resume_builder'
}

)

module.exports= pool