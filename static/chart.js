(function() { 
google.charts.load('visualization', '1.0',  {'packages':['corechart', 'controls']});
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

function median(values) {
    values.sort(function(a,b){return a - b});
    var piv = Math.floor(values.length / 2);
    return values.length % 2 ? values[piv] : (values[piv] + values[piv] / 2.0);
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

        var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'));
        // create the filters
        
        var sysmemFilter = new google.visualization.ControlWrapper({
            'controlType': 'NumberRangeFilter',
            'containerId': 'sysmem_filter_div',
            'options': {
                'filterColumnLabel': 'sysmem',
            },
            'state': { 'lowValue': 0, 'highValue': 32 }
        });
        
        var gpuFilter = new google.visualization.ControlWrapper({
            controlType: 'CategoryFilter',
            containerId: 'gpu_filter_div',
            state: { selectedValues: ["GeForce GTX 970/PCIe/SSE2"] },
            options: {
                filterColumnLabel: 'gpudevice',
                ui: {
                    label: "GPU",
                    caption: "Filter by GPU",
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
                    label: "Version",
                    caption: "Filter by version",
                    allowNone: true,
                    allowMultiple: true
                }
            }
        });
        var cpuFilter = new google.visualization.ControlWrapper({
            controlType: 'CategoryFilter',
            containerId: 'cpu_filter_div',
            options: {
                filterColumnLabel: "processordevice",
                ui: {
                    label: "CPU",
                    caption: "Filter by CPU",
                    allowNone: true,
                    allMultiple: true 
                }
            }
        });
        
        var osFilter = new google.visualization.ControlWrapper({
            controlType: 'CategoryFilter',
            containerId: 'os_filter_div',
            options: {
                filterColumnLabel: "OS",
                ui: {
                    label: "OS",
                    caption: "Filter by OS",
                    allowNone: true,
                    allMultiple: true 
                }
            }
        });
        
        var rendermodeFilter = new google.visualization.ControlWrapper({
            controlType: 'CategoryFilter',
            containerId: 'rendermode_filter_div',
            options: {
                filterColumnLabel: "rendermode",
                ui: {
                    label: "Rendermode",
                    caption: "Filter by rendermode",
                    allowNone: true,
                    allMultiple: true 
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
            // once the chart has been filtered, this callback fires
            // and we bucket the filtered data, then create a new chart with that data
            var gpuGroup = google.visualization.data.group(chart.getDataTable(), [20], [
            {
                column: 9,
                label: 'minftCPU (median)',
                aggregation: median,
                type: 'number'
            }, 
            {
                column: 10,
                label: 'medianftCPU (median)',
                aggregation: median,
                type: 'number'
            }, 
            {
                column: 11,
                label: 'maxftCPU (median)',
                aggregation: median,
                type: 'number'
            }, 
            {
                column: 12,
                label: 'minftGPU (median)',
                aggregation: median,
                type: 'number'
            }, 
            {
                column: 13, 
                label: 'medianftGPU (median)',
                aggregation: median,
                type: 'number'
            }, 
            {
                column: 14,
                label: 'maxftGPU (median)',
                aggregation: median,
                type: 'number' 
            }]);
            new google.visualization.ChartWrapper({
                chartType: 'ColumnChart',
                containerId: 'chart_div',
                dataTable: gpuGroup,
                options: { width: 1280, height: 720 }
            }).draw();
        });

        dashboard.bind([gpuFilter, versionFilter, cpuFilter, sysmemFilter, osFilter, rendermodeFilter], chart);
        dashboard.draw(dt);
    });
}
})();
