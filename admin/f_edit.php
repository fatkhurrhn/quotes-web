<?php 
include("config.php");
$result_post = mysqli_query($conn, "SELECT * FROM post");
$post = mysqli_fetch_assoc($result_post);

$id = $conn->real_escape_string($_POST["id"]);
$jdl = $conn->real_escape_string($_POST["judul"]);
$isi = $conn->real_escape_string($_POST["isi"]);

if (mysqli_query($conn, "UPDATE post SET judul = '$jdl', isi = '$isi' WHERE id = '$id'")) {
    header("location: home.php");
} else {
    echo "gagal";
}


?>