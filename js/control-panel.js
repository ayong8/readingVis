var id_first_user = 1;
var id_last_user = 48;
for(var i=id_first_user; i<=id_last_user; i++){
	//document.getElementById("students-list-ul").append("<li class='student-li' id='"+i+"'>"+i+"</li>");
	document.getElementById("students-list-ul").insertAdjacentHTML("beforeend","<li class='student-li' id='"+i+"'>"+i+"</li>");
}

console.log("hhh");
console.log(d3.selectAll(".lec_rect"));

d3.selectAll(".student-li")
	.on("mouseover", function(d){
		var stu_id = d3.select(this).attr("id");
		console.log(stu_id);
		d3.select("path.user" + stu_id)
			.style("stroke", "black")
			.style("stroke-width", 2)
			.attr("opacity", 1);
	})
	.on("mouseout", function(d){
		var stu_id = d3.select(this).attr("id");
		d3.select("path.user" + stu_id)
			.style("stroke", "gray")
			.style("stroke-width", 1)
			.attr("opacity", 0.2);
	});

d3.selectAll(".dot")
	.on("mouseover", function(d){
		var stu_id = d3.select(this).attr("id");
		console.log(stu_id);
		d3.select("path.user" + stu_id)
			.style("stroke", "black")
			.style("stroke-width", 2)
			.attr("opacity", 1);
	})
	.on("mouseout", function(d){
		var stu_id = d3.select(this).attr("id");
		d3.select("path.user" + stu_id)
			.style("stroke", "gray")
			.style("stroke-width", 1)
			.attr("opacity", 0.2);
	});