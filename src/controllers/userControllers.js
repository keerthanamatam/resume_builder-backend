const pool = require('../config/connect');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const secretKey = 'afmahgfamhfghfs,mdfhj'


const register = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body
  if (name && email && password && phoneNumber) {
    hashedPassword = await bcrypt.hash(password, 10)
    const sql = 'INSERT INTO users (name, email, password, PhoneNumber) VALUES (?, ?, ?, ?)';
    pool.query(sql, [name, email, hashedPassword, phoneNumber], (err, result) => {
      if (err) {
        console.log(err)
        return res.status(400).send({ error: 'This email already exists' })
      }
      else {
        console.log(result)
        return res.status(200).send({ 'Message': 'Sucessfully created account' })
      }
    })
  } else {
    res.status(400).send('Missing fields');
  }
};

const login = (req, res) => {
  const { email, password } = req.body
  if (email && password) {
    pool.query(`select * from users where email = '${email}'`, async (err, result) => {
      if (err) {
        return res.status(400).send({ error: 'Please create an account' })
      }
      else {
        console.log(result[0].password)
        const isMatch = await bcrypt.compare(password, result[0].password)
        if (!isMatch) {
          return res.status(400).send({ error: 'Wrong password' })
        }
        const sessionToken = jwt.sign({
          email: result.email,
          password: result.password
        }, secretKey, { expiresIn: '1h' })
        const sql = 'INSERT INTO session (session, email) VALUES (?, ?)';
        pool.query(sql, [sessionToken, result[0].email], (err, insertResult) => {
          if (err)
            return res.status(400).send({ error: 'Problem in creating session' })
        })
        console.log(sessionToken)
        return res.status(200).send({ 'Message': "Logged in successfully" })
      }
    })
  }
}

module.exports = {
  login,
  register
}