<?php
	session_start();
	include("config.php");
	$email		= $conn->real_escape_string($_POST['email']);
	$password	= $conn->real_escape_string($_POST['password']);
	$ambil_user = $conn->query("select * from user where email = '$email' and password = '$password'");
	$login = mysqli_num_rows($ambil_user);
	$row = mysqli_fetch_array($ambil_user);
	if($login == 1) {
		$_SESSION['user'] = $email;
		header("Location: home.php");
	}else{
		header("Location: index.php");
	}
?>