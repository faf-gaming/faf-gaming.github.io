/**
 * Site-wide game search — all games from assets/data/games.json
 */
(function () {
    "use strict";

    var games = [];
    var loaded = false;
    var loading = null;
    var MAX_RESULTS = 60;

    function assetsPrefix() {
        var path = window.location.pathname.replace(/\\/g, "/");
        if (
            path.indexOf("/game/") !== -1 ||
            /\/(action|adventure|bike|car|idle|shooting|skill|sport|2-player-games|io-games|classroom-6x)\//.test(
                path
            )
        ) {
            return "../";
        }
        return "./";
    }

    function dataUrl() {
        return assetsPrefix() + "assets/data/games.json";
    }

    function gameHref(url) {
        var prefix = assetsPrefix();
        if (url.indexOf("game/") === 0) {
            return prefix + url;
        }
        return prefix + "game/" + url;
    }

    function loadGames() {
        if (loaded) {
            return Promise.resolve();
        }
        if (loading) {
            return loading;
        }
        loading = fetch(dataUrl())
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Failed to load games");
                }
                return response.json();
            })
            .then(function (data) {
                games = Array.isArray(data) ? data : [];
                loaded = true;
            })
            .catch(function (err) {
                console.error("Game search load error:", err);
                games = [];
            })
            .finally(function () {
                loading = null;
            });
        return loading;
    }

    function normalize(str) {
        return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    }

    function matchGame(game, query) {
        var q = normalize(query);
        if (!q) {
            return false;
        }
        var name = normalize(game.name);
        var slug = normalize(game.url.replace(/^game\//, "").replace(/\.html$/, ""));
        var keywords = normalize(game.keywords);
        var parts = q.split(/\s+/).filter(Boolean);

        return parts.every(function (part) {
            return (
                name.indexOf(part) !== -1 ||
                slug.indexOf(part) !== -1 ||
                keywords.indexOf(part) !== -1
            );
        });
    }

    function renderResults(query) {
        var gameList = document.getElementById("gameList");
        var gameSearch = document.getElementById("gameSearch");
        if (!gameList || !gameSearch) {
            return;
        }

        gameList.innerHTML = "";
        var q = (query || "").trim();

        if (!q) {
            gameList.style.display = "none";
            return;
        }

        gameList.style.display = "block";

        if (!loaded) {
            gameList.innerHTML = "<p>Loading games...</p>";
            loadGames().then(function () {
                renderResults(gameSearch.value);
            });
            return;
        }

        var results = games.filter(function (game) {
            return matchGame(game, q);
        });

        results.sort(function (a, b) {
            var ql = q.toLowerCase();
            var aName = a.name.toLowerCase();
            var bName = b.name.toLowerCase();
            var aStarts = aName.indexOf(ql) === 0 ? 0 : 1;
            var bStarts = bName.indexOf(ql) === 0 ? 0 : 1;
            if (aStarts !== bStarts) {
                return aStarts - bStarts;
            }
            return aName.localeCompare(bName);
        });

        results = results.slice(0, MAX_RESULTS);

        if (results.length === 0) {
            gameList.innerHTML = "<p>No results found</p>";
            return;
        }

        results.forEach(function (game) {
            var item = document.createElement("div");
            item.className = "game-item";
            var link = document.createElement("a");
            link.href = gameHref(game.url);
            link.textContent = game.name;
            item.appendChild(link);
            gameList.appendChild(item);
        });

        if (results.length === MAX_RESULTS) {
            var more = document.createElement("p");
            more.className = "search-more-hint";
            more.textContent =
                "Showing first " + MAX_RESULTS + " of " + games.length + " games — refine your search";
            gameList.appendChild(more);
        }
    }

    window.searchGames = function () {
        var gameSearch = document.getElementById("gameSearch");
        if (!gameSearch) {
            return;
        }
        renderResults(gameSearch.value);
    };

    document.addEventListener("DOMContentLoaded", function () {
        var gameSearch = document.getElementById("gameSearch");
        if (!gameSearch) {
            return;
        }

        loadGames();

        gameSearch.addEventListener("input", window.searchGames);

        gameSearch.setAttribute("placeholder", "Search 942 games");

        document.addEventListener("click", function (e) {
            var gameList = document.getElementById("gameList");
            if (!gameList) {
                return;
            }
            if (!e.target.closest("#gameSearch, #gameList")) {
                gameList.style.display = "none";
            }
        });
    });
})();
