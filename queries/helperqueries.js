const result = 'SELECT * FROM wilayah_desa WHERE desa_kelurahan ILIKE $1 LIMIT $2 OFFSET $3'
const totalResult = 'SELECT COUNT(*) AS total FROM wilayah_desa WHERE desa_kelurahan ILIKE $1'

module.exports = {
    result,
    totalResult
}