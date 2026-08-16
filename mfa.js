/* ================================================
   BOSA-CARE — mfa.js
   Real TOTP 2FA using Supabase Auth's built-in MFA API.
   Include AFTER supabase-config.js on: login.html,
   doctor-profile.html, patient-profile.html
================================================ */

(function () {

  /* ---------- inject modal markup + styles once ---------- */
  function mfaInjectModal() {
    if (document.getElementById("mfaModalScrim")) return;

    const style = document.createElement("style");
    style.textContent = `
      #mfaModalScrim{
        position:fixed;inset:0;background:rgba(40,40,30,0.45);
        display:none;align-items:center;justify-content:center;z-index:999;padding:20px;
      }
      #mfaModalScrim.open{display:flex;}
      .mfa-modal{
        background:#fff;border-radius:18px;width:100%;max-width:380px;
        padding:26px;box-shadow:0 20px 50px -20px rgba(0,0,0,0.35);
        font-family:'DM Sans','Space Grotesk',sans-serif;color:#3d3e33;
      }
      .mfa-modal h3{font-size:18px;font-weight:700;margin:0 0 6px;font-family:'Playfair Display','Fraunces',serif;}
      .mfa-modal p{font-size:13px;color:#7a7a70;line-height:1.55;margin:0 0 14px;}
      .mfa-qr-wrap{
        display:flex;justify-content:center;padding:14px;background:#FFE9DA;
        border-radius:12px;margin-bottom:14px;
      }
      .mfa-qr-wrap img{width:160px;height:160px;background:#fff;border-radius:8px;padding:6px;}
      .mfa-secret{
        font-family:monospace;font-size:12.5px;background:#F4DECD;border:1px solid #D5CCC5;
        border-radius:8px;padding:8px 10px;word-break:break-all;margin-bottom:14px;
        display:flex;align-items:center;justify-content:space-between;gap:8px;
      }
      .mfa-secret button{
        font-size:11px;font-weight:700;color:#DB827F;background:none;border:none;cursor:pointer;flex-shrink:0;
      }
      .mfa-code-input{
        width:100%;padding:12px 14px;border-radius:10px;border:1.5px solid #D5CCC5;
        font-size:20px;letter-spacing:6px;text-align:center;font-family:monospace;margin-bottom:6px;
      }
      .mfa-code-input:focus{outline:2px solid #DB827F;border-color:transparent;}
      .mfa-error{font-size:12.5px;color:#c46a67;min-height:16px;margin-bottom:8px;}
      .mfa-actions{display:flex;gap:10px;margin-top:10px;}
      .mfa-btn{
        flex:1;padding:11px 14px;border-radius:100px;font-size:13.5px;font-weight:600;
        cursor:pointer;border:none;font-family:inherit;transition:opacity .15s;
      }
      .mfa-btn:disabled{opacity:.55;cursor:default;}
      .mfa-btn-primary{background:#454735;color:#FFE9DA;}
      .mfa-btn-ghost{background:#F4DECD;color:#454735;}
    `;
    document.head.appendChild(style);

    const scrim = document.createElement("div");
    scrim.id = "mfaModalScrim";
    scrim.innerHTML = `<div class="mfa-modal" id="mfaModalBody"></div>`;
    document.body.appendChild(scrim);
  }

  function mfaShowModal(html) {
    mfaInjectModal();
    document.getElementById("mfaModalBody").innerHTML = html;
    document.getElementById("mfaModalScrim").classList.add("open");
  }
  function mfaCloseModal() {
    const scrim = document.getElementById("mfaModalScrim");
    if (scrim) scrim.classList.remove("open");
  }

  /* ---------- toast fallback (uses page's own toast if present) ---------- */
  function mfaToast(msg, type) {
    if (typeof profileToast === "function") return profileToast(msg, type);
    if (typeof showMsg === "function") return showMsg(msg, type === "error" ? "error" : "info");
    alert(msg);
  }

  /* ==================================================
     ENROLLMENT (used on doctor-profile.html / patient-profile.html)
  ================================================== */

  let _pendingFactorId = null;

  async function mfaStartEnroll() {
    const { data, error } = await supabaseClient.auth.mfa.enroll({ factorType: "totp" });
    if (error) { mfaToast(error.message, "error"); return; }

    _pendingFactorId = data.id;
    const qr = data.totp.qr_code;   // data-URI SVG
    const secret = data.totp.secret; // manual entry fallback

    mfaShowModal(`
      <h3>Set up two-factor authentication</h3>
      <p>Scan this QR code with Google Authenticator, Authy, or any TOTP app.</p>
      <div class="mfa-qr-wrap"><img src="${qr}" alt="QR code"/></div>
      <div class="mfa-secret">
        <span id="mfaSecretText">${secret}</span>
        <button type="button" onclick="navigator.clipboard.writeText('${secret}');this.textContent='Copied!'">Copy</button>
      </div>
      <p>Then enter the 6-digit code your app shows:</p>
      <input class="mfa-code-input" id="mfaEnrollCode" maxlength="6" inputmode="numeric" placeholder="000000" autocomplete="one-time-code"/>
      <div class="mfa-error" id="mfaEnrollError"></div>
      <div class="mfa-actions">
        <button class="mfa-btn mfa-btn-ghost" type="button" onclick="window.__mfaCancelEnroll()">Cancel</button>
        <button class="mfa-btn mfa-btn-primary" type="button" id="mfaEnrollConfirmBtn" onclick="window.__mfaConfirmEnroll()">Confirm</button>
      </div>
    `);

    document.getElementById("mfaEnrollCode")?.focus();
  }

  async function mfaConfirmEnroll() {
    const codeEl = document.getElementById("mfaEnrollCode");
    const errEl = document.getElementById("mfaEnrollError");
    const btn = document.getElementById("mfaEnrollConfirmBtn");
    const code = (codeEl?.value || "").trim();

    if (!/^\d{6}$/.test(code)) { errEl.textContent = "Enter the 6-digit code."; return; }
    btn.disabled = true; btn.textContent = "Verifying…";

    const { data: challenge, error: chalErr } = await supabaseClient.auth.mfa.challenge({ factorId: _pendingFactorId });
    if (chalErr) { errEl.textContent = chalErr.message; btn.disabled = false; btn.textContent = "Confirm"; return; }

    const { error: verifyErr } = await supabaseClient.auth.mfa.verify({
      factorId: _pendingFactorId, challengeId: challenge.id, code,
    });

    if (verifyErr) {
      errEl.textContent = "Incorrect code — try again.";
      btn.disabled = false; btn.textContent = "Confirm";
      return;
    }

    mfaCloseModal();
    mfaSetToggleChecked(true);
    mfaToast("Two-factor authentication enabled.", "success");
    _pendingFactorId = null;
  }

  async function mfaCancelEnroll() {
    if (_pendingFactorId) {
      // clean up the unverified factor so it doesn't clutter the account
      await supabaseClient.auth.mfa.unenroll({ factorId: _pendingFactorId });
      _pendingFactorId = null;
    }
    mfaCloseModal();
    mfaSetToggleChecked(false);
  }

  async function mfaDisable() {
    const { data, error } = await supabaseClient.auth.mfa.listFactors();
    if (error) { mfaToast(error.message, "error"); return; }

    const factor = data.totp?.[0];
    if (!factor) { mfaSetToggleChecked(false); return; }

    if (!confirm("Turn off two-factor authentication? You'll only need your password to log in.")) {
      mfaSetToggleChecked(true);
      return;
    }

    const { error: unenrollErr } = await supabaseClient.auth.mfa.unenroll({ factorId: factor.id });
    if (unenrollErr) { mfaToast(unenrollErr.message, "error"); mfaSetToggleChecked(true); return; }

    mfaSetToggleChecked(false);
    mfaToast("Two-factor authentication turned off.", "info");
  }

  function mfaSetToggleChecked(val) {
    const input = document.getElementById("toggle2FA");
    if (input) input.checked = val;
  }

  /* Wired to the checkbox's onclick in the profile pages */
  async function handle2FAToggle(input) {
    const wantsEnable = input.checked;
    input.checked = !wantsEnable; // revert immediately; only flips on real success
    if (wantsEnable) {
      await mfaStartEnroll();
    } else {
      await mfaDisable();
    }
  }

  /* Call on profile page load so the switch reflects the real DB state,
     not a stale localStorage preference */
  async function mfaSyncToggleFromServer() {
    const { data, error } = await supabaseClient.auth.mfa.listFactors();
    if (error) return;
    mfaSetToggleChecked(!!data.totp?.length);
  }

  /* ==================================================
     LOGIN-TIME CHALLENGE (used on login.html)
  ================================================== */

  async function mfaCheckAndChallengeAfterLogin(onDone) {
    const { data, error } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) { onDone(error); return; }

    if (data.nextLevel === "aal2" && data.currentLevel !== data.nextLevel) {
      const { data: factors } = await supabaseClient.auth.mfa.listFactors();
      const factor = factors.totp?.[0];
      if (!factor) { onDone(null); return; } // shouldn't happen, but don't block login

      const { data: challenge, error: chalErr } = await supabaseClient.auth.mfa.challenge({ factorId: factor.id });
      if (chalErr) { onDone(chalErr); return; }

      mfaShowModal(`
        <h3>Enter your 2FA code</h3>
        <p>Open your authenticator app and enter the current 6-digit code.</p>
        <input class="mfa-code-input" id="mfaLoginCode" maxlength="6" inputmode="numeric" placeholder="000000" autocomplete="one-time-code"/>
        <div class="mfa-error" id="mfaLoginError"></div>
        <div class="mfa-actions">
          <button class="mfa-btn mfa-btn-primary" style="flex:1" type="button" id="mfaLoginConfirmBtn">Verify</button>
        </div>
      `);
      document.getElementById("mfaLoginCode")?.focus();

      document.getElementById("mfaLoginConfirmBtn").onclick = async () => {
        const codeEl = document.getElementById("mfaLoginCode");
        const errEl = document.getElementById("mfaLoginError");
        const btn = document.getElementById("mfaLoginConfirmBtn");
        const code = (codeEl?.value || "").trim();
        if (!/^\d{6}$/.test(code)) { errEl.textContent = "Enter the 6-digit code."; return; }
        btn.disabled = true; btn.textContent = "Verifying…";

        const { error: verifyErr } = await supabaseClient.auth.mfa.verify({
          factorId: factor.id, challengeId: challenge.id, code,
        });

        if (verifyErr) {
          errEl.textContent = "Incorrect code — try again.";
          btn.disabled = false; btn.textContent = "Verify";
          return;
        }

        mfaCloseModal();
        onDone(null);
      };

      // allow Enter key to submit
      document.getElementById("mfaLoginCode").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("mfaLoginConfirmBtn").click();
      });
    } else {
      onDone(null); // no MFA required for this account
    }
  }

  /* expose what the pages need */
  window.handle2FAToggle = handle2FAToggle;
  window.mfaSyncToggleFromServer = mfaSyncToggleFromServer;
  window.mfaCheckAndChallengeAfterLogin = mfaCheckAndChallengeAfterLogin;
  window.__mfaConfirmEnroll = mfaConfirmEnroll;
  window.__mfaCancelEnroll = mfaCancelEnroll;

})();
