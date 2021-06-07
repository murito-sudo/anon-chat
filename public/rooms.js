let title = document.getElementById("title");
let rooms = document.getElementById("rooms");


console.log(socket.id);

socket.on("yourRooms", (username, rooms) => {


	if(rooms.length === 0){
		rooms.innerHTML = "You have no rooms";
	}

	title.innerHTML = user + "'s rooms";


});