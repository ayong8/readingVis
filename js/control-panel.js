var id_first_user = 1;
var id_last_user = 48;
for(var i=id_first_user; i<=id_last_user; i++){
	//document.getElementById("students-list-ul").append("<li class='student-li' id='"+i+"'>"+i+"</li>");
	document.getElementById("students-list-ul").insertAdjacentHTML("beforeend","<li class='student-li' id='"+i+"'>"+i+"</li>");
}