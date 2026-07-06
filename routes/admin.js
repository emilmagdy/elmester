const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const multerCloudinaryStorage = require("multer-storage-cloudinary")
const multer = require("multer");
const pool = require("../db")

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key : process.env.CLOUDINARY_API_KET,
    api_secret : process.env.CLOUDINARY_API_SECRET

});

const storage = new multerCloudinaryStorage.CloudinaryStorage({
    cloudinary: cloudinary,
    params : {
        folder: "teachers_photos",
        allowed_formats :["jpg", "jpeg", "png"]
        
    } ,
    transformation: [{width : 200 , height: 200 , crop: "fill", gravity : "face" }]
});

const upload = multer({storage: storage})

// ================================================================
// GET Route to render the form that will be used to input the data
// ================================================================

router.get("/admin-insert", (req, res) => {
    // Get the secret key from the URL Parameters
    const secretKey = req.query.secret;
    //Validate the secret Key
    if (secretKey === "EmilPassword123") {
        res.render("add-teacher")
    } else {
        res.status(403).send("Access Denied : Unautherized entry")
    }
});

// ====================================================
// Post Route : To send the form data into the database
// ====================================================
router.post("/admin-insert", upload.single("photo_url"), async (req, res, next) => {
    // Get the secret key from the URL Parameters
    const secretKey = req.query.secret;
    // Double Check to prevent direct attacks
    if (secretKey !== "EmilPassword123") {
        return res.status(403).send("Access Denied : Unautherized entry")
    };
    try {
        // Destructure Name and Subject constants from the form body
        const { name, subject, facebook_url, website_url, youtube_url } = req.body;
        const finalUrl = req.file && req.file.path ? req.file.path : null

        let queryText
        let queryParams

        if (finalUrl) {
            queryText = "INSERT INTO teachers (name, subject, facebook_url, website_url,youtube_url, photo_url) VALUES ($1, $2, $3, $4, $5, $6)";
                        queryParams = [name, subject,facebook_url, website_url , youtube_url, finalUrl]
        } else {
            queryText = "INSERT INTO teachers (name,subject, facebook_url, website_url, youtube_url) VALUES ($1, $2, $3, $4, $5)";
            queryParams = [name, subject, facebook_url, website_url, youtube_url];
        }
        // Insert name and subject into the database
        await pool.query(queryText, queryParams);
        // Success : Redirect to hte homepage
        res.redirect("/admin-insert?secret=EmilPassword123")
    } catch (err) {
        next(err)
    }
});

module.exports = router;