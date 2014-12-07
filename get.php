<?php
include("sql.php");
$q="SELECT * FROM scores ORDER BY score ASC LIMIT 10";
$res=mysql_query($q);
$ret=array();
while ($row=mysql_fetch_array($res)) {
    $ret[]=array("uid"=>$row["uid"],"name"=>$row["name"],"score"=>$row["score"]);    
}
echo json_encode($ret);  
?>
