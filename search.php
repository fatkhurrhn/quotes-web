<?php
    if($_GET['submit']){
        $srch = $_GET['search'];
        header("location: index.php?keyword=$srch");
    }
?>