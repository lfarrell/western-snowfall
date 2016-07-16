var _ = require('lodash');
var fs = require('fs');
var d3 = require('d3');
var R = require('ramda');

fs.readFile('../data/all/all.csv', 'utf8', function(e, stations) {
    var data = d3.csv.parse(stations);

    var parse_date = d3.time.format("%m-%y").parse,
        parse_month_date = d3.time.format("%m").parse;

    var text_format = d3.format(".01f");

    /**
     * Snow
     */
  /*  var snow = data.filter(function(d) {
       return d.snow_depth !== '';
    });

    snow.forEach(function(d) {
        d.date = d.month + '-' + d.year;
    });

    var by_elevation_snow = rollingOne('elevation_band', snow);
    var by_month_snow = rollingOne('month', snow); 
    var by_month_elevation_snow = rollingTwo('month', 'elevation_band', snow);
    var by_date_elevation_snow = rollingTwo('string_date', 'elevation_band', snow);
    var by_state_elevation_snow = rollingTwo('state', 'elevation_band', snow);     
    var state_by_elevation_month_snow = rollingThree('state', 'elevation_band', 'month', snow);
    var state_by_elevation_date_snow = rollingThree('state', 'elevation_band', 'date', snow);

    var by_elevation_snow_flat = flattenOne(by_elevation_snow, 'es');
    var by_month_snow_flat = flattenOne(by_month_snow, 'ms');
    var by_month_elevation_snow_flat = flattenTwo(by_month_elevation_snow, 'mes');
    var by_date_elevation_snow_flat = flattenTwo(by_date_elevation_snow, 'des');
    var by_state_elevation_snow_flat = flattenTwo(by_state_elevation_snow, 'ses');
    var state_by_elevation_month_snowflat = flattenThree(state_by_elevation_month_snow, 'sems');
    var state_by_elevation_date_snow_flat = flattenThree(state_by_elevation_date_snow, 'seds');*/

    /**
     * Water
     */
    var water = data.filter(function(d) {
        return d.snow_water_equivalent !== '' && d.state === 'cal';
    });

    water.forEach(function(d) {
        d.string_date = d.month + '-' + d.year;
    });

    var by_elevation_water = rollingOne('elevation_band', water);
    var by_month_water = rollingOne('month', water);
    var by_year_water = rollingOne('year', water);
    var by_date_water = rollingOne('string_date', water);
    var by_month_elevation_water = rollingTwo('month', 'elevation_band', water);
    var by_year_elevation_water = rollingTwo('year', 'elevation_band', water);
    var by_date_elevation_water = rollingTwo('string_date', 'elevation_band', water);
    var by_state_elevation_water = rollingTwo('state', 'elevation_band', water);
    var state_by_elevation_month_water = rollingThree('state', 'elevation_band', 'month', water);
    var state_by_elevation_date_water = rollingThree('state', 'elevation_band', 'string_date', water);

    var by_elevation_water_flat = flattenOne(by_elevation_water, 'ew');
    var by_month_water_flat = flattenOne(by_month_water, 'mw');
    var by_year_water_flat = flattenOne(by_year_water, 'yw');
    var by_date_water_flat = flattenOne(by_date_water, 'dw');
    var by_month_elevation_water_flat = flattenTwo(by_month_elevation_water, 'mew');
    var by_year_elevation_water_flat = flattenTwo(by_year_elevation_water, 'yew');
    var by_date_elevation_water_flat = flattenTwo(by_date_elevation_water, 'dew');
    var by_state_elevation_water_flat = flattenTwo(by_state_elevation_water, 'sew');
    var state_by_elevation_month_water_flat = flattenThree(state_by_elevation_month_water, 'semw');
    var state_by_elevation_date_water_flat = flattenThree(state_by_elevation_date_water, 'sedw');

    
   /* var all  = by_elevation_snow_flat.concat(
        by_month_snow_flat,
        by_month_elevation_snow_flat,
        by_date_elevation_snow_flat,
        by_state_elevation_snow_flat,
        state_by_elevation_month_snowflat,
        state_by_elevation_date_snow_flat,
        by_elevation_water_flat,
        by_month_water_flat,
        by_month_elevation_water_flat,
        by_date_elevation_water_flat,
        by_state_elevation_water_flat,
        state_by_elevation_month_water_flat,
        state_by_elevation_date_water_flat
    ); */

    var all  = by_elevation_water_flat.concat(
        by_month_water_flat,
        by_year_water_flat,
        by_date_water_flat,
        by_month_elevation_water_flat,
        by_year_elevation_water_flat,
        by_date_elevation_water_flat,
        by_state_elevation_water_flat,
        state_by_elevation_month_water_flat,
        state_by_elevation_date_water_flat
    );

    fs.writeFile('../data/all/munged_data.json', JSON.stringify(all, null), function(err) {
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
                state: '',
                date: date_val,
                elev: elev_val * 1000,
                water_mean: 1 * text_format(d.values.water_mean),
                water_median: 1 * text_format(d.values.water_median),
                snow_mean: 1 * text_format(d.values.snow_mean),
                snow_median: 1 * text_format(d.values.snow_median)
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
                    state: '',
                    date: d.key,
                    elev:e.key * 1000,
                    water_mean: 1 * text_format(e.values.water_mean),
                    water_median: 1 * text_format(e.values.water_median),
                    snow_mean: 1 * text_format(e.values.snow_mean),
                    snow_median: 1 * text_format(e.values.snow_median)
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
                        state: d.key,
                        date: f.key,
                        elev:e.key * 1000,
                        water_mean: 1 * text_format(f.values.water_mean),
                        water_median: 1 *  text_format(f.values.water_median),
                        snow_mean: 1 *  text_format(f.values.snow_mean),
                        snow_median: 1 *  text_format(f.values.snow_median)
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
                snow_mean: d3.mean(values, function(d) {return d.snow_depth; }),
                snow_median: d3.median(values, function(d) {return d.snow_depth; }),
                water_mean: d3.mean(values, function(d) {return d.snow_water_equivalent; }),
                water_median: d3.median(values, function(d) {return d.snow_water_equivalent; })
            };
        }
    }
});

