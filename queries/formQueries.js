const formData = `INSERT INTO form_sawah (
    nama_pemilik, waktu_pelaksanaan, desa, kecamatan, kab_kota, provinsi, 
    luas_lahan, jenis_tanaman, masa_panen, sumber_air, jarak_sumber_air, 
    ketersediaan_air, metode_pengairan, titik_koordinat_id, pelaksana_survei, cloudinary_ids,
    dokumentasi_utara, dokumentasi_timur, dokumentasi_selatan, dokumentasi_barat,
    user_id
  )
  VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10, $11,
    $12, $13, $14, $15,
    $16, $17, $18, $19,
    $20, $21
  ) RETURNING *`
const ambilForm = 'SELECT * FROM form_sawah WHERE user_id = $1'
const hapusForm = 'DELETE FROM form_sawah WHERE id = $1 RETURNING *'
const updateForm = `
  UPDATE form_sawah
  SET 
    nama_pemilik = $1,
    waktu_pelaksanaan = $2,
    desa = $3,
    kecamatan = $4,
    kab_kota = $5,
    provinsi = $6,
    luas_lahan = $7,
    jenis_tanaman = $8,
    masa_panen = $9,
    sumber_air = $10,
    jarak_sumber_air = $11,
    ketersediaan_air = $12,
    metode_pengairan = $13,
    titik_koordinat_id = $14,
    pelaksana_survei = $15,
    cloudinary_ids = $16,
    dokumentasi_utara = $17,
    dokumentasi_timur = $18,
    dokumentasi_selatan = $19,
    dokumentasi_barat = $20,
    user_id = $21,
    updated_at = NOW()
  WHERE id = $22
  RETURNING *;
`;
const getFormDataById = `
  SELECT * FROM form_sawah WHERE id = $1;
`;

const getTitikByIds = `
  SELECT * FROM titik_survei WHERE id_titik = ANY($1::int[]);
`;

module.exports ={
    formData,
    ambilForm,
    hapusForm,
    updateForm,
    getFormDataById,
    getTitikByIds
}