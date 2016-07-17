var _ = require('underscore');
var fs = require('fs');
var d3 = require('d3');
var R = require('ramda');

fs.readFile('ca_all.csv', 'utf8', function(e, snow_levels) {
    fs.readFile('ca_snow.csv', 'utf8', function(e, stations) {
        var data = d3.csv.parse(snow_levels);
        var stations = d3.csv.parse(stations);

        data.forEach(function(d) {
            d.snow_depth = +d.snow_depth;
            d.water = +d.water;
            d.water_adjusted = +d.water_adjusted;
            d.date = '0' + d.date;

            var date_parts = d.date.split('/');

            d.month = date_parts[0];
            d.year = date_parts[1];

            var station = _.findWhere(stations, { id: d.site });

            d.river = station.river;
            d.april_avg = station.avg;
            d.elevation = elevationRange(station.elevation);
        });

       /* var data = datas.filter(function(d) {
            var exclude = [
                "McCloud",
                "Stony Cr",
                "Trinity",
                "Scott",
                "Sacramento",
                "Shasta",
                "Susan",
                "Eel",
                "Walker"
            ];

            if(_.indexOf(exclude, d.river) === -1) {
                return d.river;
            }
        }); */

        var text_format = d3.format(".1f");

        /**
         * Snow
         */
        var snow = data.filter(function(d) {
            return d.snow_depth !== '';
        });

        var by_elevation_snow = rollingOne('elevation', snow);
       // var by_month_snow = rollingOne('month', snow);
        var by_year_snow = rollingOne('year', snow);
        var by_date_snow = rollingOne('date', snow);
        var by_month_elevation_snow = rollingTwo('month', 'elevation', snow);
        var by_year_elevation_snow = rollingTwo('year', 'elevation', snow);
        var by_date_elevation_snow = rollingTwo('date', 'elevation', snow);
        var by_river_elevation_month_snow = rollingThree('river', 'elevation', 'month', snow);
        var by_river_elevation_year_snow = rollingThree('river', 'elevation','year', snow);
        var by_river_elevation_date_snow = rollingThree('river', 'elevation', 'date', snow);

        var by_elevation_snow_flat = flattenOne(by_elevation_snow, 'es');
       // var by_month_snow_flat = flattenOne(by_month_snow, 'ms');
        var by_year_snow_flat = flattenOne(by_year_snow, 'ys');
        var by_date_snow_flat = flattenOne(by_date_snow, 'ds');
        var by_month_elevation_snow_flat = flattenTwo(by_month_elevation_snow, 'mes');
        var by_year_elevation_snow_flat = flattenTwo(by_year_elevation_snow, 'yes');
        var by_date_elevation_snow_flat = flattenTwo(by_date_elevation_snow, 'des');
        var by_river_elevation_month_snow_flat = flattenThree(by_river_elevation_month_snow, 'rems');
        var by_river_elevation_year_snow_flat = flattenThree(by_river_elevation_year_snow, 'reys');
        var by_river_elevation_date_snow_flat = flattenThree(by_river_elevation_date_snow, 'reds');

        

        /**
         * Water
         */
        var water = data.filter(function(d) {
            return d.water !== '';
        });

        var by_elevation_water = rollingOne('elevation', water);
       // var by_month_water = rollingOne('month', water);
        var by_year_water = rollingOne('year', water);
        var by_date_water = rollingOne('date', water);
        var by_month_elevation_water = rollingTwo('month', 'elevation', water);
        var by_year_elevation_water = rollingTwo('year', 'elevation', water);
        var by_date_elevation_water = rollingTwo('date', 'elevation', water);
        var by_river_elevation_month_water = rollingThree('river', 'elevation', 'month', water);
        var by_river_elevation_year_water = rollingThree('river', 'elevation','year', water);
        var by_river_elevation_date_water = rollingThree('river', 'elevation', 'date', water);

        var by_elevation_water_flat = flattenOne(by_elevation_water, 'ew');
      //  var by_month_water_flat = flattenOne(by_month_water, 'mw');
        var by_year_water_flat = flattenOne(by_year_water, 'yw');
        var by_date_water_flat = flattenOne(by_date_water, 'dw');
        var by_month_elevation_water_flat = flattenTwo(by_month_elevation_water, 'mew');
        var by_year_elevation_water_flat = flattenTwo(by_year_elevation_water, 'yew');
        var by_date_elevation_water_flat = flattenTwo(by_date_elevation_water, 'dew');
        var by_river_elevation_month_water_flat = flattenThree(by_river_elevation_month_water, 'remw');
        var by_river_elevation_year_water_flat = flattenThree(by_river_elevation_year_water, 'reyw');
        var by_river_elevation_date_water_flat = flattenThree(by_river_elevation_date_water, 'redw');


        var all = by_elevation_snow_flat.concat(
         //   by_month_snow_flat,
            by_year_snow_flat,
            by_date_snow_flat,
            by_month_elevation_snow_flat,
            by_year_elevation_snow_flat,
            by_date_elevation_snow_flat,
            by_river_elevation_month_snow_flat,
            by_river_elevation_year_snow_flat,
            by_river_elevation_date_snow_flat,
            by_elevation_water_flat,
         //   by_month_water_flat,
            by_year_water_flat,
            by_date_water_flat,
            by_month_elevation_water_flat,
            by_year_elevation_water_flat,
            by_date_elevation_water_flat,
            by_river_elevation_month_water_flat,
            by_river_elevation_year_water_flat,
            by_river_elevation_date_water_flat
        );

        fs.writeFile('ca_munged_data.json', JSON.stringify(all, null), function(err) {
            console.log(err)
        });

        function flattenOne(nested_group, type) {
            var flat = [];

            nested_group.forEach(function(d) {
                var date_val, elev_val;

                if(!/(m|y)/.test(type)) {
                    date_val = '0';
                    elev_val = d.key;
                } else {
                    date_val = d.key;
                    elev_val = 0;
                }

                flat.push({
                    type: type,
                    river: '',
                    date: date_val,
                    elev: elev_val * 1000,
                    total: d.values.total,
                    wm: 1 * text_format(d.values.water_mean),
                    wmd: 1 * text_format(d.values.water_median),
                    sm: 1 * text_format(d.values.snow_mean),
                    smd: 1 * text_format(d.values.snow_median),
                    sp: text_format(d.values.snow_pct)
                });
            });

            return flat;
        }

        function flattenTwo(nested_group, type) {
            var flat = [];

            nested_group.forEach(function(d) {
                d.values.forEach(function(e) {
                    flat.push({
                        type: type,
                        river: '',
                        date: d.key,
                        elev:e.key * 1000,
                        total: e.values.total,
                        wm: 1 * text_format(e.values.water_mean),
                        wmd: 1 * text_format(e.values.water_median),
                        sm: 1 * text_format(e.values.snow_mean),
                        smd: 1 * text_format(e.values.snow_median),
                        sp: text_format(e.values.snow_pct)
                    });
                })
            });

            return flat;
        }

        function flattenThree(nested_group, type) {
            var flat = [];

            nested_group.forEach(function(d) {
                d.values.forEach(function(e) {
                    e.values.forEach(function(f) {

                        flat.push({
                            type: type,
                            river: d.key,
                            date: f.key,
                            elev:e.key * 1000,
                            total: f.values.total,
                            wm: 1 * text_format(f.values.water_mean),
                            wmd: 1 *  text_format(f.values.water_median),
                            sm: 1 *  text_format(f.values.snow_mean),
                            smd: 1 *  text_format(f.values.snow_median),
                            sp: text_format(f.values.snow_pct)
                        })
                    })
                })
            });

            return flat;
        }

        function rollingOne(first_key, datas) {
            return d3.nest()
                .key(function(d) { return d[first_key]; })
                .rollup(stats())
                .entries(datas);
        }

        function rollingTwo(first_key, second_key, datas) {
            return d3.nest()
                .key(function(d) { return d[first_key]; })
                .key(function(d) { return d[second_key]; })
                .rollup(stats())
                .entries(datas);
        }

        function rollingThree(first_key, second_key, third_key, datas) {
            return d3.nest()
                .key(function(d) { return d[first_key]; })
                .key(function(d) { return d[second_key]; })
                .key(function(d) { return d[third_key]; })
                .rollup(stats())
                .entries(datas);
        }

        function stats() {
            return function(values) {
                return {
                    total: _.uniq(values, function(d) { return d.site; }).length,
                    snow_mean: d3.mean(values, function(d) {return d.snow_depth; }),
                    snow_median: d3.median(values, function(d) {return d.snow_depth; }),
                    snow_pct: (d3.mean(values, function(d) { return d.april_avg}) / d3.mean(values, function(d) {return d.snow_depth; })) * 100,
                    water_mean: d3.mean(values, function(d) {return d.water; }),
                    water_median: d3.median(values, function(d) {return d.water; })
                };
            }
        }

        function elevationRange(elevation) {
            var $elevation = parseInt(elevation);
            var range;

            if($elevation >= 10000) {
                range= 10;
            } else if($elevation >= 9000) {
                range= 9;
            } else if($elevation >= 8000) {
                range= 8;
            } else if($elevation >= 7000) {
                range= 7;
            } else if($elevation >= 6000) {
                range= 6;
            } else if($elevation >= 5000) {
                range= 5;
            } else {
                range= 4;
            }

            return range;
        }
    });
});

