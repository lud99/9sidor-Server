var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, { path: "/", origins: 'localhost:* 127.0.0.1:*' });
var fs = require('fs');
const Client = require('./client');
const Session = require('./session');
const EncryptDecrypt = require('./encrypt-decrypt');

const cors = require("cors");
app.use(cors());

sessions = new Map;
let logins = {
	users: [{username: "dev", password: "dev"}]
}

/*Status codes*/

/*
	0, Login - success,
	1, Login - invalid username or password,
	10, Register - success,
	11, Register - account with username already exists
	20, Users - one or more users does not exist
*/

function createId(len = 6, chars = 'abcdefghijklmnopqrstuvwxyz0123456789') {
	let id = "";
	while (len--) {
		id += chars[Math.random() * chars.length | 0];
	}
	return id;
}

function createClient(conn, id = createId()) {
	return new Client(conn, id);
}

function createSession(id = createId()) {
	if (sessions.has(id)) {
		throw new Error(`Session ${id} already exists`);
	}

	const session = new Session(id);
	console.log("Creating", session);

	sessions.set(id, session);

	return session;
}

function getSession(id) {
	return sessions.get(id);
}

function broadcastSession(session) {
	const clients = [...session.clients];
	clients.forEach(client => {
		client.send({
			type: 'session-broadcast',
			you: {
				id: client.id,
				username: client.username,
			},
			peers: {
				clients: clients.map(client => {
					return {
						id: client.id,
						username: client.username,
					}
				}),
			},
		});
	})
}

function broadcast(session, type, data) {
	const clients = [...session.clients];
	clients.forEach(client => {
		client.send({
			type: type,
			data: data,
		});
	})
}

function saveLogins(name, data = null, autoRead = false) {
	const json = JSON.stringify((data == null) ? logins : data);

	//Encrypt all login data
	const encrypt = new EncryptDecrypt(489);
	const encrypted = encrypt.encrypt(json);

	fs.writeFile(name, encrypted, 'utf8', function callback(err) { //Write to file
		if (err) {
	        console.log(err);
	    } else if (autoRead) {
	    	loadLogins(name);
	    }
	});
}

function loadLogins(name, msg = "") {
	fs.access(name, fs.F_OK, (err) => {
		//File doesn't exist
		if (err) {
	    	console.log("File '%s' doesn't exist, creating default one", name);
	    	saveLogins('logins.json', {users: [{username: "dev", password: "dev"}]}, true);
		} else {
			fs.readFile(name, 'utf8', function readFileCallback(err, data) {
			    if (err) {
			        console.log(err);
			    } else {
		    	 	const decrypt = new EncryptDecrypt(489);
					const decrypted = decrypt.decrypt(data);
					logins = JSON.parse(decrypted);
					console.log("Succesfully loaded '%s'", name)
				}
			});
		}
	});
}

app.get("/logins", function(req, res) {
	if (req.query.logins != "ludonline" || req.query.origin != "9sidor") res.send({error: "Invalid request"});
	else {
		res.send(logins);
	}
});

loadLogins('logins.json');

io.sockets.on("connection", function(conn) {

	const client = createClient(conn);
	console.log("Connection established with a client");

	//Disconnect
	conn.on('disconnect', () => {
		console.log("Connection closed with a client")
		const session = client.session;
		let broadcast = true;

		if (session) {
			session.leave(client);
			if (session.clients.size == 0) {
				sessions.delete(session.id);
				broadcast = false;
			}
		}

		if (broadcast) broadcastSession(session);
	});

	//Receive messages
	conn.on('message', msg => {
		let data = JSON.parse(msg);

		//Decrypt key to message
		let msgArr = data.d.split('');
		let key = data.d.slice(msgArr.length-18);

		const crypt = new EncryptDecrypt();
		const decryptedKey = crypt.decrypt(key);
		crypt.key = decryptedKey

		//Decrypt message
		const _msg = data.d.slice(0, -18);
		data = JSON.parse(crypt.decrypt(_msg));

		console.log("Message received (decrypted)", data);

		switch(data.type) {
			case "disconnect-request": {
				const session = client.session;

				session.leave(client);
				broadcastSession(session);
				break;
			};
			case "join-session": {
				const session = getSession(data.id) || createSession(data.id);
				session.join(client);

				client.state = data.state;
				client.username = "";
				break;
			};
			case "login-request": {
				const username = data.username;
				const password = data.password;
				let login = {status: false, index: 0};

				for (let i = 0; i < logins.users.length; i++) {
					if (username == logins.users[i].username && password == logins.users[i].password) {
						login.status = true;
						login.index = i;
						break;
					} else {
						login.status = false;
					}
				}

				if (login.status) {
					console.log("Succesfully logged in account", logins.users[login.index]);

					const allowed = client.session.allowedUsers;
					if (allowed && allowed != "public") {
						let good = false;
						for (let i = 0; i < allowed.length; i++) {
							if (username == allowed[i]) {
								good = true;
								break;
							} else {
								good = false;
							}
						}

						if (good) {
							client.send({
								type: 'session-access',
								data: {allowedUsers: client.session.allowedUsers},
							});
						} else {
							client.send({
								type: 'login',
								success: false,
								message: "You do not have access to this room",
								statusCode: 1,
							});
							return false;
						}
					}
					if (allowed == "public") {
						client.send({
							type: 'session-access',
							data: {allowedUsers: null},
						});
					}

					client.send({
						type: 'login',
						success: true,
						message: "Successfully logged in",
						statusCode: 0,
					});

					if (client.session.messages != []) {
						client.send({
							type: "session-messages",
							data: client.session.messages,
						});
					}

					client.username = username;

					broadcastSession(client.session);
				} else {
					client.send({
						type: 'login',
						success: false,
						message: "Either your username and password does not match or you are not registered",
						statusCode: 1,
					});
				}
				break;
			};
			case "register-request": {
				const username = data.username;
				const password = data.password;

				let usernameExists = false;

				for (let i = 0; i < logins.users.length; i++) {
					if (username == logins.users[i].username) {
						usernameExists = true;
						break;
					} else {
						usernameExists = false;
					}
				}

				if (usernameExists) {
					client.send({
						type: 'register',
						success: false,
						message: 'An account already with that username already exists',
						statusCode: 11,
					});
				} else {
					logins.users.push({username: username, password: password});
					saveLogins('logins.json');
					console.log("Succesfully registered account", logins.users[logins.users.length-1]);
					client.send({
						type: 'register',
						success: true,
						message: 'Your account was succesfully registered',
						statusCode: 10,
					});
				}

				break;
			};
			case "change-access-request": {
				//If to make room public or private instead of whitelist
				if (data.state) {
					client.session.allowedUsers = data.state;
					console.log("Made session %s " + data.state, client.session.id)
					if (data.state == "private") broadcast(client.session, 'session-access', {allowedUsers: [data.owner]});
					else broadcast(client.session, 'session-access', {allowedUsers: "public"});
					return;
				}

				//Convert users to array
				let users = data.users.split(',');
				for (let i = 0; i < users.length; i++) { 
					let usersArr = users[i].split('');
					if (usersArr[0] == " ") users[i] = users[i].slice(1);
				}

				let allowedUsers = [];
				let errorUsers = [];
				for (let u = 0; u < users.length; u++) {
					let exists = false;
					for (let l = 0; l < logins.users.length; l++) {
						if (users[u] == logins.users[l].username) {
							exists = true;
							break;
						} else {
							exists = false;
						}
					}
					if (exists) {
						allowedUsers.push(users[u]);
					} else {
						errorUsers.push(users[u]);
					}
				}

				if (allowedUsers.length == users.length) {
					client.session.allowedUsers = allowedUsers;
					console.log(client.session.allowedUsers);	

					client.send({
						type: 'status',
						message: "Succesfully changed access to this room",
						statusCode: 21,
					});

					broadcast(client.session, 'session-access', {allowedUsers: allowedUsers});
				} else {
					let message;
					if (errorUsers.length > 1) message = "Users '" + errorUsers.join(', ') + "' does not exist";
					else message = "User '" + errorUsers + "' does not exist";

					client.send({
						type: 'status',
						message: message,
						statusCode: 20,
					});
				}

				break;
			};
			case "send-message": {
				const message = data.message;
				const sender = client.username;

				client.session.messages.push({message: message, sender: sender});
				broadcast(client.session, 'new-message', {message: message, sender: sender});
				break;
			};
		}
	});
});

module.exports = () => {
    const module = {};

    module.startServer = () => app.listen(3500, () => console.log("LudOnline server running on port 3500"));

    module.app = app;

    return module;
}