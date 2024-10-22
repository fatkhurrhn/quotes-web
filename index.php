
<!DOCTYPE html>
<html lang="en">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="multikit">
    <meta name="keywords" content="multikit">
    <title>Quote</title>
    <link rel="manifest" href="https://themes.pixelstrap.net/multikit/manifest.json">
    <meta name="theme-color" content="#ff8d2f">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="apple-mobile-web-app-title" content="multikit">
    <meta name="msapplication-TileImage" content="https://themes.pixelstrap.net/multikit/assets/images/favicon/1.svg">
    <meta name="msapplication-TileColor" content="#FFFFFF">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="icon" type="image/x-icon" href="https://themes.pixelstrap.net/multikit/assets/images/favicon/9.svg">
    <link rel="shortcut icon" href="https://themes.pixelstrap.net/multikit/" type="image/x-icon">

    <!--Google font-->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">

    <!-- Bootstrap css -->
    <link id="rtl-link" rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/vendors/bootstrap.css">

    <!-- Remix Icon css -->
    <link rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/remixicon.css">

    <!-- Style css -->
    <link id="change-link" rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/style.css">
</head>

<body class="inter-body learning-color">

    <!-- Log In Form Start -->
    <section class="learning-auth">
        <div class="learning-header px-15">
            <div class="home-contain">
                <h2>Quote Seputar Al-Qur'an</h2>
                <h5>Tulis quote terbaikmu, nanti kita kolaborasi di instagram mwehehe...</h5>
            </div>
        </div>
        <div class="custom-container">
            <div class="row">
                <div class="col-12">
                    <form class="form-style-1 mt-35" action="f_tambah.php" method="POST">
                        <div class="mb-4">
                            <label for="" class="form-label">Your Instagram</label>
                            <input type="text" name="judul" class="form-control" placeholder="Nama instagram kamu" id="">
                        </div>
                        <div>
                            <label for="pass" class="form-label">Your Quote</label>
                            <textarea name="isi" class="form-control" placeholder="Keluarkan quote terbaikmu" rows="3"></textarea>
                        </div>
                        <input class="btn btn-gradient mt-4" type="submit" value="Kirim"></input>
                    </form>
                </div>
            </div>
        </div>
    </section>
    <!-- Log In Form End -->

    <!-- space box start -->
    <div class="spacing-box"></div>
    <!-- space box end -->

    

    <!-- Bootstrap js-->
    <script src="https://themes.pixelstrap.net/multikit/assets/js/vendors/bootstrap/bootstrap.bundle.min.js"></script>

    <!-- Theme js-->
    <script src="https://themes.pixelstrap.net/multikit/assets/js/script.js"></script>

    <!-- Theme Settings js-->
</body>

</html>
