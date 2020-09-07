const User = require('../models/auth.model');
const Shortener = require('../models/short.model');
const shortUrl = require('node-url-shortener');
const { errorHandler } = require('../helpers/dbErrorHandling')

exports.readController = (req, res) => {
    const userId = req.params.id;
    console.log(userId)
    User.findById(userId).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
       // user.hashed_password = undefined;
       // user.salt = undefined;
        res.json(user);
    });
};

//making the short url api
exports.getShortUrl = (req,res) => {
   // console.log("api hit")
    const original = req.param('url')
    const url_id = req.param('url_id')
    const email = req.param('email')
    console.log(req.url)
    shortUrl.short(original, (err, url) => {
        res.json({
            "user": email,
            "id": url_id,
            "original_link": original,
            "short_link": url
        })
});
}

//saving the url in db
exports.saveUrl = (req,res) => {
    console.log('hitting')
    const user1 = req.body['user']
    const id = req.body['url_id']
    const name = req.body['name']
    const original_link = req.body['original_link']
    const short_link = req.body['short_link']


    const shortener = new Shortener({
        user1,
        name,
        id,
        original_link,
        short_link
    })

    shortener.save((err,shortener) => {
        console.log(err)
        if(err){
            return res.status(401).json({
                errors: "Something went wrong"
              })
        } else {
            return res.json({
                success: true,
                message: 'saved successfully',
              })
        }
    })
}

// pulling all the generated urls based on user
exports.fetchUrls = (req,res) => {
    const user1 = req.param('email')
    Shortener.find({user1}, (err,docs) => {
        if(err){
            res.status(401).json({
                message: "Something went wrong"
            })
        } else {
            res.json(docs)
        }
    })
    
}

// Deleting one document
exports.deleteUrl = async (req,res) => {
    // const user1 = req.param('email')
     const id2 = req.param('id1')
     console.log(id2)

   const op = await Shortener.deleteOne({id: id2})
   if(op.deletedCount != 0) {
       res.json({
           message: "Deleted"
       })
   } else {
       res.status(401).json({
           message: "Something went wrong"
       })
   }

}



//update the user profile
exports.updateController = (req, res) => {
    
    // console.log('UPDATE USER - req.user', req.user, 'UPDATE DATA', req.body);
    const { name, password } = req.body;
    const email = req.param('email')
    User.findOne({ email: email }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        if (!name) {
            return res.status(400).json({
                error: 'Name is required'
            });
        } else {
            user.name = name;
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    error: 'Password should be min 6 characters long'
                });
            } else {
                user.password = password;
            }
        }

        user.save((err, updatedUser) => {
            if (err) {
                console.log('USER UPDATE ERROR', err);
                return res.status(400).json({
                    error: 'User update failed'
                });
            }
            updatedUser.hashed_password = undefined;
            updatedUser.salt = undefined;
            res.json(updatedUser);
        });
    });
};


//Admin endpoint

exports.adminData = async (req, res) => {
    
   
    const totalUser = await User.count({})
    const totalUrl  = await Shortener.count({})


    res.json({
        "Total Users": totalUser,
        "Total Urls": totalUrl
    })
}