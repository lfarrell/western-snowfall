queue()
    .defer(d3.json,'analysis/ca_munged_data.json')
    .defer(d3.json,'js/ca-all.json')
    .await(function(error, data, topo) {

    var margins = {top: 50, right: 130, bottom: 25, left: 105},
        parse_date = d3.time.format("%m/%Y").parse,
        parse_year_date = d3.time.format("%Y").parse,
        parse_month_date = d3.time.format("%m").parse,
        num_format = d3.format(".1f"),
        map_height = 250 - margins.top - margins.bottom,
        height = 400 - margins.top - margins.bottom;

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

    var year = d3.select('#year').append('svg');
    var date = d3.select('#states_cal').append('svg');
    var start_river = d3.select('#river_year_chart').append('svg');
    var map_svg = d3.select('#map').append('svg')
        .append('g').attr("id", "base_map");

    var render = _.debounce(function() {
        var screen_width = window.innerWidth;
        var map_width, chart_width;

        if(screen_width <= 480) {
            chart_width = screen_width - margins.left - 50;
            map_width  = screen_width;
        } else {
            chart_width = screen_width - margins.left - margins.right;
            map_width  = Math.floor(screen_width / 3.3);
        }

        var year_elevation_water = data.filter(function(d) {
            return d.type === 'yew';
        });

        var year_annotations = [
            {
                "xVal": parse_year_date('2005'),
                "yVal": 8000,
                "path": "M54,-75L95,100",
                "text": "Max Snow Levels",
                "textOffset": [6, -86]
            },
            {
                "xVal": parse_year_date('2015'),
                "yVal": 4000,
                "path": "M131,101L118,82",
                "text": "Min Snow Levels",
                "textOffset": [100, 119]
            }
        ];

        var date_annotations = [
            {
                "xVal": parse_year_date('2011'),
                "yVal": 8000,
                "path": "M70,19L105,156",
                "text": "Max Snow Levels",
                "textOffset": [18, 9]
            },
            {
                "xVal": parse_year_date('2015'),
                "yVal": 4000,
                "path": "M131,101L118,82",
                "text": "Min Snow Levels",
                "textOffset": [100, 119]
            }
        ];

        var cal_elevation_date_water = data.filter(function(d) {
            return d.type === 'dew';
        });

        var selected_river = data.filter(function(d) {
            return d.type === 'reyw' && d.river === 'American';
        });

        build(year_elevation_water, year, '#year', false, 'sm', year_annotations);
        build(cal_elevation_date_water, date, '#states_cal', true, 'sm', date_annotations);
        build(selected_river, start_river, '#river_year_chart', false, 'sm');
        mapping(map_width, topo, 'American');

        function build(data, svg, selector, full, metric, annotations) {
            var size = sizing(full, selector);
            var radius = size.radius;
            var type = (screen_width <= 500) ? "%y" : "%Y";
            var offset_x = (full) ? 10 : 0;
            var offset_y = (full || /river/.test(selector)) ? 5 : 0;
            var elevations = _.pluck(
                _.uniq(data, function(d) { return d.elev; }), 'elev'
            ).reverse();
            var elevations_num = elevations.length;
            var adjusted_height, text_value, width;

            if(/river/.test(selector)) {
                width = chart_width /  1.5;
                margins.top = 25;
            } else {
                width = chart_width;
                margins.top = 50;
            }

            /* Adjust size of basin charts */
            if(elevations_num == 7) {
                adjusted_height = height;
            } else if(elevations_num == 6) {
                adjusted_height = height * .9;
            } else if(elevations_num == 5) {
                adjusted_height = height * .8;
            } else if(elevations_num == 4) {
                adjusted_height = height * .6;
            } else if(elevations_num == 3) {
                adjusted_height = height * .5;
            } else if(elevations_num == 2) {
                adjusted_height = height * .35;
            } else {
                adjusted_height = height * .18;
            }

            var xScaleStateYearMonth = xScale(width, data);
            var yScaleStateYearMonth = yScaleOrd(adjusted_height, elevations);
            var xAxis = d3.svg.axis()
                .scale(xScaleStateYearMonth)
                .orient("top")
                .ticks(size.ticks)
                .tickFormat(d3.time.format(type));

            var yAxis = d3.svg.axis()
                .scale(yScaleStateYearMonth)
                .orient("left")
                .tickFormat(d3.format(",d"));

            svg.attr("height", adjusted_height + margins.top + margins.bottom)
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

            legend(selector +"-legend", p_colors, width);

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
                            '<li>Snow Mean: ' + num_format(d.sm) + ' inches</li>' +
                            '<li>Snow Median: ' + num_format(d.smd) + ' inches</li>' +
                             //   '<li>Snow %: ' + num_format(d.sp) + '%</li>' +
                            '</ul>'
                        )
                        .style("top", (d3.event.pageY+38)+"px")
                        .style("left", (d3.event.pageX-55)+"px");

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
                    return p_colors(d[metric]);
                })
                .attr('cx', function(d) { return xScaleStateYearMonth(d.date) - offset_x; })
                .attr('cy', function(d) { return yScaleStateYearMonth(d.elev) + offset_y; })
                .attr('r', radius);

            circles.exit().remove();

            if(metric === 'sm') {
                text_value = 'Snow Average';
            } else if(metric === 'smd') {
                text_value = 'Snow Median';
            } else if(metric === 'wm') {
                text_value = 'Water Average';
            } else {
                text_value = 'Water Median';
            }

            d3.select(selector + '-note').text(text_value);

            if(annotations) {
                svg.append('marker')
                    .attr('id', 'arrow')
                    .attr('viewBox', '-10 -10 20 20')
                    .attr('markerWidth', 11)
                    .attr('markerHeight', 11)
                    .attr('orient', 'auto')
                    .append('path')
                    .attr('d', 'M-6.75,-6.75 L 0,0 L -6.75,6.75');

                var annotate = 'g.annotations';
                d3.selectAll(selector + ' ' + annotate).remove();
                var swoopy = d3.swoopyDrag()
                    .x(function(d){ return xScaleStateYearMonth(d.xVal) })
                    .y(function(d){ return yScaleStateYearMonth(d.yVal) })
                    .draggable(0);

                swoopy.annotations(annotations);

                svg.append(annotate).call(swoopy);

                d3.selectAll(selector + ' .annotations path')
                    .attr('marker-end', 'url(#arrow)');
            }
        }

        function mapping(width, topos, river) {
            var river_list = [
                "American",
                "Eel",
                "Feather",
                "Kaweah",
                "Kern",
                "Kings",
                "Lk Tahoe",
                "McCloud",
                "Merced",
                "Mokelumne",
                "Mono Lk",
                "Owens",
                "Pit",
                "Sacramento",
                "San Joaquin",
                "Scott",
                "Shasta",
                "Stanislaus",
                "Stony Cr",
                "Susan",
                "Trinity",
                "Truckee",
                "Tule",
                "Tuolumne",
                "Walker",
                "Yuba"
            ];

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

            var zoom = d3.behavior.zoom()
                .scaleExtent([1, 3])
                .on("zoom", zooming);
            var drag = d3.behavior.drag()
                .origin(function(d) { return d; })
                .on("drag", dragged);

            d3.select("#map svg").attr('height', map_height)
                .attr('width', width)
                .call(zoom);

            var map_draw = map_svg.selectAll("path")
                .data(topos.features);

            map_draw.enter()
                .append("path");

            map_draw.attr("d", path)
                .style("fill", function(d) {
                    if(d.properties.Name === river) {
                        return 'red';
                    } else {
                        return 'none'
                    }
                })
                .style("opacity", 0.7)
                .style("stroke", function(d) {
                    if(d.properties.Name === river) {
                        return 'red';
                    } else {
                        if(_.indexOf(river_list, d.properties.Name) !== -1) {
                            return 'none';
                        }

                        return 'white'
                    }
                });

            function dragged(d) {
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
            }

            function zooming() {
                var scaling = "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")";
                map_draw.attr("transform", scaling);
            }
        }

        d3.selectAll(".btn-group").on("click", function(d) {
            var selected_id = d3.event.target.id;
            var id_parts = selected_id.split('-');
            var metric = id_parts[1];
            var is_full = false;
            var is_snow = /s/.test(selected_id);
            var river, which_svg, selector, type, text_value;

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

                build(river_update, start_river, '#river_year_chart', false, 'sm');
                mapping(map_width, topo, river_val);
            }
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

    function legend(selector, colors, width) {
        var width = window.innerWidth;
        var sizing = legendSize(width - 15);
        var legend_height = (sizing.orientation === 'vertical') ? 200 : 75;
        var svg = d3.select(selector).attr("width", width)
            .attr("height", legend_height);

        svg.append("g")
            .attr("class", "legendQuant")
            .translate([20, 0])
            .attr("width", width)
            .attr("height", legend_height);

        var legend = d3.legend.color()
            .shapeWidth(sizing.shape_width)
            .orient(sizing.orientation)
            .labelFormat(d3.format(".1f"))
            .scale(colors);

        svg.select(".legendQuant")
            .call(legend);
    }

    function legendSize(width) {
        var shape_width, orientation;

        if(width < 150) {
            shape_width = 10;
            orientation = 'vertical';
        } else if(width < 350) {
            shape_width = 20;
            orientation = 'vertical';
        } else if(width < 500) {
            shape_width = 40;
            orientation = 'vertical';
        } else if(width < 700) {
            shape_width = 50;
            orientation = 'horizontal';
        } else if(width < 805) {
            shape_width = 57;
            orientation = 'horizontal';
        } else if(width < 1000) {
            shape_width = 65;
            orientation = 'horizontal';
        } else {
            shape_width = 70;
            orientation = 'horizontal';
        }

        return { shape_width: shape_width, orientation: orientation };
    }

    function sizing(full, selector) {
        var width = window.innerWidth - margins.right - margins.left;
        var type = /y/.test(selector);
        var radius,ticks;

        if(width < 150) {
            radius = 3.3;
            ticks = 3;
        } else if(width < 350) {
            radius = 6;
            ticks = 9;
        } else if(width < 500) {
            radius = 9;
            ticks = 9;
        } else if(width < 700) {
            radius = 11;
            ticks = 9;
        } else if(width < 1000) {
            radius = 15;
            ticks = 17;
        } else {
            radius = 15;
            ticks = 17;
        }

        if(type && width <= 420) {
            radius = 2.5;
        } else if(type && width <= 700) {
            radius = 7;
        } else if(type && width <= 1020) {
            radius = 10;
        }

        if(full && width <= 420) {
            radius = 1.5;
        } else if(full && width <= 800) {
            radius = 2;
        } else if (full) {
            radius = 3;
        }

        return { radius: radius, ticks: ticks };
    }

  /*  function sizing(full, selector) {
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
    } */

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