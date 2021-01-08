//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const MongoClient = require('mongodb').MongoClient;
const mongoose = require("mongoose");
const assert = require('assert');
// const url = 'mongodb://localhost:27017';
const url = 'mongo "mongodb+srv://cluster0.yz6p2.mongodb.net/proDB" --username admin-mayankS';
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { config } = require('process');
const { use, Passport } = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
//STORAGE API
const multer = require("multer");
const path = require("path");
//FILE PATHS
const testFolder = './public/upload';
const fs = require('fs');
const { json } = require('body-parser');

// NODE APP CONFIGS
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/profile', express.static('uploads'));

//PASSPORT INITIALISATION
app.use(session({
    secret: "Our Key",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//MONGO DB 
mongoose.connect("mongodb+srv://admin-mayankS:YevvDFd5TZxVW35M@cluster0.yz6p2.mongodb.net/proDB", { useUnifiedTopology: true, useNewUrlParser: true });
// mongoose.connect("mongodb://localhost:27017/proDB", { useUnifiedTopology: true, useNewUrlParser: true });
mongoose.set("useCreateIndex", true);
const dbName = 'proDB';

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    username: String,
    name: String,
    lastname: String,
    googleId: String,
    picture: String,
    feedback: String,
    filePath: String,
    videoPath: String,
    videoDesc: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//DATABASE MODEL
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
// OAUTH GOOGLE
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/devbase",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id, name: profile.displayName, username: profile.id, picture: profile._json.picture}, function (err, user) {
            return cb(err, user);
        });
    }
));

fs.readdirSync(testFolder).forEach(file => {
    // console.log(file);
});

// STORAGE ENGINE

const storage = multer.diskStorage({
    destination: './public/upload',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({
    storage: storage,
   limits:{
       fileSize: 100485760
   }
})

// app.post("/upload", upload.single('profile'), (req, res) => {
//     res.json({
//         success: 1,
//         profile_url: `http://localhost:3000/profile/${req.file.filename}`
//     })
//     let imgPath = req.file.path;
//     console.log(imgPath);
// })

// app.post("/upload", upload.single('profile'), (req, res) => {
//     let imgPath = req.file.path;
//     const path = new user ({
//         filePath: req.file.path
//     });
//     user.save()
//     res.redirect("/main")
//     console.log(imgPath);
// })




function errHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        res.json({
            success: 0,
            message: err.message
        })
    }
}
app.use(errHandler);

// ROUTS
app.get("/", function (req, res) {
    res.render("landingpg");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("signup");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get('/auth/google/devbase',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect main.
        res.redirect("/userin");
    });

app.get("/main", function  (req, res) {
    if (req.isAuthenticated()) {
        User.find({ "secret": { $ne: null }, "filePath": { $ne: null }}, function(err, foundUser, filePath){
            if(err){
                console.log(err);
            }else{
                if(foundUser ){
                    res.render("main", {
                        usersWithSecrets: foundUser,
                        usersWithImages: filePath
                    });
                }
            }
        }
        );
    } else {
        res.redirect("/login");
    }

});
app.get("/cini", function (req, res) {
    if (req.isAuthenticated()) {
        User.find({ "secret": { $ne: null }, "filePath": { $ne: null } }, function (err, foundUser, videoPath) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    res.render("cini", {
                        usersWithSecrets: foundUser,
                        usersWithVideos: videoPath
                    });
                }
            }
        }
        );
    } else {
        res.redirect("/login");
    }

});
app.get("/profile", function (req, res) {
    if (req.isAuthenticated()) {
        User.find({ "secret": { $ne: null }, "filePath": { $ne: null } }, function (err, foundUser, videoPath) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    res.render("userprofile", {
                        usersWithSecrets: foundUser,
                        usersWithVideos: videoPath
                    });
                }
            }
        }
        );
    } else {
        res.redirect("/login");
    }

});

app.get("/readmore", function(req,res){
    res.render("read-more");
})


app.get("/userin", function (req, res) { 
    if (req.isAuthenticated()) {
        User.find({ "secret": { $ne: null } }, function (err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    res.render("userin", { usersWithSecrets: foundUser });
                }
            }
        }
        );
    } else {
        res.redirect("/login");
    }

});

app.get("/photo", function (req, res) {
    if (req.isAuthenticated()) {
        User.find({ "secret": { $ne: null } }, function (err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    res.render("photography", { usersWithSecrets: foundUser });
                }
            }
        }
        );
    } else {
        res.redirect("/login");
    }

});


// app.get("/readmore", function (req, res) {
//     if (req.isAuthenticated()) {
//         // res.render("main");
//         User.find({ "secret": { $ne: null } }, function (err, foundUser) {
//             if (err) {
//                 console.log(err);
//             } else {
//                 if (foundUser) {
//                     res.render("read-more", { usersWithSecrets: foundUser });
//                 }
//             }
//         }
//         );
//     } else {
//         res.redirect("/login");
//     }

// });

app.get("/submit", function(req,res){
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});
app.get("/uplod", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("ciniupload");
    } else {
        res.redirect("/login");
    }
});
app.get("/update", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("update");
    } else {
        res.redirect("/login");
    }
});
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/login");
});


app.post("/feedback", function(req,res){
    const userFeedBack = req.body.userFeed;
    User.findById(req.user.id, req.body.userFeed ,function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.feedback = userFeedBack;
                foundUser.save(function () {
                    res.redirect("/userin");
                });
            }
        }
    });
})




app.post("/submit", upload.single('profile'), function(req,res){
    const submittedSecret = req.body.secret;
    const submittedFile = req.file.path.split('\\').splice(1).join('\\');
    User.findById(req.user.id, req.file.path,function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.filePath = submittedFile;
                foundUser.save(function(){
                    res.redirect("/main");
                });
            }
        }
    });
});
app.post("/uplod", upload.single('profile'), function (req, res) {
    const submittedDesc = req.body.description;
    const uploadedVido = req.file.path.split('\\').splice(1).join('\\');
    User.findById(req.user.id, req.file.path, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedDesc;
                foundUser.videoPath = uploadedVido;
                foundUser.save(function () {
                    res.redirect("/cini");
                });
                // console.log(uploadedVido);
            }
        }
    });
});
app.post("/update", upload.single('profile'), function (req, res) {
    const userUpdate = req.file.path.split('\\').splice(1).join('\\');
    User.findById(req.user.id, req.file.path, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.picture = userUpdate;
                foundUser.save(function () {
                    res.redirect("/main");
                });
            }
        }
    });
});
app.post("/register", upload.single('profile'), function (req, res) {
    User.register({ username: req.body.username, name: req.body.userName }, req.body.password ,function (err, user) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                // res.redirect("main")
                res.redirect("/userin")
            });
        }
    });
})

// app.post("/upload", upload.single('profile'), (req, res) => {
//     let imgPath = req.file.path;
//     const path = new user({
//         filePath: req.file.path
//     });
//     user.save()
//     res.redirect("/main")
//     console.log(imgPath);
// })

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password 
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {                                           // AUTHENTICATES THE USER
            passport.authenticate("local")(req, res, function () {
                res.redirect("/userin");
            });
        }
    })
});




// STARTING NODE SERVER ON PORT 3000

// app.listen(3000, '0.0.0.0', function () {
//     console.log("Server started at port 3000");
// });

app.listen(process.env.PORT || 5000, function () {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});