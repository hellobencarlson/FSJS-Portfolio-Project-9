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
  console.log(credentials);

  if(credentials) {
    const user = await User.findAll({ where: {
      emailAddress: credentials.name
    }})

      if (user) {
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


/* GET users */
router.get('/users', authenticateUser, 
asyncHandler(async (req, res) => {
  //const user = await Course.findByPk(req.params.id)
  console.log(req.currentUser); 
  res.json({
     firstName: req.currentUser[0].dataValues.firstName,
     lastName: req.currentUser[0].dataValues.lastName
   });
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
    console.log(req.body);
    let user;
    try {
        user = await User.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          emailAddress: req.body.emailAddress,
          password: req.body.password
        });
        res.location("/");
        res.status(201).end();
      } catch (error) {
        throw error;
      }
     // user.password = bcryptjs.hashSync(user.password);
}
}));

/* GET courses */
router.get('/courses', asyncHandler(async (req, res, next) => {
   const courses = await Course.findAll();
//   console.log(courses);
  res.render('index', { courses, title: 'Course List' });
}));

/* GET a course */
router.get('/courses/:id', asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id)
  if (course) {
    res.render("update-course", { course, title: course.title });
  } else {
    res.render('error');
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
  let course;
  console.log(req.currentUser[0].dataValues.id);
  course = await Course.create({
    userId: req.currentUser[0].dataValues.id,
    title: req.body.title,
    description: req.body.description
  });
  res.location("/couses/" + course.id);
  res.status(201).end();
 }
}));

 /* PUT a course- update */
router.put('/courses/:id', authenticateUser, [
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
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  await course.destroy();
}));


module.exports = router;

