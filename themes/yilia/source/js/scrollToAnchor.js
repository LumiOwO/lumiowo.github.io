var findPcHeadPosition = function (top) {
  // assume that we are not in the post page if no TOC link be found,
  // thus no need to update the status
  if ($(".toc-link").length === 0) {
    return false;
  }
  var list = $(".article-entry").find("h1,h2,h3,h4,h5,h6");
  var currentId = "";
  list.each(function () {
    var head = $(this);
    if (top > head.position().top) {
      currentId = "#" + $(this).attr("id");
    }
  });

  if (currentId === "") {
    $(".toc-link").removeClass("active");
  }

  var currentActive = $(".toc-link.active");
  if (currentId && currentActive.attr("href") !== currentId) {
    $(".toc-link").removeClass("active");

    var _this = $('.toc-link[href="' + currentId + '"]');
    _this.addClass("active");
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

$("#container").scroll(function () {
  findPcHeadPosition($(this).scrollTop());
});
