<?php
/* if (($handle = fopen("data/ca_snow.csv", "r")) !== FALSE) {
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        if(preg_match('/id_num/', $data[0])) { continue; }
        $station = $data[2];
        $url = "http://cdec.water.ca.gov/cgi-progs/snowQuery?course_num=$station&month=%28All%29&start_date=2000&end_date=2016&csv_mode=Y&data_wish=Retrieve+Data";
        $ch = curl_init($url);
        $fp = fopen("data/ca_only/" . $station . ".csv", "wb");

        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

        curl_exec($ch);
        curl_close($ch);
        fclose($fp);

        echo $station . " processed\n";
    }
    fclose($handle);
} */

$fh = fopen('data/ca_all.csv', 'wb');
fputcsv($fh, ['date','snow_depth','water', 'water_adjusted', 'site']);

$path = 'data/ca_only';
$files = scandir('data/ca_only');

foreach($files as $file) {
    $station = preg_split('/\./', $file)[0];
    if (($handle = fopen("$path/$file", "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, "\t")) !== FALSE) {
            $field = preg_split('/,/', $data[0]);
            print_r($field);
            if(!preg_match('/\d\//', trim($field[0]))) { continue; }
            fputcsv($fh, array(trim($field[0]), trim($field[2]), trim($field[3]), trim($field[4]), $station));
        }
        fclose($handle);
    }

    echo $station . " processed\n";
}