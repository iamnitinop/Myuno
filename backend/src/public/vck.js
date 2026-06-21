(function () {
    var accountId = window.ju_num;
    if (!accountId) return;

    // Use the same host that served vck.js — works for both local and production
    var API_URL = (window.asset_host || "https://web-production-75bfb.up.railway.app/").replace(/\/$/, "");

    // ===================================================================
    // Targeting rule engine (ported from dashboard/src/lib/runtime.ts)
    // ===================================================================
    var FIRST_URL_SESSION_KEY = "demo_first_url_session";
    var FIRST_URL_ALLTIME_KEY = "demo_first_url_alltime";

    function safeStore(s) {
        return {
            getItem: function (k) { try { return s.getItem(k); } catch (e) { return null; } },
            setItem: function (k, v) { try { s.setItem(k, v); } catch (e) {} }
        };
    }
    var STORAGE = { session: safeStore(window.sessionStorage), local: safeStore(window.localStorage) };

    function ensureFirstUrls(url) {
        if (!STORAGE.session.getItem(FIRST_URL_SESSION_KEY)) STORAGE.session.setItem(FIRST_URL_SESSION_KEY, String(url || ""));
        if (!STORAGE.local.getItem(FIRST_URL_ALLTIME_KEY)) STORAGE.local.setItem(FIRST_URL_ALLTIME_KEY, String(url || ""));
    }

    function getHostSafe(u) { try { return new URL(u).host || ""; } catch (e) { return ""; } }

    function matchString(hay, op, needle) {
        hay = String(hay == null ? "" : hay);
        needle = String(needle == null ? "" : needle);
        if (op === "equals" || op === "is_equal_to") return hay === needle;
        if (op === "is_not_equal_to") return hay !== needle;
        if (op === "starts_with") return hay.indexOf(needle) === 0;
        if (op === "contains") return hay.indexOf(needle) !== -1;
        if (op === "does_not_contain") return hay.indexOf(needle) === -1;
        if (op === "matches_regex") { try { return new RegExp(needle).test(hay); } catch (e) { return false; } }
        if (op === "matches_wildcard") {
            try {
                var rx = needle.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
                return new RegExp("^" + rx + "$").test(hay);
            } catch (e) { return false; }
        }
        return false;
    }

    function checkUrlRules(url, rules) {
        if (!rules || !rules.length) return true;
        return rules.some(function (r) { return matchString(url, r.op, r.value); });
    }

    function checkTrafficSource(referrer, sources) {
        if (!sources) return false;
        if (sources.all) return true;
        var ref = String(referrer || "").toLowerCase();
        var isGoogle = ref.indexOf("google.") !== -1;
        var isFacebook = ref.indexOf("facebook.com") !== -1 || ref.indexOf("fb.com") !== -1;
        if (sources.googleOrganic && isGoogle && ref.indexOf("aclk") === -1) return true;
        if (sources.googleAdwords && isGoogle && ref.indexOf("aclk") !== -1) return true;
        if (sources.facebook && isFacebook) return true;
        if (sources.others && !isGoogle && !isFacebook) return true;
        return false;
    }

    function evalCond(c, ctx) {
        var v = "";
        if (c.type === "current_url") v = ctx.url;
        else if (c.type === "referring_url") v = ctx.referrer;
        else if (c.type === "first_url" || c.type === "first_url_session") v = ctx.firstUrlSession;
        else if (c.type === "first_url_all_time") v = ctx.firstUrlAllTime;
        else if (c.type === "previous_domain_referring_url") v = getHostSafe(ctx.referrer);
        return matchString(v, c.operator, c.value);
    }

    function evalAdvanced(rules, id, ctx) {
        var config = rules.config;
        var shownKey = "banner_shown_" + id;
        var closedKey = "banner_closed_" + id;

        if (config) {
            if (config.trigger && config.trigger.type === "after_pages") {
                var views = Number(ctx.storage.session.getItem("page_views") || 1);
                if (views < (config.trigger.value || 0)) return false;
            }
            if (config.pageRules) {
                if (config.pageRules.showOn && config.pageRules.showOn.mode === "others") {
                    if (!checkUrlRules(ctx.url, config.pageRules.showOn.urls)) return false;
                }
                var dso = config.pageRules.dontShowOn;
                if (dso && dso.urls && dso.urls.length && dso.urls[0].value) {
                    if (checkUrlRules(ctx.url, dso.urls)) return false;
                }
            }
            if (config.stopShowing) {
                if (config.stopShowing.never) return false;
                if (config.stopShowing.afterClosedThisVisit && ctx.storage.session.getItem(closedKey)) return false;
                if (config.stopShowing.afterShownVisit && config.stopShowing.afterShownVisit.enabled) {
                    if (Number(ctx.storage.session.getItem(shownKey + "_count") || 0) >= config.stopShowing.afterShownVisit.times) return false;
                }
                if (config.stopShowing.afterShownEver && config.stopShowing.afterShownEver.enabled) {
                    if (Number(ctx.storage.local.getItem(shownKey + "_count") || 0) >= config.stopShowing.afterShownEver.times) return false;
                }
            }
            if (config.frequency) {
                if (config.frequency.oncePerSession && ctx.storage.session.getItem(shownKey)) return false;
                if (config.frequency.onceEver && ctx.storage.local.getItem(shownKey)) return false;
                if (config.frequency.againEveryXDays && config.frequency.againEveryXDays.enabled) {
                    var last = ctx.storage.local.getItem(shownKey);
                    if (last && (Date.now() - Number(last)) / 86400000 < config.frequency.againEveryXDays.days) return false;
                }
            }
            if (config.audience) {
                var fv = ctx.storage.local.getItem("first_visit_ts");
                var isNew = !fv;
                if (config.audience.mode === "new" && !isNew) return false;
                if (config.audience.mode === "returning") {
                    if (isNew) return false;
                    if (fv && (Date.now() - Number(fv)) / 86400000 < (config.audience.returningSinceDays || 0)) return false;
                }
            }
            if (config.trafficSource) {
                if (config.trafficSource.showFrom && !config.trafficSource.showFrom.all) {
                    if (!checkTrafficSource(ctx.referrer, config.trafficSource.showFrom)) return false;
                }
                var ds = config.trafficSource.dontShowFrom;
                if (ds && (ds.email || ds.facebook || ds.googleOrganic || ds.googleAdwords || ds.others)) {
                    if (checkTrafficSource(ctx.referrer, ds)) return false;
                }
            }
        }

        return evalRuleGroups(rules, ctx);
    }

    // Evaluate the Rule Builder's condition groups (top-level OR across groups).
    function evalRuleGroups(rules, ctx) {
        if (!rules.ruleGroups || !rules.ruleGroups.length) return true;
        for (var i = 0; i < rules.ruleGroups.length; i++) {
            var grp = rules.ruleGroups[i];
            if (!grp.conditions || !grp.conditions.length) return true;
            var res = grp.conditionOperator === "OR"
                ? grp.conditions.some(function (c) { return evalCond(c, ctx); })
                : grp.conditions.every(function (c) { return evalCond(c, ctx); });
            if (res) return true;
        }
        return false;
    }

    function evalLegacy(rules, id, ctx) {
        var conds = rules.conditions || [];
        for (var i = 0; i < conds.length; i++) {
            var c = conds[i];
            var type = c.type === "url" ? "current_url" : c.type;
            if (type === "current_url" && !matchString(ctx.url, c.op, c.value || "")) return false;
            if (type === "referring_url" && !matchString(ctx.referrer, c.op, c.value || "")) return false;
            if (type === "previous_domain_referring_url" && !matchString(getHostSafe(ctx.referrer), c.op, c.value || "")) return false;
            if (type === "first_url_session" && !matchString(ctx.firstUrlSession, c.op, c.value || "")) return false;
            if (type === "first_url_all_time" && !matchString(ctx.firstUrlAllTime, c.op, c.value || "")) return false;
            if (type === "device" && c.op === "equals" && ctx.device !== c.value) return false;
            if (type === "frequency") {
                var key = "banner_shown_" + id;
                if (c.op === "once_per_session" && ctx.storage.session.getItem(key)) return false;
                if (c.op === "once_per_day") {
                    var today = new Date().toISOString().slice(0, 10);
                    if (ctx.storage.local.getItem(key) === today) return false;
                }
            }
        }
        return true;
    }

    // Returns true if the banner should show for this visitor.
    // rulesOnly=true (global banners): honor only the Rule Builder condition groups /
    // legacy conditions, ignoring the advanced config gates (audience/traffic/frequency/…)
    // which the global-banner UI never exposes.
    function evaluateRules(rules, id, ctx, rulesOnly) {
        if (!rules || rules.enabled === false) return true; // no/disabled targeting → always eligible
        ctx.firstUrlSession = ctx.storage.session.getItem(FIRST_URL_SESSION_KEY) || "";
        ctx.firstUrlAllTime = ctx.storage.local.getItem(FIRST_URL_ALLTIME_KEY) || "";
        if (rulesOnly) {
            if (rules.ruleGroups && rules.ruleGroups.length) return evalRuleGroups(rules, ctx);
            if (rules.conditions) return evalLegacy(rules, id, ctx);
            return true;
        }
        if (rules.config || rules.ruleGroups) return evalAdvanced(rules, id, ctx);
        if (rules.conditions) return evalLegacy(rules, id, ctx);
        return true;
    }

    function markShown(id) {
        var shownKey = "banner_shown_" + id;
        var ts = Date.now();
        STORAGE.session.setItem(shownKey + "_count", String(Number(STORAGE.session.getItem(shownKey + "_count") || 0) + 1));
        STORAGE.session.setItem(shownKey, String(ts));
        STORAGE.local.setItem(shownKey + "_count", String(Number(STORAGE.local.getItem(shownKey + "_count") || 0) + 1));
        STORAGE.local.setItem(shownKey, String(ts));
        if (!STORAGE.local.getItem("first_visit_ts")) STORAGE.local.setItem("first_visit_ts", String(ts));
    }

    function buildContext() {
        var url = location.href;
        ensureFirstUrls(url);
        return {
            url: url,
            referrer: document.referrer || "",
            device: window.innerWidth < 768 ? "mobile" : "desktop",
            storage: STORAGE
        };
    }

    // ===================================================================
    // Shopify actions: coupon apply + add-to-cart
    // ===================================================================
    function applyCoupon(code) {
        if (!code) return;
        try { fetch("/discount/" + encodeURIComponent(String(code).trim()), { credentials: "include" }).catch(function () {}); } catch (e) {}
    }

    function addToCart(variantId, quantity, afterAction) {
        var ids = String(variantId).split(",").map(function (s) { return s.trim(); }).filter(Boolean);
        if (!ids.length) return;
        var qty = Number(quantity) || 1;
        var items = ids.map(function (id) { return { id: /^\d+$/.test(id) ? Number(id) : id, quantity: qty }; });
        try {
            fetch("/cart/add.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: items })
            }).then(function () {
                if (afterAction === "checkout") window.location.href = "/checkout";
                else if (afterAction === "cart") window.location.href = "/cart";
            }).catch(function () {});
        } catch (e) {}
    }

    function handleCta(meta) {
        meta = meta || {};
        if (meta.action === "add_to_cart" && meta.variantId) {
            addToCart(meta.variantId, meta.quantity, meta.afterAction);
            if (meta.couponCode) applyCoupon(meta.couponCode);
        } else if (meta.ctaUrl) {
            if (meta.ctaNewTab === false) window.location.href = meta.ctaUrl;
            else window.open(meta.ctaUrl, "_blank");
        }
    }

    // ===================================================================
    // Loaders
    // ===================================================================
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

    // Determine the current page handle (Shopify /pages/<handle>, /products/<handle>, etc.)
    function getPageHandle() {
        if (window.ju_handle) return String(window.ju_handle).trim().toLowerCase();
        try {
            var path = (location.pathname || "").split("?")[0].split("#")[0];
            var parts = path.split("/").filter(function (p) { return p && p.length; });
            return parts.length ? parts[parts.length - 1].trim().toLowerCase() : "";
        } catch (e) {
            return "";
        }
    }

    // Replace the designated layer's content (text HTML or image URL) with sheet data.
    function injectLayerContent(creative, layerId, value) {
        if (!creative || !creative.views || !layerId) return creative;
        ["desktop", "mobile"].forEach(function (k) {
            var view = creative.views[k];
            if (!view || !view.layers) return;
            view.layers.forEach(function (layer) {
                if (layer && layer.id === layerId) layer.content = value;
            });
        });
        return creative;
    }

    // Force the offer heading/body colors regardless of the sheet HTML's inline styles.
    function applyOfferColorStyle(style) {
        if (!style) return;
        var css = "";
        if (style.headingColor) {
            css += "#ju-banner h1,#ju-banner h2,#ju-banner h3,#ju-banner h1 *,#ju-banner h2 *,#ju-banner h3 *{color:" + style.headingColor + " !important;}";
        }
        if (style.bodyColor) {
            css += "#ju-banner p,#ju-banner p *{color:" + style.bodyColor + " !important;}";
        }
        if (!css) return;
        var s = document.createElement("style");
        s.innerHTML = css;
        document.head.appendChild(s);
    }

    // Fetch all candidate global banners, evaluate targeting rules client-side,
    // and render the first eligible one. Falls back via onNone() if none match.
    function loadGlobalBanners(onNone) {
        var handle = getPageHandle();
        var xhr = new XMLHttpRequest();
        xhr.open("GET", API_URL + "/global-banner/runtime?accountId=" + encodeURIComponent(accountId) + "&handle=" + encodeURIComponent(handle));
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            var handled = false;
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    var banners = (data && data.banners) || [];
                    var ctx = buildContext();
                    for (var i = 0; i < banners.length; i++) {
                        var b = banners[i];
                        if (!b) continue;
                        if (!evaluateRules(b.rulesJson, b.id, ctx, true)) continue;
                        if (b.layoutJson && b.layoutJson.bar && b.layoutJson.containers) {
                            // New container-based responsive flex layout.
                            renderContainerBanner({ id: b.id, name: b.name }, b.layoutJson, b.offerHtml || "", b.offerImageUrl || "");
                        } else if (b.creativeJson) {
                            // Legacy absolute-layer layout.
                            var creative = injectLayerContent(b.creativeJson, b.offerLayerId, b.offerHtml || "");
                            if (b.offerImageLayerId && b.offerImageUrl) {
                                creative = injectLayerContent(creative, b.offerImageLayerId, b.offerImageUrl);
                            }
                            renderBanner({ id: b.id, name: b.name, creativeJson: creative });
                            applyOfferColorStyle(b.style);
                        } else {
                            continue;
                        }
                        markShown(b.id);
                        handled = true;
                        break;
                    }
                } catch (e) {
                    console.error("Justuno: failed to parse global banners", e);
                }
            }
            if (!handled) onNone();
        };
        xhr.onerror = function () { onNone(); };
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
            var right = (l.position ? l.position.x : 0) + (l.size ? l.size.width : 0);
            if (right > max) max = right;
        });
        return max || 1200;
    }

    // renderLayer — for top_bar pass designWidth so x/width become percentages
    function renderLayer(layer, closeFn, designWidth) {
        var el = document.createElement("div");
        el.style.position = "absolute";

        if (designWidth) {
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
                (function (meta) {
                    el.onclick = function (e) {
                        e.stopPropagation();
                        handleCta(meta);
                    };
                })(layer.metadata || {});
                break;

            case "coupon_box":
                el.style.cursor = "pointer";
                el.style.userSelect = "all";
                el.innerHTML = layer.content || (layer.metadata && layer.metadata.couponCode) || "";
                (function (code) {
                    el.onclick = function (e) {
                        e.stopPropagation();
                        if (!code) return;
                        try { navigator.clipboard.writeText(code); } catch (_) {}
                        applyCoupon(code);
                    };
                })((layer.metadata && layer.metadata.couponCode) || layer.content);
                break;

            case "close_button":
                el.style.cursor = "pointer";
                el.innerHTML = layer.content || "X";
                el.style.userSelect = "none";
                el.setAttribute("role", "button");
                el.setAttribute("tabindex", "0");
                el.setAttribute("aria-label", "Close announcement");
                el.onclick = function (e) {
                    e.stopPropagation();
                    closeFn();
                };
                el.onkeydown = function (e) {
                    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                        e.preventDefault();
                        closeFn();
                    }
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

        // Don't reshow a banner the visitor has dismissed (persists across refreshes).
        if (campaign.id) {
            try { if (window.localStorage.getItem("ju_dismissed_" + campaign.id)) return; } catch (e) {}
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

        var designWidth = (renderMode === "top_stack")
            ? getDesignWidth(view.layers, view.width || 0)
            : null;

        var reduceMotion = false;
        try { reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
        var EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // ease-out
        var DURATION = 520; // ms (within 400–600ms)

        var styleEl = document.createElement("style");
        styleEl.innerHTML = [
            "#ju-wrapper{z-index:2147483647;}",
            "#ju-wrapper.ju-email-modal{position:fixed;top:0;left:0;width:100vw;height:100vh;",
            "background:rgba(0,0,0,0.5);display:flex;justify-content:center;",
            "align-items:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;}",
            "#ju-wrapper.ju-email-modal.ju-visible{opacity:1;pointer-events:auto;}",
            "#ju-wrapper.ju-top-stack{width:100%;overflow:hidden;}",
            "#ju-banner{position:relative;overflow:hidden;}",
        ].join("");
        document.head.appendChild(styleEl);

        var wrapper = document.createElement("div");
        wrapper.id = "ju-wrapper";
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute("aria-label", "Site announcement");
        if (campaign.name) wrapper.setAttribute("data-ju-banner", campaign.name);
        if (campaign.id) wrapper.setAttribute("data-ju-id", campaign.id);

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

        // Expose the banner height as a CSS var so a sticky/fixed header can offset
        // itself with: header{ top: var(--ju-banner-height,0px); transition: top .5s; }
        function setHeaderOffset(px) {
            try { document.documentElement.style.setProperty("--ju-banner-height", px + "px"); } catch (e) {}
        }

        var closed = false;
        var origBodyPad = 0;   // body padding-top before we pushed content down
        var bannerH = 0;       // measured banner height
        function restoreBodyPad(animate) {
            var bs = document.body.style;
            if (animate && !reduceMotion) bs.transition = "padding-top " + DURATION + "ms " + EASE;
            bs.paddingTop = origBodyPad + "px";
        }
        function closeBanner() {
            if (closed) return;
            closed = true;
            if (campaign.id) {
                STORAGE.session.setItem("banner_closed_" + campaign.id, "1");
                try { window.localStorage.setItem("ju_dismissed_" + campaign.id, "1"); } catch (e) {}
            }
            if (renderMode !== "top_stack") {
                wrapper.classList.remove("ju-visible");
                setTimeout(function () { wrapper.remove(); styleEl.remove(); }, 350);
                return;
            }
            // Slide the fixed bar back up; let the page content settle to the top.
            setHeaderOffset(0);
            restoreBodyPad(true);
            if (reduceMotion) { wrapper.remove(); styleEl.remove(); return; }
            banner.style.transform = "translateY(-100%)";
            var done = false;
            function cleanup() { if (done) return; done = true; wrapper.remove(); styleEl.remove(); }
            banner.addEventListener("transitionend", function (e) { if (e.propertyName === "transform") cleanup(); });
            setTimeout(cleanup, DURATION + 120);
        }

        view.layers.forEach(function (layer) {
            if (layer.visible === false) return;
            banner.appendChild(renderLayer(layer, closeBanner, designWidth));
        });

        // Apply any coupon elements on this banner to the Shopify cart on show.
        view.layers.forEach(function (l) {
            if (l && l.type === "coupon_box") {
                applyCoupon((l.metadata && l.metadata.couponCode) || l.content);
            }
        });

        if (renderMode === "top_stack") {
            wrapper.classList.add("ju-top-stack");
            banner.style.width = "100%";
            wrapper.appendChild(banner);
            // Pin to the very top of the viewport, above every site element.
            wrapper.style.position = "fixed";
            wrapper.style.top = "0";
            wrapper.style.left = "0";
            wrapper.style.right = "0";
            wrapper.style.width = "100%";
            document.body.appendChild(wrapper);

            bannerH = banner.offsetHeight || view.height || 0; // measured (handles wrapped mobile text)
            origBodyPad = parseFloat((window.getComputedStyle(document.body).paddingTop) || "0") || 0;

            if (reduceMotion) {
                banner.style.transform = "translateY(0)";
                document.body.style.paddingTop = (origBodyPad + bannerH) + "px";
                setHeaderOffset(bannerH);
            } else {
                // Premium slide-down: the fixed bar slides in from above while the page
                // content is pushed down (body padding-top) in sync. GPU-accelerated.
                banner.style.transform = "translateY(-100%)";
                banner.style.willChange = "transform";
                banner.style.transition = "transform " + DURATION + "ms " + EASE;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        banner.style.transform = "translateY(0)";
                        document.body.style.transition = "padding-top " + DURATION + "ms " + EASE;
                        document.body.style.paddingTop = (origBodyPad + bannerH) + "px";
                        setHeaderOffset(bannerH);
                    });
                });
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
            setTimeout(function () { wrapper.classList.add("ju-visible"); }, 600);
        }
    }

    // ===================================================================
    // Container-based responsive global banner — SHARED spec.
    // Mirrors dashboard/src/app/(dashboard)/global-banner/bannerCss.ts so the
    // editor preview is 1:1 with this live render.
    // ===================================================================
    function jugbJustify(v) { return v === "left" ? "flex-start" : v === "right" ? "flex-end" : (v || "center"); }
    function jugbN(v, d) { return v == null ? (d || 0) : v; }
    function jugbOwnHidden(r, device) { return !!(r && r[device] && r[device].hidden); }
    function jugbPad(s, def) {
        def = def || {};
        var t = jugbN(s.padTop, jugbN(s.paddingY, jugbN(def.t, 0)));
        var r = jugbN(s.padRight, jugbN(s.paddingX, jugbN(def.r, 0)));
        var b = jugbN(s.padBottom, jugbN(s.paddingY, jugbN(def.b, 0)));
        var l = jugbN(s.padLeft, jugbN(s.paddingX, jugbN(def.l, 0)));
        return (t || r || b || l) ? ("padding:" + t + "px " + r + "px " + b + "px " + l + "px;") : "";
    }
    function jugbMargin(s) {
        var t = jugbN(s.marginTop), r = jugbN(s.marginRight), b = jugbN(s.marginBottom), l = jugbN(s.marginLeft);
        return (t || r || b || l) ? ("margin:" + t + "px " + r + "px " + b + "px " + l + "px;") : "";
    }
    // Pick + fill the cart-goal message for a cart total (major units). Mirrors bannerCss.cartGoalMessage.
    function jugbCartGoalText(cfg, totalMajor) {
        if (!cfg) return "";
        var thr = Number(cfg.threshold) || 0;
        var sym = cfg.currencySymbol != null ? cfg.currencySymbol : "£";
        function fmt(nv) { var r = Math.round(nv * 100) / 100; return sym + (r % 1 === 0 ? String(r) : r.toFixed(2)); }
        var remaining = Math.max(0, thr - totalMajor);
        var t;
        if (thr > 0 && totalMajor >= thr) t = cfg.msgUnlocked || "";
        else if (totalMajor <= 0) t = cfg.msgEmpty || cfg.msgProgress || "";
        else t = cfg.msgProgress || "";
        // Wrap substituted amounts so they can be styled independently (.jugb-cg-amt).
        function amt(nv) { return '<span class="jugb-cg-amt">' + fmt(nv) + '</span>'; }
        return String(t).replace(/\{remaining\}/g, amt(remaining)).replace(/\{total\}/g, amt(totalMajor)).replace(/\{threshold\}/g, amt(thr));
    }

    // Sandboxed-iframe document for a custom HTML/CSS/JS element. Mirrors bannerCss.buildHtmlSrcdoc.
    function jugbSrcdoc(e) {
        var css = e.css || "", html = e.html || "";
        var js = (e.js || "").replace(/<\/script>/gi, "<\\/script>");
        return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0}' + css + '</style></head><body>' + html + (js ? '<script>try{' + js + '}catch(e){if(window.console)console.error(e)}<\/script>' : '') + '</body></html>';
    }

    // Compose a CSS background value (solid / gradient / image). Mirrors bannerCss.composeBackground.
    function jugbBg(s, fallback) {
        if (!s) return fallback || "";
        if (s.bgType === "gradient") {
            var stops = [s.gradientFrom || "#3a34f2", s.gradientVia, s.gradientTo || "#7b5cff"].filter(Boolean).join(", ");
            return s.gradientType === "radial"
                ? ("radial-gradient(circle, " + stops + ")")
                : ("linear-gradient(" + (s.gradientAngle != null ? s.gradientAngle : 90) + "deg, " + stops + ")");
        }
        if (s.bgType === "image" && s.bgImageUrl) {
            var overlay = s.bgOverlay ? ("linear-gradient(" + s.bgOverlay + ", " + s.bgOverlay + "), ") : "";
            return overlay + 'url("' + s.bgImageUrl + '") ' + (s.bgImagePosition || "center") + "/" + (s.bgImageSize || "cover") + " " + (s.bgImageRepeat || "no-repeat");
        }
        return s.background || fallback || "";
    }

    function jugbResolve(r, device) {
        var out = {}, k;
        var d = (r && r.desktop) || {};
        for (k in d) out[k] = d[k];
        if (device === "desktop") return out;
        var tb = (r && r.tablet) || {};
        for (k in tb) out[k] = tb[k];
        if (device === "tablet") return out;
        var mb = (r && r.mobile) || {};
        for (k in mb) out[k] = mb[k];
        return out;
    }

    function jugbDeviceRules(layout, device, scope) {
        var css = [];
        var bar = jugbResolve(layout.bar.responsive, device);
        var stack = device === "mobile" && !!layout.bar.mobileStack;
        var padX = bar.paddingX != null ? bar.paddingX : 24, padY = bar.paddingY != null ? bar.paddingY : 10;
        // Bar: full-bleed (edge to edge). Horizontal stays 0 unless padLeft/padRight set.
        var bpt = bar.padTop != null ? bar.padTop : padY, bpb = bar.padBottom != null ? bar.padBottom : padY;
        var bpl = bar.padLeft != null ? bar.padLeft : 0, bpr = bar.padRight != null ? bar.padRight : 0;
        css.push(scope + "{position:relative;box-sizing:border-box;width:100%;padding:" + bpt + "px " + bpr + "px " + bpb + "px " + bpl + "px;background:" + jugbBg(bar, "#000") + ";min-height:" + (bar.minHeight || 0) + "px;}");
        var innerDir = stack ? "column" : (bar.direction || "row");
        var innerGap = stack ? Math.max(6, Math.round((bar.gap != null ? bar.gap : 16) / 2)) : (bar.gap != null ? bar.gap : 16);
        var innerJustify = innerDir === "column" ? "flex-start" : "center";
        css.push(scope + " .jugb-inner{display:flex;flex-direction:" + innerDir + ";align-items:" + (bar.align || "center") + ";justify-content:" + innerJustify + ";gap:" + innerGap + "px;width:100%;box-sizing:border-box;}");
        var contentMax = bar.maxWidth || 0;
        var gutterL = padX, gutterR = Math.max(padX, 40);
        (layout.containers || []).forEach(function (c) {
            var cs = jugbResolve(c.responsive, device);
            var csel = scope + ' [data-cid="' + c.id + '"]';
            var cwsel = csel + " > .jugb-cwrap";
            if (jugbOwnHidden(c.responsive, device)) { css.push(csel + "{display:none;}"); return; }
            // BAND: width (% of full bar) + background + radius; centers content wrapper horizontally,
            // TOP-aligns it (flex-start) so a tall min-height leaves space below, not centered.
            var band = "display:flex;justify-content:center;align-items:flex-start;box-sizing:border-box;";
            if (stack) band += "width:100%;flex:0 0 auto;";
            else if (cs.widthPct) band += "flex:0 1 " + cs.widthPct + "%;width:" + cs.widthPct + "%;";
            else if (cs.grow) band += "flex:" + cs.grow + " 1 0%;";
            else band += "flex:0 1 auto;";
            if (cs.bgType || cs.background) band += "background:" + jugbBg(cs) + ";";
            if (cs.radius) band += "border-radius:" + cs.radius + "px;overflow:hidden;";
            if (cs.minHeight) band += "min-height:" + cs.minHeight + "px;";
            band += jugbMargin(cs);
            css.push(csel + "{" + band + "}");
            // CONTENT WRAPPER: the flex layout, capped at content max-width and centered.
            var cw = "display:flex;box-sizing:border-box;flex-direction:" + (cs.direction || "row") + ";justify-content:" + jugbJustify(cs.justify) + ";align-items:" + (cs.align || "center") + ";gap:" + (cs.gap != null ? cs.gap : 12) + "px;width:100%;";
            if (contentMax) cw += "max-width:" + contentMax + "px;";
            if (cs.wrap) cw += "flex-wrap:wrap;";
            cw += jugbPad(cs, { t: 0, b: 0, l: gutterL, r: gutterR });
            css.push(cwsel + "{" + cw + "}");
            (c.elements || []).forEach(function (e) { jugbEmitEl(e, css, device, scope); });
        });
        return css.join("");
    }

    // Emit CSS for one element, recursing into a group's children. Mirrors bannerCss.emitElement.
    function jugbEmitEl(e, css, device, scope) {
        var sel = scope + ' [data-eid="' + e.id + '"]';
        if (jugbOwnHidden(e.responsive, device)) { css.push(sel + "{display:none;}"); return; }
        var s = jugbResolve(e.responsive, device);
        var fixedImg = (e.type === "image" || e.type === "sheetImage");
        var isGroup = e.type === "group";
        var isHtml = e.type === "html";
        var er = "box-sizing:border-box;min-width:0;";
        if (isHtml) er += "display:block;";
        else if (isGroup) {
            er += "display:flex;flex-direction:" + (s.direction || "row") + ";justify-content:" + jugbJustify(s.justify) + ";align-items:" + (s.align || "center") + ";gap:" + (s.gap != null ? s.gap : 12) + "px;";
            if (s.wrap) er += "flex-wrap:wrap;";
        } else if (e.type === "cartGoal") {
            // block (not column-flex) so the message text + amount spans flow as ONE inline line.
            er += "display:block;text-align:" + (s.textAlign || "center") + ";";
        } else {
            er += "display:flex;flex-direction:column;justify-content:center;align-items:center;";
        }
        if (s.widthPct) er += "flex:0 1 " + s.widthPct + "%;width:" + s.widthPct + "%;max-width:" + s.widthPct + "%;";
        else if (s.grow) er += "flex:" + s.grow + " 1 0%;";
        else er += fixedImg ? "flex:0 0 auto;" : "flex:0 1 auto;";
        if (e.type === "close") er += "position:absolute;top:8px;right:12px;cursor:pointer;line-height:1;z-index:2;";
        if (s.alignSelf) er += "align-self:" + s.alignSelf + ";";
        if (s.color) er += "color:" + s.color + ";";
        if (s.fontSize) er += "font-size:" + s.fontSize + "px;";
        if (s.fontWeight) er += "font-weight:" + s.fontWeight + ";";
        if (s.fontStyle) er += "font-style:" + s.fontStyle + ";";
        if (s.lineHeight) er += "line-height:" + s.lineHeight + ";";
        if (s.fontFamily) er += "font-family:" + s.fontFamily + ";";
        // Per-element background box (any element type), independent of the banner/container bg.
        if (e.type !== "close" && (s.bgType || s.background)) er += "background:" + jugbBg(s) + ";";
        if (e.type !== "close" && s.boxRadius) er += "border-radius:" + s.boxRadius + "px;" + (s.bgType === "image" ? "overflow:hidden;" : "");
        // Cart Goal: single line by default; wrap only when the user opts in.
        if (e.type === "cartGoal" && !(e.cartGoal && e.cartGoal.wrap)) er += "white-space:nowrap;";
        er += jugbPad(s);
        er += jugbMargin(s);
        if (s.heightPx && !isHtml) er += "min-height:" + s.heightPx + "px;";
        if (!isGroup && !isHtml && s.textAlign) er += "text-align:" + s.textAlign + ";align-items:" + jugbJustify(s.textAlign) + ";";
        css.push(sel + "{" + er + "}");
        if (isHtml) css.push(sel + " iframe{display:block;width:100%;border:0;height:" + (s.heightPx || 80) + "px;background:transparent;}");
        if (e.type === "sheetMessage") {
            css.push(sel + " h1," + sel + " h2," + sel + " h3{margin:0;}" + sel + " p{margin:2px 0;}");
            if (s.headingColor) css.push(sel + " h1," + sel + " h2," + sel + " h3," + sel + " h1 *," + sel + " h2 *," + sel + " h3 *{color:" + s.headingColor + " !important;}");
            if (s.bodyColor) css.push(sel + " p," + sel + " p *{color:" + s.bodyColor + " !important;}");
            var l2 = "";
            if (s.line2Color) l2 += "color:" + s.line2Color + " !important;";
            if (s.line2FontSize) l2 += "font-size:" + s.line2FontSize + "px;";
            if (s.line2FontWeight) l2 += "font-weight:" + s.line2FontWeight + ";";
            if (s.line2FontStyle) l2 += "font-style:" + s.line2FontStyle + ";";
            if (l2) css.push(sel + " p:not(:first-of-type)," + sel + " p:not(:first-of-type) *{" + l2 + "}");
        }
        if (e.type === "image" || e.type === "sheetImage") {
            css.push(sel + " img{width:" + (s.width || 64) + "px;height:" + (s.height || 64) + "px;object-fit:" + (s.fit || "cover") + ";border-radius:" + (s.radius || 0) + "%;display:block;}");
        }
        if (e.type === "cartGoal") {
            var hl = "";
            if (s.cgHighlightColor) hl += "color:" + s.cgHighlightColor + ";";
            if (s.cgHighlightWeight) hl += "font-weight:" + s.cgHighlightWeight + ";";
            if (hl) css.push(sel + " .jugb-cg-amt{" + hl + "}");
        }
        if (e.type === "timer") {
            css.push(sel + " .jugb-trow{display:inline-flex;gap:5px;align-items:center;}");
            css.push(sel + " .jugb-tbox{display:inline-flex;flex-direction:column;align-items:center;border-radius:6px;padding:3px 7px;min-width:32px;background:" + (s.boxColor || "rgba(255,255,255,0.15)") + ";}");
            css.push(sel + " .jugb-tbox b{font-size:" + (s.fontSize || 16) + "px;line-height:1;color:" + (s.color || "#fff") + ";}");
            css.push(sel + " .jugb-tlbl{font-size:9px;opacity:.8;color:" + (s.color || "#fff") + ";" + (e.timer && e.timer.showLabels === false ? "display:none;" : "") + "}");
        }
        if (isGroup) (e.children || []).forEach(function (ch) { jugbEmitEl(ch, css, device, scope); });
    }

    function jugbBuildCss(layout, scope) {
        return jugbDeviceRules(layout, "desktop", scope)
            + "@media (max-width:1023px){" + jugbDeviceRules(layout, "tablet", scope) + "}"
            + "@media (max-width:767px){" + jugbDeviceRules(layout, "mobile", scope) + "}";
    }

    function jugbFormatCountdown(ms, mode) {
        if (ms < 0) ms = 0;
        var s = Math.floor((ms % 60000) / 1000), m = Math.floor((ms % 3600000) / 60000);
        if (mode === "hours") return [{ v: Math.floor(ms / 3600000), l: "hrs" }, { v: m, l: "min" }, { v: s, l: "sec" }];
        return [{ v: Math.floor(ms / 86400000), l: "days" }, { v: Math.floor((ms % 86400000) / 3600000), l: "hrs" }, { v: m, l: "min" }, { v: s, l: "sec" }];
    }
    function jugbCountdownHtml(parts) {
        var out = "";
        for (var i = 0; i < parts.length; i++) { var v = parts[i].v; out += '<span class="jugb-tbox"><b>' + (v < 10 ? "0" + v : v) + '</b><span class="jugb-tlbl">' + parts[i].l + '</span></span>'; }
        return '<span class="jugb-trow">' + out + '</span>';
    }
    function jugbFormatInTz(instantIso, tz) {
        try { return new Intl.DateTimeFormat("en-GB", { timeZone: tz || "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(instantIso)); }
        catch (e) { return new Date(instantIso).toUTCString(); }
    }
    function jugbStartCountdown(el, e, timers) {
        var t = e.timer || {};
        var labelHtml = t.timezone ? '<div style="font-size:10px;opacity:.8;margin-top:3px;">Ends ' + jugbFormatInTz(t.endInstant, t.timezone) + '</div>' : '';
        function tick() {
            var end = new Date(t.endInstant).getTime();
            if (isNaN(end)) { el.style.display = "none"; return; }
            var diff = end - Date.now();
            if (diff <= 0 && t.onExpire === "hide") { el.style.display = "none"; el.innerHTML = ""; return; }
            el.innerHTML = jugbCountdownHtml(jugbFormatCountdown(diff, t.mode || "days")) + labelHtml;
        }
        tick();
        timers.push(setInterval(tick, 1000));
    }

    function renderContainerBanner(meta, layout, offerHtml, offerImageUrl) {
        if (!layout || !layout.bar || !layout.containers) return;
        if (meta.id) { try { if (window.localStorage.getItem("ju_dismissed_" + meta.id)) return; } catch (e) {} }

        var reduceMotion = false;
        try { reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
        var EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
        var DURATION = 520;
        var bar = layout.bar;
        var containers = layout.containers || [];
        var timers = [];

        // ---- Scoped CSS (shared generator: desktop base + tablet/mobile @media) ----
        var styleEl = document.createElement("style");
        styleEl.innerHTML = "#ju-wrapper{z-index:2147483647;}" + jugbBuildCss(layout, "#ju-banner");
        document.head.appendChild(styleEl);

        // ---- DOM ----
        var wrapper = document.createElement("div");
        wrapper.id = "ju-wrapper";
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute("aria-label", "Site announcement");
        if (meta.name) wrapper.setAttribute("data-ju-banner", meta.name);
        if (meta.id) wrapper.setAttribute("data-ju-id", meta.id);
        // Pinned to the very top of the viewport (stays put while scrolling).
        wrapper.style.position = "fixed";
        wrapper.style.top = "0"; wrapper.style.left = "0"; wrapper.style.right = "0";
        wrapper.style.width = "100%"; wrapper.style.overflow = "hidden";

        var bannerEl = document.createElement("div"); bannerEl.id = "ju-banner";
        var innerEl = document.createElement("div"); innerEl.className = "jugb-inner";

        var closed = false, origBodyPad = 0, bannerH = 0;
        var shiftedHeaders = []; // theme sticky/fixed headers we pushed below the banner (to restore on close)
        var ro = null;           // ResizeObserver that keeps the reserved space in sync with content height
        var onWinResize = null;  // window resize handler (breakpoint changes can change height)
        var cartGoalEls = []; // {el, cfg} for cart-value threshold messaging (updated from /cart.js)
        function updateCartGoals() {
            if (closed || !cartGoalEls.length) return;
            try {
                fetch("/cart.js", { credentials: "include", headers: { "Accept": "application/json" } })
                    .then(function (r) { return r.json(); })
                    .then(function (cart) {
                        var totalMajor = (Number(cart && cart.total_price) || 0) / 100;
                        for (var i = 0; i < cartGoalEls.length; i++) cartGoalEls[i].el.innerHTML = jugbCartGoalText(cartGoalEls[i].cfg, totalMajor);
                        syncBannerHeight(); // message length may have changed the banner height
                    }).catch(function () {});
            } catch (e) {}
        }
        // Re-measure the banner and keep the reserved page space + theme-header offset in
        // sync whenever content grows/shrinks (long sheet messages, async images, breakpoint
        // changes, font swaps). This is what makes the canvas height truly dynamic.
        function syncBannerHeight() {
            if (closed) return;
            var h = bannerEl.offsetHeight || bar.minHeight || 0;
            if (!h || h === bannerH) return;
            bannerH = h;
            setBannerHeightVar(bannerH);
            for (var i = 0; i < shiftedHeaders.length; i++) { try { shiftedHeaders[i].el.style.top = bannerH + "px"; } catch (e) {} }
            document.body.style.paddingTop = (origBodyPad + bannerH) + "px";
        }
        // Reusable offset variable for themes that want to consume it in CSS
        // (e.g. header { top: var(--promo-banner-height) }). Set on both names.
        function setBannerHeightVar(px) {
            try {
                document.documentElement.style.setProperty("--promo-banner-height", px + "px");
                document.documentElement.style.setProperty("--ju-banner-height", px + "px");
            } catch (e) {}
        }

        // The banner is position:fixed at top:0. A theme header that is itself
        // sticky/fixed at top:0 would sit UNDER the banner. Find those top-anchored
        // bars and push their `top` down by the banner height so they sit/stick just
        // below the banner. Records originals so close() can restore them.
        function offsetStickyHeaders(px) {
            try {
                var all = document.body.getElementsByTagName("*");
                var vw = window.innerWidth || document.documentElement.clientWidth || 0;
                for (var i = 0; i < all.length; i++) {
                    var el = all[i];
                    if (el === wrapper || wrapper.contains(el)) continue;
                    var cs = window.getComputedStyle(el);
                    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
                    var topVal = parseFloat(cs.top); // only bars anchored at/near the very top
                    if (isNaN(topVal) || topVal > 2) continue;
                    var r = el.getBoundingClientRect();
                    if (r.width < vw * 0.6) continue;          // wide → a header/announcement bar, not a small widget
                    if (r.height > (window.innerHeight || 800) * 0.5) continue; // skip full-screen overlays
                    shiftedHeaders.push({ el: el, top: el.style.top });
                    el.style.top = px + "px";
                }
            } catch (e) {}
        }
        function restoreStickyHeaders() {
            for (var i = 0; i < shiftedHeaders.length; i++) {
                try { shiftedHeaders[i].el.style.top = shiftedHeaders[i].top; } catch (e) {}
            }
            shiftedHeaders = [];
        }
        function doClose() {
            if (closed) return; closed = true;
            for (var i = 0; i < timers.length; i++) clearInterval(timers[i]);
            if (ro) { try { ro.disconnect(); } catch (e) {} ro = null; }
            if (onWinResize) { try { window.removeEventListener("resize", onWinResize); } catch (e) {} onWinResize = null; }
            if (meta.id) {
                STORAGE.session.setItem("banner_closed_" + meta.id, "1");
                try { window.localStorage.setItem("ju_dismissed_" + meta.id, "1"); } catch (e) {}
            }
            setBannerHeightVar(0);
            restoreStickyHeaders();                   // put theme headers back to their original top
            var bs = document.body.style;
            var done = false;
            function cleanup() { if (done) return; done = true; wrapper.remove(); styleEl.remove(); }
            if (reduceMotion) { bs.paddingTop = origBodyPad + "px"; cleanup(); return; }
            // Smoothly remove the reserved space (page glides back up) + slide the bar away.
            bs.transition = "padding-top " + DURATION + "ms " + EASE;
            bs.paddingTop = origBodyPad + "px";
            bannerEl.style.transform = "translateY(-100%)";
            bannerEl.addEventListener("transitionend", function (e) { if (e.propertyName === "transform") cleanup(); });
            setTimeout(cleanup, DURATION + 150);
        }

        function buildElement(e) {
            var el = document.createElement("div");
            el.className = "jugb-el jugb-" + e.type + (e.type === "sheetMessage" ? " jugb-msg" : "") + (e.type === "close" ? " jugb-close" : "");
            el.setAttribute("data-eid", e.id);
            if (e.type === "text") {
                el.innerHTML = e.content || "";
            } else if (e.type === "sheetMessage") {
                el.innerHTML = offerHtml || e.sampleHtml || "";
            } else if (e.type === "sheetImage" || e.type === "image") {
                var url = (e.type === "sheetImage" ? (offerImageUrl || e.sampleUrl) : e.sampleUrl) || "";
                if (url) { var img = document.createElement("img"); img.src = url; img.alt = ""; el.appendChild(img); }
                else { el.style.display = "none"; }
            } else if (e.type === "button") {
                el.innerHTML = e.content || "Shop now";
                el.style.cursor = "pointer";
                (function (m) { el.addEventListener("click", function (ev) { ev.stopPropagation(); handleCta(m); }); })({ action: e.variantId ? "add_to_cart" : "open_url", variantId: e.variantId, ctaUrl: e.ctaUrl, ctaNewTab: e.ctaNewTab, quantity: e.quantity, afterAction: e.afterAction, couponCode: e.couponCode });
            } else if (e.type === "coupon") {
                var code = e.couponCode || e.content || "";
                el.innerHTML = e.content || code;
                el.style.cursor = "pointer"; el.style.userSelect = "all";
                (function (cd) { el.addEventListener("click", function (ev) { ev.stopPropagation(); if (!cd) return; try { navigator.clipboard.writeText(cd); } catch (_) {} applyCoupon(cd); }); })(code);
            } else if (e.type === "timer") {
                if (!e.timer || !e.timer.endInstant) { el.style.display = "none"; } else { jugbStartCountdown(el, e, timers); }
            } else if (e.type === "group") {
                (e.children || []).forEach(function (ch) { el.appendChild(buildElement(ch)); });
            } else if (e.type === "html") {
                var ifr = document.createElement("iframe");
                ifr.setAttribute("sandbox", "allow-scripts"); // isolated: no same-origin → can't touch storefront/banner
                ifr.setAttribute("title", "custom-html");
                ifr.setAttribute("scrolling", "no");
                try { ifr.srcdoc = jugbSrcdoc(e); } catch (err) {}
                el.appendChild(ifr);
            } else if (e.type === "cartGoal") {
                var cg = e.cartGoal || {};
                el.innerHTML = jugbCartGoalText(cg, 0); // initial; replaced once /cart.js loads
                cartGoalEls.push({ el: el, cfg: cg });
            } else if (e.type === "close") {
                el.innerHTML = "&times;";
                el.style.cursor = "pointer";
                el.setAttribute("role", "button"); el.setAttribute("tabindex", "0"); el.setAttribute("aria-label", "Close announcement");
                el.onclick = function (ev) { ev.stopPropagation(); doClose(); };
                el.onkeydown = function (ev) { if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") { ev.preventDefault(); doClose(); } };
            } else {
                el.innerHTML = e.content || "";
            }
            if ((e.type === "text" || e.type === "sheetImage" || e.type === "image") && e.ctaUrl) {
                el.style.cursor = "pointer";
                (function (m) { el.addEventListener("click", function () { handleCta(m); }); })({ ctaUrl: e.ctaUrl, ctaNewTab: e.ctaNewTab });
            }
            return el;
        }

        containers.forEach(function (c) {
            var cont = document.createElement("div");
            cont.className = "jugb-cont";
            cont.setAttribute("data-cid", c.id);
            var cwrap = document.createElement("div");
            cwrap.className = "jugb-cwrap";
            (c.elements || []).forEach(function (e) { cwrap.appendChild(buildElement(e)); });
            cont.appendChild(cwrap);
            innerEl.appendChild(cont);
        });
        bannerEl.appendChild(innerEl);
        applyCoupon(bar.couponCode);

        // Cart-value messaging: read the live cart now, then keep it fresh (poll + on focus).
        if (cartGoalEls.length) {
            updateCartGoals();
            timers.push(setInterval(updateCartGoals, 4000));
            try { window.addEventListener("focus", updateCartGoals); } catch (e) {}
        }

        wrapper.appendChild(bannerEl);
        // Pre-set the slide-up transform BEFORE attaching so the bar slides in (no flash).
        if (!reduceMotion) {
            bannerEl.style.transform = "translateY(-100%)";
            bannerEl.style.transition = "transform " + DURATION + "ms " + EASE;
            bannerEl.style.willChange = "transform";
        }
        document.body.appendChild(wrapper);

        // ---- Reserve space so the FIXED banner pushes the page down (no overlay) ----
        bannerH = bannerEl.offsetHeight || bar.minHeight || 0;
        origBodyPad = parseFloat(window.getComputedStyle(document.body).paddingTop || "0") || 0;
        setBannerHeightVar(bannerH);                 // exposes --promo-banner-height / --ju-banner-height
        offsetStickyHeaders(bannerH);                // push sticky/fixed theme headers below the banner

        // Keep the reserved space synced with the live content height (dynamic canvas).
        try {
            if (window.ResizeObserver) { ro = new ResizeObserver(function () { syncBannerHeight(); }); ro.observe(bannerEl); }
        } catch (e) {}
        onWinResize = function () { syncBannerHeight(); };
        try { window.addEventListener("resize", onWinResize); } catch (e) {}

        if (reduceMotion) {
            bannerEl.style.transform = "translateY(0)";
            document.body.style.paddingTop = (origBodyPad + bannerH) + "px";
        } else {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    bannerEl.style.transform = "translateY(0)";
                    document.body.style.transition = "padding-top " + DURATION + "ms " + EASE;
                    document.body.style.paddingTop = (origBodyPad + bannerH) + "px";
                });
            });
        }
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

        // In preview mode, render directly. Otherwise rule-filter campaigns too.
        if (window.ju_campaign) {
            if (campaigns[0]) renderBanner(campaigns[0]);
            return;
        }

        var ctx = buildContext();
        var chosen = null;
        for (var j = 0; j < campaigns.length; j++) {
            if (evaluateRules(campaigns[j].rulesJson || campaigns[j].rules, campaigns[j].id, ctx)) {
                chosen = campaigns[j];
                break;
            }
        }
        if (chosen) {
            renderBanner(chosen);
            markShown(chosen.id);
        }
    }

    function init() {
        // Campaign preview mode bypasses the global banner entirely.
        if (window.ju_campaign) { loadCampaigns(); return; }
        try {
            loadGlobalBanners(loadCampaigns);
        } catch (e) {
            loadCampaigns();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.BannerRuntime = {
        init: function (opts) {
            if (opts && opts.account) accountId = opts.account;
            loadCampaigns();
        }
    };
})();
