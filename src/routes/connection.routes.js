const express = require("express");
const verifyJwt = require("../middlewares/auth.middleware");
const { sentRequest, reviewRequest, getRequests } = require("../controllers/connection.controller");

const router = express.Router();

router.route("/send/:status/:toUserId").post(verifyJwt, sentRequest);
router.route("/review/:status/:requestId").post(verifyJwt, reviewRequest);
router.route("/requests/:status").post(verifyJwt, getRequests);


module.exports = router;