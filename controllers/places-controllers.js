const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
	const placeId = req.params.pid;

	let place;
	try {
		place = await Place.findById(placeId);
	} catch (error) {
		return next(error, 500);
	}

	if (!place) {
		return next(
			new HttpError('Could not find a place for the provided id.', 404)
		);
	}

	res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
	const userId = req.params.uid;

	// ada 2 cara 1 pakai langsung dari place 1 dari populate place dari user

	// let places;
	let userWithPlaces;
	try {
		// places = await Place.find({ creator: userId });
		userWithPlaces = await User.findById(userId).populate('places');
	} catch (error) {
		return next(new HttpError(error, 500));
	}

	// if (!places || places.length === 0) {
	//   return next(
	//     new HttpError("Could not find places for the provided user id.", 404)
	//   );
	// }
	if (!userWithPlaces || userWithPlaces.length === 0) {
		return next(
			new HttpError('Could not find places for the provided user id.', 404)
		);
	}

	// res.json({
	//   places: places.map((place) => place.toObject({ getters: true })),
	// });
	res.json({
		places: userWithPlaces.places.map((place) =>
			place.toObject({ getters: true })
		),
	});
};

const createPlace = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(new HttpError(errors, 422));
	}

	const { title, description, address } = req.body;

	let coordinates;
	try {
		coordinates = await getCoordsForAddress(address);
	} catch (error) {
		return next(error);
	}

	const createdPlace = new Place({
		title,
		description,
		image: req.file.path,
		address,
		location: coordinates,
		creator: req.userData.userId,
	});

	let user;
	try {
		user = await User.findById(req.userData.userId);
	} catch (error) {
		return next(
			new HttpError('Creating place failed, please try again later', 500)
		);
	}

	if (!user) {
		return next(new HttpError('Cannot find user of provided id', 500));
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await createdPlace.save({ session: sess });
		user.places.push(createdPlace);
		await user.save({ session: sess });
		await sess.commitTransaction();
	} catch (err) {
		return next(new HttpError(err, 500));
	}
	res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError('Invalid inputs passed, please check your data.', 422)
		);
	}

	const { title, description } = req.body;
	const placeId = req.params.pid;

	let place;

	try {
		place = await Place.findById(placeId);
	} catch (error) {
		return next(new HttpError(error, 500));
	}

	if (place.creator.toString() !== req.userData.userId) {
		return next(new HttpError('You are not allowed to edit this place.', 401));
	}

	place.title = title;
	place.description = description;

	try {
		await place.save();
	} catch (error) {
		return next(new HttpError(error, 500));
	}

	res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
	const placeId = req.params.pid;

	let place;

	try {
		place = await Place.findById(placeId).populate('creator');
	} catch (error) {
		return next(new HttpError(error, 500));
	}

	if (!place) {
		return next(new HttpError('can not find place', 404));
	}

	if (place.creator.id !== req.userData.userId) {
		return next(new HttpError('You are not allowed to delete this place.', 401));
	}

	const imagePath = place.image;

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await place.deleteOne({ session: sess });
		place.creator.places.pull(place);
		await place.creator.save({ session: sess });
		await sess.commitTransaction();
	} catch (error) {
		return next(new HttpError(error, 500));
	}

	fs.unlink(imagePath, (err) => {
		console.log(err);
	});

	res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
