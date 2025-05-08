const surveiTitik =
  'INSERT INTO titik_survei (koordinat_bujur, koordinat_lintang, nama_titik, utm_x, utm_y, tinggi_ellipsoid, akurasi, zona, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
const ambilTitik = 'SELECT * FROM titik_survei WHERE user_id = $1'
const hapusTitik = 'DELETE FROM titik_survei WHERE id_titik = $1 RETURNING *'
const cekTitik = 'SELECT * FROM titik_survei WHERE id_titik = $1 AND user_id = $2'
const updateTitik = `UPDATE titik_survei SET nama_titik = $1, updated_at = NOW() WHERE id_titik = $2 AND user_id = $3`

module.exports = {
  surveiTitik,
  ambilTitik,
  hapusTitik,
  cekTitik,
  updateTitik
};