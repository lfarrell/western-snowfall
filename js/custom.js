d3.json('analysis/ca_munged_data.json', function(data) {
    var margins = {top: 35, right: 130, bottom: 25, left: 105},
        parse_date = d3.time.format("%m/%Y").parse,
        parse_year_date = d3.time.format("%Y").parse,
        parse_month_date = d3.time.format("%m").parse,
        height = 400 - margins.top - margins.bottom;

    var num_format = d3.format(".2f");
   // var temp_colors = ['#ca0020','#f4a582','#f7f7f7','#92c5de','#0571b0'];
   // var temp_colors = ['#ca0020','#f4a582','#92c5de','#0571b0'];
   // var precip_colors = ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e','#003c30'];
    var temp_colors = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'];
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    data.forEach(function(d) {
        if(/\//.test(d.date)) {
            d.date = parse_date(d.date);
        } else if(/y/.test(d.type)) {
            d.date = parse_year_date(d.date);
        } else {
            d.date = parse_month_date(d.date);
        }
    });

    /**
     * Add chart for each state & slider to go through the years
     * Possibly just state, month on x axis, year on y-axis, snow level as the circle color
     * Or month/year x axis, elevation y axis, and snow level as the circle color (This one won't need a slider)
     */
    var yew = d3.select('#yew_div').append('svg');
   // var mew = d3.select('#mew_div').append('svg');
    var cal_sedw = d3.select('#states_cal').append('svg');
    var start_river = d3.select('#river_year_chart').append('svg');

    var render = _.debounce(function() {
        var year_elevation_water = data.filter(function(d) {
            return d.type === 'yew';
        });

    /*    var month_elevation_water = data.filter(function(d) {
            return d.type === 'mew';
        }); */

        var cal_elevation_date_water = data.filter(function(d) {
            return d.type === 'dew';
        });

        var selected_river = data.filter(function(d) {
            return d.type === 'reyw' && d.river === 'Feather';
        });

        build(year_elevation_water, yew, '#yew_div', false);
     //   build(month_elevation_water, mew, '#mew_div', false);
        build(cal_elevation_date_water, cal_sedw, '#states_cal', true);
        build(selected_river, start_river, '#river_year_chart', false);

        function build(data, svg, selector, full) {
            var size = sizing(full, selector);
            var width = size.width;
            var radius = size.radius;
            var type = (full || /y/.test(selector)) ? "%Y" : "%b";
            var offset_x = (full) ? 10 : 0;
            var offset_y = (full) ? 5 : 0;
            var elevations = _.pluck(
                _.uniq(data, function(d) { return d.elev; }), 'elev'
            ).reverse();

            var xScaleStateYearMonth = xScale(width, data);
            var yScaleStateYearMonth = yScaleOrd(height, elevations);
            var xAxis = d3.svg.axis()
                .scale(xScaleStateYearMonth)
                .orient("top")
                .tickFormat(d3.time.format(type));

            var yAxis = d3.svg.axis()
                .scale(yScaleStateYearMonth)
                .orient("left")
                .tickFormat(d3.format(",d"));

            svg.attr("height", height + margins.top + margins.bottom)
                .attr("width", width + margins.right + margins.left);

            svg.append("g")
                .attr("class", "x axis")
                .translate([margins.left, margins.top]);

            d3.select(selector + " g.x").call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .translate([margins.left - 25, margins.top]);

            d3.select(selector + " g.y").call(yAxis);

            var p_colors = stripColors(temp_colors,  data, 'wm');
            var circles = svg.selectAll('circle').data(data);

            circles.enter().append('circle');

            circles.translate([margins.left, margins.top + 20])
                .style('fill', function(d) {
                    return p_colors(d.wm);
                })
                .on('mouseover touchstart', function(d) {
                    var header_text;

                    if(/y/.test(selector)) {
                        header_text = d.date.getFullYear();
                    } else if(/m/.test(selector)) {
                        header_text = monthWord(d.date.getMonth());
                    } else {
                        header_text = monthWord(d.date.getMonth()) + " " + d.date.getFullYear();
                    }

                    div.transition()
                        .duration(100)
                        .style("opacity", .9);

                    div.html(
                            '<h4 class="text-center">' + header_text + '</h4>' +
                            '<h5  class="text-center">Snow/Water Equivalence</h5>' +
                            '<ul class="list-unstyled"' +
                            '<li>Elevation: ' + d.elev + '+ feet</li>' +
                            '<li>Mean: ' + num_format(d.wm) + ' inches</li>' +
                            '<li>Median: ' + num_format(d.wmd) + ' inches</li>' +
                            '<li>Snow Mean: ' + num_format(d.sm) + ' inches</li>' +
                            '<li>Snow Median: ' + num_format(d.smd) + ' inches</li>' +
                            '</ul>'
                        )
                        .style("top", (d3.event.pageY-38)+"px")
                        .style("left", (d3.event.pageX-28)+"px");
                })
                .on('mouseout touchend', function(d) {
                    div.transition()
                        .duration(250)
                        .style("opacity", 0);
                });

            circles.transition().duration(1000)
                .ease("sin-in-out")
                .attr('cx', function(d) { return xScaleStateYearMonth(d.date) - offset_x; })
                .attr('cy', function(d) { return yScaleStateYearMonth(d.elev) + offset_y; })
                .attr('r', radius);

            circles.exit().remove();
        }

        /*
         * Load main map
         */
      /*  var map = L.map('map');

        map.setView([42, -125], 10);

        L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',

        }).addTo(map); */

        d3.select("#month-only").on("click", function(d) {
            var selected_id = d3.event.target.id;
            console.log(selected_id)
        });

        d3.select("#river").on("change", function(d) {
            var selected_river_name = this.options[this.selectedIndex].innerHTML;
            var river = d3.select(this);
            var river_val = river.prop("value");

           // localStorage.setItem('river', river_val);

            d3.selectAll("#river_name").text(selected_river_name);
            river.prop("value", "");

            var river_update = data.filter(function(d) {
                return d.type === 'reyw' && d.river === river_val;
            });
;
            build(river_update, start_river, '#river_year_chart', false);
        });

        var rows = d3.selectAll('.row');
        rows.classed('opaque', false);
        rows.classed('hide', false);
        d3.selectAll('#load').classed('hide', true);
    });

    render();
    window.addEventListener('resize', render);

    function xScale(width, data) {
        var xScale =  d3.time.scale()
            .range([0, width]);
        xScale.domain(d3.extent(data, function (d) {
            return d.date;
        }));

        return xScale;
    }

    function yScaleOrd(height, data) {
        var yScale = d3.scale.ordinal()
            .rangeRoundBands([0, height], .05);
        yScale.domain(data);

        return yScale;
    }

    function stripColors(values, data, type) {
        return d3.scale.quantize()
            .domain(d3.extent(data, ƒ(type)))
            .range(values);
    }

    function sizing(full, selector) {
        var screen_width = window.innerWidth;
        var type = /y/.test(selector);
        var width, radius,offset;


        if(screen_width <= 420) {
         //   width = screen_width - margins.right - 50;
            radius = 8;
        } else if(screen_width <= 820) {
        //    width = screen_width - margins.right - margins.left;
            radius = 15;
        } else if(screen_width <= 1020) {
         //   offset = (type) ? 1 : 1.1;
        //    width = screen_width/offset - margins.right - margins.left;
            radius = 15;
        } else {
         //   offset = (type) ? 1.5 : 2.5;
        //    width = window.innerWidth/offset - margins.right - margins.left;
            radius = 15;
        }

        if(type && screen_width <= 420) {
            radius = 2.5;
        } else if(type && screen_width <= 700) {
            radius = 7;
        } else if(type && screen_width <= 1020) {
            radius = 10;
        }

        if(full) {
         //   width = screen_width - margins.right - margins.left;
            radius = 3;
        }
        width = window.innerWidth - margins.right - margins.left;
        return { width: width, radius: radius };
    }

    function monthWord(m) {
        switch(m) {
            case 0:
                return "January";
                break;
            case 1:
                return "February";
                break;
            case 2:
                return "March";
                break;
            case 3:
                return "April";
                break;
            case 4:
                return "May";
                break;
            case 5:
                return "June";
                break;
            case 6:
                return "July";
                break;
            case 7:
                return "August";
                break;
            case 8:
                return "September";
                break;
            case 9:
                return "October";
                break;
            case 10:
                return "November";
                break;
            case 11:
                return "December";
                break;
            default:
                return "unknown";
        }
    }
});

