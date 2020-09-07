const User = require('../models/auth.model')
const expressjwt = require('express-jwt')
const _ = require('lodash')
const { OAuth2Client } = require('google-auth-library')
const fetch = require('node-fetch')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
// Custom error handler to get useful error from database errors
const { errorHandler } = require('../helpers/dbErrorHandling')
// For sending mail -- we can use nodemailer also--
// const sgMail = require('@sendgrid/mail')
// sgMail.setApiKey(process.env.MAIL_KEY)

//importing .env
require('dotenv').config({
    path: './config/config.env'
})
const nodemailer = require('nodemailer')



exports.registerController = (req,res) => {
    const {name, email, password} = req.body
   //   console.log(name,email,password)
   //     res.send('success') 
    const errors = validationResult(req)

    //validation to req.body creating custom validation
    if(!errors.isEmpty()) {
        const firstError = errors.array().map(error => error.msg)[0]
        return res.status(422).json({
            error: firstError
        })
    } else {
        User.findOne({
            email
        }).exec((err, user) => {
            //If user exists
            if(user) {
                return res.status(400).json({
                    error: "Email is taken"
                })
            }
        })

        //Generate Token
        const token = jwt.sign({
            name,
            email,
            password
        }, 
        process.env.JWT_ACCOUNT_ACTIVATION,
        {
            expiresIn: '15m'
        }
    )

    //Email data sending
    

    // sgMail.send(emailData).then(sent=> {
    //     return res.json({
    //         message: `Email has been sent to ${email}`
    //     })
    // }).catch(err => {
    //     return res.status(400).json({
    //         error: errorHandler(err)
    //     })
    // })

    // Step 1
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL || 'abc@gmail.com', // TODO: your gmail account
            pass: process.env.PASSWORD || '1234' // TODO: your gmail password
        }
    }); 
    
    // Step 2
    const emailData = {
        from: process.env.EMAIL,
        to: email,
        subject:'Account activation link',
        html: `
        <h1>Please use the following to activate your account</h1>
        <p>${process.env.CLIENT_URL}/users/activate/${token}</p>
        <hr />
        <p>This email may containe sensetive information</p>
        <p>${process.env.CLIENT_URL}</p>
    `
    }

    // Step 3
    transporter.sendMail(emailData, (err, data) => {
       if(err){
        return res.status(400).json({
                    error: errorHandler(err)
                })
       } else {
        return res.json({
            message: `Email has been sent to ${email}`
        })
       }
    });


 }
}

// Activation and save to database
exports.activationController = (req, res) => {
    const { token } = req.body
  
    if (token) {
      jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decoded) => {
        if (err) {
          console.log('Activation error');
          return res.status(401).json({
            errors: 'Expired link. Signup again'
          });
        } else {
          const { name, email, password } = jwt.decode(token)
  
          console.log(email + " " + password + " " + name)
          const user = new User({
          email,
          name,
          password
          })
  
          user.save((err, user) => {
            if (err) {
                console.log("hitting")
              console.log('Save error', errorHandler(err));
              return res.status(401).json({
                errors: errorHandler(err)
              })
            } else {
              return res.json({
                success: true,
                message: 'Signup success',
                user
              })
            }
          })
        }
      })
    } else {
      return res.json({
        message: 'error happening please try again'
      })
    }
  }

  //making controller for login
  exports.loginController = (req, res) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array().map(error => error.msg)[0];
      return res.status(422).json({
        errors: firstError
      });
    } else {
      // check if user exist
      User.findOne({
        email
      }).exec((err, user) => {
        if (err || !user) {
          return res.status(400).json({
            errors: 'User with that email does not exist. Please signup'
          });
        }
        // authenticate
        if (!user.authenticate(password)) {
          return res.status(400).json({
            errors: 'Email and password do not match'
          });
        }
        // generate a token and send to client
        const token = jwt.sign(
          {
            _id: user._id
          },
          process.env.JWT_SECRET,
          {
            expiresIn: '7d'
          }
        );
        const { _id, name, email, role } = user;
  
        return res.json({
          token,
          user: {
            _id,
            name,
            email,
            role
          }
        });
      });
    }
  };

  // forget password 
  exports.forgetController = (req, res) => {
    const { email } = req.body;
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
      const firstError = errors.array().map(error => error.msg)[0];
      return res.status(422).json({
        errors: firstError
      });
    } else {
      User.findOne(
        {
          email
        },
        (err, user) => {
          if (err || !user) {
            return res.status(400).json({
              error: 'User with that email does not exist'
            });
          }
  
          const token = jwt.sign(
            {
              _id: user._id
            },
            process.env.JWT_RESET_PASSWORD,
            {
              expiresIn: '10m'
            }
          );
  
          const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Password Reset link`,
            html: `
                      <h1>Please use the following link to reset your password</h1>
                      <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
                      <hr />
                      <p>This email may contain sensetive information</p>
                      <p>${process.env.CLIENT_URL}</p>
                  `
          };
  
          return user.updateOne(
            {
              resetPasswordLink: token
            },
            (err, success) => {
              if (err) {
                console.log('RESET PASSWORD LINK ERROR', err);
                return res.status(400).json({
                  error:
                    'Database connection error on user password forgot request'
                });
              } else {

                //mail service initialize
                let transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                      user: process.env.EMAIL || 'abc@gmail.com', // TODO: your gmail account
                      pass: process.env.PASSWORD || '1234' // TODO: your gmail password
                  }
              }); 

              transporter.sendMail(emailData, (err, data) => {
                if(err){
                 return res.status(400).json({
                             message: err.message
                         })
                } else {
                 return res.json({
                  message: `Email has been sent to ${email}. Follow the instruction to activate your account`
                 })
                }
             });

              }
            }
          );
        }
      );
    }
  };

  //Reset password
  exports.resetController = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;
  
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
      const firstError = errors.array().map(error => error.msg)[0];
      return res.status(422).json({
        errors: firstError
      });
    } else {
      if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(
          err,
          decoded
        ) {
          if (err) {
            return res.status(400).json({
              error: 'Expired link. Try again'
            });
          }
  
          User.findOne(
            {
              resetPasswordLink
            },
            (err, user) => {
              if (err || !user) {
                return res.status(400).json({
                  error: 'Something went wrong. Try later'
                });
              }
  
              const updatedFields = {
                password: newPassword,
                resetPasswordLink: ''
              };
  
              user = _.extend(user, updatedFields);
  
              user.save((err, result) => {
                if (err) {
                  return res.status(400).json({
                    error: 'Error resetting user password'
                  });
                }
                res.json({
                  message: `Great! Now you can login with your new password`
                });
              });
            }
          );
        });
      }
    }
  };

  // maybe required in future
  // exports.requireSignin = expressjwt({
  //   secret: process.env.JWT_SECRET,
  //   algorithms: ['sha1'] // req.user._id
  // });

  // admin
  exports.adminMiddleware = (req, res, next) => {
    User.findById({
      _id: req.user._id
    }).exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: 'User not found'
        });
      }
  
      if (user.role !== 'admin') {
        return res.status(400).json({
          error: 'Admin resource. Access denied.'
        });
      }
  
      req.profile = user;
      next();
    });
  };
  
 

