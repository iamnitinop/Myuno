(function () {
    var accountId = window.ju_num;
    if (!accountId) return;

    var API_URL = "https://web-production-75bfb.up.railway.app";
    // var API_URL = "http://localhost:3001"; // Uncomment for local dev

    function loadCampaigns() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", API_URL + "/campaigns/public?accountId=" + accountId);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    renderCampaigns(data);
                } catch (e) {
                    console.error("Justuno: Failed to parse campaigns", e);
                }
            }
        };
        xhr.send();
    }

    function renderCampaigns(campaigns) {
        if (!campaigns || campaigns.length === 0) return;

        // Simple renderer for now - picks the first generic popup to show
        // In a real app, this would handle triggers, rules, etc.
        var campaign = campaigns[0];

        // Inject styles
        var style = document.createElement("style");
        style.innerHTML = `
            #ju-container {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.5);
                z-index: 2147483647;
                display: flex; justify-content: center; align-items: center;
                opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
            }
            #ju-container.ju-visible { opacity: 1; pointer-events: auto; }
            #ju-content {
                background: white; padding: 20px; border-radius: 8px; position: relative;
                max-width: 90%; max-height: 90%; overflow: auto;
            }
            #ju-close {
                position: absolute; top: 10px; right: 10px; cursor: pointer; font-family: sans-serif;
            }
        `;
        document.head.appendChild(style);

        // Inject HTML
        var container = document.createElement("div");
        container.id = "ju-container";

        var content = document.createElement("div");
        content.id = "ju-content";

        // Parse creative JSON to simple HTML (Mock rendering)
        var htmlContent = "<div style='padding: 20px;'><h1>" + campaign.name + "</h1><p>This is a test campaign.</p></div>";
        // If you have actual HTML in creativeJson, use it:
        // if (campaign.creativeJson && campaign.creativeJson.html) htmlContent = campaign.creativeJson.html; 

        content.innerHTML = htmlContent;

        var close = document.createElement("div");
        close.id = "ju-close";
        close.innerHTML = "✕";
        close.onclick = function () {
            container.classList.remove("ju-visible");
            setTimeout(function () { container.remove(); }, 300);
        };

        content.appendChild(close);
        container.appendChild(content);
        document.body.appendChild(container);

        // Show after a delay (mock trigger)
        setTimeout(function () {
            container.classList.add("ju-visible");
        }, 1000);
    }

    // Init
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadCampaigns);
    } else {
        loadCampaigns();
    }

    // Expose public API
    window.BannerRuntime = {
        init: function (opts) {
            if (opts.account) accountId = opts.account;
            loadCampaigns();
        }
    };
})();
