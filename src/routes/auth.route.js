const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", authController.userRegisterController);
router.post("/login", authController.userLoginController);
router.get("/logout", authController.userLogoutController);

module.exports = router;
