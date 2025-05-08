const { Router } = require('express');
const controller = require('../controllers/dataController');

const router = Router()

router.post("/tambahdata",  controller.surveiTitik);
router.get('/panggildata/:user_id', controller.getDataByUserId)
router.delete('/hapusdata/:id_titik', controller.hapusTitik)
router.put('/updatetitik/:user_id', controller.updateTitik)

module.exports = router
