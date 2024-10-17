<?php
include("config.php");

if (isset($_GET['keyword'])) {
    $keyword = $_GET['keyword'];
    $result_post = mysqli_query($conn, "SELECT * FROM post WHERE judul LIKE '%$keyword%' OR isi LIKE '%$keyword%'");
} else {
    $result_post = mysqli_query($conn, "SELECT * FROM post");
}
?>

<?php while ($post = mysqli_fetch_assoc($result_post)) : ?>
    <div class="row g-4">
        <div class="col-12">
            <div class="popular-box">
                <h5>"<?php echo $post['isi']; ?>" <br>~ <font style="font-size: 12px; color:black"><?php echo $post['judul']; ?></font></h5>
            </div>
        </div>
    </div>
    <br>
<?php endwhile; ?>