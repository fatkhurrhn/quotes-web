<?php
include("config.php");

if(isset($_GET['id'])){
    $id = $_GET['id'];
        if($result_post = mysqli_query($conn, "DELETE FROM post WHERE id = '$id'")){
            header("location: home.php");
        }else{
            echo "Gagal";
        }
}
?>