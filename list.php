<?php
session_start();
include("config.php");
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="multikit">
    <meta name="keywords" content="multikit">
    <title>Quotes</title>
    <link rel="manifest" href="https://themes.pixelstrap.net/multikit/manifest.json">
    <meta name="theme-color" content="#ff8d2f">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="apple-mobile-web-app-title" content="multikit">
    <meta name="msapplication-TileImage" content="https://themes.pixelstrap.net/multikit/assets/images/favicon/1.svg">
    <meta name="msapplication-TileColor" content="#FFFFFF">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="icon" type="image/x-icon" href="https://themes.pixelstrap.net/multikit/assets/images/favicon/9.svg">
    <link rel="shortcut icon" href="https://themes.pixelstrap.net/multikit/https://themes.pixelstrap.net/multikit/" type="image/x-icon">

    <!--Google font-->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Bootstrap css -->
    <link id="rtl-link" rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/vendors/bootstrap.css">

    <!-- Swiper css -->
    <link rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/vendors/swiper/swiper-bundle.min.css">

    <!-- Remix Icon css -->
    <link rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/remixicon.css">

    <link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet" />

    <!-- Style css -->
    <link id="change-link" rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/style.css">

    <!-- Sertakan SweetAlert2 CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@10">


    <style>
        .transparent{
            background:rgba(0, 0, 0, 0.5);
            width: 60%;
            height:350px;
            padding:10px;
            margin:0px auto;
            color:#fff;
            text-align:center;
                    }
    </style>
</head>

<body class="inter-body learning-color">

    <!-- header start -->
    <!-- <header class="main-header learning-header h-102">
        <div class="custom-container">
            <div class="top-header">
                <div class="header-left">
                    <a class="text-white" href="#">
                        <i class="ri-arrow-left-line"></i>
                    </a>
                </div>

                <div class="header-right">
                    <div class="notification-box">
                        <a class="text-white" href="https://www.tokopedia.com/s/quran" target="_blank">
                                <i class="ri-book-open-line"></i>
                            </a>
                    </div>
                </div>
            </div>

            <div class="header-bottom header-bottom-2">
                <h2 class="fw-500 text-white">Quotes Menghafal</h2>
            </div>
        </div>
    </header> -->
    <!-- header end -->

    <header class="main-header learning-header">
        <div class="custom-container">
            <div class="top-header">
                <div class="header-left">
                    <a class="text-white" data-bs-toggle="offcanvas" href="#sideMenu" role="button">
                        <i class="ri-menu-2-fill"></i>
                    </a>
                    <a href="index.html" class="header-logo">
                        <!-- <img src="https://themes.pixelstrap.net/multikit/assets/images/logo/1.svg" class="img-fluid" alt=""> -->
                        <h3 style="color: white;"></h3>
                    </a>
                </div>

                <div class="header-right">
                    <div class="notification-box">
                        <a class="text-white" href="admin/index.php" target="">
                            <i class="ri-login-box-line"></i>
                        </a>
                    </div>
                </div>
            </div>

            <div class="header-bottom">
                <div class="customer-name">
                    <h2>Assalamu'alaikum SobatFillah</h2>
                    <img src="https://themes.pixelstrap.net/multikit/assets/images/learning/hand.png" alt="">
                </div>
                <h5>Makasih yaa udh kasi quote terbaiknya...</h5>
            </div>

            <br>
            <section class="search-hotel-section">
                <div class="custom-container">
                    <form class="form-style-1 learning-search-form" action="search.php" method="GET">
                        <div>
                            <input id="input" type="text" name="search" class="form-control" placeholder="Search Quotes...">
                            <button class="btn filter-button" id="cari" type="submit" name="submit" value="cari">
                                <i class="ri-search-line"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </section>

<br>
        </div>
    </header>

    <!-- Popular Course Start -->

    <section class="section-t-space popular-course-section">
        <div class="custom-container">
        <div class="title">
        <a href="index.php" class="btn btn-sm btn-gradient">Tambah Quote</a>
            </div>
        
            <div class="title">
                <h4>Quote of the day</h4>
            </div>



            <div>
            <?php
            include("cari.php");
            ?>
            </div>




        </div>
    </section>

    <!-- Popular Course End -->

    <!-- space box start -->
    <div class="learning-box"></div>
    <!-- space box end -->



    <!-- Bootstrap js-->
    <script src="https://themes.pixelstrap.net/multikit/assets/js/vendors/bootstrap/bootstrap.bundle.min.js"></script>

    <!-- swiper js -->
    <script src="https://themes.pixelstrap.net/multikit/assets/js/swiper-bundle.min.js"></script>
    <script src="https://themes.pixelstrap.net/multikit/assets/js/custom_swiper.js"></script>

    <!-- Theme js-->
    <script src="https://themes.pixelstrap.net/multikit/assets/js/script.js"></script>

    <!-- Theme Settings js-->
    <!-- <script src="https://themes.pixelstrap.net/multikit/assets/js/theme-setting.js"></script> -->

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@10"></script>

    <script>
    document.addEventListener('DOMContentLoaded', function () {
        Swal.fire({
            title: 'Berhasil!',
            text: 'syukron, tunggu collab nya yaa :)',
            icon: 'success',
            confirmButtonText: 'OK'
        });
    });
</script>



</body>

</html>