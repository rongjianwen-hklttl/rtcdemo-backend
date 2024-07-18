const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const roomHandler = require('./room');

const app = express();
const port = 9000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("a user connected");
    roomHandler(socket);
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

server.listen(port, () => {
    console.log(`https listening at: ${port}`);
});
