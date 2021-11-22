const express = require("express");
const bodyparser = require("body-parser");
const http = require('http');
const socketio = require('socket.io');
let ejs = require('ejs');
const _ = require('lodash');  
const mongoose = require("mongoose");
const {userLogged, getUserName, getUsers, cleanArray} = require('./utils/user.js');
const bcrypt = require('bcrypt');
const saltRounds = 10;



const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));

app.use(express.static("public"));
app.set('socketio', io);



mongoose.connect("mongodb://localhost:27017/chatDB", {useNewUrlParser: true, useUnifiedTopology: true, 
useFindAndModify: false});



const Rooms = {
	roomPassword: String,
	roomAdmin: String,
	roomDescription: String,
	usersOnline: Number,
	slots: Number,
	roomName: String,
	chats: Array
};

const User = {
	username: String,
	password: String,
	rooms: Array,
	favorites: Array
};

let usuario = [];
let allRooms = [];

const model = mongoose.model("User", User);
const model1 = mongoose.model("Room", Rooms);









model1.find({}, null, {sort: { roomName : 'asc' }}, function(err, data){
		if(err){
			console.log(err);
		}else{
			data.forEach( function(element, index) {
			
		
				allRooms.push({
					_id: data[index]._id,
					roomName: data[index].roomName,
					roomPassword: data[index].roomPassword,
					roomAdmin: data[index].roomAdmin,
					roomDescription: data[index].roomDescription,
					chats: data[index].chats,
					slots: data[index].slots,
					usersOnline: data[index].usersOnline
				});



		
			});
		}
	});





app.get("/", function(req,res){

		res.render("login");
});

app.get("/register", function(req,res){

		res.render("register");
});

app.get("/rooms", function(req, res){

	res.render("rooms");
});


app.get("/myRooms", function(req, res){
	res.render("myRooms");
});

app.get("/createRoom", function(req, res){
	res.render("createRoom");
});


app.get("/other", function(req, res){
	res.render("other");
});

app.get("/chat", function(req, res){
	res.render("chat");
});



app.post("/regAccount", function(req,res){
	if(req.body.username === "" || req.body.password === ""){
			res.redirect("register");

		}else{

			model.findOne({username: req.body.username}, function(err, found, next){

				if(!err){
					if(found){
						res.send("There is a user with this name");
					}else{
						bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
							if(!err){
								const user = new model({
									username: req.body.username,
									password: hash,
									rooms: []
								});
								user.save();

							}else{
								console.log(err);
							}
						    

						});


						
						res.redirect("/");
				}

				}
	

			});
		
			
		}

});





io.on('connection', function(socket) {
			console.log("New socket connection");
			

			socket.on('joinApp', ({msg, password}) =>{

				let username;
				let rooms;
				let roomId = "";
				let totalUsers = [];

				
				model.findOne({username: msg}, function(err, found){
					if(!err){
						var checka = false;
						if(found){
								bcrypt.compare(password, found.password, function(err, result) {

								if(result === true){

									console.log("Test");
						
									if(getUsers().length === 0){
										user = userLogged(socket.id, msg, found.rooms);
										username = getUserName(socket.id).username;
										rooms = getUserName(socket.id).rooms;
										console.log(msg + " Has entered the chat");
										console.log(socket.id);
										checka = true;
									}else{

										for(let x = 0; x < getUsers().length; x++){

											if(getUsers()[x].username === msg){
												console.log("Triggered");
												break;
											}

											if(x === getUsers().length - 1){
												if(getUsers()[x].username != msg){
													user = userLogged(socket.id, msg, found.rooms);
													username = getUserName(socket.id).username;
													rooms = getUserName(socket.id).rooms;
													console.log(msg + " Has entered the chat");
													console.log(socket.id);
													checka = true;
											
												}
											}

										}

									}

								}
									io.to(socket.id).sockets.emit("checker", checka);


								});
								
						
						
						
						}else{
							console.log("User not found");

						}
					
						
					}
				});


					socket.on("Overload", () => {
						username =  getUserName(socket.id).username;
						model.find({username: username}, function(err, data){
							if(err){

							}else{
								let rooms = data[0].rooms;
					
								socket.emit("yourRooms", {username, rooms});
							}

						});



					});


					socket.on("OverloadRooms", () => {

						socket.emit("showAll", allRooms);
					});
					

	

					socket.on("creatingRoom", (room,desc,password,select) => {
						let id;

						username = getUserName(socket.id).username;


						const rooms = new model1({
							roomName: room.room,
							roomPassword: room.password,
							roomAdmin: username,
							roomDescription: room.desc, 
							slots: room.select,
							usersOnline: 0
						});

						rooms.save().then(function() {

						});

						id = rooms.get("_id");

						console.log(id);


						
						model.updateOne({username: username}, {$push: {'rooms': {_id: id, roomName: room.room, 
							roomPassword: room.password, roomDescription: room.desc, slots: room.select, usersOnline: 0}}}, function(err){
							if(err){
								console.log("aEDritjawt0p");
							}else{
								allRooms.push({
										_id: id,
										roomName: room.room,
										roomPassword: room.password,
										roomAdmin: username,
										roomDescription: room.desc,
										chats: room.chats,
										slots: room.select,
										usersOnline: 0
								});
							}
						});


	

					});





			


					socket.on("enterRooms", (target) => {
						let username = getUserName(socket.id);
						let rooms = getUsers().slice();
						let index = 0;
						roomId = target.target;
						console.log(username.username + "Has entered chat id: " + target.target);

						
						for(let x = 0; x < allRooms.length; x++){



							if(String(allRooms[x]._id) === target.target){
								
								allRooms[x].usersOnline = allRooms[x].usersOnline + 1;
								index = x;
								console.log("Room: " + allRooms[x].roomName + " Has now: " + allRooms[x].usersOnline + " users online");
									

	
								break;

							}




						}


						model.findOne({username: target.admin}, function(err, data){
							if(err){
								console.log(err);

							}else{
								if(data){
									for(let x = 0; x < data.rooms.length; x++){
										console.log(data.rooms[x]._id);
										
										if(String(data.rooms[x]._id) === roomId){
								
											let query = "rooms." + x + ".usersOnline";
											model.updateOne( {username: target.admin}, { $set:  { [query]: data.rooms[x].usersOnline + 1} 
    										}, function(err, model){

    										});
										

										
										}
									}
								}else{
									console.log("No record found");
								}
							}

				
						});


						socket.join(roomId);



					});


					socket.on("overloadChat", () => {
						let username = getUserName(socket.id).username;
						const clients = io.sockets.adapter.rooms.get(roomId);

						

					


						for (const clientId of clients ) {
							let user = getUserName(clientId);

							totalUsers.push(user.username);

						}

						
						model1.find({_id: roomId}, function(err, data){
							if(err){
								console.log("Boca sho te amo");
							}else{
								let allMessages = data[0].chats.slice();
								let admin = data[0].roomAdmin;
								let roomName = data[0].roomName;


								
							

								
		
								socket.emit("loadMessages", {allMessages, username, admin, roomName});

							}

						});


						socket.emit("getId", roomId);
						socket.emit("loadUsers", totalUsers);
						

						socket.broadcast.to(roomId).emit("newUserJoin", username);





					});






					socket.on("overloadMessage", (value) => {
						let username = getUserName(socket.id).username;
						let chatValue = value.value;

						model1.updateOne({_id: roomId}, {$push: {'chats': {message: value.value, user: username}}}, function(err){
							if(err){
								console.log("Boca sho te amo");
							}else{


								
							}
						});


						socket.broadcast.to(value.roomId).emit("recieveMessage", {username, chatValue});



					});


					socket.on("leaveChat", (roomIds) => {
						let username = getUserName(socket.id).username;
						socket.leave(roomId);
						let index = 0;



						for(let x = 0; x < allRooms.length; x++){
							if(String(allRooms[x]._id) === roomIds){
								allRooms[x].usersOnline = allRooms[x].usersOnline - 1;
								index = x;
							}
						}

							let userAd = String(allRooms[index].roomAdmin);
							let roomieId = roomId;
							


							model.findOne({username: userAd}, function(err, data){
							if(err){
								console.log(err);

							}else{
								if(data){

									for(let x = 0; x < data.rooms.length; x++){
										console.log(data.rooms[x]._id.length);
										

										
										if(String(data.rooms[x]._id) === roomieId){
											
											let query = "rooms." + x + ".usersOnline";
											model.updateOne( {username: userAd}
												, { $set:  { [query]: data.rooms[x].usersOnline - 1} 
    										}, function(err, model){
    											if(err){
    												console.log("Y no me haga pregunta");
    											}

    											if(!model){
    												console.log("Asiiiiiiii");
    											}
    										});
										

										
										}
									}
								}else{
									console.log("No record found");
								}
							}
						});
		

						socket.broadcast.to(roomId).emit("removeUser", username);

						roomId = "";

	
						totalUsers = [];


					});






			socket.on('disconnect', () => {
				let username = getUserName(socket.id);

				if(username !== undefined){
					let index  = 0;
					for(let x = 0; x < getUsers().length; x++){
						if(getUsers()[x].username === username.username){
							index = x;
							
							if(roomId.length > 0){
								// Here we use the same code as the socket.on("leaveChat") since we can't emit to this socket 
								//Anymore because we disconnected.
									let username = getUserName(socket.id).username;
									socket.leave(roomId);
									let index = 0;

									for(let x = 0; x < allRooms.length; x++){
										if(String(allRooms[x]._id) === roomId){
											console.log(allRooms[x].usersOnline);
											allRooms[x].usersOnline = allRooms[x].usersOnline - 1;
											console.log(allRooms[x].usersOnline);
											index = x;
										}
									}

										let userAd = String(allRooms[index].roomAdmin);
										let roomieId = roomId;
										


										model.findOne({username: userAd}, function(err, data){
										if(err){
											console.log(err);

										}else{
											if(data){




												for(let x = 0; x < data.rooms.length; x++){
													console.log(data.rooms[x]._id.length);
													



													
													if(String(data.rooms[x]._id) === roomieId){
														console.log("Nothing less than greek");
														let query = "rooms." + x + ".usersOnline";
														model.updateOne( {username: userAd}
															, { $set:  { [query]: data.rooms[x].usersOnline - 1} 
			    										}, function(err, model){
			    											if(err){
			    												console.log("Y no me haga pregunta");
			    											}

			    											if(!model){
			    												console.log("Asiiiiiiii");
			    											}
			    										});
													

													
													}
												}
											}else{
												console.log("No record found");
											}
										}

										socket.broadcast.to(roomId).emit("removeUser", username);
										roomId = "";
										totalUsers = [];
									});
									//End of the condition
							}
							
							break;
						}

					}

					getUsers().splice(index, 1);



				}
			
				console.log("Disconnected");


			});


			});

	
});


server.listen(3000, function(){
	console.log("Server running on port 3000");
});



													



