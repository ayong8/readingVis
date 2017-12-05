var width = document.getElementById("activity-spiral-div").offsetWidth,
    height = document.getElementById("activity-spiral-div").offsetHeight,
    start = 0.5,
    end = 2.5,
    numSpirals = 4;

var currentSpiral = "daily";

var theta = function(r) {
  return numSpirals * Math.PI * r;
};

var r = d3.min([width, height]) / 2 - 15;

var radius = d3.scaleLinear()
  .domain([start, end])
  .range([40, r]);

var svg = d3.select("#activity-spiral-view-wrapper").append("svg")
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

  var spiralLength = path.node().getTotalLength(),
      N = 105,
      dailyBarWidth = (spiralLength / N) - 2,
      hourlyBarWidth = (spiralLength / (N*24)) - 0.1;
  var activityData = [];
  var hourlyActivityData = [];
  /*for (var i = 0; i < N; i++) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + i);
    someData.push({
      date: currentDate,
      value: Math.random()
    });
  }*/

  map_date_id = {};
  map_datehour_id ={};

  for (var i = 0; i < N; i++) {
    var date = new Date(2016,7,26);
    date.setDate(date.getDate() + i);
    //var day = date.getDate();
    //var month = date.getMonth()+1;//Months in javascript start from zero
    //var year = date.getFullYear();
    //date_string = month+"/"+day+"/"+year.toString().substr(2,2);
    date_string = formatDate(date);
    date.setHours(date.getHours()+23);
    /*someData.push({
      date: currentDate,
      value: Math.random()
    });*/
    map_date_id[date_string] = i;
    activityData.push({date: date, value: 0, students_act:{}});
  }

  for (var i = 0; i < N; i++) {
    
    for(var j = 0; j<24; j++){
      
      var date = new Date(2016,7,26);
      date.setDate(date.getDate() + i);
      map_datehour_id[date_string] = i*24 + j; 
      date.setHours(date.getHours()+j)
      date_string = formatDateHour(date);

      hourlyActivityData.push({date: date, value: 0, students_act:{}});
      
    }
    //var day = date.getDate();
    //var month = date.getMonth()+1;//Months in javascript start from zero
    //var year = date.getFullYear();
    //date_string = month+"/"+day+"/"+year.toString().substr(2,2);
    
  }
  
  console.log(map_date_id);
  console.log(map_datehour_id);
  


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

  for(var i = 0; i<data.length; i++){
    var log = data[i];
    var date_string = log.date;
    date_string = date_string.substr(0,date_string.indexOf(":"));
    var user = log.usr;
    var page_id = log.docno+"-"+log.page;
    //first addition of a user in the day
    if( !(user in hourlyActivityData[map_datehour_id[date_string]].students_act)){
        hourlyActivityData[map_datehour_id[date_string]].students_act[user]={"pages": {}};
        hourlyActivityData[map_datehour_id[date_string]].students_act[user]["pages"][page_id]=1;
    }else{
        //the user was already active in that day
        if(! hourlyActivityData[map_datehour_id[date_string]].students_act[user]["pages"][page_id]){
          hourlyActivityData[map_datehour_id[date_string]].students_act[user]["pages"][page_id]= 1;
        }else{
          hourlyActivityData[map_datehour_id[date_string]].students_act[user]["pages"][page_id]++;
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
        //console.log(i+" "+activityData[i].date+" "+avg_unique_pages);
      }else{
        activityData[i]["sum_unique_pages"] = 0;
        activityData[i]["avg_unique_pages"] = 0;
        activityData[i].value = 0;
        //console.log(i+" "+activityData[i].date+" "+avg_unique_pages);
      }
    }
  }

  //Aggregated hourly activity
  for(var i = 0; i<hourlyActivityData.length; i++){
    if(hourlyActivityData[i]){
      var avg_unique_pages = 0;
      var active_students_date = Object.keys(hourlyActivityData[i].students_act);
      for(var j = 0; j<active_students_date.length; j++){
        var user = active_students_date[j];
        avg_unique_pages = avg_unique_pages + Object.keys(hourlyActivityData[i].students_act[user]["pages"]).length;
      }
      if(active_students_date.length>0){
        hourlyActivityData[i]["sum_unique_pages"] = avg_unique_pages;
        avg_unique_pages = avg_unique_pages/active_students_date.length;
        hourlyActivityData[i]["avg_unique_pages"] = avg_unique_pages;
        hourlyActivityData[i].value = hourlyActivityData[i]["sum_unique_pages"];
        //console.log(i+" "+activityData[i].date+" "+avg_unique_pages);
      }else{
        hourlyActivityData[i]["sum_unique_pages"] = 0;
        hourlyActivityData[i]["avg_unique_pages"] = 0;
        hourlyActivityData[i].value = 0;
        //console.log(i+" "+activityData[i].date+" "+avg_unique_pages);
      }
    }
  }

  //console.log(hourlyActivityData);


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
    .domain(d3.extent(hourlyActivityData, function(d){
      return d.date;
    }))
    .range([0, spiralLength]);

  // yScale for the bar height
  //var yDailyScale = d3.scaleLinear()
  //var yDailyScale = d3.scaleLog()
  var yDailyScale = d3.scaleSqrt()
    .domain([0, d3.max(activityData, function(d){
      return d.value;
    })])
    .range([0, (r / numSpirals) - 16]);

  //var yHourlyScale = d3.scaleLinear()
  //var yHourlyScale = d3.scaleLog()
  var yHourlyScale = d3.scaleSqrt()
    .domain([0, d3.max(hourlyActivityData, function(d){
      return d.value;
    })])
    .range([0, (r / numSpirals) - 16]);

  // append our rects
  svg.selectAll("rect")
    .data(activityData)
    .enter()
    .append("rect")
    .attr("class","daily-bar")
    .attr("x", function(d,i){
      
      // placement calculations
      var linePer = timeScale(d.date),
          posOnLine = path.node().getPointAtLength(linePer),
          angleOnLine = path.node().getPointAtLength(linePer - (dailyBarWidth));
    
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
      return dailyBarWidth;
    })
    .attr("height", function(d){
      return yDailyScale(d.value);
    })
    .style("fill", "orange")
    .style("stroke", "none")
    .style("visibility", "visible")
    .attr("transform", function(d){
      return "rotate(" + d.a + "," + d.x  + "," + d.y + ")"; // rotate the bar
    });

    // append our rects
  svg.selectAll("rect")
    .data(hourlyActivityData)
    .enter()
    .append("rect")
    .attr("class","hourly-bar")
    .attr("x", function(d,i){
      
      // placement calculations
      var linePer = timeScale(d.date),
          posOnLine = path.node().getPointAtLength(linePer),
          angleOnLine = path.node().getPointAtLength(linePer - hourlyBarWidth);
    
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
      return hourlyBarWidth;
    })
    .attr("height", function(d){
      return yHourlyScale(d.value);
    })
    .style("fill", "orange")
    .style("stroke", "none")
    .style("visibility", "hidden")
    .attr("transform", function(d){
      return "rotate(" + d.a + "," + d.x  + "," + d.y + ")"; // rotate the bar
    });

  // add date labels
  var tF = d3.timeFormat("%b %Y"),
      tF2 = d3.timeFormat("%a %d"),
      firstInMonth = {};
  /*svg.selectAll("text")
    .data(activityData)
    .enter()
    .append("text")
    .attr("dy", 15)
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
    })*/

  svg.selectAll("text")
    .data(activityData)
    .enter()
    .append("text")
    .attr("dy", 8)
    .style("text-anchor", "start")
    .style("font", "7px arial")
    .append("textPath")
    // only add for the first of each month
    /*.filter(function(d){
      var sd = tF(d.date);
      if (!firstInMonth[sd]){
        firstInMonth[sd] = 1;
        return true;
      }
      return false;
    })*/
    .text(function(d){
      return tF2(d.date);
    })
    // place text along spiral
    .attr("xlink:href", "#spiral")
    .style("fill", "grey")
    .attr("startOffset", function(d){
      return ((d.linePer / spiralLength) * 100) + "%";
    })
  });

document.getElementById("title_spiral").insertAdjacentHTML("afterend","<div id='spiral-control-div'><input type='radio' name='spiral-control' value='daily' onclick='changeSpiral(this);' checked>Daily activity</input><input type='radio' name='spiral-control' value='hourly' onclick='changeSpiral(this);'>Hourly activity</input></div>");

  

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

function formatDateHour(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear(),
      hour = d.getHours().toString();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  if (hour.length <2) hour = '0' + hour;
  
  datetime_string = [year, month, day].join('-');
  datetime_string = datetime_string + " "+ hour;
  return datetime_string;
}

function changeSpiral(option) {
    currentSpiral = option.value;
    if(currentSpiral=="daily"){
      d3.selectAll(".hourly-bar").transition()
        .duration(500)
        .style("visibility","hidden");
      d3.selectAll(".daily-bar").transition()
        .duration(500)
        .style("visibility","visible");
      
    }
    if(currentSpiral=="hourly"){
      d3.selectAll(".daily-bar").transition()
        .duration(500)
        .style("visibility","hidden");
      d3.selectAll(".hourly-bar").transition()
        .duration(500)
        .style("visibility","visible");

      
    }
}
