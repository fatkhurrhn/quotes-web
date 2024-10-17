<?php 

include("config.php");

$result_post = mysqli_query($conn, "SELECT * FROM post");
$post = mysqli_fetch_assoc($result_post);

$jdl = $conn->real_escape_string($_POST["judul"]);
$isi = $conn->real_escape_string($_POST["isi"]);

if (mysqli_query($conn, "INSERT INTO post values('', '$jdl', '$isi')")) {
    echo "You clicked the button!";
    header("location: list.php");
} else {
    echo "gagal";
}
?>