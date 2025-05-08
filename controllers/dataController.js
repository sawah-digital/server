const pool = require("../config/db");
const queries = require("../queries/dataQueries");

const surveiTitik = async (req, res) => {
  const {
    latitude: koordinat_lintang,
    longitude: koordinat_bujur,
    namaTitik: nama_titik,
    utmX: utm_x,
    utmY: utm_y,
    tinggiEllipsoid: tinggi_ellipsoid,
    akurasi,
    zona,
    user_id
  } = req.body;

  try {
    const result = await pool.query(queries.surveiTitik, [
      koordinat_bujur,
      koordinat_lintang,
      nama_titik,
      utm_x,
      utm_y,
      tinggi_ellipsoid,
      akurasi,
      zona,
      user_id
    ]);

    res
      .status(201)
      .json({
        success: true,
        message: "Data survei berhasil disimpan",
        data: result.rows[0],
      });
  } catch (error) {
    console.error("Error menyimpan data survei:", error);
    res.status(500).json({ success: false, message: "Gagal menyimpan data" });
  }
};

const getDataByUserId = async (req, res) => {
  const { user_id } = req.params; 
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id harus disertakan' });
  }

  try {
    const result = await pool.query(queries.ambilTitik, [user_id]
    );

    res.status(200).json({
      success: true,
      message: 'Data titik berhasil diambil',
      data: result.rows,
    });
  } catch (error) {
    console.error('Error mengambil data titik:', error);
    res.status(500).json({ success: false, message: error });
  }
};

const hapusTitik = async (req, res) => {
  const { id_titik } = req.params; 

  try {
    const result = await pool.query(queries.hapusTitik, [id_titik]
    );

    if (result.rows.length > 0) {
      res.status(200).json({
        success: true,
        message: 'Data survei berhasil dihapus',
        data: result.rows[0]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Data survei tidak ditemukan'
      });
    }
  } catch (error) {
    console.error('Error menghapus data survei:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data survei'
    });
  }
};

const updateTitik = async (req, res) => {
  const { id_titik, nama_titik } = req.body;
  const { user_id } = req.params;

  try {
    const titikExists = await pool.query(queries.cekTitik, [id_titik, user_id]);
    if (titikExists.rows.length === 0) {
      return res.status(400).json({ message: "Data titik not found or not owned by this user" });
    }

    await pool.query(queries.updateTitik, [nama_titik, id_titik, user_id]
    );

    res.status(200).json({ success: true, message: "Data titik updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error", error: error.message });
  }
};

module.exports = {
  surveiTitik,
  getDataByUserId,
  updateTitik,
  hapusTitik
};
