const { Router } = require('express');
const controller = require('../controllers/formController');

const router = Router()

router.post("/tambahForm",  controller.formData);
router.get('/panggilform/:user_id', controller.getFormByUserId)
router.delete('/hapusform/:id', controller.hapusForm)
router.put('/updateform/:id', controller.updateForm)
router.get('/downloadpdf/:id', controller.generatePdf)

module.exports = router