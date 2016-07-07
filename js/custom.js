d3.json('data/all/munged_data.json', function(data) {
    var margins = {top: 35, right: 130, bottom: 25, left: 105},
        parse_date = d3.time.format("%m-%y").parse,
        parse_year_date = d3.time.format("%y").parse,
        parse_month_date = d3.time.format("%m").parse,
        height = 400 - margins.top - margins.bottom;

    var num_format = d3.format(".2f");
    var precip_colors = ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e','#003c30'];
    var temp_colors = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'];
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    data.forEach(function(d) {
        if(/-/.test(d.date)) {
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
    var mew = d3.select('#mew_div').append('svg');
    var sedw = d3.select('#states').append('svg');

    var render = _.debounce(function() {
        var year_elevation_water = data.filter(function(d) {
            return d.type === 'yew';
        });

        var month_elevation_water = data.filter(function(d) {
            return d.type === 'mew';
        });

        var state_elevation_date_water = data.filter(function(d) {
            return d.type === 'sedw' && d.state === 'cal';
        });

        build(year_elevation_water, yew, '#yew_div', false);
        build(month_elevation_water, mew, '#mew_div', false);
        build(state_elevation_date_water, sedw, '#states', true);

        function build(data, svg, selector, full) {
            var size = sizing(full, selector);
            var width = size.width;
            var radius = size.radius;
            var type = (full || /y/.test(selector)) ? "%Y" : "%b";
            var offset = (full) ? 10 : 0;
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

            var p_colors = stripColors(temp_colors,  data, 'water_mean');
            var circles = svg.selectAll('circle').data(data);

            circles.enter().append('circle');

            circles.attr('cx', function(d) { return xScaleStateYearMonth(d.date) - offset; })
                .attr('cy', function(d) { return yScaleStateYearMonth(d.elev) + offset; })
                .attr('r', radius)
                .translate([margins.left, margins.top + 20])
                .style('fill', function(d) {
                    return p_colors(d.water_mean);
                })
                .on('mouseover touchstart', function(d) {
                    div.transition()
                        .duration(100)
                        .style("opacity", .9);

                    div.html(
                            '<h4 class="text-center">' + monthWord(d.date.getMonth()) + '</h4>' +
                            '<h5  class="text-center">Snow/Water Equivalence</h5>' +
                            '<ul class="list-unstyled"' +
                            '<li>Elevation: ' + d.elev + '+ feet</li>' +
                            '<li>Mean: ' + num_format(d.water_mean) + ' inches</li>' +
                            '<li>Median: ' + num_format(d.water_median) + ' inches</li>' +
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

            circles.exit().remove();
        }
        d3.selectAll("#month-only").on("click", function(d) {
            var selected_id = d3.event.target.id;
            console.log(selected_id)
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
        return d3.scale.quantile()
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

