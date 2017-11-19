var layout = {
	w: 500,
	h: 550,
	p: 30
}

var plot = d3.select(".plot"),
	svg = plot
			.append("svg")
			.attr("width", layout.w)
			.attr("height", layout.h);

// parcoords + timeline
var view = {
	rootEle: d3.select(".plot")
}

var dataset = {

}
