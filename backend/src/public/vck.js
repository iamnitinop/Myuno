(function () {
    var accountId = window.ju_num;
    if (!accountId) return;

    // Use the same host that served vck.js — works for both local and production
    var API_URL = (window.asset_host || "https://web-production-75bfb.up.railway.app/").replace(/\/$/, "");

    function loadCampaigns() {
        var xhr = new XMLHttpRequest();
        var url = window.ju_campaign
            ? API_URL + "/campaigns/preview?campaignId=" + window.ju_campaign
            : API_URL + "/campaigns/public?accountId=" + accountId;
        xhr.open("GET", url);
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
        document.cookie = cname + "=" + cvalue + ";expires=" + d.toUTCString() + ";path=/";
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) === 0) return c.substring(name.length);
        }
        return "";
    }

    function applyStyles(el, styles) {
        if (!styles) return;
        for (var k in styles) {
            if (Object.prototype.hasOwnProperty.call(styles, k)) {
                try { el.style[k] = styles[k]; } catch (e) {}
            }
        }
    }

    // Calculate the design canvas width from the layer extents
    function getDesignWidth(layers, fallback) {
        var max = fallback || 0;
        layers.forEach(function (l) {
            var right = l.position.x + l.size.width;
            if (right > max) max = right;
        });
        return max || 1200;
    }

    // renderLayer — for top_bar pass designWidth so x/width become percentages
    function renderLayer(layer, closeFn, designWidth) {
        var el = document.createElement("div");
        el.style.position = "absolute";

        if (designWidth) {
            // Percentage-based horizontal positioning → scales to any viewport width
            el.style.left  = (layer.position.x / designWidth * 100) + "%";
            el.style.width = (layer.size.width  / designWidth * 100) + "%";
        } else {
            el.style.left  = layer.position.x   + "px";
            el.style.width = layer.size.width    + "px";
        }

        el.style.top    = layer.position.y  + "px";
        el.style.height = layer.size.height + "px";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.overflow = "hidden";
        el.style.boxSizing = "border-box";
        applyStyles(el, layer.style);

        switch (layer.type) {
            case "text":
                el.innerHTML = layer.content || "";
                break;

            case "image":
                var img = document.createElement("img");
                img.src = layer.content || "";
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "cover";
                img.style.display = "block";
                el.appendChild(img);
                break;

            case "button":
                el.style.cursor = "pointer";
                el.innerHTML = layer.content || "";
                el.style.userSelect = "none";
                (function (ctaUrl) {
                    el.onclick = function (e) {
                        e.stopPropagation();
                        if (ctaUrl) window.open(ctaUrl, "_blank");
                    };
                })(layer.metadata && layer.metadata.ctaUrl);
                break;

            case "close_button":
                el.style.cursor = "pointer";
                el.innerHTML = layer.content || "X";
                el.style.userSelect = "none";
                el.onclick = function (e) {
                    e.stopPropagation();
                    closeFn();
                };
                break;

            default:
                el.innerHTML = layer.content || "";
        }

        return el;
    }

    function renderBanner(campaign) {
        var creative = campaign.creativeJson;
        if (!creative || !creative.views) {
            console.warn("Justuno: campaign has no creativeJson", campaign.id);
            return;
        }

        var isMobile = window.innerWidth < 768;
        var view = (isMobile && creative.views.mobile) ? creative.views.mobile : creative.views.desktop;
        if (!view || !view.layers) return;

        // Email-capture banners stay as centered modals; all other banners
        // render at the top of the page and push site content down.
        var hasEmailForm = view.layers.some(function (l) {
            return l && (l.type === "email_form" || l.type === "sms_signup");
        });
        var renderMode = hasEmailForm ? "email_modal" : "top_stack";

        // Derive design canvas width so layers scale to viewport width
        var designWidth = (renderMode === "top_stack")
            ? getDesignWidth(view.layers, view.width || 0)
            : null;

        // --- CSS ---
        var styleEl = document.createElement("style");
        styleEl.innerHTML = [
            "#ju-wrapper{z-index:2147483647;}",
            "#ju-wrapper.ju-email-modal{position:fixed;top:0;left:0;width:100vw;height:100vh;",
            "background:rgba(0,0,0,0.5);display:flex;justify-content:center;",
            "align-items:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;}",
            "#ju-wrapper.ju-email-modal.ju-visible{opacity:1;pointer-events:auto;}",
            "#ju-wrapper.ju-top-stack{position:sticky;top:0;width:100%;",
            "opacity:0;transition:opacity 0.35s ease;pointer-events:auto;}",
            "#ju-wrapper.ju-top-stack.ju-visible{opacity:1;}",
            "#ju-banner{position:relative;overflow:hidden;}",
        ].join("");
        document.head.appendChild(styleEl);

        var wrapper = document.createElement("div");
        wrapper.id = "ju-wrapper";

        var banner = document.createElement("div");
        banner.id = "ju-banner";
        banner.style.position = "relative";
        banner.style.overflow = "hidden";
        banner.style.background = view.background || "transparent";
        banner.style.height = view.height + "px";

        if (view.borderRadius) banner.style.borderRadius = view.borderRadius + "px";
        if (view.boxShadow)    banner.style.boxShadow    = view.boxShadow;
        if (view.borderWidth) {
            banner.style.borderWidth = view.borderWidth + "px";
            banner.style.borderStyle = view.borderStyle || "solid";
            banner.style.borderColor = view.borderColor || "#000";
        }

        function closeBanner() {
            wrapper.classList.remove("ju-visible");
            setTimeout(function () { wrapper.remove(); styleEl.remove(); }, 400);
        }

        // Render layers — pass designWidth so top-stack layers scale to viewport
        view.layers.forEach(function (layer) {
            if (layer.visible === false) return;
            banner.appendChild(renderLayer(layer, closeBanner, designWidth));
        });

        if (renderMode === "top_stack") {
            wrapper.classList.add("ju-top-stack");
            banner.style.width = "100%";
            wrapper.appendChild(banner);
            // Insert at the very top of <body> so it pushes site content (header, etc.) down
            if (document.body.firstChild) {
                document.body.insertBefore(wrapper, document.body.firstChild);
            } else {
                document.body.appendChild(wrapper);
            }
        } else {
            wrapper.classList.add("ju-email-modal");
            var modalWidth = view.width || getDesignWidth(view.layers, 0);
            if (modalWidth) banner.style.width = modalWidth + "px";
            wrapper.appendChild(banner);
            wrapper.onclick = function (e) {
                if (e.target === wrapper) closeBanner();
            };
            document.body.appendChild(wrapper);
        }

        setTimeout(function () {
            wrapper.classList.add("ju-visible");
        }, 1000);
    }

    function renderCampaigns(data) {
        var campaigns = data.campaigns || [];
        var abTests = data.abTests || [];

        if (!campaigns.length) return;

        // Apply A/B tests
        abTests.forEach(function (test) {
            var baselineCampaign = campaigns.find(function (c) { return c.id === test.baselineId; });
            if (!baselineCampaign) return;

            var cookieName = "ju_ab_" + test.id;
            var assignedVariantId = getCookie(cookieName);

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
                            assignedVariantId = v.bannerId === "control" ? "control" : v.bannerId;
                            break;
                        }
                    }
                    if (!assignedVariantId) assignedVariantId = test.baselineId;
                }
                setCookie(cookieName, assignedVariantId, 30);
            }

            if (assignedVariantId === "control") {
                campaigns = campaigns.filter(function (c) { return c.id !== test.baselineId; });
            } else if (assignedVariantId !== test.baselineId) {
                var variantCampaign = campaigns.find(function (c) { return c.id === assignedVariantId; });
                if (variantCampaign) {
                    var bIdx = campaigns.indexOf(baselineCampaign);
                    if (bIdx > -1) campaigns[bIdx] = variantCampaign;
                }
            }
        });

        var campaign = campaigns[0];
        if (campaign) renderBanner(campaign);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadCampaigns);
    } else {
        loadCampaigns();
    }

    window.BannerRuntime = {
        init: function (opts) {
            if (opts && opts.account) accountId = opts.account;
            loadCampaigns();
        }
    };
})();
