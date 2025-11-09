const { check, validationResult } = require('express-validator');

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ errors: errors.array() });
};

const registerValidators = [
  check('name').isString().isLength({ min: 2 }).withMessage('Name too short'),
  check('email').isEmail().withMessage('Invalid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be >=6 characters'),
];

const loginValidators = [
  check('email').isEmail().withMessage('Invalid email'),
  check('password').exists().withMessage('Password is required'),
];

const requestResetValidators = [check('email').isEmail().withMessage('Invalid email')];

const resetValidators = [
  check('token').isString().withMessage('Token required'),
  check('newPassword').isLength({ min: 6 }).withMessage('newPassword must be >=6 characters'),
];

const articleCreateValidators = [
  check('title').isString().isLength({ min: 3 }).withMessage('Title too short'),
  check('content').isString().isLength({ min: 10 }).withMessage('Content too short'),
];

const oauthGoogleValidators = [
  check('idToken').isString().withMessage('idToken is required'),
];

const rssSourceValidators = [
  check('name').isString().isLength({ min: 2 }).withMessage('Name required'),
  check('url').isURL().withMessage('Valid url required'),
  check('tag').optional().isString(),
  check('active').optional().isBoolean()
];

module.exports = {
  validate,
  registerValidators,
  loginValidators,
  requestResetValidators,
  resetValidators,
  articleCreateValidators,
  oauthGoogleValidators,
  rssSourceValidators,
  // placeholder: no validators here for recommendations (routes use express-validator inline)
};
