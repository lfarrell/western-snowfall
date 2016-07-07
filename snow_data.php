<?php
include 'functions.php';
date_default_timezone_set('America/New_York');

$states = array('az', 'cal', 'co', 'id', 'nv', 'nm', 'or', 'utah', 'wa', 'wy');

$url_base = "http://www.wcc.nrcs.usda.gov/nwcc/rgrpt?station=";

foreach($states as $state) {
   /* if (($handle = fopen("data/stations/".$state."_snow.csv", "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if(preg_match('/Site_Name/', $data[0])) { continue; }

            $ch = curl_init($url_base . $data[1] . '&report=snowmonth_hist');
            $name = strtolower(preg_replace('/(\(|\)|#|\s|\')/', '_', trim($data[0]) . '-' . $data[2]));
            $fp = fopen("raw_data/".$state."_snow/" . $name . ".csv", "w");

            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_HEADER, 0);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

            curl_exec($ch);
            curl_close($ch);
            fclose($fp);

            echo $name . " processed\n";
        }
        fclose($handle);
    } */

  //  $base_file = file("snow/".$state."_snow.csv");
    $path = 'raw_data/' . $state . '_snow';
    $files = scandir($path);

    $i = 0;
    foreach($files as $file) {
        if(!preg_match('/^\./', $file)) {
            $fh = fopen('data/' . $state . '_snow/' . $file, "wb");
            fputcsv($fh, array('location', 'snow_depth', 'snow_water_equivalent', 'elevation_band', 'elevation', 'month', 'year'));
            $name = '';
            $elevation = '';
            if (($handle = fopen($path . '/' . $file, "r")) !== FALSE) {
                while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    if($i == 0) {
                        preg_match('/[A-Z].*?\(/', $data[0], $matches);
                        $name = substr_replace($matches[0], '', -2);
                    }

                    if($i == 1) {
                        preg_match('/\d{3,5}/', $data[0], $matches);
                        $elevation = $matches[0];
                    }

                    if(preg_match('/^\d{4}/', $data[0]) && $data[0] >= 2000) {
                        $year = $data[0];
                        array_shift($data);
                        $unique_measurements = array_chunk($data, 3);

                        foreach($unique_measurements as $measurement) {
                            if(!preg_match('/^[A-Z]/', $measurement[0])) { continue; }
                            $date = date('m/Y', strtotime(strtolower($measurement[0]) . ' ' . $year));
                            if(preg_match('/^(10|11|12)/', $date)) {
                                echo "Old date " .$date . "\n";
                                $datebits = preg_split('/\//', $date);
                                $date = $datebits[0] . '/' . ($datebits[1] - 1);
                                echo "New Date $date\n";
                            }

                            $split_date = preg_split('/\//', $date);
                            fputcsv($fh, array(trim($name), $measurement[1], $measurement[2], elevationRange($elevation), $elevation, $split_date[0], substr($split_date[1], -2)));
                        }
                    }

                    $i++;
                }
                fclose($handle);
            }
            fclose($fh);
        }
        $i = 0;
      //  echo $file . " processed\n";
    }
}

function elevationRange($elevation) {
    if($elevation > 10000) {
        $range = 10;
    } elseif($elevation > 9000) {
        $range = 9;
    } elseif($elevation > 8000) {
        $range = 8;
    } elseif($elevation > 7000) {
        $range = 7;
    } elseif($elevation > 6000) {
        $range = 6;
    } elseif($elevation > 5000) {
        $range = 5;
    } else {
        $range = 4;
    }

    return $range;
}