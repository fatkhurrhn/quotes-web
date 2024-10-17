<?php
    if($_GET['submit']){
        $srch = $_GET['search'];
        header("location: home.php?keyword=$srch");
    }
?>