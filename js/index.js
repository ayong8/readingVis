var __ = {
    data: [],
    smoothness: 0.35
};

var layout = {
	w: 500,
	h: 550,
	p: 30,
}

var plot = d3.select(".plot"),
	svg = plot
			.append("svg")
			.attr("width", layout.w)
			.attr("height", layout.h);

var curvePaths;

// parcoords + timeline
var diffView = {
	rootEle: d3.select(".plot"),
	svg: {},
	__: __,
	_attr: {
		// xScale, yScale, xScale_timeline, yScale_timeline, xKernelScale_timeline, yKernelScale_timeline;
		dims: [],
		dimsClusterInfo: d3.map()
	},
	pcView: {},		// parallel coordinates view
	timeView: {},	// timeline view
	sortBy: "",

	initialize: function(){

	},
	drawDims: function(){
		var _self = this;

		_self.xScale = d3.scalePoint().rangeRound([0, layout.w - layout.p * 2], 1);
		_self.yScale = d3.scaleBand().range([layout.h-100, layout.p]);

		_self.xScale.domain(_self._attr.dims);
		_self.yScale.domain(dataset.nodes.sort(function(a, b){ 
											return b.centralities[diffView.sortBy] - a.centralities[diffView.sortBy] })
										  .map(function(d){ return d.stateId; }));

		var dimensions = svg.selectAll(".dimension")
										.data(_self._attr.dims)
										.enter()
										.append("g")
										.attr("class", function(d){ return d; })
										.attr("transform", function(d){ return "translate(" + _self.xScale(d) + ", 0)"; });

		// Inject axis to svg
		dimensions.append("g")
			.attr("class", function(d){ return d; })
			.attr("class", "y-axis")
			.attr("transform", "translate(" + layout.p + ",0)")
			.each(function(d){
				d3.select(this).call(d3.axisLeft(_self.yScale).tickSize(1));
				d3.select(this).select("path").attr("opacity", 0);
				//d3.select(this).selectAll(".tick").attr("transform", "translate(6, -3)");
				d3.select(this).selectAll("text")
								.style("opacity", function(label){
									var label_match = dataset.data.filter(function(edge){
															return (edge.sourceDimension == d && edge.sourceName == label) || (edge.targetDimension == d && edge.targetName == label);
														});
									if(label_match == undefined || label_match.length == 0){
										return 0;
									} else {
										return 1;
									}
								})
								.attr("fill", "#717171")
								.attr("y", -4)
    							.attr("x", 18);

    			d3.select(this).selectAll(".tick")
    							.each(function(){ 
    								var stateName = d3.select(this).select("text").text();
    								var attr_measure = dataset.nodes.filter(function(node){
								    									return node.stateId == stateName;
								    								}).map(function(d){ return d.centralities[diffView.sortBy]; });
    								d3.select(this).append("circle")
													.attr("class", "attr_circle")
													.attr("r", 100 * attr_measure)
													.style("fill", "#D9D3DF")
													.style("opacity", function(){
														var label_match = dataset.data.filter(function(edge){
																				return (edge.sourceDimension == d && edge.sourceName == stateName) || (edge.targetDimension == d && edge.targetName == stateName);
																			});
														if(label_match == undefined || label_match.length == 0){
															return 0;
														} else {
															return 1;
														}
													})
													.style("stroke", "#3C0078")
													.attr("cy", -4);
    							});

			});
	},
	calcDimsFromClustering: function(stateDimsData){
		// Get dimension of states
		var dims_array = [];
		var nDim = d3.max(Object.values(stateDimsData)) + 1;
		d3.range(0, nDim, 1).forEach(function(num_dim){
			var dim = "dim_" + num_dim.toString();
			dims_array.push(dim);
		});  // dimension => ["dim_0", "dim_1", "dim_2", ...]

		return dims_array;
	},
	
	change: function(){
		var _self = this;

		clearTimeout(sortTimeout);

		var yScaleSorted = diffView.yScale.domain(dataset.nodes.sort(this.checked
	        ? function(a, b) { return b.centralities[diffView.sortBy] - a.centralities[diffView.sortBy]; }
	        : function(a, b) { return d3.descending(a.stateId, b.stateId); })
	        .map(function(d) { return d.stateId; }))
	        .copy();

	    var transition = svg.transition().duration(1000),
			delay = function(d, i){ return i * 50; };

	   	svg.selectAll(".y-axis")
			.each(function(d){ 
				d3.select(this)
					.transition().duration(1000)
					.call(d3.axisLeft(diffView.yScale).tickSize(0))
					.selectAll("g");
			});

	    svg.select(".paths")
	    	.selectAll("path")
	    	.transition().duration(2000)
	    	.attr("d", function(d){
					return drawPath(d);
				});
	}
	
}

var dataset = {
	rawData: [],
	data: [],	// edge data structure + source and target source metadata for each edge
	nodes: [],
	edges: [],
	nodesWithEdge: [],
	stateYear: {},
	yearCount: [],
	stateDims: {'IA': 0, 'PA': 0, 'MS': 0, 'MA': 2, 'MI': 3, 'GA': 1, 'UT': 0, 'NY': 0, 'CO': 0, 'OH': 0, 'MO': 0, 'WI': 0, 'KY': 0, 'MD': 0, 'ME': 0, 'MN': 0, 'IN': 1, 'AR': 1, 'WV': 1, 'DE': 0, 'SC': 0, 'TX': 0, 'ID': 0, 'OR': 1, 'NM': 0, 'NV': 0, 'AL': 0, 'AZ': 0, 'IL': 0, 'CA': 0, 'MT': 1, 'TN': 0, 'WA': 0, 'LA': 0, 'NH': 0, 'RI': 0, 'NJ': 0, 'NE': 0, 'CT': 0, 'KS': 0, 'ND': 0, 'OK': 1, 'VT': 0, 'SD': 2, 'NC': 0, 'VA': 1, 'FL': 1, 'WY': 0},

	initialize: function(rawData){
		this.rawData = rawData;
		this.nodes = this.rawData.nodes;
		this.edges = this.rawData.edges;
		this.data = this.setData(rawData.edges);
		this.nodesWithEdge = this.setNodesWithEdges();
		this.stateYear = this.setStateYearData();
		this.yearCount = this.setYearCountData();
	},
	setData: function(edgesData){
		var _self = this;

		edgesData.forEach(function(edge){
			edge.sourceStateInfo = {};
			edge.targetStateInfo = {};

			_self.nodes.forEach(function(node){
				if(edge.source == node.metadataOrder){
					edge.sourceStateInfo.adoptedYear = node.adoptedYear;
					edge.sourceStateInfo.metadata = node.metadata;
					edge.sourceName = node.stateId;
					edge.sourceCentralities = node.centralities;
				}
				if(edge.target == node.metadataOrder){
					edge.targetStateInfo.adoptedYear = node.adoptedYear;
					edge.targetStateInfo.metadata = node.metadata;
					edge.targetName = node.stateId;
					edge.targetCentralities = node.centralities;
				}
			});
		});

		return edgesData;
	},
	// For the coordinates of pcView
	setStateYearData: function(){
		var _self = this,
			stateYear = {};
		_self.nodes.filter(function(d, i){
				return d.adoptedYear != 9999;
		})
		.forEach(function(d){ stateYear[d.stateId] = d.adoptedYear; });

		return stateYear;
	},
	setNodesWithEdges: function(){
		var _self = this;

		return _self.nodes.filter(function(d){ return d.adoptedYear != 9999; });
	},
	setYearCountData: function(){
		var _self = this,
			yearCount = [];

		_self.nodesWithEdge.forEach(function(node){
			var year_overlaps = yearCount.filter(function(d){ return node.adoptedYear == d.year; });
			// if year_count does not have a year
			if(year_overlaps.length == 0 || year_overlaps == "undefined"){
				yearCount.push({ "year": node.adoptedYear,
								 "count": 1 });
			}
			else{  // If a year exists
				yearCount.forEach(function(d){
					if(d.year == node.adoptedYear){
						d.count += 1;
					}
				});
			}
		});

		return yearCount;
	},
	setDimsInfoToNodes: function(){
		var _self = this;

		// Organize data to put dimension information
		_self.nodes.forEach(function(node, i){		// Assign dimension to nodes
			if(_self.stateDims[node.stateId] != undefined){
	 			node.dimension = "dim_" + _self.stateDims[node.stateId].toString();
	 		}
	 	});
	},
	setDimesInfoToData: function(){
		var _self = this;

		_self.data.forEach(function(edge){				// and Insert dimension information into dataset(edge data)
			_self.nodes.forEach(function(node){
				if(node.dimension == undefined){
					node.dimension = "dim_3";
				}
				if(edge.source == node.metadataOrder){
					edge.sourceDimension = node.dimension;
				}
				//console.log(edge.target == node.metadataOrder);
				if(edge.target == node.metadataOrder){
					edge.targetDimension = node.dimension;
				}
			});
		});

		//@@@@@@@
		_self.data.forEach(function(edge){
			if(edge.sourceDimension == edge.targetDimension){ 
				edge.targetDimension = "dim_" + (parseInt(edge.targetDimension.replace("dim_","")) + 1).toString();
			}
		});
	}
}

var drawPath = function(d){
		var line = d3.line();

		return line([ [ diffView.xScale(d.sourceDimension), diffView.yScale(d.sourceName) ],
					  [ diffView.xScale(d.targetDimension), diffView.yScale(d.targetName) ] ]);
	}
/*
var sortTimeout = setTimeout(function() {
					    d3.select(".sort_by_pageRank").property("checked", true).each(diffView.change);
					  }, 2000);
*/

//***********************//
d3.json("./data/ex-policy-diffusion.json", function(error, data){
	diffView.sortBy = "pageRank";
	// Initialization phase
	dataset.initialize(data);	// initialize the datasets
	diffView.initialize();	// initialize the view

	// Calculate and set Dimensions
	diffView._attr.dims = diffView.calcDimsFromClustering(dataset.stateDims);

	// Reorganize dataset to include dimension information
	dataset.setDimsInfoToNodes();	// Add dimension info to nodes data
	dataset.setDimesInfoToData();	// Add dimension info to data

	// Draw dimension
	diffView.drawDims();

	// Sortable axis
	//d3.select(".sort_by_pageRank").on("change", diffView.change);

	// Organize data for feeding to edge bundling part
	dataset.data.forEach(function(edge){
		var edge_obj = {};

		//@@@@@@@@@@@@@@@@@
		// If source and target are placed at the same dimension, move the target to the next dimension
		if(edge.sourceDimension == edge.targetDimension){ 
			edge.targetDimension = "dim_" + (parseInt(edge.targetDimension.replace("dim_","")) + 1).toString();
		}

		edge_obj[edge.sourceDimension] = edge.sourceName;
		edge_obj[edge.targetDimension] = edge.targetName;
		__.data.push(edge_obj);
	});

	curvePaths = svg.append("g")
						.attr("class", "curvePaths")
						.attr("transform", "translate(30, 0)");

	compute_cluster_centroids(diffView.sortBy);
	//@@@@@@@@@@@@ Suppressed backward edge
	__.data.forEach(function(d){
		console.log(d);
		//if(getDimNum(d3.keys(d)[0]) < getDimNum(d3.keys(d)[1])){
			draw_single_curve(d);
		//}
	});


	//********* Timeline graph
	var barchart_layout = { h: 30, mb: 5 };

	var parseDate = d3.isoParse;

	diffView.timeView.xScale_timeline = d3.scaleTime().rangeRound([0, layout.w - layout.p*2]);
	diffView.timeView.yScale_timeline = d3.scaleLinear().rangeRound([20, 10]);
	diffView.timeView.xKernelScale_timeline = d3.scaleLinear().rangeRound([0, layout.w - layout.p*2]);
	diffView.timeView.yKernelScale_timeline = d3.scaleLinear().rangeRound([20, 0]);

	diffView.timeView.xScale_timeline.domain([new Date(d3.min(dataset.nodesWithEdge, function(d){ return d.adoptedYear; }),0, 1),
							new Date(d3.max(dataset.nodesWithEdge, function(d){ return d.adoptedYear; }),0, 1) ]).nice();
	diffView.timeView.yScale_timeline.domain([d3.max(dataset.yearCount, function(d){ return d.count; }), 0]);
	diffView.timeView.xKernelScale_timeline.domain([d3.min(dataset.nodesWithEdge, function(d){ return d.adoptedYear; }), 
								d3.max(dataset.nodesWithEdge, function(d){ return d.adoptedYear; })]);
	diffView.timeView.yKernelScale_timeline.domain([0, .1]);

	var g_chart = svg.append("g")
					.attr("class", "bar_chart")
					.data(dataset.yearCount)
					.attr("transform", "translate(" + layout.p + ", 450)");

	g_chart.append("g")
			.attr("class", "x-axis")
			.attr("transform", "translate(0," + barchart_layout.h + ")")
			.call(d3.axisBottom(diffView.timeView.xScale_timeline).tickFormat(d3.timeFormat("%Y")).ticks(5).tickPadding(30));

	var rects = g_chart.selectAll(".bar")
			.data(dataset.yearCount).enter()
			.append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return diffView.timeView.xScale_timeline(new Date(d.year, 0, 1)) - 5; })
			.attr("y", function(d) { return diffView.timeView.yScale_timeline(d.count); })
			.attr("width", 7)
			.attr("height", function(d){ return (barchart_layout.h - diffView.timeView.yScale_timeline(d.count)); })
			.style("fill", function(d){
				if(d.year < 1865){
					return "rgb(250, 200, 255)";
				}
				else if(d.year >= 1865 && d.year < 1883){
					return "rgb(200, 150, 255)";
				}
				else if(d.year >= 1883 && d.year < 1905){
					return "rgb(150, 100, 255)";
				}
				if(d.year >= 1905){
					return "rgb(100, 50, 255)";
				}
			});

	rects.transition()
			.attr('height', function(d) { 
				return diffView.timeView.yScale_timeline(d.count); })
			.attr('y', function(d) { return barchart_layout.h - diffView.timeView.yScale_timeline(d.count); })
			.delay(function(d, i) { return i * 200; })
			.duration(2000)
			.ease(d3.easeElastic);


	/********** For tree structure
	// Identify the data as tree strgucture
	var edges_data_copy = edges_data.slice()
	var root_id = find_root(edges_data_copy, edges_data[0]); // copy the array by slice()
	var root_edge = {};
	edges_data.forEach(function(edge){
		if(edge.source == root_id){
			edge.level = 1;
			root_edge = edge;
		}
	});
	// Calculate the number of phases by getting the tree height
	var tree_height = calculate_height_of_tree(edges_data, nodes_data, root_edge);
	console.log(tree_height);

	// Go over all nodes ("nodes" property") in the dataset
	var states_to_ids = [];

	console.log(edges_data);
	// Add more metadata to nodes(add level) and edges(add state abbreviation)
	nodes_data.forEach(function(node){
		if("adoptedYear" != 9999){
			states_to_ids.push({ "stateName": node.stateId, "stateId": node.metadataOrder, "level": node.level }); }
	});

	// Get stateNames from nodes_data and add them to edges
	edges_data.forEach(function(edge){
		nodes_data.forEach(function(node){
			if(edge.source == node.metadataOrder){
				edge.sourceState = node.stateId;
			}
			if(edge.target == node.metadataOrder){
				edge.targetState = node.stateId;
			}
		});
	});
	***** The end of For tree structure *******/
});

function compute_cluster_centroids(d) {
	diffView.sortBy = d;	// sort by pageRank
	var dimClusterCentroids = {};
	var dims = diffView._attr.dims;
	var nodesOnDimWithDuplicates = [];
	var dupCheckArray = [];
	var nodesOnDim = [];	// Nodes that have an edge on the dimension
	var attrOnDim = [];

	// Get the metadata for sorting
	// For each dimension?? dim0, dim1, ...
	for(var i=0; i<dims.length; i++){
		// Investigate which nodes are on which dimensions (Get nodes for each dimension)
		// if it is the first dimension, look at the source of edges starting from it
		// if(i == 0){
		// 	nodesOnDimWithDuplicates = dataset.data.filter(function(edge){ 
		// 					return edge.sourceDimension == dims[i];
		// 				}).map(function(d){ return { 
		// 										"id": d.source,
		// 										"dimension": d.sourceDimension,
		// 										"name": d.sourceName,
		// 										"stateInfo": d.sourceStateInfo,
		// 										"centralities": d.sourceCentralities  }; 
		// 									});
		// 	// Check duplicates of nodes
		// 	nodesOnDimWithDuplicates.forEach(function(node1){
		// 		var dupCheckArray = nodesOnDim.filter(function(node2){
		// 								return node1.id == node2.id;
		// 							});
		// 		// If there is no match, then add the unique node
		// 		if(typeof dupCheckArray == undefined || dupCheckArray.length == 0){
		// 			nodesOnDim.push(node1);
		// 		}
		// 	});
		// // if it is not the first one, just look at the target of edges
		// } else {
			nodesOnDim = dataset.data.filter(function(edge){ 
							return (edge.sourceDimension == dims[i] || edge.targetDimension == dims[i]);
						}).map(function(d){
							if(d.sourceDimension == dims[i]){
								return { "id": d.source,
										 "dimension": d.sourceDimension,
										 "name": d.sourceName,
										 "stateInfo": d.sourceStateInfo,
										 "centralities": d.sourceCentralities };
							}else if(d.targetDimension == dims[i]){
								return { "id": d.target,
										 "dimension": d.targetDimension,
										 "name": d.targetName,
										 "stateInfo": d.targetStateInfo,
										 "centralities": d.targetCentralities };
							}
						});
		// }

		attrOnDim = nodesOnDim.map(function(d){ return d.centralities[diffView.sortBy]; });

		//@@@@@@@@@@@@@@@@@@@@@@
		nodesOnDim = nodesOnDim.sort(function(a, b){ return d3.descending(a.centralities[diffView.sortBy], b.centralities[diffView.sortBy]); })

		// Clustering based on the attribute
		// Save clustering information into "diffView._attr.dimsClusterInfo"
		for(var j=0; j<nodesOnDim.length; j++){
			var cluster;
			var node = nodesOnDim[j];

			// For now, simply create clusters based on index (the first half / the second half)
			if(j < nodesOnDim.length/3){
				// Insert clustering data into edge dataset (Which clusters do source and target of edge belong to?)
				cluster = dims[i] + "-cl_" + 0;
			}else if((j >= nodesOnDim.length/3) && (j < nodesOnDim.length/3*2)){
				cluster = dims[i] + "-cl_" + 1;
			}
			else{
				cluster = dims[i] + "-cl_" + 2;
			}
			
			// Organize cluster information 
			// dimsClusterInfo = [ { dim: "dim_1", cl: "dim_1-cl_1", nodes: [ nodeObj1, nodeObj2, ... ] } ]
			// If the array is empty, push a first object
			if(!diffView._attr.dimsClusterInfo.has(dims[i])){
				diffView._attr.dimsClusterInfo.set(dims[i], d3.map());
			}
			if(!diffView._attr.dimsClusterInfo.get(dims[i]).has(cluster)){
				diffView._attr.dimsClusterInfo.get(dims[i]).set(cluster, d3.map());
			}
			if(!diffView._attr.dimsClusterInfo.get(dims[i]).get(cluster).has("nodes")){
				diffView._attr.dimsClusterInfo.get(dims[i]).get(cluster).set("nodes", []);
			}
			diffView._attr.dimsClusterInfo.get(dims[i]).get(cluster).get("nodes").push(node);
		}
	}
}

function compute_centroids(edge) {
	var dimsClusterInfo = diffView._attr.dimsClusterInfo,
		sourceDim, targetDim,
		sourceState, targetState,
		sourceCl, targetCl, sourceCls, targetCls,
		nodesInSourceCluster, nodesInTargetCluster,
		sourceCentroid, targetCentroid,
		sourceCX, sourceCY, targetCX, targetCY;
	var centroids = [];

	console.log(edge);

	//// Source
	/// Get the source cluster
	sourceDim = d3.keys(edge)[0];
	sourceState = d3.values(edge)[0];
	sourceCls = dimsClusterInfo.get(sourceDim).entries();
	sourceCls.forEach(function(cluster){
		var nodes = cluster.value.get("nodes");
		var sourceStateIsMatched = nodes.filter(function(node){
										return node.name == sourceState;
									});
		if(sourceStateIsMatched && sourceStateIsMatched.length){
			sourceCl = cluster.key;
		}
	});

	nodesInSourceCluster = dimsClusterInfo.get(sourceDim).get(sourceCl).get("nodes");

	/// Get the target cluster
	targetDim = d3.keys(edge)[1];
	targetState = d3.values(edge)[1];
	targetCls = dimsClusterInfo.get(targetDim).entries();
	targetCls.forEach(function(cluster){
		var nodes = cluster.value.get("nodes");
		var targetStateIsMatched = nodes.filter(function(node){
										return node.name == targetState;
									});
		if(targetStateIsMatched && targetStateIsMatched.length){
			targetCl = cluster.key;
		}
	});

	console.log(dimsClusterInfo.get(targetDim));
	console.log(targetCl);
	nodesInTargetCluster = dimsClusterInfo.get(targetDim).get(targetCl).get("nodes");

	/// Source part
	// centroids on 'real' axes
	var sourceX = diffView.xScale(sourceDim);
	var sourceY = diffView.yScale(sourceState);

	var targetX = diffView.xScale(targetDim);
	var targetY = diffView.yScale(targetState);

	var sourceVirtualCentroid, targetVirtualCentroid;

	var sourceClusterWidth = d3.max(nodesInSourceCluster, function(d){ return diffView.yScale(d.name); })
							- d3.min(nodesInSourceCluster, function(d){ return diffView.yScale(d.name); });

	var sourceClusterCentroid = d3.min(nodesInSourceCluster, function(d){ return diffView.yScale(d.name); }) 
															+ (sourceClusterWidth/2);



	var targetClusterWidth = d3.max(nodesInTargetCluster, function(d){ return diffView.yScale(d.name); })
							- d3.min(nodesInTargetCluster, function(d){ return diffView.yScale(d.name); });

	var targetClusterCentroid = d3.min(nodesInTargetCluster, function(d){ return diffView.yScale(d.name); }) 
															+ (targetClusterWidth/2);

	// Compare y coordinates of source and target cluster
	if(sourceClusterCentroid >= targetClusterCentroid){
		sourceVirtualCentroid = sourceClusterCentroid - 1/10*(sourceClusterCentroid - targetClusterCentroid);
		targetVirtualCentroid = targetClusterCentroid + 1/10*(sourceClusterCentroid - targetClusterCentroid);
	}else{
		sourceVirtualCentroid = sourceClusterCentroid + 1/10*(targetClusterCentroid - sourceClusterCentroid);
		targetVirtualCentroid = targetClusterCentroid - 1/10*(targetClusterCentroid - sourceClusterCentroid);
	}

	// If the edge goes backward,
	if(getDimNum(sourceDim) > getDimNum(targetDim)){
		sourceCX = sourceX - (1/7)*(sourceX - diffView.xScale("dim_" + (getDimNum(sourceDim) - 1).toString()));
		sourceCY = sourceVirtualCentroid + 1/20*(sourceY - sourceClusterCentroid);
		targetCX = targetX + (1/7)*(diffView.xScale("dim_" + (getDimNum(targetDim) + 1).toString()) - targetX);
		targetCY = targetVirtualCentroid + 1/20*(targetY - targetClusterCentroid);
		//console.log(sourceX, sourceCX, targetX, targetCX);
	}else{
		sourceCX = sourceX + (1/7)*(diffView.xScale("dim_" + (getDimNum(sourceDim) + 1).toString()) - sourceX);
		sourceCY = sourceVirtualCentroid + 1/80*(sourceY - sourceClusterCentroid);
		targetCX = targetX - (1/7)*(targetX - diffView.xScale("dim_" + (getDimNum(targetDim) - 1).toString()));
		targetCY = targetVirtualCentroid + 1/80*(targetY - targetClusterCentroid);
		//console.log(sourceX, sourceCX, targetX, targetCX);
	}

	// curvePaths
	// 		.append("circle")
	// 		.attr("r", 2)
	// 		.attr("class", "control-point")
	// 		.attr("cx", sourceCX)
	// 		.attr("cy", sourceCY);

	// curvePaths
	// 		.append("circle")
	// 		.attr("r", 2)
	// 		.attr("class", "control-point")
	// 		.attr("cx", targetCX)
	// 		.attr("cy", targetCY);
	

	centroids.push($V([sourceX, sourceY]));
	centroids.push($V([sourceCX, sourceCY]));
	centroids.push($V([targetCX, targetCY]));
	centroids.push($V([targetX, targetY]));

	return centroids;
}

function compute_control_points(centroids) {
	//console.log(centroids);
	var cols = centroids.length;
	var a = __.smoothness;
	var cps = [];

	var sourceV = centroids[0];
	var sourceCV = centroids[1];
	var targetCV = centroids[2];
	var targetV = centroids[3];

	//console.log(centroids[0], centroids[0].e(1), centroids[0].e(2), centroids[1]);
	cps.push(centroids[0]);

	// if the edge goes forward, (virtual axis is on the right of actual axis)
	if(centroids[1].e(1) - centroids[0].e(1) > 0){
		cps.push($V([centroids[0].e(1) + a*2*(centroids[1].e(1)-centroids[0].e(1)), centroids[0].e(2)]));
	}else{
		cps.push($V([centroids[1].e(1) - a*2*(centroids[0].e(1)-centroids[1].e(1)), centroids[0].e(2)]));
	}

	// For the source-side virtual axis
	// centroids[1] => right on the virtual axis
	// centroids[0],[2] => control points on both sides of centroids[1]
	var diff = centroids[0].subtract(centroids[1]);

	cps.push($V([centroids[1].e(1) - a*2*(centroids[1].e(1)-centroids[0].e(1)), centroids[1].e(2)]));
	cps.push(centroids[1]);
	cps.push($V([centroids[1].e(1) + a*2*(centroids[2].e(1)-centroids[1].e(1)), centroids[1].e(2)]));

	// For the target-side virtual axis
	// centroids[1] => right on the virtual axis
	// centroids[0],[2] => control points on both sides of centroids[1]
	cps.push($V([centroids[2].e(1) - a*2*(centroids[2].e(1)-centroids[1].e(1)), centroids[2].e(2)]));
	cps.push(centroids[2]);
	cps.push($V([centroids[2].e(1) + a*2*(centroids[3].e(1)-centroids[2].e(1)), centroids[2].e(2)]));

	// curvePaths
	// 		.append("circle")
	// 		.attr("r", 2)
	// 		.attr("class", "control-point")
	// 		.style("fill", "green")
	// 		.attr("cx", centroids[1].e(1) + a*2*(centroids[1].e(1)-centroids[0].e(1)))
	// 		.attr("cy", centroids[1].e(2));

	// If the edge goes forward,
	if(centroids[3].e(1) - centroids[2].e(1) > 0){
		cps.push($V([centroids[3].e(1) - a*2*(centroids[3].e(1)-centroids[2].e(1)), centroids[3].e(2)]));
	}else{
		cps.push($V([centroids[3].e(1) + a*2*(centroids[2].e(1)-centroids[3].e(1)), centroids[3].e(2)]));
	}
	cps.push(centroids[3]);

	// curvePaths
	// 		.append("circle")
	// 		.attr("r", 2)
	// 		.attr("class", "control-point")
	// 		.style("fill", "red")
	// 		.attr("cx", centroids[3].e(1) + a*2*(centroids[2].e(1)-centroids[3].e(1)))
	// 		.attr("cy", centroids[0].e(2));

	

	return cps;

};

// draw single cubic bezier curve
function draw_single_curve(d) {
	var centroids = compute_centroids(d);
	//console.log(centroids);
	var cps = compute_control_points(centroids);

	var cubicPath = function(c){
		return `M${c.start[0]},${c.start[1]} C${c.control1[0]},${c.control1[1]} ${c.control2[0]},${c.control2[1]} ${c.end[0]},${c.end[1]}`;
	}

	for (var i = 0; i < cps.length-1; i += 3) {
		var curvePoints = {};
		curvePoints.start = [ cps[i].e(1), cps[i].e(2) ];
		//console.log("i = ", i);

		//curves.push([cps[i].e(1), cps[i].e(2), cps[i+1].e(1), cps[i+1].e(2), cps[i+2].e(1), cps[i+2].e(2) ]);
		//path.lineTo(cps[i].e(1), cps[i].e(2), cps[i+1].e(1), cps[i+1].e(2), cps[i+2].e(1), cps[i+2].e(2));
		curvePoints.control1 = [ cps[i+1].e(1), cps[i+1].e(2) ];
		curvePoints.control2 = [ cps[i+2].e(1), cps[i+2].e(2) ];
		curvePoints.end = [ cps[i+3].e(1), cps[i+3].e(2) ];
		//path.closePath();

		curvePaths
			.append("path")
			.attr("class", "curvePath")
			.attr("stroke", function(){ 
				if(getDimNum(Object.keys(d)[0]) > getDimNum(Object.keys(d)[1])){
					return "#FF0A84";
				}
				return "purple"; 
			})
			.attr("stroke-width", 1.2)
			.attr("opacity", 0.5)
			.style("fill", "none")
			.attr("d", cubicPath(curvePoints));
	}
};

function getDimNum(dim){
	return parseInt(dim.replace("dim_",""));
}

//************** For tree layout
function find_root(edges, current_edge){
	var next_edge = {},
		next_edge_idx = 0;

	for(var i=0; i<edges.length; i++){
		if(edges[i].target == current_edge.source){
			next_edge_idx = i;
			next_edge = edges[i];
			//console.log("here");
		}
	}
	// If there is no match, then that means it gets to the edge to the root
	if(Object.keys(next_edge).length == 0){
		return current_edge.target;
	}
	else{
		//console.log(next_edge.target);
		edges.splice(next_edge_idx, 1);
		return find_root(edges, next_edge);
	}
}

function calculate_height_of_tree(edges, nodes, root_edge){
	var queue = [ root_edge ],
		edges_w_level = [ root_edge ],
		current_edge = {},
		tree_level = 1;  // root level = 1

	while(queue.length > 0){
		current_edge = queue.shift();

		// Check if there is a children
		var next_edges = [];

		for(var i=0; i<edges.length; i++){
			if(current_edge.target == edges[i].source){
				// Push the edge into "edges_w_level" and
				// Pull out edges from "edges" array
				// This is because the current edges have loop, so edges that have been hit should be pulled out
				// add levels to nodes as well (to place nodes to the right x-axes based on their levels)
				nodes.forEach(function(node){
					if(node.metadataOrder == edges[i].source){
						node.level = current_edge.level + 1;
					}
				});
				edges[i].level = current_edge.level + 1;
				queue.push(edges[i]);
				edges_w_level.push(edges[i]);
				edges.splice(i, 1);
			}
		}
	}

	tree_height = Math.max.apply(null, edges_w_level.map(function(edge){
					return edge.level;
				}));

	edges_data = edges_w_level;

	return tree_height;
}
