queue()
    .defer(d3.json,'analysis/ca_munged_data.json')
    .defer(d3.json,'js/ca.counties.json')
    .defer(d3.json,'js/rivers/AMR.json')
    .await(function(error, data, topo, watershed) {

    var margins = {top: 35, right: 130, bottom: 25, left: 105},
        parse_date = d3.time.format("%m/%Y").parse,
        parse_year_date = d3.time.format("%Y").parse,
        parse_month_date = d3.time.format("%m").parse,
        num_format = d3.format(".1f"),
        map_height = 250 - margins.top - margins.bottom,
        height = 400 - margins.top - margins.bottom;

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
    var year = d3.select('#year').append('svg');
    var date = d3.select('#states_cal').append('svg');
    var start_river = d3.select('#river_year_chart').append('svg');
    var map_svg = d3.select('#map').append('svg')
        .append('g').attr("id", "base_map");

    var render = _.debounce(function() {
        var map_width  = Math.floor(window.innerWidth / 3.5);

        var year_elevation_water = data.filter(function(d) {
            return d.type === 'yew';
        });

        var cal_elevation_date_water = data.filter(function(d) {
            return d.type === 'dew';
        });

        var selected_river = data.filter(function(d) {
            return d.type === 'reyw' && d.river === 'Feather';
        });

        build(year_elevation_water, year, '#year', false, 'wm');
        build(cal_elevation_date_water, date, '#states_cal', true, 'wm');
        build(selected_river, start_river, '#river_year_chart', false, 'wm');
        mapping(map_width, topo);
        mapping(map_width, watershed);

        function build(data, svg, selector, full, metric) {
            var size = sizing(full, selector);
            var width = (/river/.test(selector)) ? size.width /  1.5 : size.width;
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

            var p_colors = stripColors(temp_colors, data, metric);

            legend(selector +"-legend", p_colors);

            var circles = svg.selectAll('circle').data(data);

            circles.enter().append('circle');

            circles.translate([margins.left, margins.top + 20])
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
                            '<li>Total Sites: ' + d.total + '</li>' +
                            '<li>Water Mean: ' + num_format(d.wm) + ' inches</li>' +
                            '<li>Water Median: ' + num_format(d.wmd) + ' inches</li>' +
                         /*   '<li>Snow Mean: ' + num_format(d.sm) + ' inches</li>' +
                            '<li>Snow Median: ' + num_format(d.smd) + ' inches</li>' + */
                                '<li>Snow %: ' + num_format(d.sp) + '%</li>' +
                            '</ul>'
                        )
                        .style("top", (d3.event.pageY+38)+"px")
                        .style("left", (d3.event.pageX-65)+"px");

                    d3.select(this).attr('r', radius * 1.5);
                })
                .on('mouseout touchend', function(d) {
                    div.transition()
                        .duration(250)
                        .style("opacity", 0);
                    d3.select(this).attr('r', radius);
                });

            circles.transition().duration(1000)
                .ease("sin-in-out")
                .style('fill', function(d) {
                    return p_colors(d.wm);
                })
                .attr('cx', function(d) { return xScaleStateYearMonth(d.date) - offset_x; })
                .attr('cy', function(d) { return yScaleStateYearMonth(d.elev) + offset_y; })
                .attr('r', radius);

            circles.exit().remove();
        }

        function mapping(width, topos) {
            var scale = 1,
                projection = d3.geo.mercator()
                    .scale(scale)
                    .translate([0,0]);

            // Calculate bounds to properly center map
            var path = d3.geo.path().projection(projection);
            var bounds = path.bounds(topos);
            scale = .97 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / map_height);
            var translation = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2,
                (map_height - scale * (bounds[1][1] + bounds[0][1])) / 2];

            // update projection
            projection = d3.geo.mercator().scale(scale).translate(translation);
            path = path.projection(projection);

            d3.select("#map svg").attr('height', map_height)
                .attr('width', width);
            // .call(zoom);

            var map_draw = map_svg.selectAll("path")
                .data(topos.features);

            map_draw.enter()
                .append("path");

            map_draw.attr("d", path);
        }

        d3.selectAll(".btn-group").on("click", function(d) {
            var selected_id = d3.event.target.id;
            var id_parts = selected_id.split('-');
            var metric = id_parts[1];
            var is_full = false;
            var is_snow = /s/.test(selected_id);
            var river, which_svg, selector, type;

            if(id_parts[0] === 'river') {
                if(/_/.test(id_parts[2])) {
                    var pieces = id_parts[2].split('_');
                    river = pieces.map(function(d) {
                        _.capitalize(d);
                    }).join(' ');
                } else {
                    river = _.capitalize(id_parts[2])
                }

                type = (is_snow) ? 'reys' : 'reyw';
                which_svg = start_river;
                selector = '#river_year_chart';
            } else if(id_parts[0] === 'year') {
                type = (is_snow) ? 'yes' : 'yew';
                which_svg = year;
                selector = '#year';
            } else {
                type = (is_snow) ? 'des' : 'dew';
                which_svg = date;
                selector = '#states_cal';
                is_full = true;
            }

            var update = data.filter(function(d) {
                if(river !== undefined) {
                    return d.type === type && d.river === river;
                } else {
                    return d.type === type;
                }
            });

            build(update, which_svg, selector, is_full, metric);
        });

        d3.select("#river").on("change", function(d) {
            var selected_river_name = this.options[this.selectedIndex].innerHTML;
            var river = d3.select(this);
            var river_val = river.prop("value");

            d3.selectAll("#river_name").text(selected_river_name);
            river.prop("value", "");

            var river_update = data.filter(function(d) {
                return d.type === 'reyw' && d.river === river_val;
            });

            if(river_val !== '') {
                d3.selectAll("#rivers button").each(function() {
                    var sel = d3.select(this);
                    var id = sel.attr("id");
                    var id_parts = id.split('-');
                    var river_name;

                    if(id_parts.length === 3 && id_parts[2] !== river_val) {
                        river_name = (/\s/.test(river_val)) ? river_val.replace(' ', '_') : river_val;
                        sel.attr("id", id_parts[0] + '-' + id_parts[1] + '-' + river_name);
                    }
                });
            }

            build(river_update, start_river, '#river_year_chart', false, 'wm');
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
           // .domain(d3.extent(data, ƒ(type)))
            .domain(_.pluck(data, type))
            .range(values);
    }

    function legend(selector, colors) {
        var svg = d3.select(selector).attr("width", 850)
            .attr("height", 75);

        svg.append("g")
            .attr("class", "legendQuant")
            .translate([20, 20])
            .attr("width", 750)
            .attr("height", 75);

        var legend = d3.legend.color()
            .shapeWidth(70)
            .orient('horizontal')
            .labelFormat(d3.format(".1f"))
            .scale(colors);

        svg.select(".legendQuant")
            .call(legend);
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

