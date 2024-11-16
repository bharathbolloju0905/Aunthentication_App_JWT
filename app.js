const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
const ejs = require("ejs");
const userModel = require("./models/Usermodel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

require("dotenv").config();

function authenticate(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send("Access denied! Please log in.");
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send("Invalid Token");
    }
}

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/create", (req, res) => {
    const { username, email, password, age } = req.body;
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const user = await userModel.create({
                username,
                email,
                password: hash,
                age,
            });
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.cookie("token", token,{ httpOnly: true, secure: true });
            res.redirect("/home")
        });
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/home", authenticate, (req, res) => {
    console.log(req.user);
    res.send("Welcome to the home page");
});

app.post("/login", async (req, res) => {
    const user = await userModel.findOne({ email: req.body.email });
    if (user) {
        const verify = await bcrypt.compare(req.body.password, user.password);
        if (verify) {
            // const token = jwt.sign({ email: user.email }, "Hare Krishna");
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            // res.cookie("token", token);
            res.cookie("token", token, { httpOnly: true, secure: true });
            res.redirect("/home");
        } else {
            res.send("Invalid password");
        }
    } else {
        res.send("User not found");
    }
});


app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
