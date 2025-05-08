const getUsers = 'SELECT * FROM users';
const getUserById = 'SELECT * FROM users WHERE user_id = $1';
const getUserByNama = 'SELECT * FROM users WHERE nama = $1';
const checkEmailExists = 'SELECT * FROM users WHERE email = $1';
const getUserByEmail = 'SELECT * FROM users WHERE email = $1';
const addUser =
  'INSERT INTO users (nama, email, instansi, no_telp, password) VALUES ($1, $2, $3, $4, $5)';
const removeUser = 'DELETE FROM users WHERE user_id = $1';
const updateUser =
  'UPDATE users SET nama = $1, email = $2, instansi = $3, no_telp = $4, password = $5 WHERE user_id = $6';

  
module.exports = {
  getUsers,
  getUserById,
  getUserByNama,
  getUserByEmail,
  checkEmailExists,
  addUser,
  removeUser,
  updateUser
}