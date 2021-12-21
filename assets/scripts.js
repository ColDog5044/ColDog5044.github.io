function topNav() {
    var x = document.getElementById("topNav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
    var y = document.getElementById("rightLinks")
    if (y.className === "rightlinks") {
        y.className = "leftlinks";
    } else {
        y.className = "rightlinks";
    }
  }