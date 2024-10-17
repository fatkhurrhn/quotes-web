<?php 
include("config.php");

if(isset($_GET['keyword'])){
    $keyword = $_GET['keyword'];
    $result_post = mysqli_query($conn, "SELECT * FROM post WHERE judul LIKE '%$keyword%' OR isi LIKE '%$keyword%'");
}else{
    $result_post = mysqli_query($conn, "SELECT * FROM post");
}
?>
<a href="tambah.php" class="btn btn-sm btn-gradient"> Add Data</a>
<br><br>
<table class="table" id="table">
    <tr>
        <th>nama</th>
        <th>quote</th>
        <th>action</th>
    </tr>
    <?php while($post = mysqli_fetch_assoc($result_post)): ?>
    <tr>
        <td><?php echo $post['judul']; ?></td>
        <td><?php echo $post['isi']; ?></td>
        <td><a href="edit.php?post=<?php echo $post["id"]; ?>"><i class="ri-edit-2-line"></i></a> | <a href="hapus.php?id=<?php echo $post["id"]; ?>"><i class="ri-delete-bin-5-line"></i></a></td>
    </tr>
<?php endwhile; ?>
</table>