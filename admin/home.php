<?php
    session_start();
    include("config.php");
    
    if (!$_SESSION['user']){
        header("location: index.php");
    }

  $sql_ngambil_user = $conn->query("select * from user where email = '$_SESSION[user]'");
  $user = mysqli_fetch_assoc($sql_ngambil_user);
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">

    <!-- Bootstrap css -->
    <link id="rtl-link" rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/vendors/bootstrap.css">

    <!-- Swiper css -->
    <link rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/vendors/swiper/swiper-bundle.min.css">

    <!-- Remix Icon css -->
    <link rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/remixicon.css">

    <link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet"/>

    <!-- Style css -->
    <link id="change-link" rel="stylesheet" type="text/css" href="https://themes.pixelstrap.net/multikit/assets/css/style.css">
</head>

<body class="inter-body learning-color">

    <!-- header start -->
    <header class="main-header learning-header h-102">
        <div class="custom-container">
            <div class="top-header">
                <div class="header-left">
                    <a class="text-white" href="#">
                        <i class="ri-arrow-left-line"></i>
                    </a>
                </div>

                <div class="header-right">
                    <div class="notification-box">
                        <a class="text-white" href="logout.php" target="">
                        <i class="ri-logout-box-line"></i>
                            </a>
                    </div>
                </div>
            </div>

            <div class="header-bottom header-bottom-2">
                <h2 class="fw-500 text-white">Quotes of the day</h2>
            </div>
        </div>
    </header>

    <!-- Setting Section Start -->
    <div class="search-box pt-25">
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
    </div>
    <!-- Setting Section End -->

    <!-- Popular Course Start -->

    <section class="section-t-space popular-course-section">
        <div class="custom-container">
            <!-- <div class="title">
                <h4>Quote of the day</h4>
            </div> -->
            
            
            
            <?php 
            include("cari.php");
        ?>

            
            

        </div>
    </section>

    <!-- Popular Course End -->

    <!-- space box start -->
    <div class="learning-box"></div>
    <!-- space box end -->

    <script src="js.js"></script>

    <!-- Bootstrap js-->
    <script src="https://themes.pixelstrap.net/multikit/assets/js/vendors/bootstrap/bootstrap.bundle.min.js"></script>

    <!-- swiper js -->
    <script src="https://themes.pixelstrap.net/multikit/assets/js/swiper-bundle.min.js"></script>
    <script src="https://themes.pixelstrap.net/multikit/assets/js/custom_swiper.js"></script>

    <!-- Theme js-->
    <script src="https://themes.pixelstrap.net/multikit/assets/js/script.js"></script>

    <!-- Theme Settings js-->
    <!-- <script src="https://themes.pixelstrap.net/multikit/assets/js/theme-setting.js"></script> -->
</body>

</html>