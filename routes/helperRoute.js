const { Router } = require('express');
const controller = require('../controllers/helpercontroller');

const router = Router()

router.get('/wilayah/search', controller.searchDesa)
// router.put('/updatetitik/:user_id', controller.updateTitik)

module.exports = router