function topNav() {
    var x = document.getElementById("topNav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
    var y = document.getElementById("topNavCenter")
    if (y.className === "topnav-center") {
        y.className = "";
    } else {
        y.className = "topnav-center";
    }
}