const express = require("express");
const HttpError = require("../models/Http-error");

const router = express.Router();

const DUMMY_PLACES = [
	{
		id: "p1",
		title: "Borobudur Temple",
		description: "one of the funniest place",
		imageUrl:
			"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2SYpibWv2Wwn-RQKiBsnLBUCGrw7jXw3kHA&s",
		address:
			"Jl. Badrawati, Kw. Candi Borobudur, Borobudur, Kec. Borobudur, Kabupaten Magelang, Jawa Tengah",
		location: {
			lat: -7.6078738,
			lng: 110.2011764,
		},
		creator: "u1",
	},
	{
		id: "p2",
		title: "Borobudur Temple 2",
		description: "one of the funniest place",
		imageUrl:
			"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2SYpibWv2Wwn-RQKiBsnLBUCGrw7jXw3kHA&s",
		address:
			"Jl. Badrawati, Kw. Candi Borobudur, Borobudur, Kec. Borobudur, Kabupaten Magelang, Jawa Tengah",
		location: {
			lat: -7.6078738,
			lng: 110.2011764,
		},
		creator: "u2",
	},
];

router.get("/:pid", (req, res, next) => {
	const placeID = req.params.pid;
	const place = DUMMY_PLACES.find((p) => {
		return p.id === placeID;
	});
	if (!place) {
		throw new HttpError("Could not find a place for the provided id.", 404);
	}
	res.json({ place });
});

router.get("/user/:uid", (req, res, next) => {
	const userID = req.params.uid;
	const place = DUMMY_PLACES.find((p) => {
		return p.creator === userID;
	});
	if (!place) {
		return next(
			new HttpError("Could not find a place for the provided user id.", 404)
		);
	}
	res.json({ place });
});

module.exports = router;
