<?php
$host = '31.22.4.32';
$usrname = 'feifeiha_public';
$password = 'p0OnMM722iqZ';
$db = 'feifeiha_big_db';
$table = 'MarkNotes';

if ($_SERVER['REQUEST_METHOD'] == "GET") {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, OPTIONS');
  header('Content-Type: application/json');

  $notesId = $_GET['notes'];
  $passcode = $_GET['passcode'];

  $con = mysql_connect($host, $usrname, $password);
  if(!$con) {
    header(' ', true, 503);
    die('Could not connect: ' . mysql_error());
  }
  mysql_select_db($db, $con);
  $data = mysql_query("SELECT * FROM " . $table . " WHERE notes_id = \"" . $notesId. "\" AND passcode = \"". $passcode . "\"");

  $result = '';
  while($row = mysql_fetch_array($data)) {
    $result = $result . $row['content'];
  }

// remove the comma at the very last position
  header(' ', true, 200);
  echo $result;
  mysql_close($con);
}
elseif ($_SERVER['REQUEST_METHOD'] == "POST") {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

  $notesId = $_POST['notes'];
  $content = $_POST['content'];
  $passcode = $_POST['passcode'];

  $con = mysql_connect($host, $usrname, $password);
  if(!$con) {
    header(' ', true, 503);
    die('Could not connect: ' . mysql_error());
  }
  mysql_select_db($db, $con);
  mysql_query("INSERT INTO ".$table." (notes_id, content, passcode) VALUES (\"".$notesId."\",\"".$content."\",\"".$passcode."\")");

  mysql_close($con);
  header(' ', true, 200);
}
?>