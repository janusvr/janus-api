(function() { 
google.charts.load('current', {'packages':['corechart', 'controls']});
google.charts.setOnLoadCallback(drawDashboard);
var getData = function(cb) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            return cb(xhr.responseText)
        }
    };
    xhr.open('GET', '/perflog', true);
    xhr.send();
    console.log("Fetching data");
}

function drawDashboard() {
    getData(function(data) {
        data = JSON.parse(data);
        var keys = Object.keys(data.data[0]);
        var tmp = data.data.map(function(d) {
            return keys.map(function(key) { return d[key];});
        });
        console.log("Keys", keys);
        var preppedData = [keys].concat(tmp);
        var dt = google.visualization.arrayToDataTable(preppedData);

        console.log("DataTable:", dt);
        // create some groups

        var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'));
        // create the filters
        /*
        var sysmemRangeSlider = new google.visualization.ControlWrapper({
            'controlType': 'NumberRangeFilter',
            'containerId': 'filter_div',
            'options': {
                'filterColumnLabel': 'sysmem',
                'minValue': 0,
                'maxValue': 32
            },
            'state': { 'lowValue': 0, 'highValue': 8 }
        });
        */
        var gpuFilter = new google.visualization.ControlWrapper({
            controlType: 'CategoryFilter',
            containerId: 'gpu_filter_div',
            options: {
                filterColumnLabel: 'gpudevice',
                ui: {
                    allowNone: true,
                    allowMultiple: true
                }
            }
        });
        var versionFilter = new google.visualization.ControlWrapper({
            controlType: 'CategoryFilter',
            containerId: 'version_filter_div',
            options: {
                filterColumnLabel: 'version',
                ui: {
                    allowNone: true,
                    allowMultiple: true
                }
            }
        });

        // create the chart
        var opts = {
            chartType: 'ColumnChart',
            containerId: 'chart_div',
            view: {columns: [9, 10, 11, 12, 13, 14]} 
        };
        var chart = new google.visualization.ChartWrapper(opts);

        google.visualization.events.addListener(chart, 'ready', function() {
            var gpuGroup = google.visualization.data.group(chart.getDataTable(), [20], [{
                column: 12,
                label: 'minftGPU (avg)',
                aggregation: google.visualization.data.avg,
                type: 'number'
            }, {
                column: 13, 
                label: 'medianftGPU (avg)',
                aggregation: google.visualization.data.avg,
                type: 'number'
            }, {
                column: 14,
                label: 'maxftGPU (avg)',
                aggregation: google.visualization.data.avg,
                type: 'number' 
            }]);
            console.log(gpuGroup);
            new google.visualization.ChartWrapper({
                chartType: 'ColumnChart',
                containerId: 'chart_div',
                dataTable: gpuGroup
            }).draw();
        });

        dashboard.bind([gpuFilter, versionFilter], chart);
        dashboard.draw(dt);
    });
}
})();
