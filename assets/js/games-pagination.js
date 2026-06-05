/**
 * Load-more + page controls for homepage/category game grids.
 */
(function () {
  "use strict";

  var PAGE_SIZE = 30;
  var MIN_FOR_PAGINATION = 31;
  var MAX_PAGE_BUTTONS = 7;

  function getItems(grid) {
    var list = Array.prototype.filter.call(grid.children, function (el) {
      return el.nodeType === 1 && el.classList.contains("games-item");
    });
    if (list.length) return list;
    return Array.prototype.slice.call(
      grid.querySelectorAll(":scope > .games-item")
    );
  }

  function setVisibleItems(items, shown, viewMode, pageIndex) {
    items.forEach(function (el, i) {
      var visible;
      if (viewMode === "page") {
        var start = (pageIndex - 1) * PAGE_SIZE;
        var end = pageIndex * PAGE_SIZE;
        visible = i >= start && i < end;
      } else {
        visible = i < shown;
      }
      el.classList.toggle("is-hidden", !visible);
    });
  }

  function destroyIsotope(grid) {
    try {
      if (window.jQuery && jQuery(grid).data("isotope")) {
        jQuery(grid).isotope("destroy");
      }
    } catch (e) { /* ignore */ }
  }

  function removeLegacyControls() {
    var legacy = document.getElementById("loadMoreWrap");
    if (legacy) legacy.remove();
  }

  function showAllInGrid(grid) {
    grid.classList.add("pagination-ready");
    getItems(grid).forEach(function (el) {
      el.classList.remove("is-hidden", "filter-hidden");
    });
  }

  function buildPageList(totalPages, currentPage) {
    if (totalPages <= MAX_PAGE_BUTTONS) {
      var all = [];
      for (var i = 1; i <= totalPages; i++) all.push(i);
      return all;
    }
    var list = [1];
    var left = Math.max(2, currentPage - 1);
    var right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) list.push("…");
    for (var p = left; p <= right; p++) list.push(p);
    if (right < totalPages - 1) list.push("…");
    list.push(totalPages);
    return list;
  }

  function initGrid(grid) {
    if (grid.getAttribute("data-paginated") === "1") return;
    if (grid.id === "gamesPopular" || grid.getAttribute("data-paginate") === "off") {
      showAllInGrid(grid);
      return;
    }

    var items = getItems(grid);
    if (items.length <= MIN_FOR_PAGINATION) {
      showAllInGrid(grid);
      return;
    }

    grid.setAttribute("data-paginated", "1");
    destroyIsotope(grid);
    grid.classList.add("games-grid-paginated");

    var shown = PAGE_SIZE;
    var currentPageIndex = 1;
    var viewMode = "cumulative";
    var totalPages = Math.ceil(items.length / PAGE_SIZE);

    var section = document.createElement("div");
    section.className = "faf-games-list-section";
    if (grid.parentNode) {
      grid.parentNode.insertBefore(section, grid);
    }
    section.appendChild(grid);

    var wrap = document.createElement("div");
    wrap.className = "faf-games-pagination";
    wrap.innerHTML =
      '<div class="faf-games-pagination__meta">' +
      '  <span class="faf-games-pagination__count" aria-live="polite"></span>' +
      '  <div class="faf-games-pagination__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Games loaded">' +
      '    <div class="faf-games-pagination__bar-fill"></div>' +
      "  </div>" +
      "</div>" +
      '<div class="faf-games-pagination__actions">' +
      '  <button type="button" class="faf-games-pagination__btn faf-games-pagination__btn--load">' +
      '    <span class="faf-games-pagination__btn-text">Load more games</span>' +
      '    <span class="faf-games-pagination__btn-icon" aria-hidden="true">↓</span>' +
      "  </button>" +
      '  <button type="button" class="faf-games-pagination__btn faf-games-pagination__btn--less" hidden>Show less</button>' +
      "</div>" +
      '<nav class="faf-games-pagination__pages" aria-label="Game list pages"></nav>';

    section.appendChild(wrap);

    var countEl = wrap.querySelector(".faf-games-pagination__count");
    var fillEl = wrap.querySelector(".faf-games-pagination__bar-fill");
    var barEl = wrap.querySelector(".faf-games-pagination__bar");
    var loadBtn = wrap.querySelector(".faf-games-pagination__btn--load");
    var lessBtn = wrap.querySelector(".faf-games-pagination__btn--less");
    var loadText = wrap.querySelector(".faf-games-pagination__btn-text");
    var pagesNav = wrap.querySelector(".faf-games-pagination__pages");

    function visibleCount() {
      if (viewMode === "page") {
        var start = (currentPageIndex - 1) * PAGE_SIZE;
        return Math.min(PAGE_SIZE, Math.max(0, items.length - start));
      }
      return Math.min(shown, items.length);
    }

    function apply() {
      setVisibleItems(items, shown, viewMode, currentPageIndex);
      grid.setAttribute("data-shown", String(visibleCount()));

      var visible = visibleCount();
      var pct = Math.min(100, Math.round((visible / items.length) * 100));
      countEl.textContent =
        viewMode === "page"
          ? "Page " +
            currentPageIndex +
            " of " +
            totalPages +
            " — " +
            visible +
            " games"
          : "Showing " + visible + " of " + items.length + " games";
      fillEl.style.width = pct + "%";
      barEl.setAttribute("aria-valuenow", String(pct));

      if (viewMode === "cumulative") {
        var remaining = items.length - shown;
        if (remaining > 0) {
          loadBtn.hidden = false;
          lessBtn.hidden = true;
          loadText.textContent =
            "Load " + Math.min(PAGE_SIZE, remaining) + " more games";
          loadBtn.disabled = false;
        } else {
          loadBtn.hidden = true;
          lessBtn.hidden = false;
        }
      } else {
        loadBtn.hidden = currentPageIndex >= totalPages;
        lessBtn.hidden = currentPageIndex <= 1;
        if (!loadBtn.hidden) {
          loadText.textContent = "Load next page";
        }
      }

      renderPageNav();
    }

    function renderPageNav() {
      if (totalPages <= 1) {
        pagesNav.hidden = true;
        return;
      }
      pagesNav.hidden = false;
      var cp = currentPageIndex;
      var parts = buildPageList(totalPages, cp);
      pagesNav.innerHTML = "";

      var prev = document.createElement("button");
      prev.type = "button";
      prev.className =
        "faf-games-pagination__page-btn faf-games-pagination__page-btn--nav";
      prev.textContent = "‹";
      prev.setAttribute("aria-label", "Previous page");
      prev.disabled = cp <= 1;
      prev.addEventListener("click", function () {
        viewMode = "page";
        currentPageIndex = Math.max(1, cp - 1);
        apply();
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pagesNav.appendChild(prev);

      parts.forEach(function (part) {
        if (part === "…") {
          var ell = document.createElement("span");
          ell.className = "faf-games-pagination__ellipsis";
          ell.textContent = "…";
          pagesNav.appendChild(ell);
          return;
        }
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "faf-games-pagination__page-btn";
        btn.textContent = String(part);
        btn.setAttribute("aria-label", "Page " + part);
        if (part === cp) {
          btn.classList.add("is-active");
          btn.setAttribute("aria-current", "page");
          btn.disabled = true;
        } else {
          (function (pageNum) {
            btn.addEventListener("click", function () {
              viewMode = "page";
              currentPageIndex = pageNum;
              shown = Math.min(pageNum * PAGE_SIZE, items.length);
              apply();
              section.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          })(part);
        }
        pagesNav.appendChild(btn);
      });

      var next = document.createElement("button");
      next.type = "button";
      next.className =
        "faf-games-pagination__page-btn faf-games-pagination__page-btn--nav";
      next.textContent = "›";
      next.setAttribute("aria-label", "Next page");
      next.disabled = cp >= totalPages;
      next.addEventListener("click", function () {
        viewMode = "page";
        currentPageIndex = Math.min(totalPages, cp + 1);
        shown = Math.min(currentPageIndex * PAGE_SIZE, items.length);
        apply();
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pagesNav.appendChild(next);
    }

    loadBtn.addEventListener("click", function (e) {
      e.preventDefault();
      viewMode = "cumulative";
      if (shown < items.length) {
        shown = Math.min(shown + PAGE_SIZE, items.length);
      }
      currentPageIndex = Math.max(1, Math.ceil(shown / PAGE_SIZE));
      apply();
    });

    lessBtn.addEventListener("click", function (e) {
      e.preventDefault();
      viewMode = "cumulative";
      shown = PAGE_SIZE;
      currentPageIndex = 1;
      apply();
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* Hide extra games before pagination-ready (stops CSS from showing all 800+) */
    setVisibleItems(items, shown, "cumulative", 1);
    grid.classList.add("pagination-ready");
    apply();
  }

  function initDesktopMobileFilter() {
    var filterBar = document.querySelector(".projectFilter");
    if (!filterBar) return;

    filterBar.addEventListener("click", function (e) {
      var link = e.target.closest("a[data-filter]");
      if (!link) return;
      e.preventDefault();

      var links = filterBar.querySelectorAll("a[data-filter]");
      for (var i = 0; i < links.length; i++) {
        links[i].classList.remove("current");
      }
      link.classList.add("current");

      var selector = link.getAttribute("data-filter");
      document
        .querySelectorAll(".games-masonary .gamesContainer > .games-item")
        .forEach(function (item) {
          if (item.classList.contains("is-hidden")) return;
          var show =
            selector === "*" ||
            (selector === ".mobile" && item.classList.contains("mobile")) ||
            (selector === ".desktop" && item.classList.contains("desktop"));
          item.classList.toggle("filter-hidden", !show);
        });
    });
  }

  function boot() {
    removeLegacyControls();
    var grids = document.querySelectorAll(".games-masonary .gamesContainer");
    for (var i = 0; i < grids.length; i++) {
      initGrid(grids[i]);
    }
    initDesktopMobileFilter();
  }

  function scheduleBoot() {
    boot();
    /* Re-apply after other scripts (isotope, filters) on window load */
    window.addEventListener("load", function () {
      var grids = document.querySelectorAll(".games-masonary .gamesContainer");
      for (var i = 0; i < grids.length; i++) {
        var grid = grids[i];
        if (grid.getAttribute("data-paginated") !== "1") continue;
        if (grid.id === "gamesPopular" || grid.getAttribute("data-paginate") === "off") {
          continue;
        }
        var items = getItems(grid);
        var shown = parseInt(grid.getAttribute("data-shown") || String(PAGE_SIZE), 10);
        if (!shown || shown < PAGE_SIZE) shown = PAGE_SIZE;
        setVisibleItems(items, shown, "cumulative", 1);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleBoot);
  } else {
    scheduleBoot();
  }
})();
