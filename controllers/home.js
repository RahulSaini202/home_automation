const Home = require('../models/home');
const io = require('../socket');


exports.postMotionDetectionEnabledStatus = async (req, res, next) => {
    const userId = req.body.userId;
    const status = req.body.status;

    try {

        const home = await Home.findOne({ userId: userId });

        console.log(home);

        if (!home) {
            const error = new Error("Home not found!");
            error.statusCode = 401;

            // 'throw' will throw an error and exit this function here.
            // this will then go to Express's 'error-handling' middleware which we have defined in app.js
            throw error;
        }

        home.motiondetection = status;
        const updatedHome = await home.save();

        res.status(201).json({ status: updatedHome.motiondetection });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getMotionDetectionEnabledStatus = async (req, res, next) => {
    const userId = req.query.userId;

    try {

        const home = await Home.findOne({ userId: userId });

        console.log(home);

        if (!home) {
            const error = new Error("Home not found!");
            error.statusCode = 401;

            // 'throw' will throw an error and exit this function here.
            // this will then go to Express's 'error-handling' middleware which we have defined in app.js
            throw error;
        }

        res.status(201).json({ status: home.motiondetection });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};



exports.getHomeSensorValues = async (req, res, next) => {
    const hum = req.query.hum;
    const md = req.query.pir;
    const temp = req.query.temp;
    const li = req.query.ldr;

    try {
        if (hum) {
            io.getIO().emit("humidity", hum);
        }
        if (temp) {
            io.getIO().emit("temperature", temp);
        }
        if (li) {
            io.getIO().emit("lightintensity", li);
        }
        if (md) {
            io.getIO().emit("motiondetection", md);
        }
        res.status(201).json({ Success: true });

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

