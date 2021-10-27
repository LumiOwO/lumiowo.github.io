function colortag() {
  $("ul.tag-list li").each(function () {
    let random = Math.floor(Math.random() * 6 + 1);
    if (random == 1) {
      $(this).find("a").addClass("tagred");
    } else if (random == 2) {
      $(this).find("a").addClass("tagorange");
    } else if (random == 3) {
      $(this).find("a").addClass("tagblue");
    } else if (random == 4) {
      $(this).find("a").addClass("taggreen");
    } else if (random == 5) {
      $(this).find("a").addClass("tagpurple");
    } else if (random == 6) {
      $(this).find("a").addClass("tagyellow");
    }
  });
}

colortag();

function colorcategory() {
  $("ul.category-list li").each(function () {
    let random = Math.floor(Math.random() * 6 + 1);
    if (random == 1) {
      $(this).find("a").addClass("categoryred");
    } else if (random == 2) {
      $(this).find("a").addClass("categoryorange");
    } else if (random == 3) {
      $(this).find("a").addClass("categoryblue");
    } else if (random == 4) {
      $(this).find("a").addClass("categorygreen");
    } else if (random == 5) {
      $(this).find("a").addClass("categorypurple");
    } else if (random == 6) {
      $(this).find("a").addClass("categoryyellow");
    }
  });
}

colorcategory();
