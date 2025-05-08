const pool = require("../config/db");
const queries = require("../queries/userQueries");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = "your_jwt_secret"

const getUsers = (req, res) => {
  pool.query(queries.getUsers, (error, results) => {
    if (error) throw error;
    res.status(200).json(results.rows);
  });
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(queries.getUserById, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addUser = async (req, res) => {
  const { nama, email, instansi, no_telp, password } = req.body;

  try {
    const emailExists = await pool.query(queries.checkEmailExists, [email]);
    if (emailExists.rows.length) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); 

    await pool.query(queries.addUser, [nama, email, instansi, no_telp, hashedPassword]);
    res.status(201).json({message: "User Created Successfully"});
  } catch (error) {
    console.error(error);
    res.status(500).send({message: "Server error", error: error.message});
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: "Email and password are required", isLoggedIn: false });
  }

  try {
    // Cari pengguna berdasarkan email
    const user = await pool.query(queries.getUserByEmail, [email]);
    if (!user.rows.length) {
      return res.status(404).send({ message: "User not found", isLoggedIn: false });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid credentials", isLoggedIn: false });
    }

    // Buat JWT
    const token = jwt.sign({ user_id: user.rows[0].user_id }, JWT_SECRET, { expiresIn: '1h' });

    // Set cookie dengan token
    res.cookie('token', token, { httpOnly: true });

    // Kirim status login
    res.json({ 
      message: "Login successful", 
      isLoggedIn: true ,
      user_id: user.rows[0].user_id
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error", isLoggedIn: false });
  }
};

const logoutUser = (req, res) => {
  // For JWT, you typically don't need to do anything for logout
  // Just inform the client to delete the token from local storage
  res.status(200).send("User logged out successfully");
};

const removeUser = (req, res) => {
  const user_id = parseInt(req.params.user_id); // Menggunakan user_id dari URL

  pool.query(queries.getUserById, [user_id], (error, results) => {
    if (error) throw error;

    const noUserFound = !results.rows.length;
    if (noUserFound) {
      return res.status(404).send("User does not exist in the database");
    }

    pool.query(queries.removeUser, [user_id], (error, results) => {
      if (error) throw error;
      res.status(200).send("User removed successfully");
    });
  });
};

const updateUser = (req, res) => {
  const user_id = parseInt(req.params.user_id); // Menggunakan user_id dari URL
  const { nama, email, no_telp, posisi, password } = req.body; // Data yang akan diperbarui

  pool.query(queries.getUserById, [user_id], (error, results) => {
    if (error) throw error;

    const noUserFound = !results.rows.length;
    if (noUserFound) {
      return res.status(404).send("User does not exist in the database");
    }

    pool.query(
      queries.updateUser,
      [nama, email, no_telp, posisi, password, user_id], // Update berdasarkan user_id
      (error, results) => {
        if (error) throw error;
        res.status(200).send("User updated successfully");
      }
    );
  });
};

module.exports = {
    getUsers,
    getUserById,
    addUser,
    removeUser,
    updateUser,
    loginUser,
    logoutUser,
  };
  