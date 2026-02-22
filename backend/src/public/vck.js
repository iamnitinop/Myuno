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

    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function renderCampaigns(data) {
        var campaigns = data.campaigns || [];
        var abTests = data.abTests || [];

        if (!campaigns || campaigns.length === 0) return;

        // Apply A/B tests
        abTests.forEach(function (test) {
            var baselineCampaign = campaigns.find(function (c) { return c.id === test.baselineId; });
            if (!baselineCampaign) return;

            var cookieName = 'ju_ab_' + test.id;
            var assignedVariantId = getCookie(cookieName);

            // If not assigned yet, roll the dice
            if (!assignedVariantId) {
                var rand = Math.random() * 100;
                if (rand < test.baselinePercentage) {
                    assignedVariantId = test.baselineId;
                } else {
                    var currentP = test.baselinePercentage;
                    for (var i = 0; i < test.variants.length; i++) {
                        var v = test.variants[i];
                        currentP += v.percentage;
                        if (rand < currentP) {
                            if (v.bannerId === 'control') {
                                assignedVariantId = 'control';
                            } else {
                                assignedVariantId = v.bannerId;
                            }
                            break;
                        }
                    }
                    if (!assignedVariantId) assignedVariantId = test.baselineId; // fallback
                }
                setCookie(cookieName, assignedVariantId, 30);
            }

            // Apply the assignment map the campaigns list
            if (assignedVariantId === 'control') {
                // Remove baseline, they don't see anything
                campaigns = campaigns.filter(function (c) { return c.id !== test.baselineId; });
            } else if (assignedVariantId !== test.baselineId) {
                // Replace baseline with variant
                var variantCampaign = campaigns.find(function (c) { return c.id === assignedVariantId; });
                if (variantCampaign) {
                    var bIdx = campaigns.indexOf(baselineCampaign);
                    if (bIdx > -1) {
                        campaigns[bIdx] = variantCampaign; // Swap
                    }
                }
            }
        });

        // Simple renderer for now - picks the first generic popup to show
        var campaign = campaigns[0];
        if (!campaign) return;


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
