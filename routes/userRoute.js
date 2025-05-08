const { Router } = require('express');
const controller = require('../controllers/usercontroller');

const router = Router()

// Rute lainnya
router.get("/",  controller.getUsers);
router.post("/register", controller.addUser);
router.get('/:id', controller.getUserById);
router.post("/login", controller.loginUser);
router.post("/logout", controller.logoutUser);
router.post("/", controller.addUser);
router.delete("/:user_id", controller.removeUser);
router.put("/:user_id", controller.updateUser);

module.exports = router