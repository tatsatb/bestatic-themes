window.addEventListener('scroll', function() {
    var navbar = document.getElementById('navbardemo');
    var navlinks = document.getElementsByClassName('nav-link');
    
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
        // Loop through all nav-links
        for (var i = 0; i < navlinks.length; i++) {
            navlinks[i].classList.add('nav-link-scrolled');
        }
    } else {
        navbar.classList.remove('navbar-scrolled');
        // Loop through all nav-links
        for (var i = 0; i < navlinks.length; i++) {
            navlinks[i].classList.remove('nav-link-scrolled');
        }
    }
});