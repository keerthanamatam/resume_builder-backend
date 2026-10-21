const pool = require('../config/connect');

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const secretKey = process.env.secretKey
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || secretKey;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || secretKey;
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET)
) {
  throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are required in production');
}
const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/'
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('sessionToken', accessToken, {
    ...sessionCookieOptions,
    maxAge: 15 * 60 * 1000
  });
  res.cookie('refreshToken', refreshToken, {
    ...sessionCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('sessionToken', sessionCookieOptions);
  res.clearCookie('refreshToken', sessionCookieOptions);
};

const createRefreshToken = (email) => jwt.sign(
  { email, tokenType: 'refresh' },
  refreshTokenSecret,
  { expiresIn: '7d', jwtid: randomUUID() }
);


const register = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body || {};
  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).send({ message: 'Please enter all the details' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (name, email, password, phoneNumber) VALUES (?, ?, ?, ?)';
    pool.query(sql, [name, email, hashedPassword, phoneNumber], (err) => {
      if (err) {
        console.error(err);
        return res.status(400).send({ error: 'Could not create user' });
      }

      return res.status(201).send({ message: 'User created successfully' });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: 'Server error' });
  }
};



const login = (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    pool.query(`SELECT * FROM users WHERE email = ?`, [email], async (err, result) => {
      if (err) {
        console.log(err)
        return res.status(400).send({ error: 'Database error' });
      }
      if (result.length === 0) {
        return res.status(400).send({ error: 'Please create an account' });
      }

      try {
        const isMatch = await bcrypt.compare(password, result[0].password);
        console.log("isMatch", isMatch)
        if (!isMatch) {
          return res.status(400).send({ error: 'Wrong password' });
        }

        const email = result[0].email;
        const sessionToken = jwt.sign(
          { email, tokenType: 'access' },
          accessTokenSecret,
          { expiresIn: '15m' }
        );
        const refreshToken = createRefreshToken(email);
        const sql = 'INSERT INTO session (session, email) VALUES (?, ?)';
        pool.query(sql, [refreshToken, email], (err) => {
          if (err) {
            console.log(err);
            return res.status(500).send({ error: 'Problem in creating session' });
          }
          setAuthCookies(res, sessionToken, refreshToken);
          return res.status(200).send({
            message: "Logged in successfully"
          });
        });

      } catch (error) {
        console.log("error", error);
        return res.status(500).send({ error: 'Server error' });
      }
    });
  } else {
    return res.status(400).send({ error: "Email and password required" });
  }
};

const refresh = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).send({ error: 'Refresh token required' });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, refreshTokenSecret);
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).send({ error: 'Invalid or expired refresh token' });
  }

  if (payload.tokenType !== 'refresh' || !payload.email) {
    clearAuthCookies(res);
    return res.status(401).send({ error: 'Invalid refresh token' });
  }

  const newAccessToken = jwt.sign(
    { email: payload.email, tokenType: 'access' },
    accessTokenSecret,
    { expiresIn: '15m' }
  );
  const newRefreshToken = createRefreshToken(payload.email);

  const sql = 'UPDATE session SET session = ? WHERE session = ? AND email = ?';
  pool.query(sql, [newRefreshToken, refreshToken, payload.email], (err, result) => {
    if (err) {
      return res.status(500).send({ error: 'Problem refreshing session' });
    }
    if (result.affectedRows !== 1) {
      clearAuthCookies(res);
      return res.status(401).send({ error: 'Refresh token has been revoked' });
    }

    setAuthCookies(res, newAccessToken, newRefreshToken);
    return res.status(200).send({ message: 'Session refreshed successfully' });
  });
};

const logout = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    clearAuthCookies(res);
    return res.status(200).send({ message: 'Logged out successfully' });
  }

  pool.query('DELETE FROM session WHERE session = ?', [refreshToken], (err) => {
    clearAuthCookies(res);
    if (err) {
      return res.status(500).send({ error: 'Problem ending session' });
    }
    return res.status(200).send({ message: 'Logged out successfully' });
  });
}


module.exports = {
  login,
  register,
  refresh,
  logout
}