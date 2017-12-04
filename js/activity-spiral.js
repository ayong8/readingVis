var width = document.getElementById("activity-spiral-div").offsetWidth,
    height = document.getElementById("activity-spiral-div").offsetHeight,
    start = 0,
    end = 2,
    numSpirals = 5;

var theta = function(r) {
  return numSpirals * Math.PI * r;
};

var r = d3.min([width, height]) / 2 - 40;

var radius = d3.scaleLinear()
  .domain([start, end])
  .range([40, r]);

var svg = d3.select("#activity-spiral-div").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

// create the spiral, borrowed from http://bl.ocks.org/syntagmatic/3543186
var points = d3.range(start, end + 0.001, (end - start) / 1000);

var spiral = d3.radialLine()
  .curve(d3.curveCardinal)
  .angle(theta)
  .radius(radius);

var path = svg.append("path")
  .datum(points)
  .attr("id", "spiral")
  .attr("d", spiral)
  .style("fill", "none")
  .style("stroke", "steelblue");

d3.csv("data/IRFall2016_activity_logs_anonymized.csv", function(data) {

  //data.sort(compare_date);

  // fudge some data, 2 years of data starting today
  var spiralLength = path.node().getTotalLength(),
      //N = 730,
      N = 110,
      barWidth = (spiralLength / N) - 1;
  var activityData = [];
  /*for (var i = 0; i < N; i++) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + i);
    someData.push({
      date: currentDate,
      value: Math.random()
    });
  }*/

  map_date_id = {};

  for (var i = 0; i < N; i++) {
    var date = new Date(2016,7,26);
    date.setDate(date.getDate() + i);
    //var day = date.getDate();
    //var month = date.getMonth()+1;//Months in javascript start from zero
    //var year = date.getFullYear();
    //date_string = month+"/"+day+"/"+year.toString().substr(2,2);
    date_string = formatDate(date);
    /*someData.push({
      date: currentDate,
      value: Math.random()
    });*/
    map_date_id[date_string] = i;
    activityData.push({date: date, value: 0, students_act:{}});
  }
  //console.log(map_date_id);

  for(var i = 0; i<data.length; i++){
    var log = data[i];
    var date_string = log.date;
    date_string = date_string.substr(0,date_string.indexOf(" "));
    var user = log.usr;
    var page_id = log.docno+"-"+log.page;
    //first addition of a user in the day
    if( !(user in activityData[map_date_id[date_string]].students_act)){
        activityData[map_date_id[date_string]].students_act[user]={"pages": {}};
        activityData[map_date_id[date_string]].students_act[user]["pages"][page_id]=1;
    }else{
        //the user was already active in that day
        if(! activityData[map_date_id[date_string]].students_act[user]["pages"][page_id]){
          activityData[map_date_id[date_string]].students_act[user]["pages"][page_id]= 1;
        }else{
          activityData[map_date_id[date_string]].students_act[user]["pages"][page_id]++;
        }  
    }
    //activityData[map_date_id[date_string]].value++;
  }

  for(var i = 0; i<activityData.length; i++){
    if(activityData[i]){
      var avg_unique_pages = 0;
      var active_students_date = Object.keys(activityData[i].students_act);
      for(var j = 0; j<active_students_date.length; j++){
        var user = active_students_date[j];
        avg_unique_pages = avg_unique_pages + Object.keys(activityData[i].students_act[user]["pages"]).length;
      }
      if(active_students_date.length>0){
        activityData[i]["sum_unique_pages"] = avg_unique_pages;
        avg_unique_pages = avg_unique_pages/active_students_date.length;
        activityData[i]["avg_unique_pages"] = avg_unique_pages;
        activityData[i].value = activityData[i]["sum_unique_pages"] ;
        console.log(i+" "+activityData[i].date+" "+avg_unique_pages);
      }else{
        activityData[i]["sum_unique_pages"] = 0;
        activityData[i]["avg_unique_pages"] = 0;
        activityData[i].value = 0;
        console.log(i+" "+activityData[i].date+" "+avg_unique_pages);
      }
    }
  }


  /*for(var i = 0; activityData.length; i++){
    if(activityData[i]){
      //console.log(activityData[i]);
      active_students_date = Object.keys(activityData[i].students_act);
      var avg_unique_pages = 0;
      var user;
      for(var j=0; j<active_students_date.length;j++){
        user = active_students_date[j];
        var unique_pages = Array.from(new Set(activityData[i].students_act[user]["raw_pages"]));
        activityData[i].students_act[user]["unique_pages"]=unique_pages;
        avg_unique_pages = avg_unique_pages + unique_pages.length;
      }
      if(active_students_date.length>0){
        avg_unique_pages = avg_unique_pages/active_students_date.length;
        activityData[i].students_act[user]["avg_unique_pages"] = avg_unique_pages;
      }
    }
  }*/

  // here's our time scale that'll run along the spiral
  var timeScale = d3.scaleTime()
    .domain(d3.extent(activityData, function(d){
      return d.date;
    }))
    .range([0, spiralLength]);

  // yScale for the bar height
  //var yScale = d3.scaleLinear()
  //var yScale = d3.scaleLog()
  var yScale = d3.scaleSqrt()
    .domain([0, d3.max(activityData, function(d){
      return d.value;
    })])
    .range([0, (r / numSpirals) - 10]);

  // append our rects
  svg.selectAll("rect")
    .data(activityData)
    .enter()
    .append("rect")
    .attr("x", function(d,i){
      
      // placement calculations
      var linePer = timeScale(d.date),
          posOnLine = path.node().getPointAtLength(linePer),
          angleOnLine = path.node().getPointAtLength(linePer - barWidth);
    
      d.linePer = linePer; // % distance are on the spiral
      d.x = posOnLine.x; // x postion on the spiral
      d.y = posOnLine.y; // y position on the spiral
      
      d.a = (Math.atan2(angleOnLine.y, angleOnLine.x) * 180 / Math.PI) - 90; //angle at the spiral position

      return d.x;
    })
    .attr("y", function(d){
      return d.y;
    })
    .attr("width", function(d){
      return barWidth;
    })
    .attr("height", function(d){
      return yScale(d.value);
    })
    .style("fill", "orange")
    .style("stroke", "none")
    .attr("transform", function(d){
      return "rotate(" + d.a + "," + d.x  + "," + d.y + ")"; // rotate the bar
    });

  // add date labels
  var tF = d3.timeFormat("%b %Y"),
      firstInMonth = {};
  svg.selectAll("text")
    .data(activityData)
    .enter()
    .append("text")
    .attr("dy", 10)
    .style("text-anchor", "start")
    .style("font", "10px arial")
    .append("textPath")
    // only add for the first of each month
    .filter(function(d){
      var sd = tF(d.date);
      if (!firstInMonth[sd]){
        firstInMonth[sd] = 1;
        return true;
      }
      return false;
    })
    .text(function(d){
      return tF(d.date);
    })
    // place text along spiral
    .attr("xlink:href", "#spiral")
    .style("fill", "grey")
    .attr("startOffset", function(d){
      return ((d.linePer / spiralLength) * 100) + "%";
    })
  });

function compare_date(a,b) {
  date_a=new Date(a.date);
  date_b=new Date(b.date)
  if (date_a < date_b)
    return -1;
  if (date_a > date_b)
    return 1;
  return 0;
}

function formatDate(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}
