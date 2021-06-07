const users = [];


function userLogged(id, username, rooms){
	const user = {id, username, rooms};

	users.push(user);

	return user;

}


function getUserName(id){
	return users.find(user => user.id === id);

}

function getRooms(rooms){
	return users.find(user => user.rooms === rooms);

}


function getUsers(username){

	return users;
}


function cleanArray(){
	users = [];
}


module.exports ={
	userLogged,
	getUserName,
	getUsers,
	cleanArray
	
}