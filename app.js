const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const homeRoutes = require('./routes/home');
const testIO = require('./socket');

// Connection String
// "home_automation" is the DB name
const MONGODB_URI = 'mongodb://localhost/home_automation';

const app = express();

// Setting body-parser for parsing the incoming data into JSON format
app.use(bodyParser.json({ limit: "50mb" })); // application/json
app.use(bodyParser.raw({ limit: '150mb' }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })); // x-www-form-urlencoded <form>

// Setting static path to images folder.
// "static" method is given by "Express", and used to set static folder.
// "/images" means every request that comes to this path(url) goes to this.
// "__dirname" gives the absolute path of this file. like we are in app.js so it gives "/"
// app.use("/images/profilephoto", express.static(path.join(__dirname, "images/profilephoto")));
app.use("/images/photo", express.static(path.join(__dirname, "images/photo")));



// Common Gotcha :- (Enabling CORS) Allowing different servers and applications to connect with our Rest-API
app.use((req, res, next) => {
    // "*" means, allowing all the domains to connect with our API.
    // We can specify any specific domain also.
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Allowing methods to be accessed by other domains.
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");

    // Allowing headers to be set by our client(domain).
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    next();
});

// SocketIO testing code
app.post('/testIO', (req, res, next) => {
    // console.log(req.body.data); 
    testIO.getIO().sockets.in("5cc94c745ebd63081c3a08f9").emit('test', "testing data");
});

// Registering Routes
// appending "/auth" before every request to this route.
// every request starting from "/auth" will make it into this route.
app.use('/auth', authRoutes);
app.use('/room', roomRoutes);
app.use('/home', homeRoutes);

// Express's error handling middleware
// Everytime either the error is thrown by 'throw' kewyord or by calling 'next(error)', 
// this middleware will be executed.
app.use((error, req, res, next) => {
    console.log(error);

    // 'statusCode' is our custom property that we have manually sat while having an error.   
    // '||' indicates that if 'statusCode' is undefined then it will take '500'
    const status = error.statusCode || 500;

    // 'message' is a in-built property which has the error message that we have passed in Error() constructor.
    const message = error.message;

    res.status(status).json({ error: message });
});

// Connecting to MongoDB and starting server at port : 8080
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
    .then((result) => {
        const server = app.listen(8080);
        console.log('server is Connected and its listen on the port 8080' ); 

        // Setting socket.io for realtime communication like chatting app.
        // Works on WebSocket protocol instead of http protocol.
        // it takes the created server as an argument.
        // const io = require('socket.io')(server);
        // init() method is made by us in 'socket.js' file
        const io = require('./socket').init(server);

        // on() is the event listener, and 'connection' means we are waiting for a new connection!
        // this on() event listener will be called whenever a new connection is established.
        io.sockets.on('connection', (socket) => {
            console.log('Client Connected!');

            socket.on("join", (roomName) => {

                // using socketio rooms
                socket.join(roomName, (error) => {
                    if (error) {
                        console.log(`Error joining room :- ${error}`);
                    } else {
                        console.log(`Room has been joined by ${roomName}`);
                    }
                });
                // io.sockets.in("5cc94c745ebd63081c3a08f9").emit("test", "Yo baby!");
            });

            socket.on('dis', (roomName) => {
                // console.log("Room name :- " + roomName);
                socket.leave(roomName, (error) => {
                    if (error) {
                        console.log(`Error leaving room :- ${error}`);
                    } else {
                        socket.in(roomName).disconnect(true);
                        console.log(`Room has been left by ${roomName}`);
                    }
                });
            });
        });
    })
    .catch((error) => {
        console.log(error);
    });