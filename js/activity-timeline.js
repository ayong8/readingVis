var view = {
	rootEle: d3.select(".plot"),
	layout: {
		w: document.getElementById("activity-timeline-div").offsetWidth,
		h: document.getElementById("activity-timeline-div").offsetHeight,
		p: 40
	}
}

var plot = d3.select("#activity-timeline-div"),
	svg = plot
			.append("svg")
			.attr("width", view.layout.w)
		    .attr("height", view.layout.h);
	g_zoom = svg.append("g")
				.attr("class", "g_zoom");

var dataset = {
	rawData: [],
	getDates: function(){
		var _self = this;
		var dateArray = _self.rawData.map(function(d){ return new Date(Date.parse(d.date)); })
		
		return dateArray;
	},
	setPathData: function(){
		var _self = this;
		var pathPerUserObj = d3.map();
		_self.rawData.forEach(function(log){
			if(typeof pathPerUserObj[log.usr] == "undefined"){
				pathPerUserObj[log.usr] = [];
			}
			pathPerUserObj[log.usr].push(log);
		});
		return pathPerUserObj;
	}
}

var datasetPageSequence = {
	rawData: [],
	lec_data: [
		{"lec_id": "lec_1", "start_page": "foa-2357-2", "end_page": "mir2-2384-14"},
		{"lec_id": "lec_2", "start_page": "iir-2156-38", "end_page": "iir-2412-100"},
		{"lec_id": "lec_3", "start_page": "iir-2104-104", "end_page": "mir-2155-240"},
		{"lec_id": "lec_4", "start_page": "iir-2156-10", "end_page": "iir-2176-170"},
		{"lec_id": "lec_5", "start_page": "iir-2177-274", "end_page": "iir-2188-289"},
		{"lec_id": "lec_6", "start_page": "iir-2189-188", "end_page": "iir-2216-231"},
		{"lec_id": "lec_7", "start_page": "mir-2217-269", "end_page": "mir-2261-335"},
		{"lec_id": "lec_8", "start_page": "iir-2262-458", "end_page": "mir-2309-407"},
		{"lec_id": "lec_9", "start_page": "iir-2310-290", "end_page": "iir-2356-438"}
	],
	bookSequence: ["foa", "ies", "iir", "mir", "mir2"],
	getPageIds: function(){
		var _self = this;
		var pageIdArray = _self.rawData.map(function(d){ return d.page_id; });
		return pageIdArray;
	},
}	


d3.csv("./data/reading_logs_min.csv", function(error, log_data){
	d3.csv("./data/page_sequence.csv", function(error, sequence_data){
		dataset.rawData = log_data;
		datasetPageSequence.rawData = sequence_data;
		var pageIds = datasetPageSequence.getPageIds(),
			dates = dataset.getDates(),
			pathData = dataset.setPathData();

		console.log(pageIds);
		
		var xScale = d3.scaleTime().range([view.layout.p, view.layout.w - view.layout.p]),
	 		yScale = d3.scaleBand().range([view.layout.p, view.layout.h - view.layout.p]);

	 	xScale.domain(d3.extent(dates)).nice();
	 	yScale.domain(pageIds);

		var xAxis = g_zoom.append("g")
						.attr("class", "x-axis1")
						.attr("transform", "translate(0," + (view.layout.h - view.layout.p) + ")")
						.call(d3.axisBottom(xScale).tickSize(0));

		// Add lecture areas in the y-axis
		var g_rects = g_zoom.selectAll("rect")
			  					.data(datasetPageSequence.lec_data)
			  					.enter().append('g')
			  					.attr("class", "rect_g")
		g_rects.append("rect")
			  .attr("class", "lec_rect")
			  .attr("x", view.layout.p)
			  .attr("y", function(d, i){
				return yScale(d.start_page);	
			  })
			  .attr("width", view.layout.w - view.layout.p * 2)
			  .attr("height", function(d, i){
			  	return yScale(d.end_page) - yScale(d.start_page);
			  })
			  .style("fill", function(d, i){
			  	if(i%2 == 0){
			  		return "gray"
			  	}else{
			  		return "none"
			  	}
			  })
			  .attr("opacity", 0.2);

		g_rects.append("text")
				.text(function(d, i){ return d.lec_id; })
				.attr("x", function(d){ return view.layout.w - view.layout.p; })
				.attr("y", function(d){ return yScale(d.end_page) - 5; })
				.style("color", "gray")
				.style("font-size", 9);
		
		//g_zoom.selectAll("rect")
				

	 	// var dimensions = g_zoom.selectAll(".dimension")
			// 			.data(pageIds)
			// 			.enter().append("g")
			// 			.attr("class", "x-axis")
			// 			.attr("transform", function(d){
			// 				return "translate(0," + yScale(d) + ")"; })
			// 			.each(function(d){
			// 				d3.select(this).call(d3.axisLeft(xScale).tickSize(1));
			// 				d3.select(this).select("path").attr("opacity", 0);
			// 				d3.select(this).selectAll("text")
			// 		                        .attr("class", "x-label")
			// 		                        .attr("opacity", 0);
			// 			});

		var drawPath = function(d){
							var line = d3.line()
										.x(function(d){ return xScale(new Date(Date.parse(d.date))); })
										.y(function(d){ return yScale(d.id); });

							return line(d);
						}

		// var lines = g_zoom.append("g")
		// 				.attr("class", "lines")
		// 				.selectAll("line")
		// 				.data(log_data)
		// 				.enter().append("line")
		// 				.attr("class", function(d){
		// 					return "user" + d.usr;
		// 				})
		// 				.attr("x1", function(d, i){ return xScale(new Date(Date.parse(d.date))); })
		// 				.attr("y1", function(d, i){ return yScale(d.id); })
		// 				.attr("x2", function(d, i){
		// 					if(typeof log_data[i+1] != "undefined"){
		// 						return xScale(new Date(Date.parse(log_data[i+1]["date"])));
		// 					}else{
		// 						return xScale(new Date(Date.parse(log_data[i]["date"])));
		// 					}
		// 				})
		// 				.attr("y2", function(d, i){
		// 					if(typeof log_data[i+1] != "undefined"){
		// 						return yScale(log_data[i+1]["id"]);
		// 					}else{
		// 						return yScale(log_data[i]["id"]);
		// 					}
		// 				})
		// 				.style("stroke", function(d, i){
		// 					var lineColor = "blue";
		// 					// If it goes forward == if the page for the next log comes later than the current page
		// 					if(typeof log_data[i+1] != "undefined"){
		// 						if(pageIds.indexOf(d.id) < pageIds.indexOf(log_data[i+1]["id"])){
		// 							lineColor = "blue";
		// 						}else if(pageIds.indexOf(d.id) > pageIds.indexOf(log_data[i+1]["id"])){
		// 							lineColor = "red";
		// 						}else{
		// 							lineColor = "gray";
		// 						}
		// 					}

		// 					return lineColor;
		// 				})
		// 				.style("stroke-width", 1.0)
		// 				.style("stroke-dasharray", function(d, i){
		// 					if(typeof log_data[i+1] != "undefined"){
		// 						var dasharray = "none";
		// 						if(pageIds.indexOf(d.id) == pageIds.indexOf(log_data[i+1]["id"])){
		// 							dasharray = "5, 5";
		// 						}
		// 					}

		// 					return dasharray;
		// 				})
		// 				.attr("opacity", 0.7);
		// 				// .on("mouseover", function(d, i){
		// 				// 	console.log(d3.select(this).attr("class"));
		// 				// 	var lineclass = d3.select(this).attr("class");
		// 				// 	d3.selectAll("path." + lineclass).style("stroke", "black");
		// 				// })
		// 				// .on("mouseout", function(d, i){
		// 				// 	console.log(d3.select(this).attr("class"));
		// 				// 	var lineclass = d3.select(this).attr("class");
		// 				// 	d3.selectAll("path." + lineclass).style("stroke", "none");
		// 				// });

		var paths = g_zoom.append("g")
						.attr("class", "paths")
						.selectAll("path")
						.data(Object.values(pathData))
						.enter().append("path")
						.attr("class", function(d, i){
							return "user" + (i+1);
						})
						.attr("d", drawPath)
						.attr("opacity", 0.2)
						.style("stroke", function(d, i){
							//return "rgb(" + (100+i*3) + "," + (255-i*5) + "," + (i*5) + ")";
							return "black";
						})
						.style("fill", "none")
						.on("mouseover", function(d, i){
							d3.select(this).style("stroke", "black").style("stroke-width", "3px");
						})
						.on("mouseout", function(d){
							d3.select(this).style("stroke", "none");
						});

		var circles = g_zoom.append("g")
						.attr("class", "quiz_circle_g")
						.selectAll("circle")
						.data(log_data.filter(function(d){ return d.question == 1; }))
						.enter().append("circle")
						.attr("class", function(d, i){
							return "circle" + d.usr;
						})
						.attr("r", 0.5)
						.attr("cx", function(d, i){ return xScale(new Date(Date.parse(d.date))); })
						.attr("cy", function(d, i){ return yScale(d.id); })
						.style("fill", "none")
						.style("stroke", "black")
						.style("stroke-width", 1);

		// Zoom Function
		var zoom = d3.zoom()
		    .on("zoom", zoomFunction);

		g_zoom.call(zoom);

		function zoomFunction(){
			// create new scale ojects based on event
			var new_xScale = d3.event.transform.rescaleX(xScale);
			//var new_yScale = d3.event.transform.rescaleY(yScale);

			// update axes
			xAxis.call(d3.axisBottom(new_xScale));
			//yAxis.call(d3.axisLeft(new_yScale));

			// update circle
			circles.attr("cx", function(d, i){ return new_xScale(new Date(Date.parse(d.date))); });
			//paths.attr("transform", d3.event.transform);
			//lines.attr("transform", d3.event.transform);
		};

		

		// Mark important events
		// Midterm line
		g_zoom.append("line")
				.attr("class", "line_midterm")
				.attr("x1", xScale(new Date(Date.parse("10/31/16 00:00"))))
				.attr("y1", 10)
				.attr("x2", xScale(new Date(Date.parse("10/31/16 00:00"))))
				.attr("y2", view.layout.h - view.layout.p)
				.style("stroke", "black")
				.style("stroke-width", 3)
				.style("stroke-dasharray", "6,6");
				
		g_zoom.append("text")
				.attr("text", "midterm");

		// Midterm circle
		g_zoom.append("circle")
				.attr("r", 2)
				.attr("cx", xScale(new Date(Date.parse("10/31/16 00:00"))))
				.attr("cy", view.layout.h - view.layout.p)
				.style("fill", "red");
 	});
});

// d3.csv("./data/reading_logs.csv", function(error, log_data){
	
// 	dataset.rawData = log_data;
// 	dataset.initialize();

// 	var xScale = d3.scaleBand().range([0, view.layout.w]),
// 		yScale = d3.scaleTime().range([view.layout.h, 0]);

// 	xScale.domain(datasetPageSequence.getPageIds());
// 	yScale.domain(d3.extent(dataset.getDates()));

	// var dimensions = svg.selectAll(".dimension")
	// 					.data(datasetPageSequence.getPageIds())
	// 					.enter().append("g")
	// 					.attr("class", "y-axis")
	// 					.attr("transform", function(d){ 
	// 						return "translate(" + xScale(d) + ", 0)"; })
	// 					.each(function(d){
	// 						d3.select(this).call(d3.axisLeft(yScale).tickSize(1));
	// 						//d3.select(this).select("path").attr("opacity", 0);
	// 						d3.select(this).selectAll("text")
	// 				                        .attr("class", "y-label")
	// 				                        .attr("opacity", 0);
	// 					});

// 	console.log(dataset.getUniqueUsers());
// 	console.log(dataset.setPathData());

	// function drawPath(d){
	// 	console.log(d);
	// 	var line = d3.line()
	// 				.x(function(d){ return xScale(d.id); })
	// 				.y(function(d){ return yScale(new Date(Date.parse(d.date))); });
	// }

	// var paths = svg.selectAll("path")
	// 				.data(dataset.setPathData())
	// 				.enter().append("path")
	// 				.attr("d", function(d){ return drawPath(d); })
	// 				.style("stroke", "red");
// });

// d3.json("./data/reading_logs_min1.json", function(error, log_data){
// 	d3.json("./data/page_sequence.json", function(error, sequence_data){
// 		dataset.rawData = log_data
// 		datasetPageSequence.rawData = sequence_data;
// 		dataset.initialize();

// 		var xScale = d3.scaleBand().range([0, view.layout.w]),
// 			yScale = d3.scaleTime().range([view.layout.h, 0]);

// 		xScale.domain(datasetPageSequence.getPageIds());
// 		yScale.domain(d3.extent(dataset.getDates()));

// 		var dimensions = svg.selectAll(".dimension")
// 							.data(datasetPageSequence.getPageIds())
// 							.enter().append("g")
// 							.attr("class", "y-axis")
// 							.attr("transform", function(d){ 
// 								return "translate(" + xScale(d) + ", 0)"; })
// 							.each(function(d){
// 								d3.select(this).call(d3.axisLeft(yScale).tickSize(1));
// 								//d3.select(this).select("path").attr("opacity", 0);
// 								d3.select(this).selectAll("text")
// 						                        .attr("class", "y-label")
// 						                        .attr("opacity", 0);
// 							});

// 		console.log(dataset.getUniqueUsers());
// 		console.log(dataset.setPathData());

// 		function drawPath(d){
// 			console.log(d);
// 			var line = d3.line()
// 						.x(function(d){ return xScale(d.id); })
// 						.y(function(d){ return yScale(new Date(Date.parse(d.date))); });
// 		}

// 		var paths = svg.selectAll("path")
// 						.data(dataset.setPathData())
// 						.enter().append("path")
// 						.attr("d", function(d){ return drawPath(d); })
// 						.style("stroke", "red");



// 	});
// });



