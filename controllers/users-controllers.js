const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const user = require('../models/user');

const getUsers = async (req, res, next) => {
	let users;
	try {
		users = await User.find({}, '-password');
	} catch (error) {
		return next(new HttpError(error, 500));
	}
	res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError('Invalid inputs passed, please check your data.', 422)
		);
	}
	const { name, email, password } = req.body;

	// we can use mongoose validate
	// let existingUser;
	// try{
	//   existingUser = await User.findOne({email:email});
	// }catch(error){
	//   return next(new HttpError(error, 500));
	// }

	// if(existingUser){
	//   return next(new HttpError('User Exists, please login instead', 500));
	// }

	let hashedPassword;
	try {
		hashedPassword = await bcrypt.hash(password, 12);
	} catch (error) {
		return next(
			new (HttpError('Could not create user, please try again.', 500))()
		);
	}

	const createdUser = new User({
		name,
		email,
		image: req.file.path,
		password: hashedPassword,
		places: [],
	});

	try {
		await createdUser.save();
	} catch (error) {
		return next(new HttpError('User Exists, please login instead', 500));
	}

	let token;
	try {
		token = jwt.sign(
			{ userId: createdUser.id, email: createdUser.email },
			process.env.JWT_KEY,
			{ expiresIn: '1h' }
		);
	} catch (error) {
		return next(new HttpError('Token Creation Error', 500));
	}

	res
		.status(201)
		.json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
	const { email, password } = req.body;

	let existingUser;
	try {
		existingUser = await User.findOne({ email: email });
	} catch (error) {
		return next(new HttpError(error, 500));
	}

	if (!existingUser) {
		return next(
			new HttpError('Invalid credentials, could not log you in', 401)
		);
	}

	let isValidPassword = false;
	try {
		isValidPassword = await bcrypt.compare(password, existingUser.password);
	} catch (error) {
		return next(
			new HttpError('could not log you in, something went wrong', 500)
		);
	}

	if (!isValidPassword) {
		return next(new HttpError('could not log you in, wrong password', 500));
	}

	let token;
	try {
		token = jwt.sign(
			{ userId: existingUser.id, email: existingUser.email },
			process.env.JWT_KEY,
			{ expiresIn: '1h' }
		);
	} catch (error) {
		return next(new HttpError('Token Creation Error', 500));
	}

	res.json({
		message: 'Logged in!',
		userId: existingUser.id,
		email: existingUser.email,
		token: token,
	});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
