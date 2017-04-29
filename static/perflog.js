(function() {

function Chart(width, height, data, div) {

    this.maxftChart;
    this.chartData;
    this.all;
    this.gpuData = data;
    this.groupSize = data.length;
    this.svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

    this.margin = {top: 20, right: 20, bottom: 30, left: 80};
    this.width = +this.svg.attr("width") - this.margin.left - this.margin.right;
    this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom;


    this.drawChart();
}

Chart.prototype.drawChart = function() {
        this.x = d3.scaleOrdinal([0, this.width]);
        this.y = d3.scaleLinear().rangeRound([this.height, 0]);
        this.x.domain(this.gpuData.map(function(d) { return d.key }))
              .range(this.gpuData.map(function(d, i) { return (this.width / this.groupSize) * i }.bind(this))); 
        this.y.domain([0, d3.max(this.gpuData, function(d) { return d.value})]);
        var g = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
       console.log(this.x);
        g.append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + this.height + ")")
          .call(d3.axisBottom(this.x));

        g.append("g")
          .attr("class", "axis axis--y")
          .call(d3.axisLeft(this.y).ticks(10))
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("#");

        g.selectAll(".bar")
        .data(this.gpuData)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return this.x(d.key); }.bind(this))
          .attr("y", function(d) { return this.y(d.value); }.bind(this))
          .attr("width", 15)
          .attr("height", function(d) { return this.height - this.y(d.value) }.bind(this)); 

}

ChartController = function() {
    this.getData(this.onData.bind(this));
}

ChartController.prototype.getData = function(cb) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            return cb(xhr.responseText)
        }
    };
    xhr.open('GET', '/perflog', true);
    xhr.send();
}

ChartController.prototype.getGPUStats = function(data, gpustring) {
    console.log('data', data);
    var gpus = data.filter(function(d) { return d.gpudevice.match(gpustring) });
    var gpustotal = gpus.length;
    var gpus = gpus.reduce(function(a, b) { 
        a.maxftGPU += b.maxftGPU;
        a.minftGPU += b.minftGPU; 
        return a; 
    }); 
    gpus.maxftGPU = gpus.maxftGPU / gpustotal;
    gpus.minftGPU = gpus.minftGPU / gpustotal;

    return gpus;
} 

ChartController.prototype.onData = function(data) {
    this.data = JSON.parse(data).data ;
    console.log(this.data);
    var ndx = crossfilter(this.data);

    var dim = ndx.dimension(function(d) { return d.gpudevice });
    var group = dim.group();

    var gpus = group.top(group.size()),
        gpulist = gpus.map(function(d) { return d.key});
    console.log(gpulist);
    var groupSize = 5;
    var gpuData = group.top(groupSize);

    var gtx1070 = this.getGPUStats(this.data, "1070");
    var gtx1080 = this.getGPUStats(this.data, "1080");
    var chartData = [
        {key: "GTX 1070 maxftGPU", value: gtx1070.maxftGPU},
        {key: "GTX 1070 minftGPU", value: gtx1070.minftGPU},
        {key: "GTX 1080 maxftGPU", value: gtx1080.maxftGPU},
        {key: "GTX 1080 minftGPU", value: gtx1080.minftGPU}
    ];
  
    this.chart = new Chart(640, 480, chartData);
};
var x = new ChartController();
console.log(x);
})();
