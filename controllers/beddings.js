const express = require('express');
const Bedding = require('../models/Bedding');
const BabyBedding = require('../models/Baby');
const Order = require('../models/Order');
const Interior = require('../models/Interior');
const nodemailer = require('nodemailer');
require('dotenv').config();
const router = express.Router({
    mergeParams: true
});

// Multer and cloudinary configuration
let multer = require('multer');
let storage = multer.diskStorage({
    filename: (req, file, callback) => {
        callback(null, Date.now() + file.originalname);
    }
});

let filesFilter =  (req, file, cb) => {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
let upload = multer({
    storage: storage,
    fileFilter: filesFilter
})

let cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'boyedeveloper',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get('/', (req, res) => {
    Bedding.find({}, (err, beddings) => {
        if(err) {
            console.log(err);
            req.flash('error', err.message);
            return res.send('Error response from server')
        } else  {
            Interior.find({}, (err, interiors) => {
                if(err) {
                    console.log(err);
                    req.flash('error',  err.message);
                } else {
                    BabyBedding.find({}, (err, babyBeddings)=>{
                        if(err) {
                            console.log(err);
                            req.flash('error',  err.message);
                        } else {
                            res.render('index', { interiors, babyBeddings, beddings});
                        }
                    });
                }
            });
        }
    });
});

// Beddings Page 
router.route('/babybeddings')
    .get((req, res) => {
        BabyBedding.find({}, (err, babyBeddings)=> {
            if(err) {
                console.log(err);
                req.flash('error',  err.message)
                return res.redirect('/')
            } else {
                res.render('babybeddings', {babyBeddings});
            }
        });
    })
    .post(isAdminLoggedIn, upload.single('image'), (req, res) => {
        cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
            if (err) {
                console.log(err);
                req.flash("error", "There is a problem Uploading your product "+ err.message);
                return res.redirect("/admin");
            }
            req.body.image = result.secure_url;
            req.body.imageId = result.public_id;
            let productName = req.body.productName;
            let price = req.body.price;
            let description = req.body.description;           
            let author = {
                id: req.user._id,
                username: req.user.username
            };
            let { colors, sizes, patterns, quantity } = req.body
            let col = colors.split(','); let siz = sizes.split(','); let pat = patterns.split(',');
            let newColors = col;
            let newSizes = siz;
            let newPatterns = pat;
            let bedding = { productName, price, image: req.body.image, imageId: req.body.imageId, description, author, colors: newColors, sizes: newSizes, patterns: newPatterns, quantity }
            BabyBedding.create(bedding, function (err, createdBedding) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash("success", "Babybedding " + createdBedding.productName + " succcessfully created");
                    res.redirect("/babybeddings");
                }
            });
        });
    });

router.route('/babybeddings/:id')
    .get(isLoggedIn, (req, res) => {
        BabyBedding.findById(req.params.id, (err, babyBedding) => {
            if (err) {
                console.log(err);
                req.flash('error', err.message)
                return res.redirect('/babybeddings')
            } else {
                res.render('baby-show', {
                    product: babyBedding
                });
            }
        })
    })
    .put(isAdminLoggedIn, upload.single('image'), (req, res) => {
        BabyBedding.findById(req.params.id, async (err, updated) => {
            if (err) {
                console.log(err);
                req.flash('error', err.message);
                res.redirect('back');
            } else {
                if (req.file) {
                    try {
                        await cloudinary.v2.uploader.destroy(updated.imageId);
                        let result = await cloudinary.v2.uploader.upload(req.file.path);
                        updated.image = result.secure_url;
                        updated.imageId = result.public_id;
                    } catch (err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                }
                let {colors, sizes, patterns} = req.body;
                let col = colors.split(','); let siz = sizes.split(','); let pat = patterns.split(',');
                let newColors = col;
                let newSizes = siz;
                let newPatterns = pat;
                updated.productName = req.body.productName
                updated.colors = newColors; updated.price = req.body.price; updated.description = req.body.description;
                updated.sizes = newSizes; updated.patterns = newPatterns; updated.quantity = req.body.quantity;
                updated.save();
                req.flash('success', `${updated.productName} updated!!!`)
                res.redirect(`/babybeddings/${updated._id}`);
            }
        });
    })
    .delete(isAdminLoggedIn, (req, res) => {
        BabyBedding.findByIdAndDelete(req.params.id, (err, deleted) => {
            if (err) {
                console.log(err);
                req.flash('error', 'The product deletion was unsuccessful' + err.message);
                return res.redirect('/babybeddings');
            } else {
                req.flash('success', 'The requested product has been deleted!!!');
                return res.redirect('/babybeddings');
            }
        })
    });

router.route('/babybeddings/:id/edit')
    .get(isAdminLoggedIn, (req, res) => {
        BabyBedding.findById(req.params.id, (err, bed) => {
            try{
                res.render('baby-edit', { product: bed })
            } catch(err) {
                console.log(err);
                req.flash('error', err.message);
                res.redirect(`/babybeddings/${bed._id}`);
            }
        });
    })

// Interior Decoration Page
router.route('/interiordecor')
    .get((req, res) => {
        Interior.find({}, (err, interiors) => {
            if (err) {
                console.log(err);
                req.flash('error', err.message);
                return res.redirect('/');
            } else {
                res.render("interiordecor", { interiors });
            }
        });
    })
    .post(isAdminLoggedIn, upload.single('image'), (req, res) => {
        cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
            if (err) {
                req.flash("error", "There is a problem Uploading your picture");
                return res.redirect("admin");
            }
            req.body.image = result.secure_url;
            req.body.imageId = result.public_id;
            let productName = req.body.productName;
            let price = req.body.price;
            let description = req.body.description;
            let author = {
                id: req.user._id,
                username: req.user.username
            };
            let bedding = {
                productName: productName,
                price: price,
                image: req.body.image,
                imageId: req.body.imageId,
                description: description,
                author: author
            }
            Interior.create(bedding, function (err, createdBedding) {
                if (err) {
                    console.log(err.message);
                    req.flash('error', 'There is an issues while uploading your Interior decoration Product ' + err.message)
                } else {
                    req.flash("success", createdBedding.productName + " succcessfully created");
                    res.redirect("/interiordecor/" );
                }
            });
        });
    });

// Interior decor index route
router.route('/interiordecor/:id')
    .get(isLoggedIn, (req, res) => {
        Interior.findById(req.params.id, (err, interior) => {
            try {
                res.render('interior-show', {
                    product: interior
                });
            }
            catch (err){
                console.log(err);
                req.flash('error', err.message);
                return res.redirect('/interiordecor');
            } 
        });
    })
    .put((req, res) => {
        res.send('Your shortened route worked!')
    })
    .delete(isAdminLoggedIn, (req, res) => {
        Interior.findByIdAndDelete(req.params.id, (err, deleted) => {
            if (err) {
                console.log(err);
                req.flash('error', '. The product deletion was unsuccessful' + err.message);
                return res.redirect('/');
            } else {
                req.flash('success', 'The requested product has been deleted!!!');
                return res.redirect('/interiordecor');
            }
        })
    });

// Normal Beddings product route
router.route('/products') 
    .get((req, res) => {
        Bedding.find({}, (err, beddings) => {
            if (err) {
                console.log(err);
                req.flash('error','There is an issue retrieving products ' +  err.message);
                return res.send('Error response from server')
            } else {
                Interior.find({}, (err, interiors) => {
                    if (err) {
                        console.log(err);
                        req.flash('error', err.message);
                    } else {
                        BabyBedding.find({}, (err, babyBeddings) => {
                            if (err) {
                                console.log(err);
                                req.flash('error', err.message);
                            } else {
                                res.render('products', {
                                    beddings, interiors, babyBeddings
                                });
                            }
                        });
                    }
                });
            }
        });
    })
    .post(isAdminLoggedIn, upload.single('image'), (req, res) => {
            cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
                if (err) {
                    req.flash("error", "There is a problem Uploading your picture");
                    return res.redirect("/products/new");
                }
                console.log(req.body);
                req.body.image = result.secure_url;
                req.body.imageId = result.public_id;
                let productName = req.body.productName;
                let price = req.body.price;
                let description = req.body.description;
                let author = {
                    id: req.user._id,
                    username: req.user.username
                };
                let { colors, sizes, patterns, quantity } = req.body
                let col = colors.split(','); let siz=  sizes.split(','); let pat = patterns.split(',');     
                let newColors = col; 
                let newSizes = siz; 
                let newPatterns = pat; 
                let bedding = {  productName, price, image: req.body.image, imageId: req.body.imageId, description, author, colors:newColors, sizes:newSizes, patterns:newPatterns, quantity }
                Bedding.create(bedding, function (err, createdBedding) {
                    if (err) {
                        console.log(err);
                        req.flash('error', "An error occur while uploading your Bedding! " + err.message)
                    } else {
                        req.flash("success", createdBedding.productName + " succcessfully created");
                        res.redirect("/products/");
                    }
                });
            });   
    });

router.route('/products/:id')
    .get(isLoggedIn, (req, res) => {
        Bedding.findById( req.params.id, (err, bedding) => {
           if (err) {
               console.log(err);
               req.flash ('error',  err.message)
               return res.redirect('/products')
           } else {
            res.render('product-show', {
            product:bedding
        });
           }
        }) 
    })
    .put(isAdminLoggedIn, upload.single('image'), (req, res) => {
            Bedding.findById(req.params.id, async (err, updated) => {
                if(err) {
                    console.log(err);
                    req.flash('error', err.message);
                    res.redirect('back');
                } else {
                if (req.file) {
                    try {
                        await cloudinary.v2.uploader.destroy(updated.imageId);
                        let result = await cloudinary.v2.uploader.upload(req.file.path);
                        updated.image = result.secure_url;
                        updated.imageId = result.public_id;
                    } catch (err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                    }    
                    let { colors, sizes, patterns } = req.body
                    let col = colors.split(','); let siz = sizes.split(','); let pat = patterns.split(',');
                    let newColors = col;
                    let newSizes = siz;
                    let newPatterns = pat;
                    updated.productName = req.body.productName
                    updated.colors = newColors; updated.price = req.body.price; updated.description = req.body.description;
                    updated.sizes = newSizes; updated.patterns = newPatterns; updated.quantity = req.body.quantity;
                    updated.save();
                    req.flash('success', `${updated.productName} updated!!!`)
                    res.redirect(`/products/${updated._id}`);
            }
        });
    })
    .delete(isAdminLoggedIn, (req, res) => {
        Bedding.findByIdAndDelete(req.params.id, (err, deleted) => {
            if(err) {
                console.log(err);
                req.flash('error', '. The product deletion was unsuccessful'+ err.message );
                return res.redirect ('/');
            } else {
                req.flash('success',  'The requested product has been deleted!!!');
                return res.redirect('/products');
            }
        })
    });

router.route('/products/:id/edit')
    .get(isAdminLoggedIn, (req, res)=> {
        Bedding.findById(req.params.id, (err, bed) => {
            res.render('product-edit', {product:bed})
        });
    })

router.post('/order',  (req, res)=> {
    console.log(req.body);
    Order.create(req.body, (err, order)=> {
        try {
            console.log(order._id + ' order created')
            return res.redirect('/checkout/' + order._id)
        }
        catch (err) {
            console.log(err);
            req.flash(err);
            res.redirect('back');
        }
    });
});

router.get('/checkout/:id', (req, res) => {
    Order.findById(req.params.id , (err, order)=> {
        if (err) {
            console.log(err);
            req.flash('error', err.message);
            res.redirect('back');
        }
         else {
             console.log(order);
             res.render('checkout', {
                 order
             });
         }
    })
});

router.post('/checkout/:id', isLoggedIn, (req, res) => {
    Order.findById(req.params.id, (err, order) =>{
        try {
            console.log(req.body);
            let email = 'pascalkayfittings@gmail.com';
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'pascalkayfittings@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            let mailOptions = {
                to: 'kayfittings0211@gmail.com, eyiwumiolaboye@gmail.com',
                from: email,
                subject: 'Kayfittings Customer Delivery details',
                text: 'A customer recently paid for your good via paystack, below is their delivery details\n\n' +
                    'Customer Name: ' + req.user.firstName + ' ' + req.user.lastName + "\n\n" +
                    'Customer Phone: ' + req.body.phone + "\n\n" +
                    'Purchased product: ' + order.orderName + "\n\n" +
                    'Size: ' + order.size + "\n\n" +
                    'Color: ' + order.color + "\n\n" +
                    'Purchase Price: ' + order.orderPrice + "\n\n" +
                    'Street Address : ' + req.body.addressLine + "\n\n" +
                    'City: ' + req.body.city + ' \n\n' +
                    'State: ' + req.body.state + ' \n\n' +
                    'Kindly deliver to your customer as soon as possible.'
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                try {
                    req.flash('success', 'Your information has been successfully sent to Kayfittings. You will be contacted shortly');
                    order.remove()
                    return res.redirect("/");
                } catch (err) {
                    console.log(err + 'Delivery detail not delivering to backend');
                    req.flash("error", "Delivery details couldn't successfully submit");
                    return res.redirect("back");
                }
            });
        }
        catch (err) {
            console.log(err, 'Cannot find order in database')
        }
    });
});

router.get('/faq', (req, res) => {
    res.render('faq');
});

router.get('/contact', (req, res) => {
    res.render('contact');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash("error", "You need to be logged in to do that")
        res.redirect("/login");
    }
}

function isAdminLoggedIn(req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    } else {
        req.flash("error", "You are not an admin");
        return res.redirect("/login");
    }
}


module.exports =  router; 