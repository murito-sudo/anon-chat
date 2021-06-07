var field = document.getElementById("log_button");
var chatForm = document.getElementById("user-field");
var pass = document.getElementById("passField");
var title = document.getElementById("title");
var rooms = document.getElementById("rooms");




const socket = io();


  

socket.on("checker", (checka) => {
	if(checka === false){
		location.reload();
	}else{
		$('body').load("/rooms");
	}
	

});



document.getElementById("log_button").addEventListener("click", function(){
	let msg = chatForm.value;
	let password = pass.value;
	socket.emit('joinApp', {msg, password});
	
});








