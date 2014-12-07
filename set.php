<?php
include("sql.php");
if (isset($_GET["u"]) and ctype_xdigit($_GET["u"]) and isset($_GET["name"]) and ctype_alnum($_GET["name"]) and isset($_GET["score"]) and is_numeric($_GET["score"])) {
    if (strlen($_GET["name"])<=10 and strlen($_GET["name"])>0 and $_GET["score"]<=1 and $_GET["score"]>=0) {
        $q="INSERT INTO scores (`uid`, `score`, `name`, `date`) VALUES ('".$_GET["u"]."', '".$_GET["score"]."', '".$_GET["name"]."', CURRENT_TIMESTAMP);";
        if (!mysql_query($q)) {
            $q="UPDATE scores SET score='".$_GET["score"]."', name='".$_GET["name"]."' WHERE uid='".$_GET["u"]."' AND score>'".$_GET["score"]."' LIMIT 1";
            mysql_query($q);
        }
    }
    $q="SELECT * FROM scores ORDER BY score ASC LIMIT 10";
    $res=mysql_query($q);
    $ret=array();
    while ($row=mysql_fetch_array($res)) {
        $ret[]=array("uid"=>$row["uid"],"name"=>$row["name"],"score"=>$row["score"]);    
    }
    echo json_encode($ret);
} else echo json_encode(array());  
?>
