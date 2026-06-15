var juScriptEl = null;

function setStatus(msg, color) {
    var el = document.getElementById('ju-status');
    el.textContent = msg;
    el.style.color = color || '#facc15';
}

function loadWithAccount() {
    var accountId = document.getElementById('ju-account-input').value.trim();
    if (!accountId) {
        setStatus('❌ Please enter an Account ID', '#f87171');
        return;
    }

    localStorage.setItem('ju_test_account', accountId);

    if (juScriptEl) juScriptEl.remove();
    var oldBanner = document.getElementById('ju-wrapper');
    if (oldBanner) oldBanner.remove();

    var campaignId = document.getElementById('ju-campaign-input').value.trim();
    var statusMsg = campaignId
        ? '⏳ Loading campaign ' + campaignId + '…'
        : '⏳ Loading published campaigns for ' + accountId + '…';
    setStatus(statusMsg, '#facc15');

    window.ju_num = accountId;
    window.ju_campaign = campaignId || undefined;
    window.asset_host = 'http://localhost:3001/';

    juScriptEl = document.createElement('script');
    juScriptEl.src = 'http://localhost:3001/vck.js?t=' + Date.now();
    juScriptEl.onload = function () {
        setStatus('✅ vck.js loaded — banner will appear in ~1s', '#4ade80');
    };
    juScriptEl.onerror = function () {
        setStatus('❌ Could not load vck.js — is the backend running on localhost:3001?', '#f87171');
    };
    document.body.appendChild(juScriptEl);
}

document.addEventListener('DOMContentLoaded', function () {
    // Pre-fill from URL param ?account=xxx
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get('account');
    if (fromUrl) {
        document.getElementById('ju-account-input').value = fromUrl;
        loadWithAccount();
    } else {
        var saved = localStorage.getItem('ju_test_account');
        if (saved) {
            document.getElementById('ju-account-input').value = saved;
        }
    }

    document.getElementById('ju-load-btn').addEventListener('click', loadWithAccount);
});
