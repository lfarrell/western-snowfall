<?php
$states = array('az', 'cal', 'co', 'id', 'nv', 'nm', 'or', 'utah', 'wa', 'wy');
$headers = array('location', 'snow_depth', 'snow_water_equivalent', 'elevation_band', 'elevation', 'month', 'year');
$headers_alt = array('snow_depth', 'snow_water_equivalent', 'elevation_band', 'month', 'year');
$all_headers = $headers;
$no_locations = $headers;
$all_headers[] = 'state';
$no_locations[] = 'state';

$fg = fopen('data/all/all.csv', 'wb');
fputcsv($fg, $all_headers);

$ft = fopen('data/all/all_no_loc.csv', 'wb');

array_shift($no_locations);
fputcsv($ft, $no_locations);

$fn = fopen('data/all/all_no_loc_elev.csv', 'wb');
fputcsv($fn, $headers_alt);

foreach($states as $state) {
    $base = 'data/' . $state . '_snow';
    $files = scandir($base);
    $fh = fopen('data/all/all_' . $state . '.csv', 'wb');
    fputcsv($fh, $headers);

    foreach($files as $file) {
        if(!preg_match('/^\./', $file)) {
            if (($handle = fopen($base . '/' . $file, "r")) !== FALSE) {
                while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    if(preg_match('/location/', $data[0])) { continue; }

                    if(preg_match('/^0(1|2|3|4|5|6)/', $data[5])) {
                        fputcsv($fh, $data);
                        $data[] = $state;
                        fputcsv($fg, $data);

                        fputcsv($fn, array($data[1], $data[2], $data[3], $data[5], $data[6], $data[7]));

                        array_shift($data);
                        fputcsv($ft, $data);
                    }
                }
                fclose($handle);
            }
        }
    }
    fclose($fh);
    echo $state . " processed\n";
}
fclose($fg);
fclose($ft);
fclose($fn);