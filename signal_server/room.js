const { Socket } = require("socket.io");
// const { v4 as uuidV4 } = require("uuid");

const rooms = {};
const chats = {};
const sharingScreens = {};

const roomHandler = (socket) => {
    const createRoom = ({ roomId, userName, peerId, avatar }) => {
        // const roomId = uuidV4();
        if (!rooms[roomId]) {
            rooms[roomId] = {};
        }
        socket.emit("room-created", { roomId, peerId, userName, avatar });
        console.log("user created the room");
    };
    const joinRoom = ({ roomId, peerId, userName, avatar }) => {
        if (!rooms[roomId]) rooms[roomId] = {};
        if (!chats[roomId]) chats[roomId] = [];
        socket.emit("get-messages", chats[roomId]);

        console.log("user joined the room", roomId, peerId, userName);
        rooms[roomId][peerId] = { peerId, userName, avatar };
        socket.join(roomId);
        socket.to(roomId).emit("user-joined", { peerId, userName, avatar });

        socket.emit("get-users", {
            roomId,
            participants: rooms[roomId],
            sharingScreenId: sharingScreens[roomId],
        });

        if (sharingScreens[roomId]) {
            socket.emit("user-started-sharing", sharingScreens[roomId]);
        }
        
        socket.on("disconnect", () => {
            console.log("user left the room", peerId);
            const user = rooms[roomId][peerId];
            leaveRoom({ roomId, peerId, userName: user.userName });
            if (sharingScreens[roomId] === peerId) {
                sharingScreens[roomId] = null;
            }
        });
    };

    const leaveRoom = ({ peerId, roomId, userName }) => {
        for (let i in rooms[roomId]) {
            if (i === peerId) {
                delete rooms[roomId][i];
                break;
            }
        }
        //rooms[roomId] = rooms[roomId]?.filter((id) => id !== peerId);
        if (sharingScreens[roomId] === peerId) {
            socket.to(roomId).emit("user-stopped-sharing");
        }
        socket.to(roomId).emit("user-disconnected", {peerId, userName});
    };

    const startSharing = ({ peerId, roomId }) => {
        console.debug('user-started-sharing...')
        console.log({ roomId, peerId });
        sharingScreens[roomId] = peerId;
        socket.to(roomId).emit("user-started-sharing", peerId);
    };

    const stopSharing = (roomId) => {
        console.debug('user-stopped-sharing...')
        sharingScreens[roomId] = null;
        socket.to(roomId).emit("user-stopped-sharing");
    };

    const addMessage = (roomId, message) => {
        //console.log({ message });
        console.log("new message " + message.created_at);
        if (chats[roomId]) {
            chats[roomId].push(message);
        } else {
            chats[roomId] = [message];
        }
        socket.to(roomId).emit("add-message", message);
    };

    const changeName = ({
        peerId,
        userName,
        roomId,
    }) => {
        if (rooms[roomId] && rooms[roomId][peerId]) {
            rooms[roomId][peerId].userName = userName;
            socket.to(roomId).emit("name-changed", { peerId, userName });
        }
    };
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("start-sharing", startSharing);
    socket.on("stop-sharing", stopSharing);
    socket.on("send-message", addMessage);
    socket.on("change-name", changeName);
};

module.exports = roomHandler;
