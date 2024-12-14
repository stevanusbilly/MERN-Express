const express = require("express");
const router = express.Router();

router.get("/users", (req, res, next) => {
    console.log("get request");
    res.json({
        message: "it works",
    });
});

module.exports = router;