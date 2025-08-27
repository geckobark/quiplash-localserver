const fs = require('fs');
const content = require('fs').readFileSync(__dirname + '/index.html', 'utf8');

var Players = [];
var choices;
var prompt;

function Player(name, userid, vip) {
    this.name = name;
    this.userid = userid;
    this.vip = true;
  }

var counter = 0;
var appsocket;
const server = require('http').createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.write('{"create":true, "server":"http://localhost"}')
    res.end();

});

const httpServer = require('http').createServer((req, res) => {

    if (req.url === '/js/bootstrap.min.js') {
        fs.readFile('./js/bootstrap.min.js', function(err, data) {
            if (err){
                throw err;
            }
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.write(data); 
            res.end();
            return;
        });
    } else if (req.url === '/js/jquery.min.js') {
            fs.readFile('./js/jquery.min.js', function(err, data) {
                if (err){
                    throw err;
                }
                res.writeHead(200, { 'Content-Type': 'text/javascript' });
                res.write(data); 
                res.end();
                return;
            });
            } else if (req.url === '/css/bootstrap.min.css') {
                 fs.readFile('./css/bootstrap.min.css', function(err, data) {
                 if (err){
                   throw err;
                 }
                 res.writeHead(200, { 'Content-Type': 'text/css' });
                 res.write(data); 
                 res.end();
                 return;
            });
            } else {

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', Buffer.byteLength(content));
    res.end(content);
    }
});

const io = require('socket.io').listen(httpServer);
io.set('transports', ['websocket','flashsocket']);

io.on('connection', socket => {
    console.log('client connected');
    console.log('client id: ' + socket.id);
    //setInterval(() => {
    //    socket.emit('hello', ++counter);
    //}, 1000);

    socket.on('disconnect',()=>{

        if (socket.id === appsocket) {
            console.log("Se desconecto la app");
            appsocket = 0;
            console.log("Desconectando clientes..");

            for(var i=0; i < Players.length; i++){
                io.sockets.sockets[Players[i].userid].disconnect(true);
            }
            Players = [];
        } else if (appsocket != 0) {

            for(var i=0; i < Players.length; i++){
                 if(Players[i].userid === socket.id){
                    Players.splice(i,1); 
                 } 
               }
        console.log("Se fue un jugador: Nueva cantidad " + Players.length); 
        }
    });

    socket.on('newUser', function(data){
        console.log("Se recibio un mensaje tipo: " + data);
        Players.push(new Player(data, socket.id, false));
        io.sockets.socket(appsocket).emit("msg", { type:'Event', event: 'CustomerJoinedRoom', roomId:'GECK', customerUserId: socket.id, customerName: data})  
        console.log("Cantidad de jugadores: " + Players.length);
        console.log("Se devolvio el jugador " + getCustomerByID(socket.id).name);
        sendCustomerMsg(getCustomerByID(socket.id), "Bienvenido, te agregamos al array de jugadores.. bue chau");
    });

    socket.on('msg', function(data){
        console.log("Se recibio un mensaje tipo: " + data.action);
        switch(data.action){
            case 'CreateRoom':
                appsocket = socket.id;
                socket.emit("msg", {type:'Result', action:'CreateRoom', success: true, roomId:'GECK'});
                break;   
            case 'StartSession':
                socket.emit("msg", {type:'Result', action: 'StartSession', success: true, module: 'audience', name: 'Quiplash Audience', response: {count: 0}});
                break;

            case 'SetRoomBlob':
                console.log("State: " + data.blob.state);
                if (data.blob.state == "Gameplay_Vote"){
                    console.log("Opcion derecha: " + data.blob.choices.right);
                    console.log("Opcione izquierda: " + data.blob.choices.left);
                    choices = data.blob.choices;
                    prompt = data.blob.question.prompt;
                }
                break;
            case 'SetCustomerBlob':
                console.log("Datos del blob: " +data.blob.playerName + " " + data.blob.playerColor);
                sendCustomerMsg(getCustomerByID(data.customerUserId), {color: data.blob.playerColor});
                if (typeof data.blob.question != "undefined") {
                    if (data.blob.question === null) {
                    sendCustomerMsg(getCustomerByID(data.customerUserId), {prompt: " ", id: " "});
                    } else {
                    console.log("Se recibio pregunta para " + data.blob.playerName + ". Prompt: " + data.blob.question.prompt);
                    sendCustomerMsg(getCustomerByID(data.customerUserId), {prompt: data.blob.question.prompt, id: data.blob.question.id});
                    }
                }
                if (data.blob.state == "Gameplay_Vote"){
                    console.log("Se reciben opciones para votar..");
                    console.log(data.blob.doneVoting)
                    sendCustomerMsg(getCustomerByID(data.customerUserId), {prompt: prompt, choices: choices});
                }
                //socket.emit("msg", {type:'Result', action:'CreateRoom', success: true, roomId:'GECK'});
                break;   
            case 'customerStart':
                console.log("Enviando mensaje Start: userID= " + socket.id );
                io.sockets.socket(appsocket).emit("msg",{ type:'Event', event: 'CustomerMessage', roomId: 'GECK', userId: socket.id, message:{startGame: true}});
                break;
            case 'LockRoom':
                //Lockear el Room para que no entre mas gente
                socket.emit("msg",{ type:'Result', action: 'LockRoom', success: true});
                break;
            case 'answer':
                console.log("Respuesta del jugador: " + data.answer);
                io.sockets.socket(appsocket).emit("msg", { type: 'Event', event: 'CustomerMessage', roomId: 'GECK', userId: socket.id, message:{questionId: data.questionId, answer: data.answer.toUpperCase()}});
            case 'voto':
                console.log("Voto de ");
                io.sockets.socket(appsocket).emit("msg", { type: 'Event', event: 'CustomerMessage', roomId: 'GECK', userId: socket.id, message:{vote: data.voto}});
                break;
        };
    });

});
server.listen(80);

httpServer.listen(38202, () => {
    console.log('server iniciado en 38202');
});

function sendCustomerMsg (player, data) {
        io.sockets.socket(player.userid).emit('msg',{
            msg: data,
            name: player.name
        });  
};

function getCustomerByID(user_id) {
    return Players.find(person => person.userid === user_id);
};

function cosas(arg) {
    console.log("QUE..");
};

//setTimeout(cosas, 1500, 'funky');
//setInterval(cosas, 1500);