/*!
 * IdeaRoads embeddable widget.
 *
 * Usage — inline (renders where the script tag is, or into a named container):
 *   <script src="https://yourapp.example/widget.js"
 *           data-workspace="acme"
 *           data-board="feature-requests"></script>
 *
 *   <div id="my-widget"></div>
 *   <script src="https://yourapp.example/widget.js"
 *           data-workspace="acme"
 *           data-board="feature-requests"
 *           data-container="my-widget"></script>
 *
 * Usage — floating launcher button:
 *   <script src="https://yourapp.example/widget.js"
 *           data-workspace="acme"
 *           data-mode="button"
 *           data-position="bottom-right"
 *           data-width="380"
 *           data-height="560"
 *           data-theme="light"
 *           data-accent-color="#2563eb"></script>
 *
 * data-board is optional; omit it to embed the workspace's roadmap-style
 * default board route. data-workspace is required. data-position,
 * data-width, data-height, data-theme and data-accent-color are all
 * optional and are generated for you by Settings → Embed.
 */
(() => {
  const MESSAGE_SOURCE = "idearoads-widget";
  const script = document.currentScript;

  if (!script) {
    // Can't self-identify (e.g. script was injected in a way that clears
    // currentScript before this runs) — nothing safe to do.
    return;
  }

  const workspace = script.getAttribute("data-workspace");
  if (!workspace) {
    console.error("[IdeaRoads widget] data-workspace attribute is required");
    return;
  }

  const board = script.getAttribute("data-board");
  const mode =
    script.getAttribute("data-mode") === "button" ? "button" : "inline";
  const containerId = script.getAttribute("data-container");

  const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"];
  const position = POSITIONS.includes(script.getAttribute("data-position"))
    ? script.getAttribute("data-position")
    : "bottom-right";

  const theme = ["light", "dark"].includes(script.getAttribute("data-theme"))
    ? script.getAttribute("data-theme")
    : null;

  const accentColor = /^#[0-9a-fA-F]{6}$/.test(
    script.getAttribute("data-accent-color") || ""
  )
    ? script.getAttribute("data-accent-color")
    : null;

  const panelWidth = Number(script.getAttribute("data-width")) || 380;
  const panelHeight = Number(script.getAttribute("data-height")) || 560;

  const instanceId = "ir-widget-" + Math.random().toString(36).slice(2, 9);

  const origin = (() => {
    const a = document.createElement("a");
    a.href = script.src;
    return a.protocol + "//" + a.host;
  })();

  const path =
    "/" +
    encodeURIComponent(workspace) +
    (board ? "/b/" + encodeURIComponent(board) : "");
  const iframeQuery = new URLSearchParams({ embed: "1" });
  if (theme) {
    iframeQuery.set("theme", theme);
  }
  if (accentColor) {
    iframeQuery.set("accentColor", accentColor);
  }
  const iframeSrc = origin + path + "?" + iframeQuery.toString();

  // Simple sRGB luminance check so the launcher button's text stays legible
  // against any admin-chosen accent color.
  function contrastForeground(hex) {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#111111" : "#ffffff";
  }

  // CSS corner offsets for the floating panel and its launcher button.
  function cornerCss(inset) {
    const vertical = position.startsWith("bottom")
      ? "bottom:" + inset + "px;"
      : "top:" + inset + "px;";
    const horizontal = position.endsWith("left") ? "left:24px;" : "right:24px;";
    return vertical + horizontal;
  }

  // Injected once per page (even with multiple widget instances) — the
  // loading spinner keyframes, a visible keyboard-focus ring for the
  // launcher (inline styles can't express :focus-visible or a media query),
  // and a small-screen layout for the floating panel so it reads as a
  // proper bottom sheet on phones instead of a cramped fixed-size box.
  function injectStylesOnce() {
    if (document.getElementById("ir-widget-styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "ir-widget-styles";
    style.textContent =
      "@keyframes ir-widget-spin{to{transform:rotate(360deg)}}" +
      ".ir-widget-spinner{position:absolute;top:50%;left:50%;width:28px;height:28px;" +
      "margin:-14px 0 0 -14px;border:3px solid rgba(0,0,0,0.12);" +
      "border-top-color:rgba(0,0,0,0.4);border-radius:50%;" +
      "animation:ir-widget-spin 0.7s linear infinite;}" +
      ".ir-widget-launcher:focus-visible{outline:2px solid #fff;outline-offset:2px;" +
      "box-shadow:0 4px 14px rgba(0,0,0,0.2),0 0 0 4px rgba(37,99,235,0.5);}" +
      "@media (max-width:480px){.ir-widget-panel{left:12px!important;right:12px!important;" +
      "bottom:12px!important;top:auto!important;width:auto!important;" +
      "height:min(80vh,640px)!important;max-width:none!important;" +
      "max-height:calc(100vh - 24px)!important;}}";
    document.head.appendChild(style);
  }

  function createIframe() {
    const iframe = document.createElement("iframe");
    iframe.src = iframeSrc;
    iframe.title = "Feedback";
    iframe.setAttribute("data-idearoads-widget", "");
    iframe.setAttribute("loading", "lazy");
    iframe.style.cssText =
      "display:block;width:100%;border:none;height:" +
      panelHeight +
      "px;max-width:" +
      panelWidth +
      "px;background:transparent;opacity:0;transition:opacity 0.2s ease;";
    return iframe;
  }

  // Wraps an iframe with a centered loading spinner that fades out (and is
  // removed) once the iframe finishes loading. `fillHeight` is used for the
  // floating panel, where the wrapper needs to fill a fixed-size container
  // rather than size to its own content.
  function withLoadingSpinner(iframe, fillHeight) {
    injectStylesOnce();
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
      "position:relative;width:100%;" + (fillHeight ? "height:100%;" : "");
    const spinner = document.createElement("div");
    spinner.className = "ir-widget-spinner";
    wrapper.appendChild(spinner);
    wrapper.appendChild(iframe);
    iframe.addEventListener("load", () => {
      iframe.style.opacity = "1";
      spinner.remove();
    });
    return wrapper;
  }

  // Listens for this widget's own iframe reporting its content height, and
  // ignores every other postMessage (from this iframe before it's loaded, or
  // from anything else on the page) by checking both a namespaced payload
  // shape and the message's source window.
  function listenForResize(iframe) {
    window.addEventListener("message", (event) => {
      if (event.source !== iframe.contentWindow) {
        return;
      }
      const data = event.data;
      if (!data || data.source !== MESSAGE_SOURCE || data.type !== "resize") {
        return;
      }
      const height = Number(data.height);
      if (Number.isFinite(height) && height > 0) {
        iframe.style.height = height + "px";
      }
    });
  }

  function mountInline() {
    const iframe = createIframe();
    const wrapper = withLoadingSpinner(iframe, false);
    const container = containerId ? document.getElementById(containerId) : null;

    if (container) {
      container.appendChild(wrapper);
    } else if (script.parentNode) {
      script.parentNode.insertBefore(wrapper, script.nextSibling);
    } else {
      return;
    }

    listenForResize(iframe);
  }

  function mountFloating() {
    const iframe = createIframe();
    iframe.style.height = "100%";
    iframe.style.width = "100%";
    iframe.setAttribute("tabindex", "0");

    const launcherColor = accentColor || "#111";
    const launcherTextColor = accentColor
      ? contrastForeground(accentColor)
      : "#fff";

    const panelId = instanceId + "-panel";
    const panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "ir-widget-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Feedback");
    panel.style.cssText =
      "position:fixed;" +
      cornerCss(88) +
      "width:" +
      panelWidth +
      "px;height:" +
      panelHeight +
      "px;" +
      "max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);" +
      "box-shadow:0 8px 30px rgba(0,0,0,0.18);border-radius:12px;" +
      "overflow:hidden;display:none;z-index:2147483000;background:#fff;";
    panel.appendChild(withLoadingSpinner(iframe, true));

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "ir-widget-launcher";
    launcher.textContent = "Feedback";
    launcher.setAttribute("aria-label", "Open feedback");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", panelId);
    launcher.style.cssText =
      "position:fixed;" +
      cornerCss(24) +
      "min-width:44px;min-height:44px;padding:12px 20px;" +
      "background:" +
      launcherColor +
      ";color:" +
      launcherTextColor +
      ";border:none;border-radius:999px;" +
      "font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
      "cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.2);z-index:2147483000;";

    let open = false;

    function setOpen(next) {
      open = next;
      panel.style.display = open ? "block" : "none";
      launcher.setAttribute("aria-expanded", String(open));
      if (open) {
        // Wait a frame so display:block has taken effect before focusing —
        // an element that's still display:none can't receive focus.
        requestAnimationFrame(() => iframe.focus());
      } else {
        launcher.focus();
      }
    }

    launcher.addEventListener("click", () => setOpen(!open));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    });

    document.body.appendChild(panel);
    document.body.appendChild(launcher);
    // The floating panel is a fixed size (configured via data-width/
    // data-height), unlike inline mode — no resize listener here, so the
    // panel doesn't get resized out from under its own chrome.
  }

  function boot() {
    if (mode === "button") {
      mountFloating();
    } else {
      mountInline();
    }
  }

  if (document.body) {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();
