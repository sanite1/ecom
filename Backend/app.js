require("dotenv").config()

const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const cors = require("cors");

// for level 5 encryption
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

// level 6 
const findOrCreate = require("mongoose-findorcreate");
// const FacebookStrategy = require('passport-facebook').Strategy;

// Global variables
// let fbProfile, fbId, fbUserExists = false;

const app = express()

app.set("view engine", "ejs")

app.use(bodyParser.urlencoded({extended: true}))

app.use(express.json());

app.use(express.static("public"))


const corsOption = {
    origin: [
        "http://localhost:3002/"
    ],
    // credentials: true,
    optionSuccessStatus: 200
}
app.options("*", cors())

app.use(cors(corsOption))
app.use(cors({methods: ["GET", "POST"]}))

// for level 5 encryption
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

// Mongodb connection
// const url = "mongodb://localhost:27017/renahDB"
const url = process.env.MONGOOSE_URL_ATLAS;
mongoose.connect(url)

// Mongoose Schemas
const cartSchema = new mongoose.Schema({
    productImg: String,
    productName: String,
    productPrice: Number,    
    quantity: {type: Number},
    size: {type: String},
    parentId: String,
})
const userSchema = new mongoose.Schema({
    phoneNumber: String,
    fullName: String,    
    username: {type: String, required: false},
    password: {type: String, required: false},
    facebookId: String,
    cart: [cartSchema]
})
const subscribersSchema = new mongoose.Schema({
    email: String,
})
const productSchema = new mongoose.Schema({
    productImg: String,
    productName: String,
    productPrice: Number,
    rating: Number,
    sellerName: String,
    profileImg: String,
    category: String,
    Overview: String,
    Description: String,
    Policy: String,
    Feedback: String,
    discount: Number,
    otherImgs: [
        {
            img: String
        },
        {
            img: String
        },
        {
            img: String
        },
        {
            img: String
        },
        {
            img: String
        }
    ]
})

// for level 5 encryption
userSchema.plugin(passportLocalMongoose, {usernameQueryFields: ["username", "phoneNumber"]})

// for level 6 encryption
userSchema.plugin(findOrCreate)

const User =  mongoose.model("User", userSchema)
const Cart =  mongoose.model("Cart", cartSchema)
const Subscriber =  mongoose.model("Subscriber", subscribersSchema)
const Product =  mongoose.model("Product", productSchema)

// for level 5 encryption
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// level 6 encryption


// *************************************************************************************************************************************************************************************************

// Home route
app.route("/")
    .get((req, res) => {
        // use the to check if the user is authenticated before granting access to homepage
        res.json({isAuthenticated: req.isAuthenticated()})
        // if isAuthenticated is true then give access

        console.log(req.user);
        console.log(req.accessToken);
        console.log(req.refreshToken);
    })
    .post((req, res) => {

    });

// Sign up route
app.route("/api/signup")
    // .get((req, res) => {

    // })
    .post((req, res) => {
        
        const { phoneNumber, fullName, email, password } = req.body;

        User.register(
            {
                username: email,
                phoneNumber: phoneNumber,
                fullName: fullName,
                cart: []
            }, 
            password, 
            (err, result) => {
            if(err) {
                console.log(err);
                return res.status(200).json({success: false, err: err})
            } else {
                passport.authenticate("local") (req, res, () => {
                    console.log("Registered!!!\n" + result.fullName);
                    return res.status(200).json({success: true, data: result})
                })
            }
        })
        
    })

// Login route
app.route("/api/login")
    .get((req, res) => {
        // res.send("Login")
    })
    .post((req, res) => {

        const { username, password } = req.body;
        
        const user = new User({
            username: username,
            password: password
        })
        req.login(user, (err) => {
            if(err) {
                console.log(err);
                return res.status(200).json({success: false, err: err})
            } else {
                passport.authenticate("local") (req, res, () => {
                    console.log("Logged in successfully!!");
                    return res.status(200).json({success: true, data: req.user})
                })
            }
        })
    })

app.route("/api/logout")
    .get((req, res) => {
        // res.send("Login")
    })
    .post((req, res) => {

        req.logout((err) => {
            if(err) {
                console.log(err);
                return res.status(200).json({success: false, err: err})
            } else {
                return res.status(200).json({success: true, data: req.user})
                
            }
        })
    })


app.route("/api/products")
    .get((req, res) => {
        Product.find((err, result) => {
            if(err){
                return res.status(200).json({success: false, err: err})
            }else {
                return res.status(200).json({success: true, data: result})

            }
        })
    })

app.route("/api/cart")
    .get((req, res) => {
        Cart.find((err, result) => {
            if(err){
                return res.status(200).json({success: false, err: err})
            }else {
                return res.status(200).json({success: true, data: result})

            }
        })
    })
    .post((req, res) => {
        // console.log(req);
        const {productImg, productName, productPrice, quantity, size, parentId} = req.body;

        const data = {
            productImg: productImg,
            productName: productName,
            productPrice: Number(productPrice),
            quantity: Number(quantity),
            size: size,
            parentId: parentId  
        }
        // console.log(req.body);
        new Cart(data).save((err, result) => {
            if(err){
                return res.status(200).json({success: false, err: err})
            }else {
                return res.status(200).json({success: true, data: result})

            }
        })
        
    })
    .patch((req, res) => {
        // console.log(req.body);
        Cart.findOne({_id: req.body.id}, (err, result) => {
            if(err){
                // return res.status(200).json({success: false, err: err})
            }else {
                // return res.status(200).json({success: true, data: result})
                
                Cart.updateOne({_id: req.body.id}, {quantity: req.body.op === "+" ? result.quantity+1 : result.quantity > 1 ? result.quantity-1 : result.quantity}, (err, result) => {
                    if(err){
                        return res.status(200).json({success: false, err: err})
                    }else {
                        return res.status(200).json({success: true, data: result})
        
                    }
                })
                
            }
        })
    });


app.route("/api/cart/:id")
    .delete((req, res) => {
        console.log(req.params);
        Cart.deleteOne({_id: req.params.id}, (err, result) => {
            if(err){
                return res.status(200).json({success: false, err: err})
            }else {
                console.log(result);
                return res.status(200).json({success: true, data: result})

            }
        })
    })



app.route("/api/products/:id")
    .get((req, res) => {
        const id = req.params.id;
        Product.find({_id: id}, (err, result) => {
            if(err){
                return res.status(200).json({success: false, err: err})
            }else {
                return res.status(200).json({success: true, data: result})

            }
        })
    })



app.route("/api/subscribe")
    .get((req, res) => {
        Subscriber.findOne({_id: req.body.email}, (err, result) => {
            if(err){
                return res.status(200).json({success: false, msg: err})
            }else {
                // return res.status(200).json({success: true, data: result})
                if(result){
                    return res.status(200).json({success: false, msg: "User exists"})

                }
                Cart.updateOne({_id: req.body.id}, {quantity: req.body.op === "+" ? result.quantity+1 : result.quantity > 1 ? result.quantity-1 : result.quantity}, (err, result) => {
                    if(err){
                        return res.status(200).json({success: false, err: err})
                    }else {
                        return res.status(200).json({success: true, data: result})
        
                    }
                })
                
            }
        })
    })


port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Server started on port " + port);
})