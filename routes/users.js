var express = require('express');
var router = express.Router();
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const { check, validationResult } = require('express-validator');
const User = require('../models').User;
const Course = require('../models').Course;
let message = null;


function asyncHandler(cb){
  return async(req, res, next) => {
      try {
          await cb(req, res, next)
      } catch(error){
          res.status(500).send(error);
          console.log(error.message);
      }
  }
}

// authenticate
const authenticateUser = asyncHandler(async (req, res, next) => {
  const credentials = auth(req);
  // console.log(credentials);

  if(credentials) {
    const user = await User.findAll({ where: {
      emailAddress: credentials.name
    }});
      if (user[0] != undefined) {
        const authenticated = bcryptjs
            .compareSync(credentials.pass, user[0].dataValues.password);
        
          if (authenticated) {
            req.currentUser = user;
          } else {
            message = "Authentication failed for username: ${user.username}";
          }
      } else {
      message = "User not found for username: ${credentials.name}";
    }
  } else {
    message = "Authentication header not found";
  }

  if (message) {
    console.warn(message);
    res.status(401).json({ message: "Access Denied" });
  } else {
  next();
  }
});

// validate if user is course owner 
const validateCorrectUser = asyncHandler(async (req, res, next) => {
      // which course is it from the database?
      const course = await Course.findByPk(req.params.id);
        // what is its userId
        const id = course.dataValues.userId;
        console.log(id);
      
        const credentials = auth(req);  
        // which user is it from the credentials?
        const user = await User.findAll({ where: {
            emailAddress: credentials.name
          }})
          // what is the user's id
          const userId = user[0].dataValues.id;
          console.log(userId);
          // check for match
          if (id == userId) {
            console.log('match');
            next();
          } else { 
            console.log('not match');
            res.status(403).json({ message: "Access Denied" }).end();
          }
  });



/* GET users */
router.get('/users', authenticateUser, 
asyncHandler(async (req, res) => {

  const userNow = req.currentUser[0].dataValues.id;
  
  const user = await User.findAll({
    where: { 
      id: userNow
    },
    attributes: { 
      exclude: ['createdAt', 'updatedAt', 'password'] 
    }
  });
  res.json({ user });
}));

/* POST users */
router.post('/users', [
  check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("Please add your first name"),
  check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("Please add your last name"),
  check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("Please add your email")
    .isEmail()
    .withMessage("Please use a valid email"),
  check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("Please add a password")
], asyncHandler(async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({ errors: errorMessages });
  } else {
    let user;
    req.body.password = bcryptjs.hashSync(req.body.password);
    user = await User.create(req.body);
    res.location("/");
    res.status(201).end();
}
}));

/* GET courses */
router.get('/courses', asyncHandler(async (req, res, next) => {
   const courses = await Course.findAll({
      attributes: { exclude: ['createdAt', 'updatedAt'] }
   });
  res.json({ courses });
}));

/* GET a course */
router.get('/courses/:id', asyncHandler(async (req, res) => {
  const request = req.params.id
  try {
    const course = await Course.findAll({
      where: { 
        id: request 
      },
      attributes: { 
        exclude: ['createdAt', 'updatedAt'] 
      }
    });
    res.json({ course });
  } catch(error) {
    throw error;
  }
  }));

/* POST course- create */
router.post('/courses', authenticateUser, [
  check('title')
  .exists()
  .withMessage("Please add a title"),
check('description')
  .exists()
  .withMessage("Please add a description")
], asyncHandler(async (req, res) => {
 const errors = validationResult(req);

 if (!errors.isEmpty()) {
   const errorMessages = errors.array().map(error => error.msg);
   res.status(400).json({ errors: errorMessages });
 } else {
  let newCourse;
    newCourse = await Course.create(req.body);
    res.location("/courses/" + newCourse.id);
    res.status(201).end();
}
}));

 /* PUT a course- update */
router.put('/courses/:id', authenticateUser, validateCorrectUser, [
  check('title')
  .exists()
  .withMessage("Please add a title"),
check('description')
  .exists()
  .withMessage("Please add a description")
], asyncHandler(async (req, res) => {

  const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
      const course = await Course.findByPk(req.params.id);
      await course.update(req.body);
      res.status(204).end();
    }
}));

/* Delete a course- update */
router.delete('/courses/:id', authenticateUser, validateCorrectUser, asyncHandler(async (req, res) => {

  const course = await Course.findByPk(req.params.id);
  course.destroy();
  res.status(200).end();

}));


module.exports = router;

