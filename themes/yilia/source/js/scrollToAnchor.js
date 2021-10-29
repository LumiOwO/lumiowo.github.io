let findPcHeadPosition = function (top) {
  // assume that we are not in the post page if no TOC link be found,
  // thus no need to update the status
  if ($(".toc-link").length === 0) {
    return false;
  }
  let list = $(".article-entry").find("h1,h2,h3,h4,h5,h6");
  let currentId = "";
  list.each(function () {
    if (top > $(this).position().top + $(this).offset().top) {
      currentId = "#" + $(this).attr("id");
    }
  });

  if (currentId === "") {
    $(".toc-link").removeClass("active");
    $('.toc-link[href="' + "#" + list.first().attr("id") + '"]').addClass("active");
  } else {
    let currentActive = $(".toc-link.active");
    if (currentActive.attr("href") !== currentId) {
      currentActive.removeClass("active");
      $('.toc-link[href="' + currentId + '"]').addClass("active");
    }
  }

  
};

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    // console.log("[id='" + this.getAttribute('href').substring(1) + "']")
    document
      .querySelector("[id='" + this.getAttribute("href").substring(1) + "']")
      .scrollIntoView({
        behavior: "smooth",
      });
  });
});
findPcHeadPosition($(this).scrollTop());

$("#container").scroll(function () {
  findPcHeadPosition($(this).scrollTop());
});
